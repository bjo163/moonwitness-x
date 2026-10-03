"""Deterministic Gregorian billing boundaries and Decimal proration helpers."""

from calendar import monthrange
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


INTERVAL_MONTHS = {"monthly": 1, "quarterly": 3, "annually": 12}


def normalize_utc(value: datetime) -> datetime:
    """Treat legacy naive database timestamps as UTC, then return an aware UTC instant."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _next_month(year: int, month: int, months: int) -> tuple[int, int]:
    ordinal = year * 12 + (month - 1) + months
    return ordinal // 12, ordinal % 12 + 1


def billing_boundary(
    reference: datetime,
    *,
    anchor_day: int,
    interval: str,
    billing_timezone: str,
) -> datetime:
    """Return the next interval boundary, preserving the original day and local clock.

    Short months clamp to their final day without changing `anchor_day`, so a
    Jan-31 monthly schedule becomes Feb-28/29 and then Mar-31. Ambiguous local
    times choose the first occurrence; nonexistent DST wall times move forward
    minute-by-minute to the first valid local instant.
    """
    if interval not in INTERVAL_MONTHS:
        raise ValueError(f"Unsupported billing interval: {interval!r}")
    if not 1 <= anchor_day <= 31:
        raise ValueError("anchor_day must be between 1 and 31")
    try:
        zone = ZoneInfo(billing_timezone)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise ValueError(f"Unknown IANA billing timezone: {billing_timezone!r}") from exc

    reference_local = normalize_utc(reference).astimezone(zone)
    year, month = _next_month(
        reference_local.year,
        reference_local.month,
        INTERVAL_MONTHS[interval],
    )
    day = min(anchor_day, monthrange(year, month)[1])
    local_date = date(year, month, day)
    local_clock = reference_local.timetz().replace(tzinfo=None)
    candidate = datetime.combine(local_date, local_clock).replace(tzinfo=zone, fold=0)

    # ZoneInfo attaches offsets without validating wall-clock gaps. Round-trip
    # and move forward to a real local time if a DST transition removes it.
    for _ in range(181):
        instant = candidate.astimezone(timezone.utc)
        if instant.astimezone(zone).replace(tzinfo=None) == candidate.replace(tzinfo=None):
            return instant
        candidate += timedelta(minutes=1)
    raise ValueError("Could not resolve billing wall time after a timezone transition")


def prorate_amount(
    amount: Decimal,
    *,
    period_start: datetime,
    period_end: datetime,
    service_start: datetime,
    service_end: datetime,
    currency_exponent: int = 2,
) -> Decimal:
    """Prorate by exact elapsed microseconds and round once, half up, to currency."""
    if currency_exponent < 0 or currency_exponent > 6:
        raise ValueError("currency_exponent must be between 0 and 6")
    period_start = normalize_utc(period_start)
    period_end = normalize_utc(period_end)
    service_start = normalize_utc(service_start)
    service_end = normalize_utc(service_end)
    if period_end <= period_start:
        raise ValueError("Billing period must have positive duration")
    if service_end <= service_start:
        raise ValueError("Service interval must have positive duration")

    overlap_start = max(period_start, service_start)
    overlap_end = min(period_end, service_end)
    if overlap_end <= overlap_start:
        return Decimal("0").quantize(Decimal(1).scaleb(-currency_exponent))

    def micros(delta: timedelta) -> int:
        return (delta.days * 86400 + delta.seconds) * 1_000_000 + delta.microseconds

    fraction = Decimal(micros(overlap_end - overlap_start)) / Decimal(
        micros(period_end - period_start)
    )
    quantum = Decimal(1).scaleb(-currency_exponent)
    return (amount * fraction).quantize(quantum, rounding=ROUND_HALF_UP)
