"""Atomic company-scoped document number allocation on PostgreSQL."""

import uuid

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from services.erp.core.registry import registry
from services.erp.core.tenancy import current_company_id


async def next_document_number(
    session: AsyncSession,
    *,
    code: str,
    fallback_prefix: str,
) -> str:
    """Increment in the database and return the number allocated by that update.

    PostgreSQL `UPDATE ... RETURNING` atomically allocates the next number.
    The fallback remains globally unique when a sequence row is absent.
    """
    Sequence = registry.get_model("ir.sequence")
    statement = update(Sequence).where(Sequence.code == code)
    tenant_id = current_company_id.get()
    if tenant_id:
        statement = statement.where(Sequence.company_id == tenant_id)
    result = await session.execute(
        statement
        .values(next_number=Sequence.next_number + 1)
        .returning(Sequence.prefix, Sequence.padding, Sequence.next_number)
    )
    allocation = result.one_or_none()
    if allocation is None:
        return f"{fallback_prefix}-{uuid.uuid4().hex[:16].upper()}"

    prefix, padding, incremented_number = allocation
    issued_number = incremented_number - 1
    return f"{prefix or ''}{str(issued_number).zfill(padding or 1)}"
