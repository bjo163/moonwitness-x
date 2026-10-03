"""
Moonwitness ERP — Model Registry & Addon Compiler
Compiles addon model definitions and `_inherit` extensions into final immutable
SQLAlchemy mapped classes before the application creates sessions.
"""
from typing import Dict, List, Type, Any, Optional
import uuid
import datetime
from decimal import Decimal
from sqlalchemy import (
    Table, Column, String, DateTime, MetaData, ForeignKey, ForeignKeyConstraint,
    PrimaryKeyConstraint, CheckConstraint, UniqueConstraint,
)
from sqlalchemy.orm import registry as sa_registry, relationship
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm.attributes import NO_VALUE

from services.erp.core.db import metadata as global_metadata, Base
from services.erp.core.fields import (
    Field, CharField, IntegerField, FloatField, DecimalField, BooleanField,
    DateTimeField, JSONField, Selection, Many2One, One2Many, Many2Many,
    ComputedField,
)
from services.erp.core.clock import utc_now

REGISTRY_NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

class ModelMeta(type):
    """Metaclass that collects field declarations from Model class definitions"""
    def __new__(mcs, name, bases, attrs):
        fields = {}
        for key, val in list(attrs.items()):
            if isinstance(val, (Field, One2Many, Many2Many, ComputedField)):
                val.name = key
                fields[key] = val
        attrs["_declared_fields"] = fields
        return super().__new__(mcs, name, bases, attrs)


