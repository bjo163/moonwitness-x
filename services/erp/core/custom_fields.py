"""Validation and typed serialization for governed company custom fields."""
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import re
from typing import Any


CUSTOM_FIELD_TYPES = {"char", "text", "decimal", "integer", "boolean", "datetime", "json"}
CUSTOM_FIELD_NAME = re.compile(r"x_[a-z][a-z0-9_]{0,61}\Z")
_PROTECTED_NAME_PARTS = {
    "password", "passwd", "secret", "credential", "token", "tax",
    "bank", "ledger", "balance", "iban", "routing",
}
_ALLOWED_VALIDATION_KEYS = {"minimum", "maximum", "max_length", "choices"}


def validate_custom_field_definition(
    *, field_name: str, data_type: str, validation: dict[str, Any]
) -> None:
    if not CUSTOM_FIELD_NAME.fullmatch(field_name):
        raise ValueError("Custom field names must match x_<lowercase_identifier>")
    if _PROTECTED_NAME_PARTS.intersection(field_name.split("_")):
        raise ValueError("Custom fields cannot store credentials, tax, banking, or ledger data")
    if data_type not in CUSTOM_FIELD_TYPES:
        raise ValueError(f"Unsupported custom field type: {data_type}")
    if not isinstance(validation, dict) or set(validation) - _ALLOWED_VALIDATION_KEYS:
        raise ValueError("Validation rules may contain only minimum, maximum, max_length, and choices")

    if "max_length" in validation:
        limit = validation["max_length"]
        if data_type not in {"char", "text"} or not isinstance(limit, int) or isinstance(limit, bool) or not 1 <= limit <= 4096:
            raise ValueError("max_length must be between 1 and 4096 for char/text fields")
    if "choices" in validation:
        choices = validation["choices"]
        if data_type not in {"char", "text"} or not isinstance(choices, list) or not choices:
            raise ValueError("choices must be a non-empty list for char/text fields")
        if any(not isinstance(item, str) or len(item) > 4096 for item in choices):
            raise ValueError("Every custom field choice must be a string of at most 4096 characters")
    if "minimum" in validation or "maximum" in validation:
        if data_type not in {"decimal", "integer"}:
            raise ValueError("minimum/maximum are supported only for decimal/integer fields")
        low, high = validation.get("minimum"), validation.get("maximum")
        if data_type == "integer":
            for key, bound in (("minimum", low), ("maximum", high)):
                if key in validation and (not isinstance(bound, int) or isinstance(bound, bool)):
                    raise ValueError(f"{key} must be an integer")
        else:
            for key, bound in (("minimum", low), ("maximum", high)):
                if key in validation:
                    if not isinstance(bound, (str, int)) or isinstance(bound, bool):
                        raise ValueError(f"{key} must be decimal text or an integer")
                    try:
                        parsed = Decimal(str(bound))
                    except InvalidOperation as exc:
                        raise ValueError(f"{key} must be finite decimal text") from exc
                    if not parsed.is_finite():
                        raise ValueError(f"{key} must be finite decimal text")
        if low is not None and high is not None:
            compare_low, compare_high = (
                (Decimal(str(low)), Decimal(str(high)))
                if data_type == "decimal" else (low, high)
            )
            if compare_low > compare_high:
                raise ValueError("minimum cannot exceed maximum")


def encode_custom_value(data_type: str, value: Any, rules: dict[str, Any]) -> dict[str, Any]:
    """Validate a JSON API value and return exactly one typed DB value column."""
    columns = {
        "value_text": None,
        "value_decimal": None,
        "value_integer": None,
        "value_boolean": None,
        "value_datetime": None,
        "value_json": None,
    }
    if data_type not in CUSTOM_FIELD_TYPES:
        raise ValueError("Custom field has an unsupported data type")
    if data_type in {"char", "text"}:
        if not isinstance(value, str):
            raise ValueError("Custom char/text values must be strings")
        max_length = min(rules.get("max_length", 4096), 4096)
        if len(value) > max_length:
            raise ValueError(f"Custom value exceeds max_length {max_length}")
        if "choices" in rules and value not in rules["choices"]:
            raise ValueError("Custom value is not one of the allowed choices")
        columns["value_text"] = value
    elif data_type == "decimal":
        if not isinstance(value, (str, int)) or isinstance(value, bool):
            raise ValueError("Decimal custom values must be decimal text or an integer; floats are rejected")
        try:
            parsed = Decimal(str(value))
        except InvalidOperation as exc:
            raise ValueError("Decimal custom value is invalid") from exc
        if not parsed.is_finite():
            raise ValueError("Decimal custom value must be finite")
        try:
            fixed_scale = parsed.quantize(Decimal("0.00000001"))
        except InvalidOperation as exc:
            raise ValueError("Decimal custom value exceeds supported precision") from exc
        if fixed_scale != parsed or abs(parsed) >= Decimal("10000000000000000"):
            raise ValueError("Decimal custom values support up to 16 integer and 8 fractional digits")
        _validate_numeric_bounds(parsed, rules)
        columns["value_decimal"] = parsed
    elif data_type == "integer":
        if not isinstance(value, int) or isinstance(value, bool):
            raise ValueError("Integer custom values must be JSON integers")
        if abs(value) >= 10**20:
            raise ValueError("Integer custom values support at most 20 digits")
        _validate_numeric_bounds(value, rules)
        columns["value_integer"] = value
    elif data_type == "boolean":
        if not isinstance(value, bool):
            raise ValueError("Boolean custom values must be true or false")
        columns["value_boolean"] = value
    elif data_type == "datetime":
        if not isinstance(value, str):
            raise ValueError("Datetime custom values must be ISO-8601 strings")
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("Datetime custom value must be ISO-8601") from exc
        if parsed.tzinfo is None or parsed.utcoffset() is None:
            raise ValueError("Datetime custom values must include a timezone offset")
        columns["value_datetime"] = parsed.astimezone(timezone.utc)
    else:
        if not isinstance(value, (dict, list)):
            raise ValueError("JSON custom values must be an object or array")
        columns["value_json"] = value
    return columns


def _validate_numeric_bounds(value: int | Decimal, rules: dict[str, Any]) -> None:
    minimum = rules.get("minimum")
    maximum = rules.get("maximum")
    if isinstance(value, Decimal):
        minimum = Decimal(str(minimum)) if minimum is not None else None
        maximum = Decimal(str(maximum)) if maximum is not None else None
    if minimum is not None and value < minimum:
        raise ValueError(f"Custom value must be at least {rules['minimum']}")
    if maximum is not None and value > maximum:
        raise ValueError(f"Custom value must be at most {rules['maximum']}")


def decode_custom_value(data_type: str, row: Any) -> Any:
    if data_type in {"char", "text"}:
        return row["value_text"]
    if data_type == "decimal":
        return format(row["value_decimal"], "f")
    if data_type == "integer":
        return int(row["value_integer"])
    if data_type == "boolean":
        return row["value_boolean"]
    if data_type == "datetime":
        value = row["value_datetime"]
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).isoformat()
    return row["value_json"]
