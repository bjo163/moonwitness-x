"""
Moonwitness ERP — Core Configuration
"""
from pydantic_settings import BaseSettings
from pydantic import Field, SecretStr


class Settings(BaseSettings):
    app_name: str = "Moonwitness ERP"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1/erp"
    port: int = 5180
    environment: str = "development"
    api_key: SecretStr | None = Field(default=None, min_length=32)
    tenant_api_keys: SecretStr | None = Field(default=None, repr=False)
    telemetry_enabled: bool = False
    telemetry_otlp_trace_endpoint: str | None = None
    telemetry_service_name: str = "moonwitness-erp"
    telemetry_sample_ratio: float = Field(default=0.1, ge=0.0, le=1.0)
    seed_demo_data: bool = False
    cors_allowed_origins: list[str] = ["http://localhost:3000"]
    
    # PostgreSQL is the only supported ERP database backend.
    database_url: str = Field(
        default="postgresql+asyncpg://moonwitness:change-me@localhost:5432/moonwitness_erp",
        description="Async SQLAlchemy database connection string"
    )
    
    # Financial settings (money rules: fixed precision decimal)
    default_currency: str = "IDR"
    default_billing_timezone: str = "Asia/Jakarta"

    # Encryption key generated and managed outside the repository. Fernet keys
    # are URL-safe base64-encoded 32-byte values.
    credential_encryption_key: str | None = None
    
    # Inter-service URLs in Moonwitness Universe Monorepo
    radius_service_url: str = "http://localhost:5170"
    runner_service_url: str = "http://localhost:5160"
    time_service_url: str = "http://localhost:5155"
    gateway_service_url: str = "http://localhost:5150"
    
    # Outbox worker settings
    outbox_poll_interval_seconds: float = 2.0
    outbox_max_retries: int = 5
    outbox_lease_seconds: int = 30
    billing_poll_interval_seconds: float = 30.0
    billing_invoice_due_days: int = 14
    
    class Config:
        env_prefix = "MW_ERP_"
        extra = "ignore"


settings = Settings()
