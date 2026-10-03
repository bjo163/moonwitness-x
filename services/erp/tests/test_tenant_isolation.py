"""PostgreSQL integration coverage for row ownership and tenant query scoping."""

import os
import unittest
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from services.erp.addons import load_all_addons
from services.erp.core.db import metadata
from services.erp.core.registry import registry
from services.erp.core.tenancy import current_company_id


class TenantIsolationPostgresTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        database_url = os.environ.get("MW_ERP_TEST_DATABASE_URL")
        if not database_url:
            self.skipTest("Set MW_ERP_TEST_DATABASE_URL to a disposable PostgreSQL test database")
        parsed = urlparse(database_url)
        if not parsed.scheme.startswith("postgresql") or not parsed.path.rstrip("/").endswith("_test"):
            raise RuntimeError("Tenant integration tests only accept a PostgreSQL database ending in _test")

        if not registry.is_compiled:
            load_all_addons()
        self.engine = create_async_engine(database_url)
        async with self.engine.begin() as connection:
            await connection.run_sync(metadata.drop_all)
            await connection.run_sync(metadata.create_all)
        self.addAsyncCleanup(self.engine.dispose)
        self.factory = async_sessionmaker(self.engine, expire_on_commit=False, autoflush=False)
        self.Company = registry.get_model("res.company")
        self.Partner = registry.get_model("res.partner")
        self.Order = registry.get_model("sale.order")

    async def test_known_ids_and_foreign_keys_cannot_cross_company(self):
        company_a = self.Company(name="Tenant A", code="TEN-A")
        company_b = self.Company(name="Tenant B", code="TEN-B")
        async with self.factory() as session:
            session.add_all([company_a, company_b])
            await session.flush()

            token_a = current_company_id.set(company_a.id)
            try:
                partner_a = self.Partner(name="A customer")
                session.add(partner_a)
                await session.flush()
            finally:
                current_company_id.reset(token_a)

            token_b = current_company_id.set(company_b.id)
            try:
                partner_b = self.Partner(name="B customer")
                session.add(partner_b)
                await session.flush()
            finally:
                current_company_id.reset(token_b)
            await session.commit()
            partner_a_id, partner_b_id = partner_a.id, partner_b.id

        async with self.factory() as session:
            token_a = current_company_id.set(company_a.id)
            try:
                visible = (await session.execute(select(self.Partner))).scalars().all()
                hidden = await session.scalar(
                    select(self.Partner.id).where(self.Partner.id == partner_b_id)
                )
            finally:
                current_company_id.reset(token_a)
        self.assertEqual([row.id for row in visible], [partner_a_id])
        self.assertIsNone(hidden)

        async with self.factory() as session:
            token_a = current_company_id.set(company_a.id)
            try:
                session.add(self.Partner(name="Spoof", company_id=company_b.id))
                with self.assertRaisesRegex(ValueError, "another company"):
                    await session.flush()
                await session.rollback()

                session.add(self.Order(number="SO-CROSS-1", partner_id=partner_b_id))
                with self.assertRaisesRegex(ValueError, "another company"):
                    await session.flush()
                await session.rollback()
            finally:
                current_company_id.reset(token_a)


if __name__ == "__main__":
    unittest.main()
