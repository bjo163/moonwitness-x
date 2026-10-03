"""
Moonwitness ERP — Master FastAPI Application
Odoo-inspired Modular Business, CRM, Subscription & Invoicing Engine.
Port: :5180
"""
from contextlib import asynccontextmanager
import datetime
import uuid
import asyncio
import logging
import re
import time
from decimal import Decimal
from typing import List, Optional, Dict, Any, Literal

from fastapi import FastAPI, Depends, HTTPException, Query, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, SecretStr, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, insert
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from pathlib import Path
from zoneinfo import ZoneInfo
from sqlalchemy.exc import IntegrityError

from services.erp.core.config import settings
from services.erp.core.db import async_engine, get_db, AsyncSessionLocal
from services.erp.core.registry import registry
from services.erp.core.outbox import outbox_dispatcher, OutboxEvent, emit_outbox_event
from services.erp.core.security import (
    CredentialEncryptionUnavailable, api_key_matches, company_for_tenant_key,
    configured_tenant_keys, encrypt_secret,
)
from services.erp.core.tenancy import (
    DEFAULT_COMPANY_ID, current_company_id, current_request_is_admin,
)
from services.erp.core.billing import billing_boundary
from services.erp.core.sequences import next_document_number
from services.erp.core.clock import utc_now
from services.erp.core.observability import (
    configure_telemetry, http_logger, request_id_context,
)
from services.erp.core.subscriptions import (
    InvalidSubscriptionTransition,
    transition_subscription,
)
from services.erp.core.fields import (
    BooleanField, CharField, ComputedField, DateTimeField, DecimalField,
    FloatField, IntegerField, JSONField, Many2Many, Many2One, Selection,
    TextField, One2Many,
)
from services.erp.addons import load_all_addons
from services.erp.addons.custom_fields.schema import custom_field_definition, custom_field_value
from services.erp.core.custom_fields import (
    decode_custom_value,
    encode_custom_value,
    validate_custom_field_definition,
)

logger = logging.getLogger("erp.billing")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.environment.lower() == "production" and settings.api_key is None:
        raise RuntimeError("MW_ERP_API_KEY must be configured in production")

    # 1. Load and compile all Odoo-like addons and _inherit extensions
    load_all_addons()
    
    # Schema is changed only by reviewed Alembic migrations, never create_all
    # during application startup.
    migration_config = Config(str(Path(__file__).parent / "alembic.ini"))
    script_directory = ScriptDirectory.from_config(migration_config)
    expected_revision = script_directory.get_current_head()
    async with async_engine.connect() as conn:
        current_revision = await conn.run_sync(
            lambda sync_conn: MigrationContext.configure(sync_conn).get_current_revision()
        )
    if current_revision != expected_revision:
        raise RuntimeError(
            "ERP database schema is not at the migration head "
            f"(current={current_revision!r}, expected={expected_revision!r}). "
            "Run `just migrate-erp` before starting the service. For a legacy "
            "database, verify its schema with `alembic check` and explicitly "
            "baseline it with `alembic stamp head`."
        )

    tenant_keys = configured_tenant_keys()
    if tenant_keys:
        Company = registry.get_model("res.company")
        async with AsyncSessionLocal() as session:
            configured_companies = set((await session.scalars(
                select(Company.id).where(Company.id.in_(tenant_keys))
            )).all())
        missing_companies = set(tenant_keys) - configured_companies
        if missing_companies:
            raise RuntimeError(
                "MW_ERP_TENANT_API_KEYS references company IDs missing from res_company: "
                + ", ".join(sorted(missing_companies))
            )

    # Demo fixtures are opt-in so production starts without sample customer or billing data.
    if settings.seed_demo_data:
        await seed_initial_data()

    telemetry_runtime = configure_telemetry(
        app,
        enabled=settings.telemetry_enabled,
        endpoint=settings.telemetry_otlp_trace_endpoint,
        service_name=settings.telemetry_service_name,
        sample_ratio=settings.telemetry_sample_ratio,
        engine=async_engine.sync_engine,
    )

    billing_task = asyncio.create_task(_billing_worker(), name="erp-billing-worker")

    # 4. Start Transactional Outbox Background Dispatcher
    await outbox_dispatcher.start()

    yield

    # Teardown
    await outbox_dispatcher.stop()
    billing_task.cancel()
    try:
        await billing_task
    except asyncio.CancelledError:
        pass
    await async_engine.dispose()
    if telemetry_runtime:
        telemetry_runtime.shutdown()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Moonwitness Universe OS — Odoo-like Modular ERP, CRM & Subscription Engine",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def require_api_bearer_key(request: Request, call_next):
    """Resolve admin or company token and bind company scope to this request."""
    if request.url.path == "/health" or request.method == "OPTIONS":
        return await call_next(request)
    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    token = token.strip() if scheme.lower() == "bearer" else ""
    admin = bool(
        settings.api_key
        and api_key_matches(token, settings.api_key.get_secret_value())
    )
    tenant_company = company_for_tenant_key(token)
    has_configured_auth = settings.api_key is not None or bool(configured_tenant_keys())
    if not admin and tenant_company is None:
        if settings.environment.lower() == "production" or has_configured_auth:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Valid bearer credentials are required"},
                headers={"WWW-Authenticate": "Bearer"},
            )
        admin = True  # Explicit local-development mode only.

    path = request.url.path
    global_admin_path = path in {
        f"{settings.api_prefix}/companies",
        f"{settings.api_prefix}/models",
    }
    if global_admin_path and not admin:
        return JSONResponse(status_code=403, content={"detail": "Administrator credentials are required"})

    requested_company = request.headers.get("x-company-id") or request.query_params.get("company_id")
    if not requested_company and path.startswith(f"{settings.api_prefix}/custom-fields/"):
        parts = path[len(f"{settings.api_prefix}/custom-fields/"):].split("/")
        if parts:
            requested_company = parts[0]
    if requested_company:
        try:
            requested_company = str(uuid.UUID(requested_company))
        except ValueError:
            return JSONResponse(status_code=400, content={"detail": "X-Company-ID must be a UUID"})

    if tenant_company is not None:
        if requested_company and requested_company != tenant_company:
            return JSONResponse(status_code=403, content={"detail": "Tenant token cannot access another company"})
        company_id = tenant_company
    elif admin:
        company_id = requested_company or DEFAULT_COMPANY_ID
        if (
            settings.environment.lower() == "production"
            and not global_admin_path
            and requested_company is None
        ):
            return JSONResponse(status_code=400, content={"detail": "X-Company-ID is required"})
    else:
        company_id = DEFAULT_COMPANY_ID

    company_token = current_company_id.set(company_id)
    admin_token = current_request_is_admin.set(admin)
    try:
        return await call_next(request)
    finally:
        current_company_id.reset(company_token)
        current_request_is_admin.reset(admin_token)


