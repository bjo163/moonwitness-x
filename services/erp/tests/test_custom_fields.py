import unittest
import uuid
from datetime import datetime, timezone
import os
from unittest.mock import patch

import httpx
from decimal import Decimal

from sqlalchemy import event, insert, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from services.erp.addons import load_all_addons
from services.erp.core.config import settings
from services.erp.core.db import get_db, metadata
from services.erp.core.registry import registry
from services.erp.main import app
from services.erp.addons.custom_fields.schema import custom_field_definition, custom_field_value


class TenantCustomFieldAPITests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        if not registry.is_compiled:
            load_all_addons()
        database_url = os.environ.get(
            "MW_ERP_TEST_DATABASE_URL", "sqlite+aiosqlite:///:memory:"
        )
        self.engine = create_async_engine(database_url)

        if database_url.startswith("sqlite"):
            @event.listens_for(self.engine.sync_engine, "connect")
            def enable_foreign_keys(connection, _record):
                cursor = connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()

        async with self.engine.begin() as connection:
            if os.environ.get("MW_ERP_TEST_DATABASE_URL"):
                await connection.run_sync(metadata.drop_all)
            await connection.run_sync(metadata.create_all)
        self.factory = async_sessionmaker(self.engine, expire_on_commit=False)

        async def override_get_db():
            async with self.factory() as session:
                yield session

        self.previous_override = app.dependency_overrides.get(get_db)
        app.dependency_overrides[get_db] = override_get_db
        self.settings_patch = patch.object(settings, "api_key", None)
        self.settings_patch.start()
        self.client = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://erp.test"
        )

    async def asyncTearDown(self):
        await self.client.aclose()
        if self.previous_override is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = self.previous_override
        self.settings_patch.stop()
        await self.engine.dispose()

    async def test_company_scoped_typed_values_validation_and_no_runtime_ddl(self):
        company_response = await self.client.post(
            "/api/v1/erp/companies",
            json={"name": "Custom Field Tenant", "code": "CFT-1"},
        )
        self.assertEqual(company_response.status_code, 201, company_response.text)
        company_id = company_response.json()["id"]

        partner_response = await self.client.post(
            "/api/v1/erp/partners", json={"name": "Custom Value Subject"},
            headers={"X-Company-ID": company_id},
        )
        self.assertEqual(partner_response.status_code, 201, partner_response.text)
        partner_id = partner_response.json()["id"]

        definition = {
            "company_id": company_id,
            "model_name": "res.partner",
            "field_name": "x_score",
            "label": "Customer Score",
            "data_type": "decimal",
            "validation": {"minimum": "0", "maximum": "100"},
        }
        created = await self.client.post("/api/v1/erp/custom-fields", json=definition)
        self.assertEqual(created.status_code, 201, created.text)

        saved = await self.client.put(
            f"/api/v1/erp/custom-fields/{company_id}/res.partner/{partner_id}/x_score",
            json={"value": "12.50"},
        )
        self.assertEqual(saved.status_code, 200, saved.text)
        values = await self.client.get(
            f"/api/v1/erp/custom-fields/{company_id}/res.partner/{partner_id}"
        )
        self.assertEqual(values.status_code, 200, values.text)
        self.assertEqual(values.json()[0]["field_name"], "x_score")
        self.assertEqual(values.json()[0]["value"], "12.50000000")

        extra_fields = [
            {
                "company_id": company_id, "model_name": "res.partner",
                "field_name": "x_opt_in", "label": "Marketing Opt In",
                "data_type": "boolean", "validation": {},
            },
            {
                "company_id": company_id, "model_name": "res.partner",
                "field_name": "x_started_at", "label": "Started At",
                "data_type": "datetime", "validation": {},
            },
            {
                "company_id": company_id, "model_name": "res.partner",
                "field_name": "x_preferences", "label": "Preferences",
                "data_type": "json", "validation": {},
            },
        ]
        extra_values = {
            "x_opt_in": False,
            "x_started_at": "2026-10-03T12:00:00+07:00",
            "x_preferences": {"theme": "dark"},
        }
        for extra in extra_fields:
            response = await self.client.post("/api/v1/erp/custom-fields", json=extra)
            self.assertEqual(response.status_code, 201, response.text)
            response = await self.client.put(
                f"/api/v1/erp/custom-fields/{company_id}/res.partner/{partner_id}/{extra['field_name']}",
                json={"value": extra_values[extra["field_name"]]},
            )
            self.assertEqual(response.status_code, 200, response.text)
        values = await self.client.get(
            f"/api/v1/erp/custom-fields/{company_id}/res.partner/{partner_id}"
        )
        by_name = {item["field_name"]: item["value"] for item in values.json()}
        self.assertIs(by_name["x_opt_in"], False)
        self.assertEqual(by_name["x_started_at"], "2026-10-03T05:00:00+00:00")
        self.assertEqual(by_name["x_preferences"], {"theme": "dark"})

        form = await self.client.get(
            "/api/v1/erp/forms/res.partner", params={"company_id": company_id}
        )
        self.assertEqual(form.status_code, 200, form.text)
        form_fields = {field["name"]: field for field in form.json()["fields"]}
        self.assertEqual(form.json()["api_version"], "1")
        self.assertTrue(form_fields["x_score"]["custom"])
        self.assertEqual(form_fields["x_score"]["validation"]["maximum"], "100")
        self.assertNotIn("radius_credential_ciphertext", form_fields)

        bad_float = await self.client.put(
            f"/api/v1/erp/custom-fields/{company_id}/res.partner/{partner_id}/x_score",
            json={"value": 12.5},
        )
        self.assertEqual(bad_float.status_code, 422)
        out_of_range = await self.client.put(
            f"/api/v1/erp/custom-fields/{company_id}/res.partner/{partner_id}/x_score",
            json={"value": "120"},
        )
        self.assertEqual(out_of_range.status_code, 422)

        duplicate = await self.client.post("/api/v1/erp/custom-fields", json=definition)
        self.assertEqual(duplicate.status_code, 409)
        partner_model = registry.get_model("res.partner")
        self.assertNotIn("x_score", partner_model.__table__.columns)
        self.assertNotIn("x_score", partner_model._model_fields)

        deactivated = await self.client.patch(
            f"/api/v1/erp/custom-fields/{company_id}/res.partner/x_score",
            json={"active": False},
        )
        self.assertEqual(deactivated.status_code, 200, deactivated.text)
        inactive_write = await self.client.put(
            f"/api/v1/erp/custom-fields/{company_id}/res.partner/{partner_id}/x_score",
            json={"value": "13"},
        )
        self.assertEqual(inactive_write.status_code, 409)

        company_two = await self.client.post(
            "/api/v1/erp/companies",
            json={"name": "Other Custom Field Tenant", "code": "CFT-2"},
        )
        self.assertEqual(company_two.status_code, 201)
        async with self.factory() as session:
            definition_id = await session.scalar(
                select(custom_field_definition.c.id).where(
                    custom_field_definition.c.field_name == "x_score"
                )
            )
            with self.assertRaises(IntegrityError):
                await session.execute(insert(custom_field_value).values(
                    id=str(uuid.uuid4()),
                    company_id=company_two.json()["id"],
                    model_name="res.partner",
                    record_id=partner_id,
                    field_id=definition_id,
                    data_type="decimal",
                    value_decimal=Decimal("1"),
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                ))
                await session.commit()
            await session.rollback()


if __name__ == "__main__":
    unittest.main()
