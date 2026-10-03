"""enforce bounded values for subscription/sales primitives

Revision ID: 20261003checks
Revises: 20261003subaudit
Create Date: 2026-10-03
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261003checks"
down_revision: Union[str, Sequence[str], None] = "20261003subaudit"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _assert_no_invalid(table: str, predicate: str) -> None:
    count = op.get_bind().execute(
        sa.text(f'SELECT COUNT(*) FROM "{table}" WHERE {predicate}')
    ).scalar_one()
    if count:
        raise RuntimeError(
            f"Cannot add ERP data constraint: {table} has {count} invalid rows ({predicate}). "
            "Correct the records explicitly, then rerun the migration."
        )


def upgrade() -> None:
    for table in ("sale_order_line", "subscription_line", "account_move_line"):
        _assert_no_invalid(table, '"quantity" IS NOT NULL AND "quantity" <= 0')
        op.execute(sa.text(f'UPDATE "{table}" SET "quantity" = 1 WHERE "quantity" IS NULL'))
    _assert_no_invalid("crm_lead", '"probability" IS NOT NULL AND ("probability" < 0 OR "probability" > 100)')
    op.execute(sa.text('UPDATE "crm_lead" SET "probability" = 20 WHERE "probability" IS NULL'))
    _assert_no_invalid("sale_subscription", '"billing_anchor_day" IS NOT NULL AND ("billing_anchor_day" < 1 OR "billing_anchor_day" > 31)')

    with op.batch_alter_table("sale_order_line") as batch_op:
        batch_op.alter_column("quantity", existing_type=sa.Numeric(18, 4), nullable=False)
        batch_op.create_check_constraint(op.f("ck_sale_order_line_quantity_range"), '"quantity" > 0')
    with op.batch_alter_table("subscription_line") as batch_op:
        batch_op.alter_column("quantity", existing_type=sa.Numeric(18, 4), nullable=False)
        batch_op.create_check_constraint(op.f("ck_subscription_line_quantity_range"), '"quantity" > 0')
    with op.batch_alter_table("account_move_line") as batch_op:
        batch_op.alter_column("quantity", existing_type=sa.Numeric(18, 4), nullable=False)
        batch_op.create_check_constraint(op.f("ck_account_move_line_quantity_range"), '"quantity" > 0')
    with op.batch_alter_table("crm_lead") as batch_op:
        batch_op.alter_column("probability", existing_type=sa.Integer(), nullable=False)
        batch_op.create_check_constraint(
            op.f("ck_crm_lead_probability_range"),
            '"probability" >= 0 AND "probability" <= 100',
        )
    with op.batch_alter_table("sale_subscription") as batch_op:
        batch_op.create_check_constraint(
            op.f("ck_sale_subscription_billing_anchor_day_range"),
            '"billing_anchor_day" >= 1 AND "billing_anchor_day" <= 31',
        )


def downgrade() -> None:
    with op.batch_alter_table("sale_subscription") as batch_op:
        batch_op.drop_constraint(op.f("ck_sale_subscription_billing_anchor_day_range"), type_="check")
    with op.batch_alter_table("crm_lead") as batch_op:
        batch_op.drop_constraint(op.f("ck_crm_lead_probability_range"), type_="check")
        batch_op.alter_column("probability", existing_type=sa.Integer(), nullable=True)
    with op.batch_alter_table("account_move_line") as batch_op:
        batch_op.drop_constraint(op.f("ck_account_move_line_quantity_range"), type_="check")
        batch_op.alter_column("quantity", existing_type=sa.Numeric(18, 4), nullable=True)
    with op.batch_alter_table("subscription_line") as batch_op:
        batch_op.drop_constraint(op.f("ck_subscription_line_quantity_range"), type_="check")
        batch_op.alter_column("quantity", existing_type=sa.Numeric(18, 4), nullable=True)
    with op.batch_alter_table("sale_order_line") as batch_op:
        batch_op.drop_constraint(op.f("ck_sale_order_line_quantity_range"), type_="check")
        batch_op.alter_column("quantity", existing_type=sa.Numeric(18, 4), nullable=True)