@app.middleware("http")
async def add_request_context(request: Request, call_next):
    """Attach a validated request ID and emit structured request completion logs."""
    supplied_id = request.headers.get("x-request-id", "")
    request_id = (
        supplied_id
        if re.fullmatch(r"[A-Za-z0-9._-]{1,128}", supplied_id)
        else uuid.uuid4().hex
    )
    context_token = request_id_context.set(request_id)
    started = time.perf_counter()
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        http_logger.info(
            "request_complete",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round((time.perf_counter() - started) * 1000, 3),
            },
        )
        return response
    except Exception as exc:
        http_logger.error(
            "request_failed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "error_type": type(exc).__name__,
            },
        )
        raise
    finally:
        request_id_context.reset(context_token)


# ==============================================================================
# 📦 PYDANTIC DTO SCHEMAS
# ==============================================================================

class PartnerCreateDTO(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    is_customer: bool = True
    is_subscriber: bool = False
    radius_username: Optional[str] = None
    radius_profile: Optional[str] = "10M_BROADBAND"
    radius_password: Optional[SecretStr] = Field(default=None, min_length=12, max_length=300)


class LeadCreateDTO(BaseModel):
    name: str
    partner_id: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    expected_revenue: Decimal = Field(default=Decimal("0"), ge=0)
    probability: int = Field(default=20, ge=0, le=100)
    stage: str = "new"
    description: Optional[str] = None


class LeadStageUpdateDTO(BaseModel):
    stage: str


class OrderLineDTO(BaseModel):
    product_id: Optional[str] = None
    name: str
    quantity: Decimal = Field(default=Decimal("1"), gt=0)
    unit_price: Decimal = Field(ge=0)
    line_kind: Literal["one_off", "recurring"] = "one_off"


class OrderCreateDTO(BaseModel):
    partner_id: str
    notes: Optional[str] = None
    lines: List[OrderLineDTO] = Field(min_length=1)


class SubscriptionActionDTO(BaseModel):
    reason: Optional[str] = "Operator administrative command"


class InvoicePayDTO(BaseModel):
    payment_method: str = "Bank Transfer"
    notes: Optional[str] = "Paid via Virtual Account / Gateway"


class CompanyCreateDTO(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    code: str = Field(min_length=1, max_length=32)
    currency_code: str = Field(default="IDR", min_length=3, max_length=8)
    email: Optional[str] = Field(default=None, max_length=128)
    phone: Optional[str] = Field(default=None, max_length=64)
    address: Optional[str] = None


class CustomFieldDefinitionCreateDTO(BaseModel):
    company_id: str = Field(min_length=36, max_length=36)
    model_name: str = Field(min_length=3, max_length=128)
    field_name: str = Field(min_length=4, max_length=64)
    label: str = Field(min_length=1, max_length=128)
    data_type: Literal["char", "text", "decimal", "integer", "boolean", "datetime", "json"]
    help_text: Optional[str] = Field(default=None, max_length=2000)
    validation: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("company_id")
    @classmethod
    def validate_company_uuid(cls, value: str) -> str:
        try:
            return str(uuid.UUID(value))
        except ValueError as exc:
            raise ValueError("company_id must be a UUID") from exc


class CustomFieldDefinitionStateDTO(BaseModel):
    active: bool


class CustomFieldValueDTO(BaseModel):
    value: Any


class FormFieldMetadataDTO(BaseModel):
    name: str
    label: str
    data_type: str
    required: bool = False
    read_only: bool = False
    custom: bool = False
    help_text: Optional[str] = None
    max_length: Optional[int] = None
    minimum: Any = None
    maximum: Any = None
    choices: List[Dict[str, str]] = Field(default_factory=list)
    target_model: Optional[str] = None
    depends: List[str] = Field(default_factory=list)
    validation: Dict[str, Any] = Field(default_factory=dict)


class ModelFormMetadataDTO(BaseModel):
    api_version: Literal["1"] = "1"
    model_name: str
    fields: List[FormFieldMetadataDTO]


# ==============================================================================
# 🌱 INITIAL SEED DATA
# ==============================================================================

async def seed_initial_data():
    async with AsyncSessionLocal() as session:
        Partner = registry.get_model("res.partner")
        Product = registry.get_model("product.template")
        Stage = registry.get_model("crm.stage")
        Sequence = registry.get_model("ir.sequence")

        # Check if already seeded (check products, not partners, since partner may exist from manual test)
        res = await session.execute(select(func.count(Product.id)))
        if res.scalar() > 0:
            return

        # Seed Sequences
        session.add_all([
            Sequence(code="sale.order", name="Sales Order Sequence", prefix="SO-2026-", padding=4, next_number=1),
            Sequence(code="sale.subscription", name="Subscription Sequence", prefix="SUB-2026-", padding=4, next_number=1),
            Sequence(code="account.move", name="Invoice Sequence", prefix="INV-2026-", padding=4, next_number=1),
        ])

        # Seed CRM Stages
        session.add_all([
            Stage(name="New", sequence=10, is_won=False, is_lost=False),
            Stage(name="Qualified", sequence=20, is_won=False, is_lost=False),
            Stage(name="Proposition", sequence=30, is_won=False, is_lost=False),
            Stage(name="Won", sequence=40, is_won=True, is_lost=False),
            Stage(name="Lost", sequence=50, is_won=False, is_lost=True),
        ])

        # Seed Products (One-off and Recurring)
        p1 = Product(name="Router MikroTik hEX RB750Gr3", code="HW-MTK-HEX", kind="one_off", list_price=Decimal("950000"), description="Gigabit Router ONT")
        p2 = Product(name="Biaya Instalasi & Tarik Fiber", code="SVC-INSTALL", kind="one_off", list_price=Decimal("350000"), description="One-time Setup & Splicing")
        p3 = Product(name="Dedicated Internet 50 Mbps", code="ISP-50M", kind="recurring", list_price=Decimal("1500000"), rate_limit="50M/50M", billing_interval="monthly")
        p4 = Product(name="Dedicated Internet 100 Mbps", code="ISP-100M", kind="recurring", list_price=Decimal("2800000"), rate_limit="100M/100M", billing_interval="monthly")
        p5 = Product(name="Managed Odoo 19 Container Workload", code="CLOUD-ODOO19", kind="recurring", list_price=Decimal("750000"), billing_interval="monthly")
        session.add_all([p1, p2, p3, p4, p5])

        # Seed Partners
        c1 = Partner(
            name="PT Nusantara Solusi Digital",
            email="finance@nusantara.id",
            phone="081298765432",
            city="Jakarta Selatan",
            address="Jl. Sudirman Kav. 52-53",
            is_customer=True,
            is_subscriber=True,
            radius_username="nusantara_corp",
            radius_profile="50M_BROADBAND",
            radius_framed_ip="10.10.20.14",
            radius_status="active"
        )
        c2 = Partner(
            name="CV Mahakarya Kreatif",
            email="admin@mahakarya.co.id",
            phone="081311223344",
            city="Bandung",
            address="Jl. R.E. Martadinata No. 88",
            is_customer=True,
            is_subscriber=False
        )
        session.add_all([c1, c2])
        await session.commit()


# ==============================================================================
# 🚀 CORE ERP ENDPOINTS
# ==============================================================================

@app.get("/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "moonwitness-erp",
        "version": settings.app_version,
        "database": "postgresql",
        "models_count": len(registry.list_models()),
        "timestamp": utc_now().isoformat()
    }


@app.get(f"{settings.api_prefix}/models")
async def list_compiled_models():
    """Expose the immutable addon/model manifest for developer diagnostics."""
    return registry.describe()


@app.post(f"{settings.api_prefix}/companies", status_code=status.HTTP_201_CREATED)
async def create_company(dto: CompanyCreateDTO, db: AsyncSession = Depends(get_db)):
    """Create a legal company used to scope governed custom-field definitions."""
    Company = registry.get_model("res.company")
    company = Company(**dto.model_dump())
    db.add(company)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Company code already exists") from exc
    return company.to_dict()


@app.get(f"{settings.api_prefix}/companies")
async def list_companies(db: AsyncSession = Depends(get_db)):
    Company = registry.get_model("res.company")
    rows = (await db.execute(select(Company).order_by(Company.name))).scalars().all()
    return [row.to_dict() for row in rows]


async def _require_custom_field_company(db: AsyncSession, company_id: str) -> None:
    scoped_company_id = current_company_id.get()
    if not current_request_is_admin.get() and scoped_company_id != company_id:
        raise HTTPException(status_code=403, detail="Cannot access another company's metadata")
    Company = registry.get_model("res.company")
    found = await db.scalar(select(Company.id).where(Company.id == company_id))
    if not found:
        raise HTTPException(status_code=404, detail="Company not found")


def _require_custom_field_model(model_name: str):
    try:
        return registry.get_model(model_name)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="ERP model not found") from exc


@app.get(
    f"{settings.api_prefix}/forms/{{model_name}}",
    response_model=ModelFormMetadataDTO,
)
async def get_model_form_metadata(
    model_name: str,
    company_id: str = Query(min_length=36, max_length=36),
    db: AsyncSession = Depends(get_db),
):
    """Build explicit, versioned form metadata without exposing DB models as DTOs."""
    try:
        company_id = str(uuid.UUID(company_id))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="company_id must be a UUID") from exc
    await _require_custom_field_company(db, company_id)
    model_cls = _require_custom_field_model(model_name)

    fields = []
    for name, field in model_cls._model_fields.items():
        if getattr(field, "sensitive", False):
            continue
        if isinstance(field, ComputedField):
            data_type, read_only = "computed", True
        elif isinstance(field, Selection):
            data_type, read_only = "selection", False
        elif isinstance(field, Many2One):
            data_type, read_only = "many2one", False
        elif isinstance(field, (One2Many, Many2Many)):
            data_type, read_only = "relation_list", True
        elif isinstance(field, CharField):
            data_type, read_only = "char", False
        elif isinstance(field, TextField):
            data_type, read_only = "text", False
        elif isinstance(field, DecimalField):
            data_type, read_only = "decimal", False
        elif isinstance(field, IntegerField):
            data_type, read_only = "integer", False
        elif isinstance(field, FloatField):
            data_type, read_only = "number", False
        elif isinstance(field, BooleanField):
            data_type, read_only = "boolean", False
        elif isinstance(field, DateTimeField):
            data_type, read_only = "datetime", False
        elif isinstance(field, JSONField):
            data_type, read_only = "json", False
        else:
            continue
        fields.append(FormFieldMetadataDTO(
            name=name,
            label=getattr(field, "string", "") or name.replace("_", " ").title(),
            data_type=data_type,
            required=getattr(field, "required", False),
            read_only=read_only,
            help_text=getattr(field, "help", "") or None,
            max_length=getattr(field, "max_length", None),
            minimum=getattr(field, "minimum", None),
            maximum=getattr(field, "maximum", None),
            choices=[{"value": key, "label": label} for key, label in getattr(field, "choices", ())],
            target_model=getattr(field, "target_model", None),
            depends=list(getattr(field, "depends", ())),
        ))

    custom_rows = (await db.execute(
        select(custom_field_definition).where(
            custom_field_definition.c.company_id == company_id,
            custom_field_definition.c.model_name == model_name,
            custom_field_definition.c.active.is_(True),
        ).order_by(custom_field_definition.c.field_name)
    )).mappings().all()
    fields.extend(
        FormFieldMetadataDTO(
            name=row["field_name"],
            label=row["label"],
            data_type=row["data_type"],
            custom=True,
            help_text=row["help_text"],
            validation=row["validation"] or {},
        )
        for row in custom_rows
    )
    return ModelFormMetadataDTO(model_name=model_name, fields=fields)


