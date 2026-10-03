# 📐 BLUEPRINT: Moonwitness Time System (MTS)
## Cetak Biru Rekayasa, Matematika Harmonik, dan Arsitektur Sistem — Powered by the Antikythera Engine

* **Dokumen Versi**: 1.0.0-PROD-SPEC
* **Standard Name**: Moonwitness Time System (MTS)
* **Engine**: Antikythera Celestial Core
* **Status**: Arsitektur Inti Disetujui
* **Target Stack**: Rust 1.98+ (No-std compatible core, Tokio async runtime)

---

## DAFTAR ISI
1. [Formulasi Masalah & Dekomposisi Waktu](#1-formulasi-masalah--dekomposisi-waktu)
2. [Matematika Harmonik Roda Gigi Antikythera](#2-matematika-harmonik-roda-gigi-antikythera)
3. [Mekanika Orbit: Mekanisme Pin-and-Slot & Anomali Kepler](#3-mekanika-orbit-mekanisme-pin-and-slot--anomali-kepler)
4. [True Celestial Clock (TCC) Engine](#4-true-celestial-clock-tcc-engine)
5. [Celestial Cron (CelCron): Deterministic Event-Driven Scheduler](#5-celestial-cron-celcron-deterministic-event-driven-scheduler)
6. [Mesin Proyeksi Hijriah & Kompatibilitas UTC](#6-mesin-proyeksi-hijriah--kompatibilitas-utc)
7. [Dekomposisi Crate & Arsitektur Perangkat Lunak](#7-dekomposisi-crate--arsitektur-perangkat-lunak)
8. [Spesifikasi Interface & Protokol (gRPC / REST / WebSocket)](#8-spesifikasi-interface--protokol-grpc--rest--websocket)
9. [Analisis Error Budget & Presisi Lintas Abad](#9-analisis-error-budget--presisi-lintas-abad)

---

## 1. Formulasi Masalah & Dekomposisi Waktu

### 1.1 Keterbatasan Fundamental Sistem Waktu Modern
Waktu sipil dan komputasi modern dibangun atas standar yang saling berbenturan:

$$\begin{aligned}
\text{TAI} &= \text{International Atomic Time (detik atomik murni Cesium-133, konstan)} \\
\text{UT1} &= \text{Universal Time (berdasarkan rotasi fisik bumi aktual terhadap bintang/matahari)} \\
\text{UTC} &= \text{TAI} - n \text{ (diatur dengan } \text{Leap Second} \text{ agar } |\text{UTC} - \text{UT1}| < 0.9\text{s}) \\
\text{TT}  &= \text{Terrestrial Time} = \text{TAI} + 32.184\text{s} \\
\Delta T   &= \text{TT} - \text{UT1} \quad (\text{Pertambahan drift akibat perlambatan rotasi bumi}) \\
\text{MTS} &= \text{Moonwitness Time System (Waktu kontinu berbasis status sudut harmonik astronomis)}
\end{aligned}$$

```
                ┌──────────────────────────────────────────────┐
                │          TAI (Detik Atomik Statis)           │
                └──────────────────────┬───────────────────────┘
                                       │
                      Disuntik Leap Second (Discontinuous!)
                                       │
                                       ▼
                ┌──────────────────────────────────────────────┐
                │           UTC / POSIX Timestamp              │
                │  - Menghapus detik 23:59:60 (POSIX bug)      │
                │  - Server crash & NTP smear drift            │
                └──────────────────────────────────────────────┘
                                       ▲
                                       │ Terjadi divergensi permanen (~11 hari/thn)
                                       │ Tidak kompatibel dengan siklus orbit
                                       ▼
                ┌──────────────────────────────────────────────┐
                │        Kalender Hijriah & Fase Bulan         │
                │  - Revolusi Sinodik Bulan: ~29.530588 hari   │
                │  - Bergantung pada Ijtimak & Keterlihatan    │
                └──────────────────────────────────────────────┘
```

### 1.2 Masalah Kegagalan Cron Terdistribusi
Standar cron UNIX mengekspresikan waktu sebagai tuple integer 5-dimensi:
$$\text{Cron} = (\text{minute}, \text{hour}, \text{day\_of\_month}, \text{month}, \text{day\_of\_week})$$

Model ini mengasumsikan:
1. Hari selalu terdiri dari 86.400 detik UTC linier.
2. Bulan selalu terbagi dalam 28–31 hari kalender sipil matahari.

**Kegagalan Sistemik**:
Ketika sistem keuangan syariah, jaringan distribusi logistik berbasis lunar, atau observatorium astronomi mencoba menjadwalkan pekerjaan berbasis bulan (misal: penutupan buku akhir bulan Hijriah atau pemantauan hilal), model ini mengalami **drift akumulatif** atau **race condition** saat pergantian tanggal hijriah mendahului/melompati tanggal masehi.

---

## 2. Matematika Harmonik Roda Gigi Antikythera

MTS menggunakan kombinasi rasio roda gigi bilangan bulat ($Z_1 / Z_2 \in \mathbb{Q}$) dari Mekanisme Antikythera untuk menyinkronkan 5 siklus fundamental bulan:

| Siklus Bulan | Simbol | Nilai Rata-rata (Hari Bumi) | Signifikansi Fisik |
| :--- | :--- | :--- | :--- |
| **Bulan Sinodik** | $M_s$ | $29.530588853$ hari | Fase bulan (Bulan Baru ke Bulan Baru berikutnya) |
| **Bulan Sideris** | $M_{sid}$ | $27.321661547$ hari | Orbit bulan terhadap bintang tetap ($360^\circ$) |
| **Bulan Anomalistik**| $M_a$ | $27.554549878$ hari | Jarak dari *Perigee* ke *Perigee* berikutnya |
| **Bulan Drakonik** | $M_d$ | $27.212220817$ hari | Titik simpul orbit (*Node* ke *Node*, penentu gerhana) |
| **Bulan Tropis** | $M_t$ | $27.321582241$ hari | Orbit relatif terhadap ekuinoks vernal |

### 2.1 Derivasi Rasio Roda Gigi Utama
Model Antikythera menyelesaikan relasi matahari-bulan melalui persamaan Diophantine rasional:

1. **Siklus Metonik**:
   $$19 \text{ Tahun Tropis} \approx 235 \text{ Bulan Sinodik} \approx 6939.688 \text{ hari}$$
   Rasio roda gigi primer:
   $$R_{\text{metonic}} = \frac{235}{19} = 12 + \frac{7}{19}$$
   (Membagi 19 tahun menjadi 235 bulan dengan 7 bulan interkalasi/kabisat).

2. **Koreksi Siklus Callippic**:
   $$4 \times 19 - 1 = 76 \text{ Tahun Matahari} = 940 \text{ Bulan Sinodik} = 27759 \text{ hari}$$
   Rasio:
   $$R_{\text{callippic}} = \frac{940}{76}$$

3. **Siklus Saros (Prediksi Gerhana)**:
   $$223 \text{ Bulan Sinodik} \approx 242 \text{ Bulan Drakonik} \approx 239 \text{ Bulan Anomalistik} \approx 6585.3213 \text{ hari}$$
   Menghasilkan gerhana dengan geometri yang hampir identik setiap 18 tahun 11 hari 8 jam.

4. **Siklus Exeligmos (Koreksi Rotasi Diurnal 8 Jam)**:
   $$1 \text{ Exeligmos} = 3 \times \text{Saros} = 669 \text{ Bulan Sinodik} \approx 19755.96 \text{ hari} \approx 54 \text{ tahun } 33 \text{ hari}$$
   Karena 8 jam $\times 3 = 24$ jam (1 rotasi bumi penuh), gerhana berulang pada **bujur bumi (*longitude*) yang sama**.

---

## 3. Mekanika Orbit: Mekanisme Pin-and-Slot & Anomali Kepler

Bulan tidak bergerak dengan kecepatan konstan di langit karena orbitnya yang elips dengan eksentrisitas $e \approx 0.0549$ (Hukum Kepler II: kecepatan sudut $\dot{\theta}$ maksimum saat *perigee* dan minimum saat *apogee*).

Mekanisme Antikythera memodelkan ini menggunakan **roda gigi pin-and-slot bertingkat**:

```
           Pusat Roda Gigi 1 (Sumbu O1)
                   ( + )
                    │
            Offset  │ d = 1.1 mm (Eksentrisitas Orbit)
                    │
                   ( + )
           Pusat Roda Gigi 2 (Sumbu O2)
                    │
                    └───────[ PIN ]────────┐
                                            │ Meluncur dalam
                                            ▼
                                     [ SLOT GUIDE ]
```

### 3.1 Formulasi Matematis Pin-and-Slot
Jika roda gigi penggerak berputar seragam dengan sudut $\alpha(t) = \omega t$, posisi angular roda gigi terdorong $\theta(t)$ didefinisikan secara implisit oleh:

$$\tan(\theta - \alpha) = \frac{e \sin \alpha}{1 - e \cos \alpha}$$

Di mana:
* $e = \frac{d}{R}$ adalah rasio offset sumbu terhadap jari-jari roda gigi ($\approx$ eksentrisitas lunar $0.0549$).
* Melalui ekspansi Fourier:
$$\theta(t) = \omega t + 2e \sin(\omega t) + \frac{5}{4}e^2 \sin(2\omega t) + \mathcal{O}(e^3)$$

Persamaan ini **identik secara matematis dengan Persamaan Pusat (*Equation of the Center*)** pada mekanika orbit klasik Kepler:
$$v = M + 2e \sin M + \frac{5}{4}e^2 \sin 2M + \dots$$

Dalam implementasi Rust kita (`mts-core`), variasi anomali lunar ini dihitung menggunakan aritmatika rasional presisi tinggi atau fixed-point trigonometri tanpa float jitter.

---

## 4. True Celestial Clock (TCC) Engine

Inti waktu dari MTS bukan penghitung detik skalar konvensional, melainkan **Vektor Keadaan Langit Kontinu (*Continuous Celestial State Vector*)**:

$$\mathbf{\Psi}_{\text{TCC}}(t) = \begin{pmatrix} \Delta\lambda(t) \\ \beta_m(t) \\ \lambda_s(t) \\ \mathcal{M}(t) \\ \mathcal{S}(t) \end{pmatrix}$$

Di mana:
* $\Delta\lambda(t) = \lambda_{\text{moon}}(t) - \lambda_{\text{sun}}(t) \pmod{360^\circ}$ adalah **Sudut Elongasi Ekliptika Geosentris**.
* $\beta_m(t)$ adalah Lintang Ekliptika Bulan (penentu gerhana & batas lintasan).
* $\lambda_s(t)$ adalah Bujur Sejati Matahari (penentu musim/zodiak/tahun matahari).
* $\mathcal{M}(t)$ adalah Indeks Fraksional Roda Gigi Metonik $[0, 235)$.
* $\mathcal{S}(t)$ adalah Indeks Fraksional Roda Gigi Saros $[0, 223)$.

### 4.1 Definisi "Detak" Waktu (The Celestial Tick)
* **1 Conjunction Tick ($T_{\text{conj}}$)** terjadi saat:
  $$\Delta\lambda(t) = 0^\circ \quad (\text{Ijtimak Sejati / New Moon})$$
* **1 Opposition Tick ($T_{\text{opp}}$)** terjadi saat:
  $$\Delta\lambda(t) = 180^\circ \quad (\text{Purnama Sejati / Full Moon})$$
* **1 Quadrature Tick** terjadi saat $\Delta\lambda(t) \in \{90^\circ, 270^\circ\}$.

---

## 5. Celestial Cron (CelCron): Deterministic Event-Driven Scheduler

Berbeda dengan cron biasa yang mengevaluasi `datetime == target`, **CelCron** di dalam MTS adalah mesin pemecah akar (*root-finding engine*) kontinu berbasis kondisi orbital.

### 5.1 Algoritma Root-Finding Event Langit
Untuk menemukan detik eksak kapan suatu peristiwa langit terjadi, CelCron menjalankan pemecah akar numerik **Brent-Dekker Hybrid**:

```
Cari t* sedemikian rupa sehingga:
f(t*) = EventCondition(t*) - TargetThreshold = 0
```

Contoh untuk mendeteksi Ijtimak berikutnya:
$$f(t) = \text{unwrap}(\lambda_{\text{moon}}(t) - \lambda_{\text{sun}}(t)) = 0$$

```rust
// Pseudocode CelCron Engine
pub fn find_next_conjunction(start_time: JulianDay) -> JulianDay {
    let mut a = start_time;
    let mut b = start_time + Days::new(31); // Batas maksimum 1 bulan sinodik
    
    // Algoritma Brent-Dekker konvergen dalam 6-8 iterasi ke presisi sub-detik
    brent_dekker_solve(|t| {
        let moon_lon = calculate_lunar_longitude(t);
        let sun_lon = calculate_solar_longitude(t);
        normalize_angle_signed(moon_lon - sun_lon)
    }, a, b, Tolerance::from_arcseconds(0.001))
}
```

### 5.2 Tipe Trigger CelCron yang Didukung
1. `Event::Conjunction`: Ijtimak toposentrik atau geosentris.
2. `Event::HilalVisibility(GeoLocation, Criteria)`: Munculnya bulan sabit pertama di ufuk geografis.
3. `Event::SolarZenith(GeoLocation)`: Kulminasi matahari (tengah hari sejati).
4. `Event::SolarElevation(GeoLocation, Angle)`: Waktu Subuh, Fajar, Maghrib, Isya.
5. `Event::Eclipse(EclipseType)`: Gerhana total/parsial/cincin.

---

## 6. Mesin Proyeksi Hijriah & Kompatibilitas UTC

MTS tidak menggantikan sistem lain secara destruktif, melainkan menyediakan **Proyeksi Deterministik 2 Arah**:

```
                         ┌─────────────────────────┐
                         │    MTS CORE ENGINE      │
                         │ (TCC State / Elongasi)  │
                         └────────────┬────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
┌───────────────────────────┐                   ┌───────────────────────────┐
│     HIJRIAH PROJECTION    │                   │   UTC / POSIX PROJECTION  │
│  - Mode 1: Hisab Wujudul  │                   │  - Evaluasi Polinomial ΔT  │
│    Hilal (Geosentris)     │                   │    (Stephenson & Morrison)│
│  - Mode 2: Kriteria Imkan │                   │  - Mapping ke ISO-8601    │
│    Rukyat (MABIMS 3°/6.4°)│                   │  - Deteksi Leap Second    │
│  - Mode 3: Global Lunar   │                   │                           │
│    Calendar (Odeh/Yallop) │                   │                           │
└───────────────────────────┘                   └───────────────────────────┘
```

### 6.1 Formula Koreksi $\Delta T$ (Stephenson & Morrison / Espenak)
Untuk mengonversi waktu dinamis astronomi ($TT$) ke waktu rotasi bumi sipil ($UT1$ dan $UTC$):

$$\Delta T = TT - UT1$$

Untuk tahun $y \in [2005, 2050]$:
$$t = y - 2000$$
$$\Delta T \approx 62.92 + 0.32217 t + 0.005589 t^2$$

Modul `mts-ephemeris` mengintegrasikan tabel historis IERS dan polinomial jangka panjang (-3000 SM s/d +3000 Masehi) sehingga kalkulasi 1.000 tahun ke belakang atau ke depan tetap presisi.

---

## 7. Dekomposisi Crate & Arsitektur Perangkat Lunak

Struktur modular Rust workspace di root repository `moonwitness`:

```
moonwitness/
├── Cargo.toml                   # Workspace Definition
├── crates/
│   ├── mts-core/                # Primitif matematika, Unit, Antikythera Gears
│   │   ├── src/
│   │   │   ├── rational.rs      # Bilangan rasional presisi tanpa float drift
│   │   │   ├── units.rs         # Newtypes (Radians, Degrees, ArcSec, JulianDay)
│   │   │   ├── gears/           # Metonic, Callippic, Saros, Exeligmos
│   │   │   └── pin_slot.rs      # Mekanika eksentrisitas Keplerian
│   │   └── Cargo.toml
│   │
│   ├── mts-ephemeris/           # Algoritma perhitungan koordinat langit
│   │   ├── src/
│   │   │   ├── solar.rs         # Teori orbit matahari (VSOP87 analytical)
│   │   │   ├── lunar.rs         # Teori orbit bulan (ELP-2000/82 truncated)
│   │   │   ├── delta_t.rs       # Tabel interpolasi & polinomial ΔT
│   │   │   └── topocentric.rs   # Parallaks & koreksi lokasi pengamat
│   │   └── Cargo.toml
│   │
│   ├── mts-hijri/               # Aturan kalender & visibilitas hilal
│   │   ├── src/
│   │   │   ├── criteria/        # MABIMS, Odeh, Yallop, Wujudul Hilal
│   │   │   └── calendar.rs      # Generator bulan & tahun hijriah deterministik
│   │   └── Cargo.toml
│   │
│   ├── mts-celcron/             # Mesin penjadwalan berbasis event langit
│   │   ├── src/
│   │   │   ├── solver.rs        # Brent-Dekker root finding
│   │   │   ├── trigger.rs       # Definisi event & evaluator
│   │   │   └── dispatcher.rs    # Event emitter async (Tokio channels)
│   │   └── Cargo.toml
│   │
├── services/
│   └── time/                    # Standalone service daemon & CLI (mts)
│       ├── src/
│       │   └── main.rs          # Entry point daemon, REST server & CLI
│       ├── tests/               # Golden integration test suites
│       └── Cargo.toml
│   │
│   └── mts-wasm/                # Kompilasi WebAssembly untuk frontend/edge
│       ├── src/
│       │   └── lib.rs           # wasm-bindgen exports
│       └── Cargo.toml
```

---

## 8. Spesifikasi Interface & Protokol (gRPC / REST / WebSocket)

### 8.1 Protobuf Contract (`mts/v1/time.proto`)
```protobuf
syntax = "proto3";
package mts.v1;

service TimeService {
  rpc GetCurrentState (Empty) returns (CelestialStateResponse);
  rpc ResolveNextEvent (EventRequest) returns (EventResponse);
  rpc ProjectHijri (HijriQueryRequest) returns (HijriProjectionResponse);
  rpc StreamCelestialTicks (StreamTickRequest) returns (stream CelestialTick);
}

message CelestialStateResponse {
  double julian_day_tt = 1;
  double elongation_deg = 2;
  double lunar_phase_fraction = 3;
  string phase_name = 4;
  GearState gear_state = 5;
  HijriDate hijri_projected = 6;
  string utc_timestamp = 7;
}

message GearState {
  uint32 metonic_month = 1;      // 0..234
  uint32 metonic_year = 2;       // 0..18
  uint32 saros_cycle_step = 3;   // 0..222
  uint32 exeligmos_tier = 4;     // 0..2
  double lunar_anomaly_rad = 5;  // Variasi kecepatan pin-slot
}

message HijriDate {
  int32 year = 1;
  uint32 month = 2;              // 1..12
  uint32 day = 3;                // 1..30
  string month_name = 4;
}
```

### 8.2 Endpoint REST API
* `GET /api/v1/time/now`: Mengambil snapshot waktu langit saat ini.
* `GET /api/v1/time/conjunction/next`: Mengambil timestamp eksak ijtimak berikutnya.
* `POST /api/v1/celcron/subscribe`: Mendaftarkan webhook untuk trigger langit.
* `WS /api/v1/time/stream`: WebSocket streaming detak waktu per detik astronomis.

---

## 9. Analisis Error Budget & Presisi Lintas Abad

| Komponen | Metode Tradisional (Float IEEE-754 / UTC) | Metode MTS (Rational Math / TCC) | Toleransi Drift per 100 Tahun |
| :--- | :--- | :--- | :--- |
| **Rasio Roda Gigi** | `f64` (Akumulasi epsilon truncation) | `num::Rational64` ($\mathbb{Q}$) | **0,000000000 ms (Zero Drift Mutlak)** |
| **Posisi Bulan** | Pendekatan sinus/cosinus sederhana | ELP-2000/82 + Koreksi Nutasi IAU | $< 0.5$ detik busur astronomis |
| **Peredaran Matahari** | Rata-rata 365.25 hari | VSOP87 Analytical Perturbation | $< 0.1$ detik busur astronomis |
| **Deteksi Ijtimak** | Jam sipil pembulatan menit | Brent-Dekker Root Solver | $< 0.1$ detik waktu riil |

Dengan arsitektur ini, **Moonwitness Time System (MTS)** dapat beroperasi ratusan hingga ribuan tahun secara deterministik tanpa pernah membutuhkan perbaikan manual akibat desinkronisasi kalender atau kegagalan penjadwalan cron.
