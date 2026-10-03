import asyncio
import datetime
import importlib.util
import os
import tempfile
import unittest
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch

from sqlalchemy import func, select, update
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from services.erp.core.config import settings


class BillingWorkflowTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        test_database_url = os.environ.get("MW_ERP_TEST_DATABASE_URL")
        self.temp_dir = None
        if test_database_url:
            database_url = test_database_url
        else:
            self.temp_dir = tempfile.TemporaryDirectory(prefix="mw-erp-billing-")
            self.db_path = Path(self.temp_dir.name) / "billing.db"
            database_url = f"sqlite+aiosqlite:///{self.db_path.as_posix()}"
        env_patch = patch.object(settings, "database_url", database_url)
        env_patch.start()
        self.addCleanup(env_patch.stop)

        from services.erp.core.registry import registry
        from services.erp.core import db as erp_db
        from services.erp.addons import load_all_addons
        if not registry.is_compiled:
            load_all_addons()

        from services.erp import main as erp_main

        self.registry = registry
        self.erp_main = erp_main
        self.engine = create_async_engine(settings.database_url)
        self.session_factory = async_sessionmaker(
            self.engine, expire_on_commit=False, autoflush=False
        )
        self.old_factory = erp_main.AsyncSessionLocal
        erp_main.AsyncSessionLocal = self.session_factory
        self.addCleanup(self._restore_factory)

        async with self.engine.begin() as conn:
            if test_database_url:
                await conn.run_sync(erp_db.metadata.drop_all)
            await conn.run_sync(erp_db.metadata.create_all)
            migration_path = (
                Path(__file__).resolve().parents[1]
                / "migrations"
                / "versions"
                / "20261003_immutable_invoice_snapshots.py"
            )
            spec = importlib.util.spec_from_file_location(
                "erp_invoice_snapshot_migration", migration_path
            )
            migration = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(migration)
            await conn.run_sync(migration.create_invoice_snapshot_triggers)
        self.addAsyncCleanup(self._dispose_and_cleanup)

        self.Partner = registry.get_model("res.partner")
        self.Sequence = registry.get_model("ir.sequence")
        self.Subscription = registry.get_model("sale.subscription")
        self.SubscriptionLine = registry.get_model("subscription.line")
        self.Invoice = registry.get_model("account.move")
        self.InvoiceLine = registry.get_model("account.move.line")
        self.Company = registry.get_model("res.company")

        async with self.session_factory() as session:
            from services.erp.core.tenancy import DEFAULT_COMPANY_ID
            session.add(self.Company(
                id=DEFAULT_COMPANY_ID, name="ERP Test Tenant",
                code="ERP-TEST", currency_code="IDR",
            ))
            await session.flush()
            partner = self.Partner(name="Renewal Customer", is_customer=True)
            session.add(partner)
            session.add(self.Sequence(
                code="account.move", name="Invoice", prefix="INV-", padding=4, next_number=1
            ))
            await session.flush()
            self.due_at = datetime.datetime(2026, 1, 31, 12, tzinfo=datetime.timezone.utc)
            subscription = self.Subscription(
                number="SUB-1", partner_id=partner.id, state="active",
                billing_interval="monthly", billing_timezone="UTC", billing_anchor_day=31,
                current_period_start=datetime.datetime(2025, 12, 31, 12, tzinfo=datetime.timezone.utc),
                current_period_end=self.due_at, next_invoice_at=self.due_at,
                currency_code="IDR", technical_service="general",
            )
            session.add(subscription)
            await session.flush()
            session.add(self.SubscriptionLine(
                subscription_id=subscription.id, name="Internet", quantity=Decimal("1"),
                unit_price=Decimal("100000"), subtotal=Decimal("100000"),
            ))
            await session.commit()
            self.subscription_id = subscription.id

    async def _restore_factory(self):
        self.erp_main.AsyncSessionLocal = self.old_factory

    async def _dispose_and_cleanup(self):
        await self.engine.dispose()
        if self.temp_dir is not None:
            self.temp_dir.cleanup()

    async def test_due_renewal_creates_one_invoice_and_advances_anchor(self):
        first = await self.erp_main.run_due_subscription_billing(now=self.due_at)
        second = await self.erp_main.run_due_subscription_billing(now=self.due_at)
        self.assertEqual(first, {"processed": 1, "created": 1, "skipped": 0, "failed": 0})
        self.assertEqual(second, {"processed": 0, "created": 0, "skipped": 0, "failed": 0})

        async with self.session_factory() as session:
            invoices = (await session.execute(
                select(self.Invoice).where(self.Invoice.subscription_id == self.subscription_id)
            )).scalars().all()
            sub = (await session.execute(
                select(self.Subscription).where(self.Subscription.id == self.subscription_id)
            )).scalar_one()
            line_count = await session.scalar(select(func.count(self.InvoiceLine.id)))

        self.assertEqual(len(invoices), 1)
        self.assertEqual(invoices[0].number, "INV-0001")
        self.assertEqual(invoices[0].total_amount, Decimal("100000.0000"))
        self.assertEqual(
            invoices[0].billing_period_start.replace(tzinfo=datetime.timezone.utc),
            self.due_at,
        )
        self.assertEqual(
            invoices[0].billing_period_end.replace(tzinfo=datetime.timezone.utc),
            datetime.datetime(2026, 2, 28, 12, tzinfo=datetime.timezone.utc),
        )
        self.assertTrue(invoices[0].idempotency_key)
        self.assertEqual(invoices[0].customer_snapshot["name"], "Renewal Customer")
        self.assertEqual(line_count, 1)
        self.assertEqual(
            sub.current_period_start.replace(tzinfo=datetime.timezone.utc), self.due_at
        )
        self.assertEqual(sub.current_period_end, invoices[0].billing_period_end)

    async def test_posted_invoice_header_and_lines_are_immutable(self):
        await self.erp_main.run_due_subscription_billing(now=self.due_at)
        async with self.session_factory() as session:
            invoice = (await session.execute(
                select(self.Invoice).where(self.Invoice.subscription_id == self.subscription_id)
            )).scalar_one()
            line = (await session.execute(
                select(self.InvoiceLine).where(self.InvoiceLine.move_id == invoice.id)
            )).scalar_one()
            invoice_id, line_id = invoice.id, line.id

        with self.assertRaises(DBAPIError):
            async with self.session_factory() as session:
                await session.execute(
                    update(self.Invoice)
                    .where(self.Invoice.id == invoice_id)
                    .values(total_amount=Decimal("1"))
                )
                await session.commit()

        with self.assertRaises(DBAPIError):
            async with self.session_factory() as session:
                await session.execute(
                    update(self.InvoiceLine)
                    .where(self.InvoiceLine.id == line_id)
                    .values(subtotal=Decimal("1"))
                )
                await session.commit()

        async with self.session_factory() as session:
            await session.execute(
                update(self.Invoice)
                .where(self.Invoice.id == invoice_id)
                .values(state="paid", payment_note="Payment recorded")
            )
            await session.commit()

        with self.assertRaises(DBAPIError):
            async with self.session_factory() as session:
                await session.execute(
                    update(self.Invoice)
                    .where(self.Invoice.id == invoice_id)
                    .values(state="posted")
                )
                await session.commit()

    async def test_invoice_payment_retry_is_idempotent(self):
        await self.erp_main.run_due_subscription_billing(now=self.due_at)
        async with self.session_factory() as session:
            invoice = (await session.execute(
                select(self.Invoice).where(self.Invoice.subscription_id == self.subscription_id)
            )).scalar_one()
            invoice_id = invoice.id

        payment = self.erp_main.InvoicePayDTO(
            payment_method="Bank Transfer", notes="Bank reference 123"
        )
        async with self.session_factory() as session:
            first = await self.erp_main.pay_invoice(invoice_id, payment, session)
        first_paid_at = first["invoice"]["payment_date"]

        async with self.session_factory() as session:
            retry = await self.erp_main.pay_invoice(invoice_id, payment, session)

        self.assertEqual(first["invoice"]["state"], "paid")
        self.assertEqual(retry["message"], "Invoice is already paid")
        self.assertEqual(retry["invoice"]["payment_date"], first_paid_at)
        self.assertEqual(retry["invoice"]["payment_method"], "Bank Transfer")
        self.assertEqual(retry["invoice"]["payment_note"], "Bank reference 123")

    async def test_parallel_postgres_workers_do_not_duplicate_invoice(self):
        if not settings.database_url.startswith("postgresql"):
            self.skipTest("FOR UPDATE SKIP LOCKED concurrency requires PostgreSQL")

        outcomes = await asyncio.gather(
            self.erp_main.run_due_subscription_billing(now=self.due_at),
            self.erp_main.run_due_subscription_billing(now=self.due_at),
        )
        async with self.session_factory() as session:
            count = await session.scalar(
                select(func.count(self.Invoice.id)).where(
                    self.Invoice.subscription_id == self.subscription_id
                )
            )

        self.assertEqual(sum(result["created"] for result in outcomes), 1)
        self.assertEqual(sum(result["failed"] for result in outcomes), 0)
        self.assertEqual(count, 1)


if __name__ == "__main__":
    unittest.main()
