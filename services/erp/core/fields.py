"""
Moonwitness ERP — Field Descriptors & Model Definitions
Provides Odoo-like ergonomic field declarations that compile into SQLAlchemy Columns & Relationships.
"""
from typing import Any, Optional, List, Tuple
from decimal import Decimal
import datetime
from sqlalchemy import (
    Column, String, Text, Integer, Float, Numeric, Boolean, DateTime, JSON, ForeignKey
)
from services.erp.core.clock import utc_now


class Field:
    """Base Field Descriptor"""
    def __init__(
        self,
        py_type: type = str,
        string: str = "",
        required: bool = False,
        default: Any = None,
        index: bool = False,
        unique: bool = False,
        help: str = "",
        sensitive: bool = False,
        minimum: Any = None,
        maximum: Any = None,
        exclusive_minimum: bool = False,
        exclusive_maximum: bool = False,
    ):
        self.py_type = py_type
        self.string = string
        self.required = required
        self.default = default
        self.index = index
        self.unique = unique
        self.help = help
        self.sensitive = sensitive
        self.minimum = minimum
        self.maximum = maximum
        self.exclusive_minimum = exclusive_minimum
        self.exclusive_maximum = exclusive_maximum
        self.name: Optional[str] = None

    def to_sa_column(self, col_name: str) -> Column:
        """Convert descriptor to SQLAlchemy Column"""
        raise NotImplementedError


class ComputedField:
    """Read-only Python-computed field; ``compute`` is a method name or callable."""
    def __init__(self, compute: Any, string: str = "", depends: Optional[List[str]] = None):
        if not callable(compute) and not isinstance(compute, str):
            raise TypeError("ComputedField compute must be a callable or method name")
        self.compute = compute
        self.string = string
        self.depends = tuple(depends or ())
        self.name: Optional[str] = None

    def value_for(self, instance):
        if isinstance(self.compute, str):
            callback = getattr(instance, self.compute)
            return callback()
        return self.compute(instance)


class RelatedField(ComputedField):
    """Read-only dotted-path alias, such as ``customer.name``."""
    def __init__(self, path: str, string: str = ""):
        parts = tuple(part for part in path.split(".") if part)
        if len(parts) < 2 or len(parts) != len(path.split(".")):
            raise ValueError("RelatedField path must contain at least two non-empty attributes")
        self.path = path
        super().__init__(self._resolve, string=string, depends=list(parts))

    def _resolve(self, instance):
        value = instance
        for part in self.path.split("."):
            if value is None:
                return None
            value = getattr(value, part)
        return value


class CharField(Field):
    def __init__(self, max_length: int = 255, **kwargs):
        super().__init__(py_type=str, **kwargs)
        self.max_length = max_length

    def to_sa_column(self, col_name: str) -> Column:
        return Column(
            col_name,
            String(self.max_length),
            nullable=not self.required,
            default=self.default,
            index=self.index,
            unique=self.unique,
            comment=self.string or col_name
        )


class TextField(Field):
    def __init__(self, **kwargs):
        super().__init__(py_type=str, **kwargs)

    def to_sa_column(self, col_name: str) -> Column:
        return Column(
            col_name,
            Text,
            nullable=not self.required,
            default=self.default,
            index=self.index,
            comment=self.string or col_name
        )


class IntegerField(Field):
    def __init__(self, **kwargs):
        super().__init__(py_type=int, **kwargs)

    def to_sa_column(self, col_name: str) -> Column:
        return Column(
            col_name,
            Integer,
            nullable=not self.required,
            default=self.default,
            index=self.index,
            unique=self.unique,
            comment=self.string or col_name
        )


class FloatField(Field):
    def __init__(self, **kwargs):
        super().__init__(py_type=float, **kwargs)

    def to_sa_column(self, col_name: str) -> Column:
        return Column(
            col_name,
            Float,
            nullable=not self.required,
            default=self.default,
            comment=self.string or col_name
        )


