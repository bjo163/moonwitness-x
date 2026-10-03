"""freeze issued invoice header and lines

Revision ID: 20261003invimmut
Revises: 20261003checks
Create Date: 2026-10-03
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261003invimmut"
down_revision: Union[str, Sequence[str], None] = "20261003checks"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _create_postgresql_triggers(bind) -> None:
    bind.exec_driver_sql("""
    CREATE OR REPLACE FUNCTION erp_guard_invoice_header() RETURNS trigger AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN
        IF OLD.state <> 'draft' THEN
          RAISE EXCEPTION 'issued invoice cannot be deleted';
        END IF;
        RETURN OLD;
      END IF;
      IF NEW.state IS DISTINCT FROM OLD.state AND NOT (
        (OLD.state = 'draft' AND NEW.state IN ('posted', 'cancelled')) OR
        (OLD.state = 'posted' AND NEW.state IN ('paid', 'overdue', 'cancelled')) OR
        (OLD.state = 'overdue' AND NEW.state IN ('paid', 'cancelled'))
      ) THEN
        RAISE EXCEPTION 'invalid invoice state transition';
      END IF;
      IF OLD.state <> 'draft' AND ROW(
        NEW.number, NEW.partner_id, NEW.source_order_id, NEW.subscription_id,
        NEW.billing_period_start, NEW.billing_period_end, NEW.idempotency_key,
        NEW.invoice_date, NEW.due_date, NEW.currency_code,
        NEW.total_amount, NEW.notes
      ) IS DISTINCT FROM ROW(
        OLD.number, OLD.partner_id, OLD.source_order_id, OLD.subscription_id,
        OLD.billing_period_start, OLD.billing_period_end, OLD.idempotency_key,
        OLD.invoice_date, OLD.due_date, OLD.currency_code,
        OLD.total_amount, OLD.notes
      ) OR NEW.customer_snapshot::text IS DISTINCT FROM OLD.customer_snapshot::text THEN
        RAISE EXCEPTION 'issued invoice snapshot is immutable';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
    """)
    bind.exec_driver_sql("""
    CREATE TRIGGER erp_invoice_header_immutable
    BEFORE UPDATE OR DELETE ON account_move
    FOR EACH ROW EXECUTE FUNCTION erp_guard_invoice_header()
    """)
    bind.exec_driver_sql("""
    CREATE OR REPLACE FUNCTION erp_guard_invoice_line() RETURNS trigger AS $$
    DECLARE parent_state text;
    BEGIN
      IF TG_OP = 'DELETE' THEN
        SELECT state INTO parent_state FROM account_move WHERE id = OLD.move_id;
        IF COALESCE(parent_state, 'missing') <> 'draft' THEN
          RAISE EXCEPTION 'issued invoice lines are immutable';
        END IF;
        RETURN OLD;
      END IF;
      SELECT state INTO parent_state FROM account_move WHERE id = NEW.move_id;
      IF COALESCE(parent_state, 'missing') <> 'draft' THEN
        RAISE EXCEPTION 'issued invoice lines are immutable';
      END IF;
      IF TG_OP = 'UPDATE' AND OLD.move_id <> NEW.move_id THEN
        SELECT state INTO parent_state FROM account_move WHERE id = OLD.move_id;
        IF COALESCE(parent_state, 'missing') <> 'draft' THEN
          RAISE EXCEPTION 'issued invoice lines are immutable';
        END IF;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
    """)
    bind.exec_driver_sql("""
    CREATE TRIGGER erp_invoice_line_immutable
    BEFORE INSERT OR UPDATE OR DELETE ON account_move_line
    FOR EACH ROW EXECUTE FUNCTION erp_guard_invoice_line()
    """)


def create_invoice_snapshot_triggers(bind) -> None:
    """Install backend-specific guards for posted invoice data."""
    if bind.dialect.name != "postgresql":
        raise RuntimeError("Invoice immutability requires PostgreSQL triggers")
    _create_postgresql_triggers(bind)


def upgrade() -> None:
    with op.batch_alter_table("account_move") as batch_op:
        batch_op.add_column(sa.Column("customer_snapshot", sa.JSON(), nullable=True, comment="Immutable Customer Details Snapshot"))
        batch_op.add_column(sa.Column("payment_note", sa.Text(), nullable=True, comment="Payment Note / Reference"))

    create_invoice_snapshot_triggers(op.get_bind())


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS erp_invoice_line_immutable ON account_move_line")
    op.execute("DROP TRIGGER IF EXISTS erp_invoice_header_immutable ON account_move")
    op.execute("DROP FUNCTION IF EXISTS erp_guard_invoice_line()")
    op.execute("DROP FUNCTION IF EXISTS erp_guard_invoice_header()")

    with op.batch_alter_table("account_move") as batch_op:
        batch_op.drop_column("payment_note")
        batch_op.drop_column("customer_snapshot")
