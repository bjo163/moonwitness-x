"""add explicit subscription transition audit fields

Revision ID: 20261003subaudit
Revises: 20261003invoiceperiod
Create Date: 2026-10-03
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261003subaudit"
down_revision: Union[str, Sequence[str], None] = "20261003invoiceperiod"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("subscription_event") as batch_op:
        batch_op.add_column(sa.Column("previous_state", sa.String(length=32), nullable=True, comment="Previous Subscription State"))
        batch_op.add_column(sa.Column("new_state", sa.String(length=32), nullable=True, comment="New Subscription State"))
        batch_op.add_column(sa.Column("actor", sa.String(length=128), nullable=True, comment="Transition Actor"))
        batch_op.add_column(sa.Column("reason", sa.Text(), nullable=True, comment="Transition Reason"))


def downgrade() -> None:
    with op.batch_alter_table("subscription_event") as batch_op:
        batch_op.drop_column("reason")
        batch_op.drop_column("actor")
        batch_op.drop_column("new_state")
        batch_op.drop_column("previous_state")
