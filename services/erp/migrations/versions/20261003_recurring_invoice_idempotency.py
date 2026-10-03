"""persist subscription invoice periods and uniqueness key

Revision ID: 20261003invoiceperiod
Revises: 47b6a88d1258
Create Date: 2026-10-03
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261003invoiceperiod"
down_revision: Union[str, Sequence[str], None] = "47b6a88d1258"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("account_move") as batch_op:
        batch_op.add_column(sa.Column("billing_period_start", sa.DateTime(timezone=True), nullable=True, comment="Billing Period Start"))
        batch_op.add_column(sa.Column("billing_period_end", sa.DateTime(timezone=True), nullable=True, comment="Billing Period End"))
        batch_op.add_column(sa.Column("idempotency_key", sa.String(length=160), nullable=True, comment="Invoice Generation Key"))
        batch_op.create_unique_constraint("uq_account_move_idempotency_key", ["idempotency_key"])


def downgrade() -> None:
    with op.batch_alter_table("account_move") as batch_op:
        batch_op.drop_constraint("uq_account_move_idempotency_key", type_="unique")
        batch_op.drop_column("idempotency_key")
        batch_op.drop_column("billing_period_end")
        batch_op.drop_column("billing_period_start")
