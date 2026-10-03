import unittest
import io
import json
import logging
from unittest.mock import patch

import httpx
from pydantic import SecretStr
from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from opentelemetry.exporter.otlp.proto.http import trace_exporter as otlp_trace_exporter
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from services.erp.core.config import settings
from services.erp.main import app
from services.erp.core.observability import ERPJsonFormatter, configure_telemetry, http_logger


class APIAuthenticationTests(unittest.IsolatedAsyncioTestCase):
    async def test_configured_bearer_key_protects_api_but_not_health(self):
        token = "t" * 40
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://erp.test") as client:
            with patch.object(settings, "api_key", SecretStr(token)):
                rejected = await client.get("/api/v1/erp/models")
                accepted = await client.get(
                    "/api/v1/erp/models",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "X-Request-ID": "job-42.worker_a",
                    },
                )
                public_health = await client.get("/health")

        self.assertEqual(rejected.status_code, 401)
        self.assertEqual(rejected.headers["www-authenticate"], "Bearer")
        self.assertEqual(accepted.status_code, 200)
        self.assertEqual(accepted.headers["x-request-id"], "job-42.worker_a")
        self.assertEqual(public_health.status_code, 200)

    async def test_tenant_bearer_is_pinned_to_its_company_and_cannot_use_admin_routes(self):
        company_a = "00000000-0000-0000-0000-00000000000a"
        company_b = "00000000-0000-0000-0000-00000000000b"
        tenant_key = "tenant-key-" + "a" * 40
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://erp.test") as client:
            with patch.object(settings, "api_key", None), patch.object(
                settings, "tenant_api_keys",
                SecretStr(json.dumps({company_a: tenant_key})),
            ):
                mismatch = await client.get(
                    "/api/v1/erp/overview",
                    headers={"Authorization": f"Bearer {tenant_key}", "X-Company-ID": company_b},
                )
                admin_route = await client.get(
                    "/api/v1/erp/models",
                    headers={"Authorization": f"Bearer {tenant_key}"},
                )
                invalid = await client.get(
                    "/api/v1/erp/overview",
                    headers={"Authorization": "Bearer invalid-token"},
                )

        self.assertEqual(mismatch.status_code, 403)
        self.assertEqual(admin_route.status_code, 403)
        self.assertEqual(invalid.status_code, 401)

    async def test_production_startup_fails_closed_without_api_key(self):
        with patch.object(settings, "environment", "production"), patch.object(
            settings, "api_key", None
        ):
            with self.assertRaisesRegex(RuntimeError, "MW_ERP_API_KEY"):
                async with app.router.lifespan_context(app):
                    self.fail("production startup must stop before serving")


class TelemetryTests(unittest.IsolatedAsyncioTestCase):
    async def test_fastapi_trace_is_exported_to_configured_span_sink(self):
        traced_app = FastAPI()

        @traced_app.get("/ping")
        async def ping():
            http_logger.info("inside_trace")
            return {"ok": True}

        exporter = InMemorySpanExporter()
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        log_stream = io.StringIO()
        log_handler = logging.StreamHandler(log_stream)
        log_handler.setFormatter(ERPJsonFormatter())
        http_logger.addHandler(log_handler)
        with patch.object(otlp_trace_exporter, "OTLPSpanExporter", return_value=exporter):
            runtime = configure_telemetry(
                traced_app,
                enabled=True,
                endpoint="http://collector.test/v1/traces",
                service_name="erp-test",
                sample_ratio=1.0,
                engine=engine.sync_engine,
            )
            transport = httpx.ASGITransport(app=traced_app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(
                    "/ping",
                    headers={
                        "traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
                    },
                )
            async with engine.connect() as connection:
                await connection.execute(text("select 1"))
            runtime.provider.force_flush(timeout_millis=5000)
            spans = exporter.get_finished_spans()
            span_names = [span.name for span in spans]
            runtime.shutdown()
        await engine.dispose()
        http_logger.removeHandler(log_handler)
        log_entries = [json.loads(line) for line in log_stream.getvalue().splitlines()]

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any("/ping" in span_name for span_name in span_names), span_names)
        self.assertTrue(any("SELECT" in span_name.upper() for span_name in span_names), span_names)
        self.assertIn(
            int("4bf92f3577b34da6a3ce929d0e0e4736", 16),
            {span.context.trace_id for span in spans},
        )
        self.assertIn(
            "4bf92f3577b34da6a3ce929d0e0e4736",
            {entry.get("trace_id") for entry in log_entries if entry["message"] == "inside_trace"},
        )

    async def test_enabled_telemetry_requires_export_endpoint(self):
        with self.assertRaisesRegex(RuntimeError, "OTLP_TRACE_ENDPOINT"):
            configure_telemetry(
                FastAPI(), enabled=True, endpoint=None,
                service_name="erp-test", sample_ratio=1.0,
            )


if __name__ == "__main__":
    unittest.main()
