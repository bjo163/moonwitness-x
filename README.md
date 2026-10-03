# 🌌 Moonwitness Time System (MTS)
> **The Millennium-Scale Autonomous Celestial Time Standard — Powered by the Antikythera Engine**

[![Time Standard: MTS](https://img.shields.io/badge/Standard-MTS%20(Moonwitness%20Time%20System)-blueviolet.svg)]()
[![Engine: Antikythera](https://img.shields.io/badge/Engine-Antikythera%20Celestial%20Core-gold.svg)]()
[![Language: Rust](https://img.shields.io/badge/Language-Rust%201.98+-orange.svg)](https://www.rust-lang.org/)
[![Precision: Zero-Drift Rational Math](https://img.shields.io/badge/Precision-Zero--Drift%20Rational%20Math-green.svg)]()

---

## 📖 Ringkasan Sistem (Executive Summary)

**Moonwitness Time System (MTS)** adalah standar dan infrastruktur waktu generasi baru yang memadukan komputasi modern dengan prinsip mekanika kosmis **Mekanisme Antikythera (Yunani Kuno, ~150 SM)**.

MTS hadir berdampingan dengan standar waktu dunia (seperti **UTC**, **TAI**, dan **GPS Time**) sebagai **Independent Celestial Base Clock** yang menyelesaikan permasalahan krusial yang tidak pernah terselesaikan selama berabad-abad:
1. **Ketidaksinkronan Abadi Kalender Hijriah vs UTC**: Kalender Hijriah berputar pada revolusi sinodik bulan sejati (~29,530588 hari), sedangkan UTC mengunci detik atomik buatan yang dipaksa mengejar matahari melalui *leap seconds*. Keduanya mengalami *drift* ~10,875 hari setiap tahun dan mustahil dijadwalkan secara deterministik menggunakan cron konvensional.
2. **Kerapuhan POSIX & Unix Cron**: Standar `cron` (`* * * * *`) mengasumsikan waktu berdetik secara linier dan modular pada kalender Gregorian. Cron tidak mampu menangani peristiwa berbasis astronomi nyata (seperti ijtimak, konjungsi toposentrik, dan visibilitas hilal) tanpa intervensi manusia atau penyesuaian manual politis.
3. **Krisis Leap Second & Perlambatan Rotasi Bumi ($\Delta T$)**: Rotasi bumi melambat secara bertahap akibat gesekan pasang surut air laut (*tidal friction*). Penyuntikan detik kabisat pada server sering menyebabkan *crash*, *race condition*, dan desinkronisasi terdistribusi.

MTS mendefinisikan waktu bukan sebagai angka detik linier statis, melainkan sebagai **Rasio Harmonik Roda Gigi Langit & Sudut Elongasi Benda Langit Kontinu ($\Delta\lambda$)**.

---

## 🏛️ Fondasi Mesin: Antikythera Celestial Engine

Mekanisme Antikythera memecahkan masalah sinkronisasi kosmis lebih dari 2.100 tahun lalu dengan **Harmonic Gear Trains**:

```
                              [ INPUT: DRIVING AXIS ]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
      [ SIKLUS MATAHARI / SOLAR ]                    [ SIKLUS BULAN / LUNAR ]
        (Tahun Tropis / Zodiak)                     (Revolusi Sinodik & Anomali)
                 │                                               │
                 │                                  ┌────────────┴────────────┐
                 │                                  ▼                         ▼
                 │                         [ Metonic Gear ]           [ Pin-and-Slot ]
                 │                            (235 / 19)              (Variasi Kepler)
                 │                                  │                         │
                 └───────────────────┬──────────────┴─────────────────────────┘
                                     ▼
                     [ TRUE CELESTIAL CLOCK (TCC) ]
                  (Elongasi Kontinu: Δλ = λ_moon - λ_sun)
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    [ SAROS / EXELIGMOS DIAL ]               [ CELESTIAL CRON ENGINE ]
       (Prediksi Gerhana)                   (Event Trigger: Ijtimak/Hilal)
```

* **Rasio Metonik ($\frac{235}{19}$)**: Menyelaraskan 235 bulan sinodik bulan dengan 19 tahun matahari secara rasional tanpa pembulatan desimal.
* **Rasio Callippic ($\frac{940}{76}$ minus 1 hari)**: Mengoreksi akumulasi drift 1 hari setiap 76 tahun.
* **Mekanisme Pin-and-Slot (Eksentrik)**: Mensimulasikan orbit elips bulan (Hukum Kepler II) di mana bulan bergerak lebih cepat saat *perigee* dan melambat saat *apogee*.
* **Siklus Saros (223 Bulan) & Exeligmos (669 Bulan / 54 Tahun)**: Menghitung pergeseran 8 jam rotasi bumi pada siklus gerhana berikutnya.

---

## ⚙️ Arsitektur Crates di Root Workspace

MTS didesain sebagai **Universe Repository / Celestial Operating System (Polyglot Monorepo)** yang memadukan 4 ekosistem bahasa:

```
moonwitness/
├── apps/
│   └── web/                 # Celestial OS Web Shell & Dashboard (Next.js 15 / React 19 / MUI)
├── crates/                  # Rust Computational Kernel (Matematika Rasional, Ephemeris, Falak)
│   ├── mts-core/            # Roda Gigi Antikythera, Rasional Q, Waktu Semesta FLRW & 4 Kitab
│   ├── mts-ephemeris/       # Algoritma Orbit Matahari-Bulan (VSOP87 / ELP2000 / Delta-T)
│   ├── mts-hijri/           # True Celestial Clock (TCC) & Kriteria Falak MABIMS/Wujudul Hilal
│   └── mts-celcron/         # Hybrid Root Finder Brent-Dekker (Penjadwal Ijtimak & Hilal)
├── services/                # Microservices Layer
│   ├── time/                # Rust Time Daemon Service (Axum REST API di :5155, CLI 'mts')
│   ├── gateway/             # Go Celestial API Gateway (Reverse Proxy & Introspection di :5150)
│   └── analytics/           # Python Astrodynamics & Hilal Optics Analytics (Kasten-Young / Odeh di :5156)
├── packages/                # Shared Packages Layer (pnpm workspace)
│   ├── types/               # Universal TypeScript Contracts (@moonwitness/types)
│   ├── sdk/                 # Universal TypeScript Client SDK (@moonwitness/sdk)
│   └── database/            # Shared Celestial Database ORM (@moonwitness/database via Prisma)
├── proto/                   # Universal ABI / Protocol Buffers (Go, C#, Java, TypeScript)
│   └── moonwitness/v1/      # time.proto & celestial.proto
├── justfile                 # Master Monorepo Task Orchestrator
├── Cargo.toml               # Root Cargo Workspace
├── pnpm-workspace.yaml      # Root pnpm Workspace
├── pyproject.toml           # Root Python (uv) Workspace
├── BLUEPRINT.md             # Spesifikasi Matematis & Rekayasa Lengkap
├── TODO.md                  # Roadmap & Status Eksekusi Bertahap
└── README.md                # Dokumentasi Utama
```

---

## 🚀 Fitur Kunci Celestial OS (Moonwitness)

* **Zero-Drift Rational Arithmetic ($\mathbb{Q}$)**: Semua kalkulasi roda gigi menggunakan bilangan rasional presisi tinggi (`num-rational`), menghilangkan kesalahan floating point IEEE-754 bahkan dalam simulasi 10.000 tahun.
* **True Celestial Clock (TCC)**: Standar waktu universal kontinu berbasis sudut elongasi sejati Bulan-Matahari ($\Delta\lambda$).
* **Waktu Semesta & Asas Korelasi 4 Kitab Wahyu**: Perhitungan kosmologis relativistik FLRW (Planck 2018) terharmonisasi dengan dalil waktu dalam Al-Qur'an, Injil, Taurat, dan Zabur.
* **Universal Polyglot Orchestrator (`just`)**: Mengontrol Rust, Go, Python, dan TypeScript dalam satu file orkestrasi yang konsisten.
* **Celestial Database ORM**: Pencatatan terpadu stasiun observasi rukyat global, riwayat hisab hilal, dan konkordansi dalil wahyu menggunakan Prisma ORM & SQLite.
* **Go High-Throughput API Gateway**: Gateway terpadu yang mem-proxy dan mem-multiplex traffic antara Rust Time Daemon, Python Analytics, dan Frontend Web Shell.
* **Python Optical & Atmospheric Engine**: Menghitung koefisien ekstingsi atmosferik Rayleigh, kontras sabit bulan (Kasten-Young / Schaefer), dan zona visibilitas astronomis Odeh ($q$-value).
* **Celestial OS Web Dashboard**: Antarmuka interaktif futuristik di `apps/web` menampilkan simulasi fase bulan, dial roda gigi Antikythera, hitung mundur ijtimak, dan telemetri kosmologi.

---

## 🛠️ Panduan Operasional Monorepo (Justfile)

Semua perintah terpusat dikelola menggunakan `just`:

```bash
# Tampilkan daftar seluruh perintah yang tersedia
just

# Jalankan validasi dan test suite lintas bahasa (Rust tests, Go checks, Python checks)
just test

# Jalankan Time Daemon Service (Rust Axum di http://localhost:5155)
just serve-time

# Jalankan Celestial API Gateway (Go di http://localhost:5150)
just serve-gateway

# Jalankan Analytics Service (Python di http://localhost:5156)
just serve-analytics

# Jalankan Frontend Web Shell (Next.js di http://localhost:3000)
just dev-web

# Sinkronkan dan kelola Database ORM
just db-push
just db-seed
just db-studio

# Jalankan telemetri CLI astronomis
just now           # Telemetri jam astronomis & dial Antikythera
just cosmic        # Waktu Semesta & Asas Korelasi 4 Kitab Wahyu
just conjunction   # Hitung waktu ijtimak terdekat
just benchmark     # Validasi data emas NASA JPL (rentang 5.000 tahun)

# Kompilasi seluruh binary release (Rust + Go)
just build-all
```

---

## 📚 Dokumen Terkait
* [BLUEPRINT.md](BLUEPRINT.md) — Cetak biru matematika, rumus astronomi, desain roda gigi, dan spesifikasi arsitektur MTS.
* [TODO.md](TODO.md) — Rencana kerja bertahap, status implementasi, dan pengujian.

