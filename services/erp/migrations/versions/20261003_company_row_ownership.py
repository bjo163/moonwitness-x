"""Add company ownership to ERP business rows and bind tenants to auth tokens.

Revision ID: 20261003tenant
Revises: 20261003cf
Create Date: 2026-10-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261003tenant"
down_revision: Union[str, Sequence[str], None] = "20261003cf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000001"
SCOPED_TABLES = (
    "res_partner", "ir_sequence", "crm_lead", "sale_order", "sale_order_line",
    "sale_subscription", "subscription_line", "subscription_event",
    "isp_nas_binding", "project_project", "account_move", "account_move_line",
    "erp_outbox_event",
)


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(sa.text(
        "INSERT INTO res_company (id, created_at, updated_at, name, code, currency_code) "
        "VALUES (:id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, :name, :code, :currency) "
        "ON CONFLICT (id) DO NOTHING"
    ), {
        "id": DEFAULT_COMPANY_ID,
        "name": "Moonwitness Default Tenant (legacy data)",
        "code": "MW-DEFAULT",
        "currency": "IDR",
    })

    for table_name in SCOPED_TABLES:
        op.add_column(table_name, sa.Column("company_id", sa.String(36), nullable=True))
        bind.execute(sa.text(
            f'UPDATE "{table_name}" SET company_id = :company_id WHERE company_id IS NULL'
        ), {"company_id": DEFAULT_COMPANY_ID})
        op.alter_column(table_name, "company_id", existing_type=sa.String(36), nullable=False)
        op.create_foreign_key(
            f"fk_{table_name}_company_id_res_company",
            table_name, "res_company", ["company_id"], ["id"], ondelete="RESTRICT",
        )
        op.create_index(f"ix_{table_name}_company_id", table_name, ["company_id"])

    # Sequence codes are reusable between companies. Legacy rows are attributed
    # to the bootstrap company before this constraint replaces global uniqueness.
    op.drop_constraint("uq_ir_sequence_code", "ir_sequence", type_="unique")
    op.create_unique_constraint(
        "uq_ir_sequence_company_code", "ir_sequence", ["company_id", "code"]
    )
    op.create_index("ix_ir_sequence_code", "ir_sequence", ["code"])


def downgrade() -> None:
    bind = op.get_bind()
    for table_name in SCOPED_TABLES:
        other_tenants = bind.execute(sa.text(
            f'SELECT COUNT(*) FROM "{table_name}" WHERE company_id <> :company_id'
        ), {"company_id": DEFAULT_COMPANY_ID}).scalar_one()
        if other_tenants:
            raise RuntimeError(
                f"Refusing to remove company ownership: {table_name} contains records for other tenants"
            )
    op.drop_index("ix_ir_sequence_code", "ir_sequence")
    op.drop_constraint("uq_ir_sequence_company_code", "ir_sequence", type_="unique")
    op.create_unique_constraint("uq_ir_sequence_code", "ir_sequence", ["code"])
    for table_name in reversed(SCOPED_TABLES):
        op.drop_index(f"ix_{table_name}_company_id", table_name)
        op.drop_constraint(f"fk_{table_name}_company_id_res_company", table_name, type_="foreignkey")
        op.drop_column(table_name, "company_id")
    count = bind.execute(sa.text(
        "SELECT COUNT(*) FROM res_company WHERE id = :company_id"
    ), {"company_id": DEFAULT_COMPANY_ID}).scalar_one()
    if count:
        bind.execute(sa.text("DELETE FROM res_company WHERE id = :company_id"), {"company_id": DEFAULT_COMPANY_ID})