@app.post(f"{settings.api_prefix}/custom-fields", status_code=status.HTTP_201_CREATED)
async def create_custom_field_definition(
    dto: CustomFieldDefinitionCreateDTO,
    db: AsyncSession = Depends(get_db),
):
    await _require_custom_field_company(db, dto.company_id)
    model_cls = _require_custom_field_model(dto.model_name)
    if dto.field_name in getattr(model_cls, "_model_fields", {}):
        raise HTTPException(status_code=409, detail="Custom field name collides with a compiled model field")
    try:
        validate_custom_field_definition(
            field_name=dto.field_name,
            data_type=dto.data_type,
            validation=dto.validation,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    values = dto.model_dump()
    values.update(
        id=str(uuid.uuid4()),
        active=True,
        created_at=utc_now(),
    )
    try:
        await db.execute(insert(custom_field_definition).values(**values))
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A field with this company/model/name already exists") from exc
    return values


@app.get(f"{settings.api_prefix}/custom-fields")
async def list_custom_field_definitions(
    company_id: str = Query(min_length=36, max_length=36),
    model_name: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    try:
        company_id = str(uuid.UUID(company_id))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="company_id must be a UUID") from exc
    await _require_custom_field_company(db, company_id)
    stmt = select(custom_field_definition).where(
        custom_field_definition.c.company_id == company_id
    )
    if model_name:
        _require_custom_field_model(model_name)
        stmt = stmt.where(custom_field_definition.c.model_name == model_name)
    stmt = stmt.order_by(custom_field_definition.c.model_name, custom_field_definition.c.field_name)
    return [dict(row) for row in (await db.execute(stmt)).mappings().all()]


@app.patch(f"{settings.api_prefix}/custom-fields/{{company_id}}/{{model_name}}/{{field_name}}")
async def set_custom_field_definition_state(
    company_id: str,
    model_name: str,
    field_name: str,
    dto: CustomFieldDefinitionStateDTO,
    db: AsyncSession = Depends(get_db),
):
    try:
        company_id = str(uuid.UUID(company_id))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="company_id must be a UUID") from exc
    await _require_custom_field_company(db, company_id)
    _require_custom_field_model(model_name)
    result = await db.execute(
        update(custom_field_definition)
        .where(
            custom_field_definition.c.company_id == company_id,
            custom_field_definition.c.model_name == model_name,
            custom_field_definition.c.field_name == field_name,
        )
        .values(active=dto.active)
    )
    if not result.rowcount:
        raise HTTPException(status_code=404, detail="Custom field not found")
    await db.commit()
    return {"company_id": company_id, "model_name": model_name, "field_name": field_name, "active": dto.active}