class Model(metaclass=ModelMeta):
    """
    Base class for ERP Models.
    Subclasses declare `_name` (for new models) or `_inherit` (to extend existing models).
    """
    _name: Optional[str] = None
    _inherit: Optional[str] = None
    _description: str = ""
    _table: Optional[str] = None
    _declared_fields: Dict[str, Any] = {}

    def __init__(self, **kwargs):
        fields = getattr(type(self), "_model_fields", {})
        relation_names = {
            name[:-3] if name.endswith("_id") else f"{name}_record"
            for name, field in fields.items()
            if isinstance(field, Many2One)
        }
        valid_names = set(fields) | relation_names | {"id", "created_at", "updated_at"}
        if hasattr(type(self), "__table__") and "company_id" in type(self).__table__.c:
            valid_names.add("company_id")
        unknown = set(kwargs) - valid_names
        if unknown:
            raise TypeError(f"Unknown fields for {getattr(type(self), '_model_name', type(self).__name__)}: {sorted(unknown)}")

        for name, field in fields.items():
            if isinstance(field, ComputedField) and name in kwargs:
                raise TypeError(f"{name} is a read-only computed field")
            if not isinstance(field, Field) or name not in kwargs:
                continue
            value = kwargs[name]
            if value is None:
                if field.required:
                    raise ValueError(f"{name} is required")
                continue
            if isinstance(field, Selection):
                allowed = {key for key, _label in field.choices}
                if value not in allowed:
                    raise ValueError(f"{name} must be one of {sorted(allowed)}")
            elif isinstance(field, CharField) and not isinstance(value, str):
                raise TypeError(f"{name} must be a string")
            elif isinstance(field, IntegerField) and (not isinstance(value, int) or isinstance(value, bool)):
                raise TypeError(f"{name} must be an integer")
            elif isinstance(field, FloatField) and not isinstance(value, (int, float)):
                raise TypeError(f"{name} must be numeric")
            elif isinstance(field, DecimalField) and not isinstance(value, (Decimal, int, str)):
                raise TypeError(f"{name} must be Decimal, integer, or decimal text; floats are rejected")
            elif isinstance(field, BooleanField) and not isinstance(value, bool):
                raise TypeError(f"{name} must be a boolean")
            elif isinstance(field, DateTimeField) and not isinstance(value, datetime.datetime):
                raise TypeError(f"{name} must be a datetime")
            elif isinstance(field, JSONField) and not isinstance(value, (dict, list)):
                raise TypeError(f"{name} must be a JSON object or array")

            if field.minimum is not None or field.maximum is not None:
                numeric_value = Decimal(str(value)) if isinstance(field, DecimalField) else value
                if field.minimum is not None:
                    minimum = Decimal(str(field.minimum)) if isinstance(field, DecimalField) else field.minimum
                    below_minimum = (
                        numeric_value <= minimum if field.exclusive_minimum
                        else numeric_value < minimum
                    )
                    if below_minimum:
                        operator = ">" if field.exclusive_minimum else ">="
                        raise ValueError(f"{name} must be {operator} {field.minimum}")
                if field.maximum is not None:
                    maximum = Decimal(str(field.maximum)) if isinstance(field, DecimalField) else field.maximum
                    above_maximum = (
                        numeric_value >= maximum if field.exclusive_maximum
                        else numeric_value > maximum
                    )
                    if above_maximum:
                        operator = "<" if field.exclusive_maximum else "<="
                        raise ValueError(f"{name} must be {operator} {field.maximum}")

            if isinstance(field, CharField) and len(value) > field.max_length:
                raise ValueError(f"{name} exceeds maximum length {field.max_length}")

        for name, field in fields.items():
            if isinstance(field, Field) and field.required and field.default is None:
                # Required foreign keys may be satisfied by assigning the
                # companion relationship (or a parent collection) after init.
                if isinstance(field, Many2One):
                    continue
                if name not in kwargs:
                    raise ValueError(f"{name} is required")

        for k, v in kwargs.items():
            setattr(self, k, v)

    def validate_model(self) -> None:
        """Addon hook for cross-field/domain checks; extensions may call ``super()``."""

    def validate(self) -> None:
        """Validate required relations and then run cooperative model validators."""
        for name, field in getattr(type(self), "_model_fields", {}).items():
            if not isinstance(field, Many2One) or not field.required:
                continue
            if getattr(self, name, None) is not None:
                continue
            relation_name = name[:-3] if name.endswith("_id") else f"{name}_record"
            relationship_value = sa_inspect(self).attrs[relation_name].loaded_value
            if relationship_value is NO_VALUE or relationship_value is None:
                raise ValueError(f"{name} requires a related {field.target_model} record or id")
        self.validate_model()

    def to_dict(self) -> Dict[str, Any]:
        """Serialize model instance to standard dict"""
        res = {}
        for col in self.__table__.columns:
            if col.info.get("sensitive", False):
                continue
            val = getattr(self, col.name, None)
            if isinstance(val, (datetime.datetime, datetime.date)):
                res[col.name] = val.isoformat()
            elif isinstance(val, Decimal):
                # Preserve exact monetary values across JSON/API boundaries.
                res[col.name] = format(val, "f")
            elif isinstance(val, uuid.UUID):
                res[col.name] = str(val)
            else:
                res[col.name] = val
        for name, field in getattr(type(self), "_model_fields", {}).items():
            if not isinstance(field, ComputedField):
                continue
            val = getattr(self, name)
            if isinstance(val, (datetime.datetime, datetime.date)):
                res[name] = val.isoformat()
            elif isinstance(val, Decimal):
                res[name] = format(val, "f")
            elif isinstance(val, uuid.UUID):
                res[name] = str(val)
            else:
                res[name] = val
        return res


class AddonManifest:
    def __init__(
        self,
        name: str,
        version: str = "1.0.0",
        depends: List[str] = None,
        description: str = "",
        api_version: str = "1",
        capabilities: Optional[List[str]] = None,
    ):
        self.name = name
        self.version = version
        self.depends = depends or []
        self.description = description
        self.api_version = api_version
        self.capabilities = capabilities or []
        self.models: List[Type[Model]] = []


