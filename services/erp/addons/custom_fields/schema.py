"""Typed tenant custom-field tables kept separate from compiled ERP models."""
from sqlalchemy import (
    Boolean, CheckConstraint, Column, DateTime, ForeignKey, ForeignKeyConstraint,
    Index, JSON, MetaData, Numeric, String, Table, Text, UniqueConstraint,
)
from sqlalchemy.schema import conv

from services.erp.core.db import metadata


custom_field_definition = Table(
    "custom_field_definition",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("company_id", String(36), ForeignKey("res_company.id", ondelete="CASCADE"), nullable=False),
    Column("model_name", String(128), nullable=False),
    Column("field_name", String(64), nullable=False),
    Column("label", String(128), nullable=False),
    Column("data_type", String(16), nullable=False),
    Column("help_text", Text),
    Column("active", Boolean, nullable=False, default=True),
    Column("validation", JSON, nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    CheckConstraint(
        "data_type IN ('char', 'text', 'decimal', 'integer', 'boolean', 'datetime', 'json')",
        name=conv("ck_custom_field_definition_data_type"),
    ),
    UniqueConstraint("company_id", "model_name", "field_name", name=conv("uq_custom_field_definition_scope_key")),
    UniqueConstraint("id", "company_id", "model_name", "data_type", name=conv("uq_custom_field_definition_composite_ref")),
    Index("ix_custom_field_definition_company_model", "company_id", "model_name"),
)


custom_field_value = Table(
    "custom_field_value",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("company_id", String(36), nullable=False),
    Column("model_name", String(128), nullable=False),
    Column("record_id", String(36), nullable=False),
    Column("field_id", String(36), nullable=False),
    Column("data_type", String(16), nullable=False),
    Column("value_text", String(4096)),
    Column("value_decimal", Numeric(24, 8)),
    Column("value_integer", Numeric(20, 0)),
    Column("value_boolean", Boolean),
    Column("value_datetime", DateTime(timezone=True)),
    Column("value_json", JSON(none_as_null=True)),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
    ForeignKeyConstraint(
        ["field_id", "company_id", "model_name", "data_type"],
        [
            "custom_field_definition.id",
            "custom_field_definition.company_id",
            "custom_field_definition.model_name",
            "custom_field_definition.data_type",
        ],
        name=conv("fk_custom_field_value_definition_scope"),
        ondelete="CASCADE",
    ),
    CheckConstraint(
        "(data_type IN ('char', 'text') AND value_text IS NOT NULL AND value_decimal IS NULL AND value_integer IS NULL AND value_boolean IS NULL AND value_datetime IS NULL AND value_json IS NULL) OR "
        "(data_type = 'decimal' AND value_text IS NULL AND value_decimal IS NOT NULL AND value_integer IS NULL AND value_boolean IS NULL AND value_datetime IS NULL AND value_json IS NULL) OR "
        "(data_type = 'integer' AND value_text IS NULL AND value_decimal IS NULL AND value_integer IS NOT NULL AND value_boolean IS NULL AND value_datetime IS NULL AND value_json IS NULL) OR "
        "(data_type = 'boolean' AND value_text IS NULL AND value_decimal IS NULL AND value_integer IS NULL AND value_boolean IS NOT NULL AND value_datetime IS NULL AND value_json IS NULL) OR "
        "(data_type = 'datetime' AND value_text IS NULL AND value_decimal IS NULL AND value_integer IS NULL AND value_boolean IS NULL AND value_datetime IS NOT NULL AND value_json IS NULL) OR "
        "(data_type = 'json' AND value_text IS NULL AND value_decimal IS NULL AND value_integer IS NULL AND value_boolean IS NULL AND value_datetime IS NULL AND value_json IS NOT NULL)",
        name=conv("ck_custom_field_value_typed_value"),
    ),
    UniqueConstraint(
        "company_id", "model_name", "record_id", "field_id",
        name=conv("uq_custom_field_value_record_field"),
    ),
    Index("ix_custom_field_value_scope_record", "company_id", "model_name", "record_id"),
)
