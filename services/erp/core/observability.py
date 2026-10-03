"""Small dependency-free HTTP logging primitives for the ERP service."""
from contextvars import ContextVar
from datetime import datetime, timezone
import json
import logging
from opentelemetry.trace import get_current_span


request_id_context: ContextVar[str] = ContextVar("erp_request_id", default="-")


class ERPJsonFormatter(logging.Formatter):
    """Emit one JSON object per log record without serializing secrets or bodies."""
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", request_id_context.get()),
        }
        span_context = get_current_span().get_span_context()
        if span_context.is_valid:
            payload["trace_id"] = f"{span_context.trace_id:032x}"
            payload["span_id"] = f"{span_context.span_id:016x}"
        for key in ("method", "path", "status_code", "duration_ms", "error_type"):
            value = getattr(record, key, None)
            if value is not None:
                payload[key] = value
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, separators=(",", ":"), ensure_ascii=False)


http_logger = logging.getLogger("erp.http")
if not http_logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(ERPJsonFormatter())
    http_logger.addHandler(handler)
    http_logger.setLevel(logging.INFO)
    http_logger.propagate = False


class TelemetryRuntime:
    def __init__(self, app, provider, httpx_instrumentor, sqlalchemy_instrumentor):
        self.app = app
        self.provider = provider
        self.httpx_instrumentor = httpx_instrumentor
        self.sqlalchemy_instrumentor = sqlalchemy_instrumentor

    def shutdown(self) -> None:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

        FastAPIInstrumentor.uninstrument_app(self.app)
        self.httpx_instrumentor.uninstrument()
        if self.sqlalchemy_instrumentor:
            self.sqlalchemy_instrumentor.uninstrument()
        self.provider.force_flush(timeout_millis=5000)
        self.provider.shutdown()


def configure_telemetry(app, *, enabled: bool, endpoint: str | None,
                        service_name: str, sample_ratio: float,
                        engine=None) -> TelemetryRuntime | None:
    """Install FastAPI/HTTPX/SQLAlchemy tracing and an OTLP/HTTP exporter."""
    if not enabled:
        return None
    if not endpoint:
        raise RuntimeError(
            "MW_ERP_TELEMETRY_OTLP_TRACE_ENDPOINT is required when telemetry is enabled"
        )

    from opentelemetry import trace
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
    from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.sdk.trace.sampling import ParentBased, TraceIdRatioBased

    provider = TracerProvider(
        resource=Resource.create({"service.name": service_name}),
        sampler=ParentBased(TraceIdRatioBased(sample_ratio)),
    )
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint)))
    trace.set_tracer_provider(provider)
    FastAPIInstrumentor.instrument_app(app, tracer_provider=provider, excluded_urls="health")
    httpx_instrumentor = HTTPXClientInstrumentor()
    httpx_instrumentor.instrument(tracer_provider=provider)
    sqlalchemy_instrumentor = None
    if engine is not None:
        sqlalchemy_instrumentor = SQLAlchemyInstrumentor()
        sqlalchemy_instrumentor.instrument(engine=engine, tracer_provider=provider)
    return TelemetryRuntime(app, provider, httpx_instrumentor, sqlalchemy_instrumentor)
