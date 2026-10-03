"""Clock helpers for UTC instants; business calendars live in billing.py."""

from datetime import datetime, timezone


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
