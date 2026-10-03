# ==============================================================================
# 🌌 MOONWITNESS UNIVERSE MONOREPO — MASTER JUSTFILE ORCHESTRATOR
# Polyglot Operating System: Rust (Kernel & Daemon), Go (Gateway), Python (Analytics), TypeScript (Web Shell & ORM)
# ==============================================================================

# Gunakan PowerShell secara otomatis saat di lingkungan Windows
set windows-shell := ["powershell.exe", "-NoProfile", "-Command"]
set dotenv-load := true

# Perintah default: tampilkan daftar seluruh perintah yang tersedia
default:
    @just --list

# ==============================================================================
# 🧪 UNIVERSAL TESTING SUITE (RUST, GO, PYTHON, TYPESCRIPT)
# ==============================================================================

# Jalankan seluruh test suite across all languages (Rust 43 tests, Go, Python)
test: test-rust test-go test-python
    @echo "✅ Seluruh test suite Universe Monorepo berhasil dijalankan!"

# Uji seluruh modul Rust (Kernel, Ephemeris, Hijri, CelCron, Waktu Semesta, Time Daemon)
test-rust:
    cargo test --workspace

# Uji Go Celestial Gateway
test-go:
    cd services/gateway; go vet ./...

# Uji Python Analytics Service
test-python:
    python -m py_compile services/analytics/main.py
    .venv\Scripts\python.exe -m unittest discover -s services/erp/tests -v

# Apply reviewed ERP Alembic migrations to the configured MW_ERP_DATABASE_URL
migrate-erp:
    .venv\Scripts\alembic.exe -c services/erp/alembic.ini upgrade head

# Verify the configured ERP database matches model metadata without changing it
check-erp-migrations:
    .venv\Scripts\alembic.exe -c services/erp/alembic.ini check

# ==============================================================================
# 🚀 SERVICES & DAEMONS
# ==============================================================================

# Jalankan seluruh 7 service sekaligus (Time Daemon, Gateway, Runner, Radius, Analytics, ERP, Web Shell) di terminal terpisah
dev:
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '[RUST] Time Daemon starting on http://localhost:5155...'; just serve-time"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '[GO] Gateway starting on http://localhost:5150...'; just serve-gateway"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '[RUNNER] Universe Runner starting on http://localhost:5160...'; just serve-runner"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '[RADIUS] ToughRADIUS starting on http://localhost:5170...'; just serve-radius"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '[PYTHON] Analytics starting on http://localhost:5156...'; just serve-analytics"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '[ERP] Odoo-like ERP Engine starting on http://localhost:5180...'; just serve-erp"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '[WEB] Next.js Web Shell starting on http://localhost:3000...'; just dev-web"
    @echo "Seluruh 7 microservices Moonwitness Universe berhasil diluncurkan!"

# Jalankan seluruh 7 service dalam 1 terminal terpadu (concurrently)
dev-single:
    npx -y concurrently -n "RUST,GO,RUNNER,RADIUS,PY,ERP,WEB" -c "magenta,cyan,green,red,yellow,white,blue" "just serve-time" "just serve-gateway" "just serve-runner" "just serve-radius" "just serve-analytics" "just serve-erp" "just dev-web"

# Jalankan Time Daemon Service (Axum REST API di http://localhost:5155)
serve-time:
    cargo run -p mts-daemon -- serve --port 5155

# Jalankan Celestial API Gateway (Go di http://localhost:5150)
serve-gateway:
    cd services/gateway; go run main.go

# Jalankan Universe Runner & Coolify Engine (Go di http://localhost:5160)
serve-runner:
    cd services/runner; go run main.go

# Jalankan ToughRADIUS AAA & Broadband Server (Go di http://localhost:5170)
serve-radius:
    cd services/radius; go run main.go

# Jalankan Astrodynamics & Optics Analytics Service (Python di http://localhost:5156)
serve-analytics:
    python services/analytics/main.py

# Jalankan Odoo-like ERP & Subscription Engine (Python di http://localhost:5180)
serve-erp:
    .venv\Scripts\uvicorn.exe services.erp.main:app --host 0.0.0.0 --port 5180

# Jalankan Frontend Web Shell (Next.js / Vuexy di http://localhost:3000)
dev-web:
    pnpm --filter ./apps/web dev

# ==============================================================================
# 🗄️ DATABASE & ORM LAYER (PRISMA & SQLITE)
# ==============================================================================

# Sinkronkan schema Prisma dengan database SQLite dev.db
db-push:
    npx prisma db push --schema=apps/web/src/prisma/schema.prisma

# Generate Prisma Client TypeScript SDK
db-generate:
    npx prisma generate --schema=apps/web/src/prisma/schema.prisma

# Seed database dengan stasiun observasi global & konkordansi 4 Kitab Wahyu
db-seed:
    npx tsx apps/web/src/prisma/seed.ts

# Buka Prisma Studio GUI untuk menginspeksi database di browser
db-studio:
    npx prisma studio --schema=apps/web/src/prisma/schema.prisma

# ==============================================================================
# 🔭 CELESTIAL CLOCK & COSMIC CLI COMMANDS
# ==============================================================================

# Cek snapshot jam astronomis saat ini (TCC, Hijriah, Dial Antikythera)
now:
    cargo run -p mts-daemon -- now

# Cek Waktu Semesta & Asas Korelasi 4 Kitab Wahyu (Al-Qur'an, Injil, Taurat, Zabur)
cosmic:
    cargo run -p mts-daemon -- cosmic --scriptures

# Hitung waktu eksak ijtimak astronomis (konjungsi) berikutnya
conjunction:
    cargo run -p mts-daemon -- conjunction

# Jalankan validasi ilmiah NASA JPL & stress-test 5.000 tahun
benchmark:
    cargo run -p mts-daemon -- benchmark

# ==============================================================================
# 🏗️ BUILD & PACKAGING
# ==============================================================================

# Kompilasi rilis optimal seluruh binary (Rust + Go)
build-all: build-rust build-go
    @echo "✅ Seluruh binary Universe Monorepo berhasil dikompilasi!"

# Kompilasi binary Rust mts.exe
build-rust:
    cargo build --release

# Kompilasi binary Go gateway.exe
build-go:
    cd services/gateway; go build -o ../../target/gateway.exe main.go

# Bersihkan cache build
clean:
    cargo clean
