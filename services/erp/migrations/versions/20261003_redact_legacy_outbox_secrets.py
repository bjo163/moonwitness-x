"""Redact credentials from legacy outbox payloads.

Revision ID: 20261003redact
Revises: 72682e2e996c
Create Date: 2026-10-03

This migration is intentionally irreversible: plaintext credentials are removed
from persisted event payloads and cannot be restored by downgrade.
"""
from __future__ import annotations

import json
from typing import Any

from alembic import op
import sqlalchemy as sa


revision = "20261003redact"
down_revision = "72682e2e996c"
branch_labels = None
depends_on = None

SENSITIVE_KEYS = {"password", "secret", "token", "credential"}


def _redact(value: Any) -> tuple[Any, bool]:
    if isinstance(value, dict):
        result = {}
        changed = False
        for key, child in value.items():
            if key.lower() in SENSITIVE_KEYS:
                changed = True
                continue
            cleaned, child_changed = _redact(child)
            result[key] = cleaned
            changed = changed or child_changed
        return result, changed
    if isinstance(value, list):
        result = []
        changed = False
        for child in value:
            cleaned, child_changed = _redact(child)
            result.append(cleaned)
            changed = changed or child_changed
        return result, changed
    return value, False


def upgrade() -> None:
    bind = op.get_bind()
    outbox = sa.table(
        "erp_outbox_event",
        sa.column("id", sa.String),
        sa.column("payload", sa.JSON),
        sa.column("status", sa.String),
        sa.column("last_error", sa.Text),
        sa.column("lease_token", sa.String),
        sa.column("lease_expires_at", sa.DateTime(timezone=True)),
    )
    rows = bind.execute(sa.text(
        "SELECT id, payload, status FROM erp_outbox_event"
    )).mappings().all()
    for row in rows:
        payload = row["payload"]
        if isinstance(payload, str):
            payload = json.loads(payload)
        cleaned, changed = _redact(payload)
        if not changed:
            continue
        values = {"payload": cleaned}
        if row["status"] in {"PENDING", "FAILED", "PROCESSING"}:
            values.update(
                status="DEAD_LETTER",
                last_error="Legacy event contained plaintext credentials; reissue after secure credential setup",
                lease_token=None,
                lease_expires_at=None,
            )
        bind.execute(outbox.update().where(outbox.c.id == row["id"]).values(**values))


def downgrade() -> None:
    # Deliberately cannot restore secrets that were redacted by upgrade().
    pass