class ERPRegistry:
    """
    Immutable Model Registry that compiles all Addon models
    and `_inherit` extensions into final mapped SQLAlchemy classes.
    """
    def __init__(self, model_metadata: Optional[MetaData] = None):
        self.metadata = model_metadata if model_metadata is not None else MetaData(
            naming_convention=REGISTRY_NAMING_CONVENTION
        )
        self._mapper_registry = sa_registry(metadata=self.metadata)
        self._addons: Dict[str, AddonManifest] = {}
        self._raw_models: Dict[str, List[Type[Model]]] = {}  # model_name -> [classes]
        self._compiled_classes: Dict[str, Type[Any]] = {}     # model_name -> Compiled Class
        self._compiled_tables: Dict[str, Table] = {}          # model_name -> SA Table
        self._compiled_fields: Dict[str, Dict[str, Any]] = {}
        self._model_to_table: Dict[str, str] = {}             # 'res.partner' -> 'res_partner'
        self._is_compiled: bool = False

    def register_addon(self, manifest: AddonManifest, models: List[Type[Model]]):
        """Register an addon and its declared models"""
        if self._is_compiled:
            raise RuntimeError("Cannot register addon after registry has been compiled!")
        if manifest.name in self._addons:
            raise ValueError(f"Addon '{manifest.name}' has already been registered")
        if not manifest.name or not manifest.api_version:
            raise ValueError("Addon name and ERP API version are required")
        self._addons[manifest.name] = manifest
        manifest.models = models

        for model_cls in models:
            target_name = model_cls._name or model_cls._inherit
            if not target_name:
                raise ValueError(f"Model {model_cls.__name__} must define either `_name` or `_inherit`")
            if target_name not in self._raw_models:
                self._raw_models[target_name] = []
            self._raw_models[target_name].append(model_cls)

    def _resolve_dependency_order(self) -> List[str]:
        """Topological sort of addon manifests to ensure deterministic compilation order"""
        visited = set()
        temp_marked = set()
        order = []

        def visit(node: str):
            if node in temp_marked:
                raise ValueError(f"Circular dependency detected involving addon '{node}'")
            if node not in visited:
                temp_marked.add(node)
                manifest = self._addons.get(node)
                if not manifest:
                    raise ValueError(f"Missing dependency addon: '{node}'")
                for dep in sorted(manifest.depends):
                    visit(dep)
                temp_marked.remove(node)
                visited.add(node)
                order.append(node)

        for addon_name in sorted(self._addons):
            if addon_name not in visited:
                visit(addon_name)

        return order

    def compile(self):
        """Compile all collected models and `_inherit` extensions into SQLAlchemy mappers"""
        if self._is_compiled:
            return

        # 1. Verify and sort addons by dependency DAG
        addon_order = self._resolve_dependency_order()

        # 2. Determine addon/model ownership and table names.
        addon_order_index = {name: index for index, name in enumerate(addon_order)}
        model_owner: Dict[str, str] = {}
        for addon_name in addon_order:
            manifest = self._addons[addon_name]
            for model_cls in manifest.models:
                model_name = model_cls._name or model_cls._inherit
                if model_name in model_owner and model_cls._name == model_name:
                    raise ValueError(
                        f"Model '{model_name}' is defined more than once "
                        f"(addons '{model_owner[model_name]}' and '{addon_name}')"
                    )
                if model_cls._name == model_name:
                    model_owner[model_name] = addon_name

        for model_name, class_list in self._raw_models.items():
            # Find base model class (the one defining _name)
            base_cls = next((c for c in class_list if c._name == model_name), None)
            if not base_cls:
                raise ValueError(f"Model '{model_name}' has `_inherit` extensions but no base class with `_name`")
            table_name = getattr(base_cls, "_table", None) or model_name.replace(".", "_")
            self._model_to_table[model_name] = table_name

            owner = model_owner.get(model_name)
            if owner is None:
                raise ValueError(f"Model '{model_name}' has extensions but no base model")

        # An extension addon must depend (directly or transitively) on the
        # addon that owns the model it extends. Otherwise load order is accidental.
        def dependency_closure(addon_name: str) -> set[str]:
            found: set[str] = set()
            pending = list(self._addons[addon_name].depends)
            while pending:
                dependency = pending.pop()
                if dependency in found:
                    continue
                found.add(dependency)
                pending.extend(self._addons[dependency].depends)
            return found

        for model_name, class_list in self._raw_models.items():
            owner = model_owner[model_name]
            for cls in class_list:
                if cls._inherit == model_name:
                    addon_name = next(
                        name for name in addon_order
                        if cls in self._addons[name].models
                    )
                    if addon_name != owner and owner not in dependency_closure(addon_name):
                        raise ValueError(
                            f"Addon '{addon_name}' extends '{model_name}' but does not depend on owner addon '{owner}'"
                        )

        # 3. For each model, merge fields from base and all extensions
        for model_name, class_list in self._raw_models.items():
            table_name = self._model_to_table[model_name]
            base_cls = next(cls for cls in class_list if cls._name == model_name)
            all_fields: Dict[str, Field] = {}

            # Apply declarations in resolved addon dependency order, not import order.
            ordered_classes = sorted(
                class_list,
                key=lambda cls: next(
                    addon_order_index[name]
                    for name in addon_order
                    if cls in self._addons[name].models
                ),
            )
            field_owners: Dict[str, str] = {}
            for cls in ordered_classes:
                addon_name = next(
                    name for name in addon_order if cls in self._addons[name].models
                )
                # Merge declared fields
                for f_name, f_obj in cls._declared_fields.items():
                    if f_name in all_fields:
                        raise ValueError(
                            f"Field collision on '{model_name}.{f_name}' between "
                            f"addons '{field_owners[f_name]}' and '{addon_name}'. "
                            "Field overrides must be explicit and compatible."
                        )
                    all_fields[f_name] = f_obj
                    field_owners[f_name] = addon_name

            # 4. Construct SQLAlchemy Table columns
            columns = [
                Column("id", String(36), primary_key=True, default=lambda: str(uuid.uuid4())),
                Column("created_at", DateTime(timezone=True), default=utc_now, nullable=False),
                Column("updated_at", DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False),
            ]

            # Every ERP business row is tenant-owned by default. Explicit shared
            # catalog models opt out with `_company_scoped = False`.
            if getattr(base_cls, "_company_scoped", True) and model_name != "res.company":
                columns.append(Column(
                    "company_id", String(36), nullable=False, index=True,
                ))

            for col_name, field_obj in all_fields.items():
                if isinstance(field_obj, Many2One):
                    target_table = self._model_to_table.get(field_obj.target_model)
                    if not target_table:
                        # Fallback default table name
                        target_table = field_obj.target_model.replace(".", "_")
                    columns.append(field_obj.to_sa_column(col_name, target_table))
                elif isinstance(field_obj, Field):
                    column = field_obj.to_sa_column(col_name)
                    if field_obj.sensitive:
                        column.info["sensitive"] = True
                    columns.append(column)

            constraints = []
            for col_name, field_obj in all_fields.items():
                if not isinstance(field_obj, Field):
                    continue
                if field_obj.minimum is None and field_obj.maximum is None:
                    continue
                parts = []
                quoted_name = f'"{col_name}"'
                if field_obj.minimum is not None:
                    operator = ">" if field_obj.exclusive_minimum else ">="
                    parts.append(f"{quoted_name} {operator} {field_obj.minimum}")
                if field_obj.maximum is not None:
                    operator = "<" if field_obj.exclusive_maximum else "<="
                    parts.append(f"{quoted_name} {operator} {field_obj.maximum}")
                constraints.append(CheckConstraint(
                    " AND ".join(parts),
                    name=f"{col_name}_range",
                ))

            if getattr(base_cls, "_company_scoped", True) and model_name != "res.company":
                constraints.append(ForeignKeyConstraint(
                    ["company_id"], ["res_company.id"],
                    name=f"fk_{table_name}_company_id_res_company", ondelete="RESTRICT",
                ))
            if model_name == "ir.sequence":
                constraints.append(UniqueConstraint(
                    "company_id", "code", name="uq_ir_sequence_company_code"
                ))

            # Create SQLAlchemy Table object in metadata
            sa_table = Table(
                table_name, self.metadata, *columns, *constraints, extend_existing=True
            )
            self._compiled_tables[model_name] = sa_table
            self._compiled_fields[model_name] = all_fields

            # 5. Create Dynamic Mapped Class
            pascal_name = "".join(part.capitalize() for part in model_name.split("."))
            extensions = [
                cls for cls in ordered_classes
                if cls is not base_cls and cls._inherit == model_name
            ]
            # Later addons appear first in the MRO, so cooperative super() walks
            # through each extension and reaches the original model method.
            compiled_bases = tuple(reversed(extensions)) + (base_cls,)
            class_dict = {
                "__tablename__": table_name,
                "__table__": sa_table,
                "_model_name": model_name,
                "_model_fields": all_fields,
                "__repr__": lambda self: f"<{pascal_name} id={getattr(self, 'id', None)}>",
            }

            # Map the compiled class using mapper_registry
            compiled_cls = type(pascal_name, compiled_bases, class_dict)
            self._mapper_registry.map_imperatively(compiled_cls, sa_table)

            self._compiled_classes[model_name] = compiled_cls

        # Add navigable relationships after every target class/table exists.
        for model_name, fields in self._compiled_fields.items():
            source_cls = self._compiled_classes[model_name]
            source_table = self._compiled_tables[model_name]
            mapper = self._mapper_registry.mappers
            source_mapper = next(item for item in mapper if item.class_ is source_cls)

            for field_name, field_obj in fields.items():
                if isinstance(field_obj, Many2One):
                    target_cls = self._compiled_classes[field_obj.target_model]
                    target_table = self._compiled_tables[field_obj.target_model]
                    target_fields = self._compiled_fields[field_obj.target_model]
                    relation_name = (
                        field_name[:-3] if field_name.endswith("_id")
                        else f"{field_name}_record"
                    )
                    if relation_name in fields:
                        raise ValueError(
                            f"Many2One '{model_name}.{field_name}' relation attribute "
                            f"'{relation_name}' collides with a declared field"
                        )
                    back_populates = next(
                        (
                            inverse_name
                            for inverse_name, inverse_field in target_fields.items()
                            if isinstance(inverse_field, One2Many)
                            and inverse_field.target_model == model_name
                            and inverse_field.inverse_field == field_name
                        ),
                        None,
                    )
                    source_mapper.add_property(
                        relation_name,
                        relationship(
                            target_cls,
                            primaryjoin=source_table.c[field_name] == target_table.c.id,
                            foreign_keys=[source_table.c[field_name]],
                            back_populates=back_populates,
                            lazy="raise",
                        ),
                    )
                elif isinstance(field_obj, One2Many):
                    target_fields = self._compiled_fields[field_obj.target_model]
                    inverse = target_fields.get(field_obj.inverse_field)
                    if not isinstance(inverse, Many2One) or inverse.target_model != model_name:
                        raise ValueError(
                            f"One2Many '{model_name}.{field_name}' inverse "
                            f"'{field_obj.target_model}.{field_obj.inverse_field}' must be a Many2One back to '{model_name}'"
                        )
                    target_cls = self._compiled_classes[field_obj.target_model]
                    target_table = self._compiled_tables[field_obj.target_model]
                    foreign_column = target_table.c[field_obj.inverse_field]
                    inverse_relation = (
                        field_obj.inverse_field[:-3]
                        if field_obj.inverse_field.endswith("_id")
                        else f"{field_obj.inverse_field}_record"
                    )
                    source_mapper.add_property(
                        field_name,
                        relationship(
                            target_cls,
                            primaryjoin=source_table.c.id == foreign_column,
                            foreign_keys=[foreign_column],
                            back_populates=inverse_relation,
                            lazy="raise",
                        ),
                    )
                elif isinstance(field_obj, Many2Many):
                    target_cls = self._compiled_classes[field_obj.target_model]
                    target_table = self._compiled_tables[field_obj.target_model]
                    source_column = field_obj.source_column or f"{source_table.name}_id"
                    target_column = field_obj.target_column or f"{target_table.name}_id"
                    relation_table_name = field_obj.relation_table or (
                        f"{source_table.name}_{target_table.name}_rel"
                    )
                    if relation_table_name not in self.metadata.tables:
                        relation_table = Table(
                            relation_table_name,
                            self.metadata,
                            Column(source_column, String(36), ForeignKey(f"{source_table.name}.id", ondelete="CASCADE"), nullable=False),
                            Column(target_column, String(36), ForeignKey(f"{target_table.name}.id", ondelete="CASCADE"), nullable=False),
                            PrimaryKeyConstraint(source_column, target_column),
                        )
                    else:
                        relation_table = self.metadata.tables[relation_table_name]
                    source_mapper.add_property(
                        field_name,
                        relationship(target_cls, secondary=relation_table, lazy="raise"),
                    )
                elif isinstance(field_obj, ComputedField):
                    setattr(
                        source_cls,
                        field_name,
                        property(lambda instance, descriptor=field_obj: descriptor.value_for(instance)),
                    )

        self._is_compiled = True

    def get_model(self, model_name: str) -> Type[Any]:
        """Retrieve compiled SQLAlchemy model class by technical name (e.g. 'res.partner')"""
        if not self._is_compiled:
            self.compile()
        cls = self._compiled_classes.get(model_name)
        if not cls:
            raise KeyError(f"Model '{model_name}' not found in ERP Registry. Registered: {list(self._compiled_classes.keys())}")
        return cls

    def list_models(self) -> List[str]:
        return sorted(self._raw_models.keys())

    @property
    def is_compiled(self) -> bool:
        return self._is_compiled

    def describe(self) -> Dict[str, Any]:
        """Return a read-only-friendly registry manifest for diagnostics and tooling."""
        addon_order = self._resolve_dependency_order()
        models: Dict[str, Any] = {}
        for model_name, declarations in sorted(self._raw_models.items()):
            owner = next(
                addon.name for addon in (self._addons[name] for name in addon_order)
                if any(cls._name == model_name for cls in addon.models)
            )
            fields: Dict[str, Any] = {}
            for addon_name in addon_order:
                for model_cls in self._addons[addon_name].models:
                    if (model_cls._name or model_cls._inherit) != model_name:
                        continue
                    for field_name, field in model_cls._declared_fields.items():
                        fields[field_name] = {
                            "owner": addon_name,
                            "type": type(field).__name__,
                            "label": getattr(field, "string", "") or field_name.replace("_", " ").title(),
                            "help": getattr(field, "help", ""),
                            "required": getattr(field, "required", False),
                            "index": getattr(field, "index", False),
                            "sensitive": getattr(field, "sensitive", False),
                            "minimum": getattr(field, "minimum", None),
                            "maximum": getattr(field, "maximum", None),
                            "exclusive_minimum": getattr(field, "exclusive_minimum", False),
                            "exclusive_maximum": getattr(field, "exclusive_maximum", False),
                            "depends": list(getattr(field, "depends", ())),
                            "read_only": isinstance(field, ComputedField),
                            "max_length": getattr(field, "max_length", None),
                            "choices": [
                                {"value": key, "label": label}
                                for key, label in getattr(field, "choices", ())
                            ],
                            "target_model": getattr(field, "target_model", None),
                            "inverse_field": getattr(field, "inverse_field", None),
                        }
            models[model_name] = {
                "table": self._model_to_table.get(model_name),
                "owner": owner,
                "fields": fields,
            }
        return {
            "compiled": self._is_compiled,
            "addons": [
                {
                    "name": name,
                    "version": self._addons[name].version,
                    "api_version": self._addons[name].api_version,
                    "depends": sorted(self._addons[name].depends),
                    "capabilities": sorted(self._addons[name].capabilities),
                }
                for name in addon_order
            ],
            "models": models,
        }


# Global Singleton Registry Instance
registry = ERPRegistry(global_metadata)
