"""Tenant context propagated only within the current request/task context."""
from contextvars import ContextVar


# Stable bootstrap owner for records that predate company ownership and for local dev.
DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000001"
current_company_id: ContextVar[str | None] = ContextVar("erp_company_id", default=None)
current_request_is_admin: ContextVar[bool] = ContextVar("erp_is_admin", default=False)
