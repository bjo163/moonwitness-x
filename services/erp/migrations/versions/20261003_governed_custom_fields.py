"""Add tenant-scoped typed custom-field metadata and values.

Revision ID: 20261003cf
Revises: 20261003invimmut
Create Date: 2026-10-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261003cf"
down_revision: Union[str, Sequence[str], None] = "20261003invimmut"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "custom_field_definition",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("company_id", sa.String(36), nullable=False),
        sa.Column("model_name", sa.String(128), nullable=False),
        sa.Column("field_name", sa.String(64), nullable=False),
        sa.Column("label", sa.String(128), nullable=False),
        sa.Column("data_type", sa.String(16), nullable=False),
        sa.Column("help_text", sa.Text(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("validation", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "data_type IN ('char', 'text', 'decimal', 'integer', 'boolean', 'datetime', 'json')",
            name=op.f("ck_custom_field_definition_data_type"),
        ),
        sa.ForeignKeyConstraint(
            ["company_id"], ["res_company.id"],
            name=op.f("fk_custom_field_definition_company_id_res_company"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_custom_field_definition")),
        sa.UniqueConstraint(
            "company_id", "model_name", "field_name",
            name=op.f("uq_custom_field_definition_scope_key"),
        ),
        sa.UniqueConstraint(
            "id", "company_id", "model_name", "data_type",
            name=op.f("uq_custom_field_definition_composite_ref"),
        ),
    )
    op.create_index(
        "ix_custom_field_definition_company_model",
        "custom_field_definition", ["company_id", "model_name"], unique=False,
    )
    op.create_table(
        "custom_field_value",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("company_id", sa.String(36), nullable=False),
        sa.Column("model_name", sa.String(128), nullable=False),
        sa.Column("record_id", sa.String(36), nullable=False),
        sa.Column("field_id", sa.String(36), nullable=False),
        sa.Column("data_type", sa.String(16), nullable=False),
        sa.Column("value_text", sa.String(4096), nullable=True),
        sa.Column("value_decimal", sa.Numeric(24, 8), nullable=True),
        sa.Column("value_integer", sa.Numeric(20, 0), nullable=True),
        sa.Column("value_boolean", sa.Boolean(), nullable=True),
        sa.Column("value_datetime", sa.DateTime(timezone=True), nullable=True),
        sa.Column("value_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "(data_type IN ('char', 'text') AND value_text IS NOT NULL AND value_decimal IS NULL AND value_integer IS NULL AND value_boolean IS NULL AND value_datetime IS NULL AND value_json IS NULL) OR "
            "(data_type = 'decimal' AND value_text IS NULL AND value_decimal IS NOT NULL AND value_integer IS NULL AND value_boolean IS NULL AND value_datetime IS NULL AND value_json IS NULL) OR "
            "(data_type = 'integer' AND value_text IS NULL AND value_decimal IS NULL AND value_integer IS NOT NULL AND value_boolean IS NULL AND value_datetime IS NULL AND value_json IS NULL) OR "
            "(data_type = 'boolean' AND value_text IS NULL AND value_decimal IS NULL AND value_integer IS NULL AND value_boolean IS NOT NULL AND value_datetime IS NULL AND value_json IS NULL) OR "
            "(data_type = 'datetime' AND value_text IS NULL AND value_decimal IS NULL AND value_integer IS NULL AND value_boolean IS NULL AND value_datetime IS NOT NULL AND value_json IS NULL) OR "
            "(data_type = 'json' AND value_text IS NULL AND value_decimal IS NULL AND value_integer IS NULL AND value_boolean IS NULL AND value_datetime IS NULL AND value_json IS NOT NULL)",
            name=op.f("ck_custom_field_value_typed_value"),
        ),
        sa.ForeignKeyConstraint(
            ["field_id", "company_id", "model_name", "data_type"],
            [
                "custom_field_definition.id",
                "custom_field_definition.company_id",
                "custom_field_definition.model_name",
                "custom_field_definition.data_type",
            ],
            name=op.f("fk_custom_field_value_definition_scope"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_custom_field_value")),
        sa.UniqueConstraint(
            "company_id", "model_name", "record_id", "field_id",
            name=op.f("uq_custom_field_value_record_field"),
        ),
    )
    op.create_index(
        "ix_custom_field_value_scope_record",
        "custom_field_value", ["company_id", "model_name", "record_id"], unique=False,
    )


def downgrade() -> None:
    bind = op.get_bind()
    for table_name in ("custom_field_value", "custom_field_definition"):
        count = bind.execute(sa.text(f'SELECT COUNT(*) FROM "{table_name}"')).scalar_one()
        if count:
            raise RuntimeError(
                f"Refusing to drop {table_name}: it contains {count} tenant custom-field records. "
                "Export/archive them explicitly before retrying the downgrade."
            )
    op.drop_index("ix_custom_field_value_scope_record", table_name="custom_field_value")
    op.drop_table("custom_field_value")
    op.drop_index("ix_custom_field_definition_company_model", table_name="custom_field_definition")
    op.drop_table("custom_field_definition")