@app.put(f"{settings.api_prefix}/custom-fields/{{company_id}}/{{model_name}}/{{record_id}}/{{field_name}}")
async def set_custom_field_value(
    company_id: str,
    model_name: str,
    record_id: str,
    field_name: str,
    dto: CustomFieldValueDTO,
    db: AsyncSession = Depends(get_db),
):
    try:
        company_id = str(uuid.UUID(company_id))
        record_id = str(uuid.UUID(record_id))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="company_id and record_id must be UUIDs") from exc
    await _require_custom_field_company(db, company_id)
    ModelClass = _require_custom_field_model(model_name)
    if field_name in getattr(ModelClass, "_model_fields", {}) or not field_name.startswith("x_"):
        raise HTTPException(status_code=422, detail="Custom field must use an unused x_ technical name")
    record_exists = await db.scalar(select(ModelClass.id).where(ModelClass.id == record_id))
    if not record_exists:
        raise HTTPException(status_code=404, detail="ERP record not found")
    definition = (await db.execute(
        select(custom_field_definition).where(
            custom_field_definition.c.company_id == company_id,
            custom_field_definition.c.model_name == model_name,
            custom_field_definition.c.field_name == field_name,
        )
    )).mappings().one_or_none()
    if definition is None:
        raise HTTPException(status_code=404, detail="Custom field definition not found")
    if not definition["active"]:
        raise HTTPException(status_code=409, detail="Custom field is inactive")
    try:
        typed_values = encode_custom_value(
            definition["data_type"], dto.value, definition["validation"] or {}
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    existing_id = await db.scalar(
        select(custom_field_value.c.id).where(
            custom_field_value.c.company_id == company_id,
            custom_field_value.c.model_name == model_name,
            custom_field_value.c.record_id == record_id,
            custom_field_value.c.field_id == definition["id"],
        )
    )
    now = utc_now()
    if existing_id:
        await db.execute(
            update(custom_field_value).where(custom_field_value.c.id == existing_id).values(
                **typed_values, updated_at=now,
            )
        )
    else:
        await db.execute(insert(custom_field_value).values(
            id=str(uuid.uuid4()),
            company_id=company_id,
            model_name=model_name,
            record_id=record_id,
            field_id=definition["id"],
            data_type=definition["data_type"],
            **typed_values,
            created_at=now,
            updated_at=now,
        ))
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Custom field value changed concurrently") from exc
    return {
        "company_id": company_id,
        "model_name": model_name,
        "record_id": record_id,
        "field_name": field_name,
        "data_type": definition["data_type"],
        "value": dto.value,
    }


@app.get(f"{settings.api_prefix}/custom-fields/{{company_id}}/{{model_name}}/{{record_id}}")
async def get_custom_field_values(
    company_id: str,
    model_name: str,
    record_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        company_id = str(uuid.UUID(company_id))
        record_id = str(uuid.UUID(record_id))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="company_id and record_id must be UUIDs") from exc
    await _require_custom_field_company(db, company_id)
    ModelClass = _require_custom_field_model(model_name)
    record_exists = await db.scalar(select(ModelClass.id).where(ModelClass.id == record_id))
    if not record_exists:
        raise HTTPException(status_code=404, detail="ERP record not found")
    stmt = select(
        custom_field_definition.c.field_name,
        custom_field_definition.c.label,
        custom_field_value.c.data_type,
        custom_field_value.c.value_text,
        custom_field_value.c.value_decimal,
        custom_field_value.c.value_integer,
        custom_field_value.c.value_boolean,
        custom_field_value.c.value_datetime,
        custom_field_value.c.value_json,
    ).select_from(
        custom_field_value.join(
            custom_field_definition,
            custom_field_value.c.field_id == custom_field_definition.c.id,
        )
    ).where(
        custom_field_value.c.company_id == company_id,
        custom_field_value.c.model_name == model_name,
        custom_field_value.c.record_id == record_id,
        custom_field_definition.c.active.is_(True),
    ).order_by(custom_field_definition.c.field_name)
    return [
        {
            "field_name": row["field_name"],
            "label": row["label"],
            "data_type": row["data_type"],
            "value": decode_custom_value(row["data_type"], row),
        }
        for row in (await db.execute(stmt)).mappings().all()
    ]


@app.get(f"{settings.api_prefix}/overview")
async def get_overview(db: AsyncSession = Depends(get_db)):
    """Executive KPI Metrics: MRR, Active Subs, Invoices Due, Leads, Outbox Queue"""
    Sub = registry.get_model("sale.subscription")
    Lead = registry.get_model("crm.lead")
    Invoice = registry.get_model("account.move")
    Partner = registry.get_model("res.partner")

    # MRR sum
    mrr_res = await db.execute(select(func.sum(Sub.mrr)).where(Sub.state == "active"))
    total_mrr = mrr_res.scalar() or Decimal("0")

    # Active Subscriptions count
    active_subs_res = await db.execute(select(func.count(Sub.id)).where(Sub.state == "active"))
    active_subs = active_subs_res.scalar() or 0

    # Total customers
    cust_res = await db.execute(select(func.count(Partner.id)))
    total_customers = cust_res.scalar() or 0

    # Total open leads
    lead_res = await db.execute(select(func.count(Lead.id)).where(Lead.stage.notin_(["won", "lost"])))
    open_leads = lead_res.scalar() or 0

    # Unpaid invoices total
    unpaid_res = await db.execute(select(func.sum(Invoice.total_amount)).where(Invoice.state.in_(["posted", "overdue"])))
    total_unpaid = unpaid_res.scalar() or Decimal("0")

    # Outbox status counts
    pending_outbox = (await db.execute(select(func.count(OutboxEvent.id)).where(OutboxEvent.status == "PENDING"))).scalar() or 0
    completed_outbox = (await db.execute(select(func.count(OutboxEvent.id)).where(OutboxEvent.status == "COMPLETED"))).scalar() or 0
    dead_letter_outbox = (await db.execute(select(func.count(OutboxEvent.id)).where(OutboxEvent.status == "DEAD_LETTER"))).scalar() or 0

    return {
        "mrr": total_mrr,
        "activeSubscriptions": active_subs,
        "totalCustomers": total_customers,
        "openLeads": open_leads,
        "totalUnpaidInvoices": total_unpaid,
        "outbox": {
            "pending": pending_outbox,
            "completed": completed_outbox,
            "deadLetter": dead_letter_outbox
        },
        "currency": settings.default_currency,
        "compiledModels": registry.list_models()
    }


# ==============================================================================
# 👥 PARTNERS (CUSTOMERS & SUBSCRIBERS)
# ==============================================================================

@app.get(f"{settings.api_prefix}/partners")
async def list_partners(
    is_subscriber: Optional[bool] = None,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    Partner = registry.get_model("res.partner")
    stmt = select(Partner)
    if is_subscriber is not None:
        stmt = stmt.where(Partner.is_subscriber == is_subscriber)
    if q:
        stmt = stmt.where(Partner.name.ilike(f"%{q}%"))
    stmt = stmt.order_by(Partner.name.asc())
    
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [r.to_dict() for r in records]


@app.post(f"{settings.api_prefix}/partners", status_code=status.HTTP_201_CREATED)
async def create_partner(dto: PartnerCreateDTO, db: AsyncSession = Depends(get_db)):
    Partner = registry.get_model("res.partner")
    if dto.radius_password and not dto.radius_username:
        raise HTTPException(status_code=422, detail="radius_username is required when setting radius_password")
    try:
        credential_ciphertext = (
            encrypt_secret(dto.radius_password.get_secret_value())
            if dto.radius_password else None
        )
    except CredentialEncryptionUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    partner = Partner(
        name=dto.name,
        email=dto.email,
        phone=dto.phone,
        address=dto.address,
        city=dto.city,
        is_customer=dto.is_customer,
        is_subscriber=dto.is_subscriber,
        radius_username=dto.radius_username,
        radius_profile=dto.radius_profile or "10M_BROADBAND",
        radius_credential_ciphertext=credential_ciphertext,
    )
    if credential_ciphertext:
        partner.radius_status = "disabled"
    db.add(partner)
    await db.commit()
    return partner.to_dict()


# ==============================================================================
# 🎯 CRM LEADS & OPPORTUNITIES
# ==============================================================================

@app.get(f"{settings.api_prefix}/leads")
async def list_leads(db: AsyncSession = Depends(get_db)):
    Lead = registry.get_model("crm.lead")
    Partner = registry.get_model("res.partner")
    
    stmt = select(Lead).order_by(Lead.created_at.desc())
    res = await db.execute(stmt)
    leads = res.scalars().all()
    
    # Enrich with partner names
    output = []
    for l in leads:
        d = l.to_dict()
        if l.partner_id:
            p = (await db.execute(select(Partner).where(Partner.id == l.partner_id))).scalar_one_or_none()
            d["partner_name"] = p.name if p else None
        output.append(d)
    return output


@app.post(f"{settings.api_prefix}/leads", status_code=status.HTTP_201_CREATED)
async def create_lead(dto: LeadCreateDTO, db: AsyncSession = Depends(get_db)):
    Lead = registry.get_model("crm.lead")
    lead = Lead(
        name=dto.name,
        partner_id=dto.partner_id,
        contact_name=dto.contact_name,
        email=dto.email,
        phone=dto.phone,
        expected_revenue=Decimal(str(dto.expected_revenue)),
        probability=dto.probability,
        stage=dto.stage,
        description=dto.description
    )
    db.add(lead)
    await db.commit()
    return lead.to_dict()


@app.patch(f"{settings.api_prefix}/leads/{{lead_id}}/stage")
async def update_lead_stage(lead_id: str, dto: LeadStageUpdateDTO, db: AsyncSession = Depends(get_db)):
    Lead = registry.get_model("crm.lead")
    lead = (await db.execute(select(Lead).where(Lead.id == lead_id))).scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead.stage = dto.stage
    if dto.stage == "won":
        lead.probability = 100
    elif dto.stage == "lost":
        lead.probability = 0
    await db.commit()
    return lead.to_dict()


# ==============================================================================
# 🛒 PRODUCT CATALOG
# ==============================================================================

@app.get(f"{settings.api_prefix}/products")
async def list_products(kind: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    Product = registry.get_model("product.template")
    stmt = select(Product)
    if kind:
        stmt = stmt.where(Product.kind == kind)
    stmt = stmt.order_by(Product.name.asc())
    res = await db.execute(stmt)
    return [p.to_dict() for p in res.scalars().all()]


# ==============================================================================
# 📜 SALES ORDERS & CONFIRMATION
# ==============================================================================

@app.get(f"{settings.api_prefix}/orders")
async def list_orders(db: AsyncSession = Depends(get_db)):
    Order = registry.get_model("sale.order")
    Partner = registry.get_model("res.partner")
    OrderLine = registry.get_model("sale.order.line")

    orders = (await db.execute(select(Order).order_by(Order.created_at.desc()))).scalars().all()
    output = []
    for o in orders:
        d = o.to_dict()
        p = (await db.execute(select(Partner).where(Partner.id == o.partner_id))).scalar_one_or_none()
        d["partner_name"] = p.name if p else "Unknown"
        lines = (await db.execute(select(OrderLine).where(OrderLine.order_id == o.id))).scalars().all()
        d["lines"] = [l.to_dict() for l in lines]
        output.append(d)
    return output


@app.post(f"{settings.api_prefix}/orders", status_code=status.HTTP_201_CREATED)
async def create_order(dto: OrderCreateDTO, db: AsyncSession = Depends(get_db)):
    Order = registry.get_model("sale.order")
    OrderLine = registry.get_model("sale.order.line")
    order_number = await next_document_number(
        db, code="sale.order", fallback_prefix="SO"
    )

    # Calculate total
    total = Decimal("0.00")
    line_models = []
    for l in dto.lines:
        subtotal = Decimal(str(l.quantity)) * Decimal(str(l.unit_price))
        total += subtotal
        line_models.append((l, subtotal))

    order = Order(
        number=order_number,
        partner_id=dto.partner_id,
        state="draft",
        total_amount=total,
        notes=dto.notes
    )
    db.add(order)
    await db.flush()

    for line_dto, subtotal in line_models:
        line = OrderLine(
            order_id=order.id,
            product_id=line_dto.product_id,
            name=line_dto.name,
            quantity=Decimal(str(line_dto.quantity)),
            unit_price=Decimal(str(line_dto.unit_price)),
            subtotal=subtotal,
            line_kind=line_dto.line_kind
        )
        db.add(line)

    await db.commit()
    return order.to_dict()


@app.post(f"{settings.api_prefix}/orders/{{order_id}}/confirm")
async def confirm_order(order_id: str, db: AsyncSession = Depends(get_db)):
    """
    CRITICAL WORKFLOW:
    1. Confirm Sales Order.
    2. Generate initial Invoice for one-off and first recurring period.
    3. Auto-spawn `sale.subscription` for recurring lines.
    4. Emit Transactional Outbox Event to `services/radius` or `services/runner`!
    """
    Order = registry.get_model("sale.order")
    OrderLine = registry.get_model("sale.order.line")
    Subscription = registry.get_model("sale.subscription")
    SubLine = registry.get_model("subscription.line")
    SubEvent = registry.get_model("subscription.event")
    Invoice = registry.get_model("account.move")
    InvoiceLine = registry.get_model("account.move.line")
    Partner = registry.get_model("res.partner")
    Product = registry.get_model("product.template")

    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Sales Order not found")
    if order.state == "confirmed":
        return {"message": "Order already confirmed", "order": order.to_dict()}

    partner = (await db.execute(select(Partner).where(Partner.id == order.partner_id))).scalar_one_or_none()
    lines = (await db.execute(select(OrderLine).where(OrderLine.order_id == order.id))).scalars().all()

    # 1. Check if there are recurring lines
    recurring_lines = [l for l in lines if l.line_kind == "recurring"]
    subscription = None

    # Validate service prerequisites before committing the commercial transition.
    if recurring_lines:
        first_product = None
        if recurring_lines[0].product_id:
            first_product = (
                await db.execute(select(Product).where(Product.id == recurring_lines[0].product_id))
            ).scalar_one_or_none()
        if first_product and "CLOUD" not in (first_product.code or "").upper():
            if not partner.radius_username or not partner.radius_credential_ciphertext:
                raise HTTPException(
                    status_code=409,
                    detail="ISP activation needs a PPPoE username and encrypted credential. Set both on the customer first.",
                )

    order.state = "confirmed"

    if recurring_lines:
        partner.is_subscriber = True
        sub_number = await next_document_number(
            db, code="sale.subscription", fallback_prefix="SUB"
        )

        billing_timezone = settings.default_billing_timezone
        now = datetime.datetime.now(datetime.timezone.utc)
        billing_interval = "monthly"
        
        # Calculate MRR
        mrr = sum(l.subtotal for l in recurring_lines)

        # Technical profile from product
        first_product_id = recurring_lines[0].product_id
        rate_profile = "50M_BROADBAND"
        tech_service = "isp_radius"
        if first_product_id:
            p_obj = (await db.execute(select(Product).where(Product.id == first_product_id))).scalar_one_or_none()
            if p_obj:
                if p_obj.rate_limit:
                    rate_profile = p_obj.rate_limit
                if p_obj.billing_interval in {"monthly", "quarterly", "annually"}:
                    billing_interval = p_obj.billing_interval
                if "CLOUD" in (p_obj.code or ""):
                    tech_service = "cloud_runner"

        local_activation = now.astimezone(ZoneInfo(billing_timezone))
        anchor_day = local_activation.day
        period_end = billing_boundary(
            now,
            anchor_day=anchor_day,
            interval=billing_interval,
            billing_timezone=billing_timezone,
        )

        # Auto generate username if not present
        partner.radius_profile = rate_profile
        if tech_service == "isp_radius":
            partner.radius_status = "disabled"

        subscription = Subscription(
            number=sub_number,
            partner_id=partner.id,
            source_order_id=order.id,
            state="pending_activation",
            mrr=mrr,
            billing_interval=billing_interval,
            billing_timezone=billing_timezone,
            billing_anchor_day=anchor_day,
            current_period_start=now,
            current_period_end=period_end,
            next_invoice_at=period_end,
            grace_until=period_end + datetime.timedelta(days=7),
            technical_service=tech_service,
            technical_reference=partner.radius_username,
            technical_profile=rate_profile
        )
        db.add(subscription)
        await db.flush()

        # Add subscription lines & audit event
        for rl in recurring_lines:
            db.add(SubLine(
                subscription_id=subscription.id,
                product_id=rl.product_id,
                name=rl.name,
                quantity=rl.quantity,
                unit_price=rl.unit_price,
                subtotal=rl.subtotal
            ))

        db.add(SubEvent(
            subscription_id=subscription.id,
            event_type="PENDING_ACTIVATION",
            previous_state="draft",
            new_state="pending_activation",
            actor="system:order_confirmation",
            reason=f"Recurring commitment created from order {order.number}",
            note=f"Subscription spawned automatically from confirmed Order {order.number}",
        ))

        # EMIT OUTBOX EVENT TO TOUGHRADIUS OR RUNNER!
        if tech_service == "isp_radius":
            await emit_outbox_event(
                session=db,
                event_type="subscription.activated",
                target_service="radius",
                idempotency_key=f"sub:{subscription.id}:v1:radius",
                payload={
                    "action": "upsert",
                    "subscription_id": subscription.id,
                    "username": partner.radius_username,
                    "password_encrypted": partner.radius_credential_ciphertext,
                    "rate_profile": rate_profile,
                    "status": "active"
                }
            )

    # 2. Generate Initial Invoice
    inv_number = await next_document_number(
        db, code="account.move", fallback_prefix="INV"
    )

    invoice = Invoice(
        number=inv_number,
        partner_id=partner.id,
        source_order_id=order.id,
        subscription_id=subscription.id if subscription else None,
        customer_snapshot=_customer_invoice_snapshot(partner),
        state="draft",
        total_amount=order.total_amount,
        currency_code=order.currency_code or settings.default_currency,
        due_date=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=14)
    )
    db.add(invoice)
    await db.flush()

    for l in lines:
        db.add(InvoiceLine(
            move_id=invoice.id,
            product_id=l.product_id,
            name=l.name,
            quantity=l.quantity,
            unit_price=l.unit_price,
            subtotal=l.subtotal
        ))

    await db.flush()
    invoice.state = "posted"
    await db.flush()
    await db.commit()

    return {
        "status": "CONFIRMED",
        "order": order.to_dict(),
        "subscription": subscription.to_dict() if subscription else None,
        "invoice": invoice.to_dict()
    }


# ==============================================================================
# 🔄 SUBSCRIPTION LIFECYCLE (ACTIVE, SUSPEND, ISOLATE, RESUME)
# ==============================================================================

@app.get(f"{settings.api_prefix}/subscriptions")
async def list_subscriptions(db: AsyncSession = Depends(get_db)):
    Sub = registry.get_model("sale.subscription")
    Partner = registry.get_model("res.partner")
    SubLine = registry.get_model("subscription.line")

    subs = (await db.execute(select(Sub).order_by(Sub.created_at.desc()))).scalars().all()
    output = []
    for s in subs:
        d = s.to_dict()
        p = (await db.execute(select(Partner).where(Partner.id == s.partner_id))).scalar_one_or_none()
        d["partner_name"] = p.name if p else "Unknown"
        lines = (await db.execute(select(SubLine).where(SubLine.subscription_id == s.id))).scalars().all()
        d["lines"] = [l.to_dict() for l in lines]
        output.append(d)
    return output


async def _create_subscription_renewal_invoice(db: AsyncSession, subscription) -> Dict[str, Any]:
    """Atomically invoice one stored billing period and advance its subscription.

    Invoice period + subscription dates advance in the same transaction. A
    unique period key makes retries and concurrent scheduler instances safe.
    """
    SubLine = registry.get_model("subscription.line")
    Invoice = registry.get_model("account.move")
    InvoiceLine = registry.get_model("account.move.line")
    Partner = registry.get_model("res.partner")

    if not subscription.current_period_end or not subscription.next_invoice_at:
        raise ValueError(f"Subscription {subscription.id} has no initialized billing period")
    period_start = subscription.current_period_end
    period_end = billing_boundary(
        period_start,
        anchor_day=subscription.billing_anchor_day or 1,
        interval=subscription.billing_interval or "monthly",
        billing_timezone=subscription.billing_timezone or settings.default_billing_timezone,
    )
    idempotency_key = f"subscription:{subscription.id}:invoice:{period_start.isoformat()}"

    existing = (await db.execute(
        select(Invoice).where(Invoice.idempotency_key == idempotency_key)
    )).scalar_one_or_none()
    if existing is not None:
        subscription.current_period_start = period_start
        subscription.current_period_end = period_end
        subscription.next_invoice_at = period_end
        await db.commit()
        return {"invoice": existing.to_dict(), "created": False}

    lines = (await db.execute(
        select(SubLine).where(SubLine.subscription_id == subscription.id)
    )).scalars().all()
    if not lines:
        raise ValueError(f"Subscription {subscription.id} has no billable lines")

    invoice_lines: list[tuple[Any, Decimal]] = []
    total = Decimal("0")
    for line in lines:
        quantity = Decimal(str(line.quantity or 0))
        unit_price = Decimal(str(line.unit_price or 0))
        amount = (quantity * unit_price).quantize(Decimal("0.01"))
        total += amount
        invoice_lines.append((line, amount))

    tenant_context = current_company_id.set(subscription.company_id)
    try:
        number = await next_document_number(db, code="account.move", fallback_prefix="INV")
        partner = (await db.execute(
            select(Partner).where(Partner.id == subscription.partner_id)
        )).scalar_one_or_none()
        invoice = Invoice(
        number=number,
        partner_id=subscription.partner_id,
        subscription_id=subscription.id,
        billing_period_start=period_start,
        billing_period_end=period_end,
        idempotency_key=idempotency_key,
        customer_snapshot=_customer_invoice_snapshot(partner),
        invoice_date=utc_now(),
        due_date=utc_now() + datetime.timedelta(days=settings.billing_invoice_due_days),
        currency_code=subscription.currency_code or settings.default_currency,
        total_amount=total,
        state="draft",
        notes=f"Subscription renewal {period_start.isoformat()} – {period_end.isoformat()}",
        )
        db.add(invoice)
        await db.flush()

        for line, amount in invoice_lines:
            db.add(InvoiceLine(
            move_id=invoice.id,
            product_id=line.product_id,
            name=line.name,
            quantity=line.quantity,
            unit_price=line.unit_price,
            subtotal=amount,
            ))

        await db.flush()
        invoice.state = "posted"
        await db.flush()
        subscription.current_period_start = period_start
        subscription.current_period_end = period_end
        subscription.next_invoice_at = period_end
        await db.commit()
        return {"invoice": invoice.to_dict(), "created": True}
    finally:
        current_company_id.reset(tenant_context)


async def run_due_subscription_billing(*, now: Optional[datetime.datetime] = None) -> Dict[str, int]:
    """Issue a single renewal invoice for every eligible active subscription."""
    Sub = registry.get_model("sale.subscription")
    now = now or utc_now()
    async with AsyncSessionLocal() as session:
        due = (await session.execute(
            select(Sub)
            .where(
                Sub.state == "active",
                Sub.current_period_end.is_not(None),
                Sub.current_period_end <= now,
                Sub.next_invoice_at <= now,
            )
            .order_by(Sub.next_invoice_at.asc())
            .limit(100)
            .with_for_update(skip_locked=True)
        )).scalars().all()

        created = skipped = failed = 0
        subscription_ids = [subscription.id for subscription in due]
        for subscription_id in subscription_ids:
            try:
                subscription = (await session.execute(
                    select(Sub).where(Sub.id == subscription_id)
                )).scalar_one()
                outcome = await _create_subscription_renewal_invoice(session, subscription)
                if outcome["created"]:
                    created += 1
                else:
                    skipped += 1
            except IntegrityError:
                await session.rollback()
                skipped += 1
            except Exception:
                await session.rollback()
                failed += 1
                logger.exception("Renewal billing failed for subscription %s", subscription_id)
        return {"processed": len(due), "created": created, "skipped": skipped, "failed": failed}


async def _billing_worker() -> None:
    while True:
        try:
            outcome = await run_due_subscription_billing()
            if outcome["created"] or outcome["failed"]:
                logger.info("Renewal billing cycle: %s", outcome)
        except Exception:
            logger.exception("Renewal billing worker cycle failed")
        await asyncio.sleep(max(1.0, settings.billing_poll_interval_seconds))


@app.post(f"{settings.api_prefix}/subscriptions/{{sub_id}}/suspend")
async def suspend_subscription(sub_id: str, dto: SubscriptionActionDTO, db: AsyncSession = Depends(get_db)):
    """
    Suspends service and emits RFC 3576 CoA Disconnect to ToughRADIUS!
    """
    Sub = registry.get_model("sale.subscription")
    SubEvent = registry.get_model("subscription.event")
    Partner = registry.get_model("res.partner")

    sub = (await db.execute(select(Sub).where(Sub.id == sub_id))).scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if sub.state == "suspended":
        return {"message": "Subscription is already suspended", "subscription": sub.to_dict()}
    try:
        previous_state = transition_subscription(sub, "suspended")
    except InvalidSubscriptionTransition as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    partner = (await db.execute(select(Partner).where(Partner.id == sub.partner_id))).scalar_one_or_none()
    if partner:
        partner.radius_status = "disabled"

    db.add(SubEvent(
        subscription_id=sub.id,
        event_type="SUSPENDED",
        previous_state=previous_state,
        new_state="suspended",
        actor="api:subscription_suspend",
        reason=dto.reason,
        note=f"Suspension triggered. Reason: {dto.reason}",
    ))

    # Emit outbox disconnect
    if sub.technical_service == "isp_radius" and sub.technical_reference:
        await emit_outbox_event(
            session=db,
            event_type="subscription.suspended",
            target_service="radius",
            idempotency_key=f"sub:{sub.id}:suspend:{int(utc_now().timestamp())}",
            payload={
                "action": "disconnect",
                "username": sub.technical_reference,
                "reason": dto.reason
            }
        )

    await db.commit()
    return {"message": "Subscription suspended and CoA disconnect dispatched", "subscription": sub.to_dict()}


@app.post(f"{settings.api_prefix}/subscriptions/{{sub_id}}/resume")
async def resume_subscription(sub_id: str, db: AsyncSession = Depends(get_db)):
    """
    Restores normal active state and updates RADIUS speed profile.
    """
    Sub = registry.get_model("sale.subscription")
    SubEvent = registry.get_model("subscription.event")
    Partner = registry.get_model("res.partner")

    sub = (await db.execute(select(Sub).where(Sub.id == sub_id))).scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if sub.state == "active":
        return {"message": "Subscription is already active", "subscription": sub.to_dict()}
    if sub.technical_service == "cloud_runner":
        raise HTTPException(
            status_code=501,
            detail="Runner subscription reconciliation is not implemented",
        )
    partner = (await db.execute(select(Partner).where(Partner.id == sub.partner_id))).scalar_one_or_none()
    if sub.technical_service == "isp_radius" and (
        not partner or not partner.radius_credential_ciphertext
    ):
        raise HTTPException(
            status_code=409,
            detail="ISP service cannot resume without a stored encrypted RADIUS credential",
        )
    try:
        previous_state = transition_subscription(
            sub,
            "pending_activation" if sub.technical_service == "isp_radius" else "active",
        )
    except InvalidSubscriptionTransition as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    target_state = sub.state

    db.add(SubEvent(
        subscription_id=sub.id,
        event_type="RESUME_REQUESTED" if target_state == "pending_activation" else "RESUMED",
        previous_state=previous_state,
        new_state=target_state,
        actor="api:subscription_resume",
        reason="Operator requested service resume",
        note=("Subscription resume requested; awaiting provisioning acknowledgement."
              if target_state == "pending_activation"
              else "Subscription resumed."),
    ))

    if sub.technical_service == "isp_radius" and sub.technical_reference:
        await emit_outbox_event(
            session=db,
            event_type="subscription.resumed",
            target_service="radius",
            idempotency_key=f"sub:{sub.id}:resume:{int(utc_now().timestamp())}",
            payload={
                "action": "upsert",
                "subscription_id": sub.id,
                "username": sub.technical_reference,
                "password_encrypted": partner.radius_credential_ciphertext if partner else None,
                "rate_profile": sub.technical_profile or "50M_BROADBAND",
                "status": "ACTIVE"
            }
        )

    await db.commit()
    return {"message": "Subscription resumed", "subscription": sub.to_dict()}


# ==============================================================================
# 🧾 INVOICES & RECONCILIATION
# ============================================================================== 

def _customer_invoice_snapshot(partner) -> Dict[str, Optional[str]]:
    """Freeze the customer details printed on an issued invoice."""
    if partner is None:
        return {"name": "Unknown", "email": None, "phone": None, "address": None, "city": None}
    return {
        "name": partner.name,
        "email": partner.email,
        "phone": partner.phone,
        "address": partner.address,
        "city": partner.city,
    }

@app.get(f"{settings.api_prefix}/invoices")
async def list_invoices(db: AsyncSession = Depends(get_db)):
    Invoice = registry.get_model("account.move")
    Partner = registry.get_model("res.partner")
    InvoiceLine = registry.get_model("account.move.line")

    invs = (await db.execute(select(Invoice).order_by(Invoice.created_at.desc()))).scalars().all()
    output = []
    for inv in invs:
        d = inv.to_dict()
        p = (await db.execute(select(Partner).where(Partner.id == inv.partner_id))).scalar_one_or_none()
        d["partner_name"] = p.name if p else "Unknown"
        lines = (await db.execute(select(InvoiceLine).where(InvoiceLine.move_id == inv.id))).scalars().all()
        d["lines"] = [l.to_dict() for l in lines]
        output.append(d)
    return output


@app.post(f"{settings.api_prefix}/invoices/{{invoice_id}}/pay")
async def pay_invoice(invoice_id: str, dto: InvoicePayDTO, db: AsyncSession = Depends(get_db)):
    Invoice = registry.get_model("account.move")
    inv = (await db.execute(select(Invoice).where(Invoice.id == invoice_id))).scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if inv.state == "paid":
        return {"message": "Invoice is already paid", "invoice": inv.to_dict()}
    if inv.state not in {"posted", "overdue"}:
        raise HTTPException(
            status_code=409,
            detail=f"Invoice in {inv.state!r} state cannot be marked paid",
        )

    payment_result = await db.execute(
        update(Invoice)
        .where(
            Invoice.id == invoice_id,
            Invoice.state.in_(["posted", "overdue"]),
        )
        .values(
            state="paid",
            payment_date=utc_now(),
            payment_method=dto.payment_method,
            payment_note=dto.notes,
        )
        .execution_options(synchronize_session=False)
    )
    if payment_result.rowcount != 1:
        await db.rollback()
        current = (await db.execute(
            select(Invoice).where(Invoice.id == invoice_id)
        )).scalar_one_or_none()
        if current and current.state == "paid":
            return {"message": "Invoice is already paid", "invoice": current.to_dict()}
        raise HTTPException(status_code=409, detail="Invoice payment state changed concurrently")
    await db.commit()
    await db.refresh(inv)
    return {"message": "Invoice marked as PAID", "invoice": inv.to_dict()}


# ==============================================================================
# 📡 TRANSACTIONAL OUTBOX MONITORING
# ==============================================================================

@app.get(f"{settings.api_prefix}/outbox")
async def list_outbox_events(limit: int = 50, db: AsyncSession = Depends(get_db)):
    stmt = select(OutboxEvent).order_by(OutboxEvent.created_at.desc()).limit(limit)
    res = await db.execute(stmt)
    events = res.scalars().all()
    
    return [{
        "id": e.id,
        "eventType": e.event_type,
        "targetService": e.target_service,
        "idempotencyKey": e.idempotency_key,
        "status": e.status,
        "attempts": e.attempts,
        "maxAttempts": e.max_attempts,
        "lastError": e.last_error,
        "createdAt": e.created_at.isoformat() if e.created_at else None,
        "completedAt": e.completed_at.isoformat() if e.completed_at else None,
        "payload": redact_sensitive_payload(e.payload)
    } for e in events]


def redact_sensitive_payload(value):
    if isinstance(value, dict):
        return {
            key: "[redacted]" if key.lower() in {"password", "password_encrypted", "secret", "token", "credential"}
            else redact_sensitive_payload(child)
            for key, child in value.items()
        }
    if isinstance(value, list):
        return [redact_sensitive_payload(child) for child in value]
    return value


@app.post(f"{settings.api_prefix}/outbox/{{event_id}}/retry")
async def retry_outbox_event(event_id: str, db: AsyncSession = Depends(get_db)):
    event = (await db.execute(select(OutboxEvent).where(OutboxEvent.id == event_id))).scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Outbox event not found")
    if event.status not in {"FAILED", "DEAD_LETTER"}:
        raise HTTPException(status_code=409, detail=f"Event in {event.status} state cannot be retried")
    retry = await db.execute(
        update(OutboxEvent)
        .where(
            OutboxEvent.id == event_id,
            OutboxEvent.status.in_(["FAILED", "DEAD_LETTER"]),
        )
        .values(
            status="PENDING",
            attempts=0,
            next_retry_at=utc_now(),
            last_error="Manually queued for retry",
            lease_token=None,
            lease_expires_at=None,
        )
    )
    if retry.rowcount != 1:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Event changed while retry was being queued")
    await db.commit()
    return {"message": "Outbox event queued for immediate retry"}