class DecimalField(Field):
    """
    Fixed-precision decimal for currency / financial amounts.
    Never use float for money.
    """
    def __init__(self, precision: int = 20, scale: int = 4, **kwargs):
        super().__init__(py_type=Decimal, **kwargs)
        self.precision = precision
        self.scale = scale

    def to_sa_column(self, col_name: str) -> Column:
        return Column(
            col_name,
            Numeric(precision=self.precision, scale=self.scale),
            nullable=not self.required,
            default=self.default if self.default is not None else Decimal("0.00"),
            comment=self.string or col_name
        )


class MoneyField(DecimalField):
    """Convenience alias for standard financial currency values (e.g. IDR, USD)"""
    def __init__(self, currency_field: str = "currency_code", **kwargs):
        super().__init__(precision=20, scale=4, **kwargs)
        self.currency_field = currency_field


class BooleanField(Field):
    def __init__(self, **kwargs):
        if "default" not in kwargs:
            kwargs["default"] = False
        super().__init__(py_type=bool, **kwargs)

    def to_sa_column(self, col_name: str) -> Column:
        return Column(
            col_name,
            Boolean,
            nullable=not self.required,
            default=self.default,
            index=self.index,
            comment=self.string or col_name
        )


class DateTimeField(Field):
    def __init__(self, auto_now: bool = False, auto_now_add: bool = False, **kwargs):
        super().__init__(py_type=datetime.datetime, **kwargs)
        self.auto_now = auto_now
        self.auto_now_add = auto_now_add

    def to_sa_column(self, col_name: str) -> Column:
        return Column(
            col_name,
            DateTime(timezone=True),
            nullable=not self.required,
            default=utc_now if self.auto_now_add else self.default,
            onupdate=utc_now if self.auto_now else None,
            index=self.index,
            comment=self.string or col_name
        )


class JSONField(Field):
    def __init__(self, **kwargs):
        super().__init__(py_type=dict, **kwargs)

    def to_sa_column(self, col_name: str) -> Column:
        return Column(
            col_name,
            JSON,
            nullable=not self.required,
            default=self.default if self.default is not None else dict,
            comment=self.string or col_name
        )


class Selection(Field):
    """Selection / Enum field (stored as VARCHAR with validation)"""
    def __init__(self, choices: List[Tuple[str, str]], **kwargs):
        super().__init__(py_type=str, **kwargs)
        self.choices = choices

    def to_sa_column(self, col_name: str) -> Column:
        return Column(
            col_name,
            String(64),
            nullable=not self.required,
            default=self.default,
            index=self.index,
            comment=self.string or col_name
        )


class Many2One(Field):
    """
    Many-to-One Foreign Key relationship.
    target_model: technical model name, e.g. 'res.partner'
    """
    def __init__(self, target_model: str, ondelete: str = "SET NULL", **kwargs):
        super().__init__(py_type=str, **kwargs)
        self.target_model = target_model
        self.ondelete = ondelete

    def to_sa_column(self, col_name: str, target_table: str) -> Column:
        fk_str = f"{target_table}.id"
        return Column(
            col_name,
            String(36),
            ForeignKey(fk_str, ondelete=self.ondelete),
            nullable=not self.required,
            index=True,
            comment=self.string or col_name
        )


class One2Many:
    """One-to-Many virtual relationship reference"""
    def __init__(self, target_model: str, inverse_field: str, string: str = ""):
        self.target_model = target_model
        self.inverse_field = inverse_field
        self.string = string


class Many2Many:
    """Many-to-many navigation through an addon-compiled association table."""
    def __init__(
        self,
        target_model: str,
        relation_table: Optional[str] = None,
        source_column: Optional[str] = None,
        target_column: Optional[str] = None,
        string: str = "",
    ):
        self.target_model = target_model
        self.relation_table = relation_table
        self.source_column = source_column
        self.target_column = target_column
        self.string = string
        self.name: Optional[str] = None
