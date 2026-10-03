# Moonwitness ERP

Modular ERP service built on FastAPI, SQLAlchemy 2.0, PostgreSQL/SQLite, and Alembic.

## Local setup

From the repository root, set `MW_ERP_DATABASE_URL` if you want a database other than `./erp.db`, then run:

```powershell
uv sync --project services/erp --no-install-project
just migrate-erp
just serve-erp
```

The application refuses to start when the configured database is not at the current Alembic revision. Schema changes are applied with migrations; the service does not create or alter tables on startup. For a legacy database created before Alembic, back it up, copy it to a temporary file, stamp that copy at `566e9edc6fac`, then run `alembic upgrade head` and `alembic check` against the copy. Only if this succeeds should the verified legacy database be stamped at `566e9edc6fac` and upgraded. Never stamp an unverified production database. The current upgrade also removes any historical plaintext credentials from outbox payloads.

Sample catalog/customer data is disabled by default. Set `MW_ERP_SEED_DEMO_DATA=true` only for a disposable development/demo database. Configure `MW_ERP_CORS_ALLOWED_ORIGINS` as a JSON array for the exact trusted web origins; the default is `http://localhost:3000`.

## Database backends

SQLite is supported for development, tests, demos, and small single-instance installs. Enable foreign keys on each connection; the service configures this. SQLite writes and worker claims must be treated as serialized. PostgreSQL is the recommended production backend for multi-worker concurrency, high availability, and larger deployments.

Example PostgreSQL URL:

```text
MW_ERP_DATABASE_URL=postgresql+asyncpg://erp_user:...@db-host:5432/moonwitness_erp
```

Do not put production credentials in this file or commit them. Use a secret manager or deployment environment.

For production, set `MW_ERP_ENVIRONMENT=production` and inject a high-entropy `MW_ERP_API_KEY` of at least 32 characters from the deployment secret manager. Startup fails closed if the key is missing. API routes require `Authorization: Bearer <key>`; `/health` is public for liveness checks and CORS preflight is allowed. This shared service key is an initial service boundary, not per-user authentication, role-based access control, or tenant authorization. Local development remains open when no API key is configured. Requests accept a sanitized `X-Request-ID` or generate one, return it in the response, and emit structured JSON request logs without body contents.

Tracing is opt-in. Set `MW_ERP_TELEMETRY_ENABLED=true` and `MW_ERP_TELEMETRY_OTLP_TRACE_ENDPOINT` to the collector's full OTLP/HTTP trace endpoint (for example, `http://otel-collector:4318/v1/traces`). Optional settings are `MW_ERP_TELEMETRY_SERVICE_NAME` and `MW_ERP_TELEMETRY_SAMPLE_RATIO` (default `0.1`). The service instruments FastAPI requests, outbound HTTPX calls, and SQLAlchemy operations, propagates W3C trace context, and adds trace/span IDs to structured logs. An enabled exporter endpoint is required; configure collector TLS and access controls for production. Trace/metric dashboards and alert policies are deployment responsibilities. SQLAlchemy is currently constrained to `<2.1` because the selected OpenTelemetry SQLAlchemy instrumentor does not support 2.1 yet; revisit this cap when upstream compatibility is available.

## Service credential encryption

Set `MW_ERP_CREDENTIAL_ENCRYPTION_KEY` to a Fernet key supplied by your secret manager before accepting/storing PPPoE credentials. Generate one with:

```powershell
.venv\Scripts\python.exe -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Keep the key stable and backed up securely: rotating it requires re-encrypting stored credentials. Credentials are encrypted before storage and omitted from serialized model responses and outbox monitoring. Protect internal service traffic with TLS or a trusted private network; Fernet encryption at rest does not protect the HTTP hop to a provisioning service.

Billing uses Gregorian calendar boundaries in `MW_ERP_DEFAULT_BILLING_TIMEZONE` (default `Asia/Jakarta`). The original local billing day is persisted; short months clamp to month-end and later periods restore the original day. Month-end, DST-gap, Decimal proration, and idempotent recurring invoice generation are covered by tests. Tax and credit-note policy remain in progress.

Active subscriptions with a due `current_period_end` are invoiced by the internal billing worker. `MW_ERP_BILLING_POLL_INTERVAL_SECONDS` controls its polling cadence (default 30 seconds), and `MW_ERP_BILLING_INVOICE_DUE_DAYS` controls renewal invoice payment terms (default 14 days). Each renewal stores its covered period and a unique subscription/period key; invoice rows and the subscription period advance commit together. The worker catches up due periods after downtime and is safe to retry. Tax calculation, credit notes, immutable statutory invoice snapshots, and dunning policy are not implemented yet.

## Addons and registry

Built-in addons live under `addons/`. The registry compiles model declarations before database sessions are opened. `_name` declares a model; `_inherit` extends its table. Addons declare dependencies and must not extend models owned by addons they do not depend on. Scalar fields compile to SQLAlchemy columns, `Many2One` creates a foreign key plus relationship, `One2Many` validates its inverse `Many2One`, and `Many2Many` creates an addon-owned association table. `ComputedField` and dotted-path `RelatedField` add read-only Python values without changing the schema; computed values that traverse relationships require those relationships to be eager-loaded in async queries. Compiled model constructors validate required scalar values, types, string lengths, selection choices, and Decimal inputs. Before every ORM flush, required `Many2One` relations and addon model validators run; addons can override `validate_model()` and call `super()` for cooperative cross-field checks. Numeric `minimum`/`maximum` field bounds are also compiled into portable SQL check constraints. Async callers should eager-load relationship properties explicitly because implicit lazy loading is disabled. Model methods compose in dependency order through Python's cooperative `super()` chain. Inspect the compiled model/addon contract at `GET /api/v1/erp/models`.

## Tenant custom fields

Create a legal company with `POST /api/v1/erp/companies`, then create a field definition with `POST /api/v1/erp/custom-fields` using a registered `model_name`, an unused `x_<lowercase_name>`, and one of `char`, `text`, `decimal`, `integer`, `boolean`, `datetime`, or `json`. Definitions are company/model scoped. Get versioned form metadata (including safe core fields and active custom fields) from `GET /api/v1/erp/forms/{model_name}?company_id=...`. Set and read record values with `PUT /api/v1/erp/custom-fields/{company_id}/{model_name}/{record_id}/{field_name}` and `GET /api/v1/erp/custom-fields/{company_id}/{model_name}/{record_id}`; deactivate a field with `PATCH /api/v1/erp/custom-fields/{company_id}/{model_name}/{field_name}`. The typed value table checks that exactly one value column matches the field type and uses a composite foreign key to prevent cross-company/model definition mismatches. Decimal inputs must be strings or integers and support up to 16 integer and 8 fractional digits. Custom field definitions never add columns to core model tables.

These records are scoped by `company_id`, but the existing ERP business tables do not yet have company ownership columns and production auth is currently a shared service bearer key. The caller must be a trusted ERP administrator; this is not yet a safe tenant-user boundary. Do not expose these endpoints directly to untrusted tenant users until row-level ownership and tenant authorization are implemented. Never use custom fields for credentials, banking, tax, or ledger facts. Field `required` semantics and indexed custom-value search are not implemented yet.

Subscription state changes use an explicit transition graph; provisioning acknowledgements complete pending activation/resume transitions. Lifecycle rows store previous/next state, reason, and actor category. Actor labels currently identify the API command or provisioning service but are not authenticated identities; deploy only behind trusted access controls until API authorization is implemented.

Every persistent field change must have a reviewed Alembic migration. Registry compilation is not permission to auto-alter a running database.

Invoices snapshot customer contact details and commercial lines. SQLite triggers and PostgreSQL triggers/functions reject changes to posted invoice headers/lines and reject deletion; they also enforce `draft -> posted/cancelled`, `posted -> paid/overdue/cancelled`, and `overdue -> paid/cancelled` state transitions. Payment fields remain writable during the legal payment transition. Payment retries are idempotent; the first recorded payment timestamp and method are preserved. Tax calculations, statutory tax snapshots, credit notes, and dunning policy are still pending.

The billing workflow test uses an isolated SQLite database by default. To run the same transactional renewal, invoice immutability, and duplicate-prevention tests against PostgreSQL, set `MW_ERP_TEST_DATABASE_URL` to its SQLAlchemy async URL. **The integration test drops and recreates ERP metadata tables in that database**, so point it only at a disposable test database. Never use the production database for this command.
