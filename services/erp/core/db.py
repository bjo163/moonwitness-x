"""
Moonwitness ERP — PostgreSQL Async Connection & Session Engine.
"""
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import Session as SyncSession, declarative_base, with_loader_criteria
from sqlalchemy import event, MetaData, select
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm.attributes import NO_VALUE

from services.erp.core.config import settings
from services.erp.core.tenancy import DEFAULT_COMPANY_ID, current_company_id
from services.erp.core.fields import Many2One

logger = logging.getLogger("erp.db")

# Naming convention for foreign keys and indexes to allow seamless migrations
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=naming_convention)
Base = declarative_base(metadata=metadata)


@event.listens_for(SyncSession, "before_flush")
def validate_erp_models_before_flush(session, flush_context, instances):
    """Assign/guard tenant ownership and run addon validation before SQL flush."""
    tenant_id = current_company_id.get()
    for instance in session.new.union(session.dirty):
        table = getattr(type(instance), "__table__", None)
        if table is not None and "company_id" in table.c:
            existing_company_id = getattr(instance, "company_id", None)
            if tenant_id and existing_company_id and existing_company_id != tenant_id:
                raise ValueError("Cannot write an ERP record owned by another company")
            owner_company_id = tenant_id or existing_company_id or DEFAULT_COMPANY_ID
            setattr(instance, "company_id", owner_company_id)
            if tenant_id and getattr(type(instance), "_model_fields", None) is not None:
                _validate_relation_company(session, instance, owner_company_id)

        validator = getattr(instance, "validate", None)
        if callable(validator) and getattr(type(instance), "_model_fields", None) is not None:
            validator()


def _validate_relation_company(session: SyncSession, instance, company_id: str) -> None:
    """Reject cross-company Many2One links even when a caller knows another UUID."""
    fields = getattr(type(instance), "_model_fields", {})
    state = sa_inspect(instance)
    for field_name, field in fields.items():
        if field_name == "company_id" or not isinstance(field, Many2One):
            continue
        foreign_id = getattr(instance, field_name, None)
        if foreign_id is None:
            continue
        relation_name = field_name[:-3] if field_name.endswith("_id") else f"{field_name}_record"
        relationship_value = state.attrs[relation_name].loaded_value
        if relationship_value is not NO_VALUE and relationship_value is not None:
            target_company_id = getattr(relationship_value, "company_id", None)
            if target_company_id and target_company_id != company_id:
                raise ValueError(f"{field_name} references a record owned by another company")
            continue

        target_table_name = field.target_model.replace(".", "_")
        target_table = Base.metadata.tables.get(target_table_name)
        if target_table is None or "company_id" not in target_table.c:
            continue  # Shared catalogs (for example product.template) remain cross-company.
        pending = next(
            (
                candidate for candidate in session.new
                if getattr(type(candidate), "_model_name", None) == field.target_model
                and getattr(candidate, "id", None) == foreign_id
            ),
            None,
        )
        if pending is not None:
            target_company_id = getattr(pending, "company_id", None) or company_id
        else:
            target_company_id = session.connection().execute(
                select(target_table.c.company_id).where(target_table.c.id == foreign_id)
            ).scalar_one_or_none()
        if target_company_id is not None and target_company_id != company_id:
            raise ValueError(f"{field_name} references a record owned by another company")


@event.listens_for(SyncSession, "do_orm_execute")
def apply_erp_company_scope(execute_state):
    """Apply company criteria to ORM SELECT/UPDATE/DELETE statements and loaders."""
    company_id = current_company_id.get()
    if company_id is None or not (
        execute_state.is_select or execute_state.is_update or execute_state.is_delete
    ):
        return
    statement = execute_state.statement
    for mapper in execute_state.all_mappers:
        model_class = mapper.class_
        if "company_id" in mapper.local_table.c:
            statement = statement.options(
                with_loader_criteria(
                    model_class,
                    lambda model, scope=company_id: model.company_id == scope,
                    include_aliases=True,
                )
            )
    execute_state.statement = statement

# Create Async Engine
if not settings.database_url.startswith(("postgresql+asyncpg://", "postgresql+psycopg://")):
    raise RuntimeError("Moonwitness ERP requires PostgreSQL with an async driver")

async_engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency for database sessions"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
