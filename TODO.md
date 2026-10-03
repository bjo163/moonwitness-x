# 📋 TODO: Rencana Implementasi Bertahap Moonwitness Time System (MTS)

## Roadmap Rekayasa MTS — Powered by the Antikythera Engine

Dokumen ini melacak seluruh tahapan implementasi teknis sistem waktu **MTS** dari nol hingga siap produksi.

---

## 🧭 Ringkasan Status Tahapan

| Fase        | Nama Fase                   | Fokus Utama                                     |             Status              |
| :---------- | :-------------------------- | :---------------------------------------------- | :-----------------------------: |
| **Fase 0**  | **Workspace & Scaffolding** | Setup Rust Workspace di `services/time`         |           ✅ Selesai            |
| **Fase 1**  | **`mts-core`**              | Matematika Rasional & Roda Gigi Antikythera     | ✅ Selesai (20/20 Tests Lulus)  |
| **Fase 2**  | **`mts-ephemeris`**         | Algoritma Orbit Bulan-Matahari & Delta-T        |  ✅ Selesai (8/8 Tests Lulus)   |
| **Fase 3**  | **`mts-hijri`**             | True Celestial Clock (TCC) & Proyeksi Hijriah   |  ✅ Selesai (6/6 Tests Lulus)   |
| **Fase 4**  | **`mts-celcron`**           | Scheduler Event Langit (Ijtimak & Hilal)        |  ✅ Selesai (2/2 Tests Lulus)   |
| **Fase 5**  | **`mts-daemon`**            | Standalone Service (CLI & HTTP REST Daemon)     |    ✅ Selesai (Binary Ready)    |
| **Fase 6**  | **`mts-wasm`**              | Kompilasi WASM untuk Browser & UI               |         ⏳ Selanjutnya          |
| **Fase 7**  | **Validasi & Benchmarking** | Uji Banding Data NASA JPL (Rentang 5.000 Tahun) | ✅ Selesai (100% Terverifikasi) |
| **Fase 8**  | **Waktu Semesta & 4 Kitab** | Kosmologi FLRW & Asas Korelasi 4 Kitab Wahyu    | ✅ Selesai (43/43 Tests Lulus)  |
| **Fase 9**  | **`services/runner`**       | Universe Runner & Coolify Docker Engine (Go)    |   ✅ Selesai (Daemon Active)    |
| **Fase 10** | **`services/radius`**       | ToughRADIUS Broadband AAA Engine (Go)           |   ✅ Selesai (Daemon Active)    |

---

## 📌 Rincian Tugas per Fase

### Fase 0: Setup Workspace & Toolchain

- [x] Inisialisasi struktur direktori Rust workspace di `services/time`.
- [x] Buat root `Cargo.toml` yang mendeklarasikan seluruh member crate (`mts-core`, `mts-ephemeris`, `mts-hijri`, `mts-celcron`, `mts-daemon`).
- [x] Setup script otomasi test runner dan build release.

---

### Fase 1: `mts-core` — Fondasi Matematika Rasional & Roda Gigi Antikythera

_Tujuan: Membangun simulasi roda gigi mekanis Antikythera tanpa floating-point drift._

- [x] **Modul `rational.rs`**:
  - [x] Implementasi wrapper rasio roda gigi berbasis bilangan rasional bulat (`num-rational` / `num-bigint`).
  - [x] Zero-loss multiplication & division untuk rasio rantai roda gigi bersusun.
- [x] **Modul `units.rs`**:
  - [x] Strongly-typed newtypes: `Radians`, `Degrees`, `ArcSeconds`, `JulianDay`, `JulianCentury`.
  - [x] Implementasi konversi lossless dan operator overloading (`+`, `-`, `*`).
- [x] **Modul `gears/metonic.rs`**:
  - [x] Implementasi rasio roda gigi Metonik $\frac{235}{19}$.
  - [x] Perhitungan bulan interkalasi (7 bulan kabisat dalam siklus 19 tahun).
- [x] **Modul `gears/callippic.rs`**:
  - [x] Implementasi koreksi Callippic (940 bulan / 76 tahun minus 1 hari).
- [x] **Modul `gears/saros.rs` & `exeligmos.rs`**:
  - [x] Rasio gerhana 223 bulan sinodik.
  - [x] Rasio Exeligmos 669 bulan (koreksi rotasi 8 jam bumi).
- [x] **Modul `pin_slot.rs`**:
  - [x] Model mekanis eksentrisitas lunar (anomali Keplerian).
  - [x] Validasi rumus kecepatan sudut variabel perigee vs apogee.
- [x] **Unit Tests**:
  - [x] Uji simulai rotasi 1.000 siklus tanpa kehilangan 1 tick rasional (13 unit tests lulus).

---

### Fase 2: `mts-ephemeris` — Mesin Koordinat Langit Presisi Tinggi

_Tujuan: Menghitung posisi bujur/lintang sejati Matahari dan Bulan di langit._

- [x] **Modul `delta_t.rs`**:
  - [x] Tabel data historis $\Delta T$ ($TT - UT1$) dari data IERS & gerhana Stephenson & Morrison.
  - [x] Algoritma interpolasi dan polinomial ekstrapolasi untuk rentang tahun -3000 SM s/d +3000 M.
- [x] **Modul `solar.rs`**:
  - [x] Perhitungan Bujur Geometri Matahari ($\lambda_{sun}$) berbasis teori analitik VSOP87.
  - [x] Koreksi aberasi cahaya dan nutasi ekuinoks.
- [x] **Modul `lunar.rs`**:
  - [x] Perhitungan Bujur Bulan ($\lambda_{moon}$) dan Lintang Bulan ($\beta_{moon}$) berbasis teori ELP-2000/82.
  - [x] Perhitungan jarak bumi-bulan (deteksi Perigee dan Apogee).
- [x] **Modul `topocentric.rs`**:
  - [x] Transformasi koordinat geosentris ke toposentrik berdasarkan koordinat geografis pengamat (Lintang, Bujur, Ketinggian mdpl).
  - [x] Koreksi paralaks horizontal bulan dan refraksi atmosfer ufuk.
- [x] **Unit Tests**:
  - [x] Verifikasi posisi matahari dan bulan terhadap tabel almanak standar IAU (8 unit tests lulus).

---

### Fase 3: `mts-hijri` & True Celestial Clock (TCC)

_Tujuan: Membangun poros waktu sejati dan generator kalender Hijriah deterministik._

- [x] **Modul `tcc.rs`**:
  - [x] State vector $\mathbf{\Psi}_{\text{TCC}}$: Elongasi kontinu $\Delta\lambda = \lambda_{moon} - \lambda_{sun} \pmod{360^\circ}$.
  - [x] Klasifikasi fase bulan otomatis (New Moon, Waxing Crescent, First Quarter, Gibbous, Full Moon, dll).
- [x] **Modul `criteria/`**:
  - [x] `wujudul_hilal.rs`: Kriteria konjungsi sebelum matahari terbenam & piringan bulan di atas ufuk.
  - [x] `mabims.rs`: Kriteria visibilitas imkan rukyat MABIMS baru (Tinggi hilal $\ge 3^\circ$, Elongasi $\ge 6.4^\circ$).
  - [x] `odeh.rs`: Algoritma visibilitas hilal astronomis modern Mohamad Odeh ($V$-value).
- [x] **Modul `calendar.rs`**:
  - [x] Generator kalender 12 bulan Hijriah deterministik (Muharram s/d Dzulhijjah).
  - [x] Penentuan jumlah hari per bulan (29 atau 30 hari murni berbasis event langit).
- [x] **Modul `utc_bridge.rs`**:
  - [x] Konversi dua arah antara MTS Timestamp dan ISO-8601 UTC / POSIX Epoch.
- [x] **Unit Tests**:
  - [x] Verifikasi perhitungan kalender dan jembatan UTC (6 unit tests lulus).

---

### Fase 4: `mts-celcron` — Penjadwal Berbasis Kondisi Langit

_Tujuan: Menggantikan cron statis dengan mesin pencari akar astronomis deterministik._

- [x] **Modul `solver.rs`**:
  - [x] Algoritma pemecah akar numerik Brent-Dekker hybrid untuk mencari $t^*$ pada $\Delta\lambda(t^*) = \theta_{target}$.
- [x] **Modul `trigger.rs`**:
  - [x] Definisi tipe trigger: `Conjunction`, `Opposition`, `FirstQuarter`, `LastQuarter`, `HilalObservation`.
- [x] **Modul `scheduler.rs`**:
  - [x] Antrean prioritas penjadwalan dan pemancar event broadcast asinkron.
- [x] **Unit Tests**:
  - [x] Simulasi pencarian waktu ijtimak berturut-turut dengan toleransi deviasi sub-detik (2 unit tests lulus).

---

### Fase 5: `mts-daemon` — Standalone Microservice & CLI

_Tujuan: Menjalankan sistem waktu sebagai daemon mandiri di background dan alat CLI._

- [x] **Infrastruktur CLI (`mts`)**:
  - [x] `mts now`: Menampilkan telemetri TCC, elongasi, fase bulan, kalender Hijriah, dan status dial roda gigi Antikythera.
  - [x] `mts conjunction`: Menghitung waktu eksak ijtimak berikutnya hingga detik/milidetik.
  - [x] `mts gears`: Menginspeksi posisi fisik roda gigi Metonik, Callippic, Saros, dan Exeligmos.
  - [x] `mts hilal --lat <LAT> --lon <LON>`: Evaluasi keterlihatan hilal menurut MABIMS & Wujudul Hilal.
- [x] **HTTP REST Daemon Server (Axum)**:
  - [x] `GET /api/v1/time/now` — Snapshot status waktu TCC, roda gigi Antikythera, dan kalender saat ini.
  - [x] `GET /api/v1/time/conjunction/next` — Prediksi ijtimak terdekat.
  - [x] `GET /api/v1/hijri/today` — Status penanggalan Hijriah hari ini.
- [x] **Kompilasi Binary Release**:
  - [x] `target/release/mts.exe` terkompilasi optimal di root repository.

---

### Fase 6: `mts-wasm` — Kompilasi ke Browser & Client

_Tujuan: Memungkinkan kalkulasi waktu Antikythera berjalan offline di frontend web._

- [ ] Konfigurasi `wasm-pack` dan `wasm-bindgen`.
- [ ] Ekspor fungsi-fungsi esensial `mts-core` dan `mts-ephemeris` ke JavaScript/TypeScript bindings.

---

### Fase 7: Validasi Golden Dataset & Uji Ketahanan Lintas Abad

_Tujuan: Membuktikan bahwa sistem waktu ini tidak akan mengalami crash atau drift selama ribuan tahun._

- [x] Uji data referensi emas NASA JPL Horizons & Fred Espenak (Gerhana tahun 632 M, J2000, 2017, 2024, 2027) 100% MATCH.
- [x] Uji simulasi 5.000 tahun virtual (-3000 SM s/d +3000 M) memastikan nol integer overflow dan akumulasi drift 0.000000000 ms (Zero-Drift Mutlak).
- [x] Benchmark throughput kecepatan hitung efemeris: ~2.900.000 evaluasi per detik.
- [x] Subcommand `mts benchmark` terintegrasi langsung di dalam binary daemon.

---

## 🧩 TODO: Pemisahan Package UI

Rencana arsitektur, alasan pembagian package, aturan dependensi, dan checklist rinci tersedia di [PACKAGE-PLAN.md](./PACKAGE-PLAN.md).

- [x] Audit kandidat ekstraksi dan tetapkan API publik tahap pertama.
- [x] Buat `packages/ui` dengan tokens dan tema MUI internal; pisahkan adapter Next.js serta settings aplikasi.
- [x] Migrasikan tema, `TextField`, `Avatar`, dan `Chip`; pindahkan import pemakai ke package UI.
- [ ] Selesaikan validasi produksi dan pemeriksaan visual, aksesibilitas, serta SSR/hydration. Typecheck package dan aplikasi lulus; build Next.js berhasil compile tetapi worker typecheck kehabisan memori.
- [x] Dokumentasikan pola pemakaian dan evaluasi package tambahan berdasarkan kebutuhan konsumen nyata.

---

## 🌐 TODO: Lokalisasi UI Web

Sistem locale, dictionary bertipe, fallback Inggris, dan CI gate sudah terpasang. Rute `/id`, label navigasi, dashboard langit, autentikasi utama, seluruh contoh auth V1/V2, serta pendaftaran bertahap kini memakai translation. Sisa migrasi luas: route inventory berisi lebih dari 60 page entry dan sekitar 150 view modules; checklist per domain di bawah harus ditutup sebelum goal selesai.

- [x] Daftarkan `id` sebagai locale LTR dan muat dictionary Bahasa Indonesia.
- [x] Tampilkan Bahasa Indonesia di pemilih bahasa dan izinkan route `/id`.
- [x] Terjemahkan seluruh label menu yang ada dan samakan key dengan dictionary Inggris.
- [x] Tetapkan namespace dictionary per area produk (`navigation`, `auth`, `celestial`) dengan fallback Inggris.
- [x] Terjemahkan label utama pada dashboard langit (jam, kosmologi, mekanika Antikythera, kitab, hilal, dan observatorium).
- [x] Terjemahkan alur login, daftar, dan lupa kata sandi pada rute utama, termasuk validasi form.
- [x] Terjemahkan reset kata sandi, verifikasi email, dan OTP pada halaman contoh V1/V2.
- [x] Terjemahkan login/reset/verifikasi/OTP/daftar contoh V1/V2 dan pendaftaran bertahap, termasuk opsi paket, label aksesibilitas, serta metadata route auth.
- [x] Terjemahkan pengaturan akun secara lengkap: tab, profil, keamanan, billing, alamat, metode pembayaran, tabel invoice, notifikasi, koneksi, penghapusan akun, beserta dialog konfirmasi, kartu pembayaran, dan upgrade paket.
- [x] Terjemahkan antarmuka profil pengguna dan seluruh label, judul, deskripsi, teknologi, serta chip data contoh profil melalui key `common`.
- [x] Terjemahkan header/menu/footer front-page dan sediakan dictionary locale di layout front-page.
- [x] Terjemahkan landing utama: hero, fitur, ulasan, tim, harga, statistik, FAQ, CTA, dan kontak ke dictionary EN/ID.
- [x] Terjemahkan konten dan tabel harga, FAQ harga, paket generik, metode pembayaran, detail tagihan, serta checkout wizard (keranjang, alamat, pengiriman, pembayaran, konfirmasi) ke dictionary EN/ID.
- [ ] Migrasi i18n global belum selesai; audit awal sebelum migrasi help center dan Workloads/RADIUS mencatat kira-kira 2.470 literal lama. Angka terkini perlu dihitung ulang setelah cakupan gate diperluas, dan goal belum boleh ditutup sebelum seluruh UI aktif bersih.
- [x] Terjemahkan seluruh copy help center front-page: header pencarian, kartu artikel, knowledge base, konten artikel, gambar, dan CTA ke dictionary EN/ID.
- [ ] Metadata dasar locale dan front-page sudah memakai brand Moonwitness; metadata ERP, RADIUS, dan Workloads mengikuti locale. Audit SEO route lain masih perlu dilakukan.
- [x] Terjemahkan shell dashboard bersama: profil, mode terang/gelap/sistem, notifikasi, shortcuts, footer, scroll-to-top, termasuk data contoh shortcut/notifikasi, ke namespace `common`.
- [ ] Migrasikan aksi umum, status, validasi form, tabel, dialog, aplikasi ERP/e-commerce/academy/invoice/email/calendar/chat/kanban/logistics, dan konten dashboard ke namespace dictionary terkelompok.
  - [x] Aplikasi Invoice: kartu tambah/edit, daftar/status, kartu dan aksi pratinjau, drawer pelanggan/pembayaran/pengiriman, serta data demo memakai kamus EN/ID.
  - [x] Customizer tema global: pilihan warna, mode, skin, tata letak, lebar konten, dan arah baca memakai kamus EN/ID.
  - [x] Dashboard Antikythera: tab, simulasi roda gigi, zodiak, kontrol waktu, telemetri siklus, dan prediksi gerhana memakai kamus EN/ID.
  - [x] Form tambah produk e-commerce: stok/pengiriman, pengelompokan, informasi/deskripsi, harga, varian, gambar, dan aksi publikasi memakai kamus EN/ID.
  - [x] Aplikasi ERP: ringkasan, tab langganan/pesanan/CRM/faktur/outbox, status, aksi, dan dialog pembuatan order ke kamus EN/ID.
  - [x] Aplikasi Workloads: header, metrik, status, aksi kartu, dialog spawn/deploy, placeholder, dan log ke kamus EN/ID.
  - [x] Aplikasi RADIUS: ringkasan, sesi, pelanggan, profil, NAS, simulator autentikasi, dan generator voucher ke kamus EN/ID.
  - [x] Aplikasi Invoice: kartu tambah/edit, daftar/status, kartu dan aksi pratinjau, drawer pelanggan/pembayaran/pengiriman, serta data demo memakai kamus EN/ID.
- [x] Tambahkan lint gate `lint:i18n`: file TSX/JSX yang berubah gagal bila memuat teks UI literal atau pesan alert/toast; teks teknis konfigurasi dikecualikan, dan key/placeholder dictionary Inggris wajib cocok dengan Indonesia.
- [x] Jalankan gate pada pull request yang mengubah web melalui workflow khusus.
- [x] Tambahkan pemeriksaan fixture profil: setiap judul, deskripsi, label, role, dan chip yang dirender wajib merujuk key di kamus `common`.
- [x] Perluas gate ke komponen landing/pricing/checkout yang disentuh dan fixture pricing: semua copy array/object harus berupa key dictionary yang ada.
- [x] Terapkan gate fail-closed pada semua file TSX/JSX yang berubah, termasuk JSX, prop UI, alert/toast, validasi, serta metadata halaman.
- [ ] Perluas pemeriksaan serupa ke sumber data objek/array lain; putuskan secara eksplisit penanganan kutipan dan konten eksternal.
- [ ] Selesaikan inventaris semua route aktif, komponen bersama, halaman depan, chart, form, wizard, tabel, dialog, dan widget; tandai per domain hanya setelah seluruh copy serta metadata pada route terkait memakai dictionary.
- [ ] Format tanggal, angka, dan nilai lokal berdasarkan locale tanpa mengubah format API.
- [ ] Uji perpindahan bahasa, direct URL `/id`, tampilan teks panjang, dan fallback untuk locale tidak valid.

#### Urutan migrasi sisa

1. Shell bersama: header, footer, breadcrumbs, notifikasi, status, aksi umum, accessibility labels.
2. Alur aktif dan operasional: forms/wizards, tabel, dialog bersama, apps, lalu dashboards selain celestial. Account settings (termasuk billing) dan profil pengguna (termasuk data contoh fake DB) sudah selesai.
3. Halaman contoh/template: charts, widgets, pricing, FAQ, profil, dan halaman misc.
4. Tutup format lokal, verifikasi tiap rute locale, serta lengkapi audit gate agar mencakup sumber teks objek/array dan non-TSX yang dirender.

`lint:i18n` bersifat wajib di CI untuk TSX/JSX yang berubah: literal UI membuat job gagal, termasuk teks JSX, label, placeholder, teks alternatif gambar, dan aria-label. Gunakan `pnpm run lint:i18n -- --all` untuk audit seluruh TSX/JSX tanpa mengandalkan daftar perubahan Git. Snapshot audit global terakhir menemukan 2.653 temuan pada 307 berkas; hasil perlu terus dibersihkan. Pemeriksaan fixture profil dan pricing memvalidasi konten yang dirender memakai key translation. Komponen baru wajib memakai dictionary.

---

### Fase 8: `cosmic` — Waktu Semesta (Cosmic Time Engine) & Asas Korelasi 4 Kitab Wahyu

_Tujuan: Mengharmonisasikan waktu kosmologis relativistik modern (FLRW Metric & Planck 2018) dengan dalil-dalil waktu dalam 4 Kitab Wahyu (Al-Qur'an, Injil, Taurat, Zabur)._

- [x] **Fondasi Kosmologi Relativistik Modern (FLRW Metric)**:
  - [x] Parameter standar Planck Collaboration 2018: $H_0 = 67.36\text{ km/s/Mpc}$, $\Omega_m = 0.3153$, $\Omega_\Lambda = 0.6847$, $\Omega_r = 9.2 \times 10^{-5}$, $T_{\text{CMB}} = 2.7255\text{ K}$, $t_0 = 13.787\text{ Gyr}$.
  - [x] Solusi integral komputasi numerik composite Simpson untuk $t(a)$ dan Newton-Raphson untuk $a(t)$ dan $z(t)$.
  - [x] Validasi era rekombinasi atom & fajar cahaya pertama ($z \approx 1100, t \approx 365.000\text{ tahun}$).
- [x] **Asas Korelasi 4 Kitab Wahyu**:
  - [x] **Kitab Taurat (Bereshit / Kejadian & Leviticus)**:
    - 6 Eon Penciptaan (_Yom_ Bereshit 1:1 - 2:3); Matahari dan Bulan ditetapkan pada Yom ke-4 (Kejadian 1:14).
    - Rasio usia Bumi (4.543 Gyr) terhadap Alam Semesta (13.787 Gyr) = 32.95% ($\approx 2/6 = 33.33\%$).
    - Siklus Sabat (7 tahun) dan Yobel (50 tahun) sebagai resonansi harmonik waktu.
    - "Yehi Or" (Kejadian 1:3: Jadilah Terang!) selaras dengan pelepasan radiasi latar foton CMB ($z \approx 1100$).
  - [x] **Kitab Zabur (Tehillim / Mazmur Daud)**:
    - Mazmur 90:4: 1.000 tahun bumi = 1 hari ilahiah ($1 : 365.242,2$).
    - Giliran Jaga Malam kuno (_Ashmurah_ ~3.5 jam) merefleksikan kompresi waktu ilahiah hingga $1 : 2.500.000$.
    - Mazmur 104:2: Membentangkan langit seperti tirai/tenda, selaras dengan metrik dinamis ekspansi ruang $a(t)$.
    - Mazmur 19:1-6 & 8:3-4: Presisi mekanika lintasan benda langit.
  - [x] **Kitab Injil (Perjanjian Baru / Gospels & Epistles)**:
    - 2 Petrus 3:8: 1 hari sama seperti 1.000 tahun DAN 1.000 tahun sama seperti 1 hari. Menegaskan prinsip simetri relativistik timbal balik (_frame invariance_).
    - Ibrani 1:10-12 & Matius 24:35: Langit menjadi usang seperti pakaian, selaras dengan Hukum II Termodinamika ($dS/dt \ge 0$) dan penuaan entropi semesta.
    - Wahyu 1:8, 21:6, 22:13: Batas batas kosmologis Alfa & Omega ($t=0$ dan $t_{\text{final}}$).
  - [x] **Kitab Suci Al-Qur'an**:
    - 6 Masa Penciptaan (_Sittati Ayyam_ / QS 7:54, 10:3, 50:38).
    - Partisi QS Fussilat 41:9-12: Pembentukan Bumi 2 masa dari total 6 masa (rasio 2/6 = 33.3% = 4.54 Gyr!).
    - Dilatasi Ilahiah 1.000 tahun (QS Al-Hajj 22:47).
    - Derivasi kecepatan cahaya $c = 299.792,5\text{ km/s}$ dari 12.000 orbit bulan sideris dengan koreksi heliosentris $\alpha \approx 26.92848^\circ$ (QS As-Sajdah 32:5 & 22:47, deviasi $< 0.0001\%$).
    - Dilatasi relativistik malaikat 50.000 tahun (QS Al-Ma'arij 70:4): faktor Lorentz $\gamma \approx 1.826 \times 10^7$ dan kecepatan $v = 0.9999999999999985 \, c$.
    - Ekspansi alam semesta $\dot{a} > 0$ (QS Adz-Dzariyat 51:47: _Lamusi'un_).
    - Singularitas awal Big Bang (QS Al-Anbiya 21:30: _Ratqan fafataqnahuma_).
    - Rekolaps geometri semesta (QS Al-Anbiya 21:104: Menggulung langit seperti lembaran buku).
- [x] **Dilatasi Kinematik Bumi terhadap Frame Kosmis (CMB Rest Frame)**:
  - Kecepatan bumi terhadap CMB dipole: $v_{\text{pec}} = 369.82\text{ km/s}$.
  - Rasio dilatasi waktu kinematik: $\approx 1 - 7.604 \times 10^{-7}$ (~24 detik/tahun).
  - Akumulasi lag jam bumi selama usia planet: $\approx 3.456\text{ tahun}$.
- [x] **CLI & REST API Integration**:
  - `mts cosmic`: Menampilkan telemetri waktu semesta dan asas korelasi 4 kitab.
  - `mts cosmic --date <ISO/YEAR>`: Evaluasi waktu semesta pada era sejarah manapun (Adam, Ibrahim, Musa, Daud, Isa, Muhammad SAW, J2000, 2026).
  - `mts cosmic --scriptures`: Menampilkan teks firman & dalil lengkap 4 Kitab Wahyu.
  - `mts benchmark`: Menyertakan Bagian 4 validasi kosmologi & 4 Kitab Wahyu.
  - REST API `GET /api/v1/cosmic` dan `GET /api/v1/cosmic/revelations`.
- [x] **Suite Pengujian Terpadu**:
  - `crates/mts-daemon/tests/cosmic_revelations_test.rs`: 4 integrasi test mendalam.
  - Total 43 unit & integration test pada workspace: **100% LULUS (Semua Hijau)**.

---

### Fase 9: `services/runner` — Universe Runner & Coolify Engine (Go)

_Tujuan: Menyediakan layanan orchestrator mandiri berbasis Go untuk mengelola Docker containers riil, deployment ala Coolify (Image, Git, Dockerfile, Compose), serta supervisi proses lokal._

- [x] **Inisialisasi Module & HTTP Server**:
  - [x] Setup Go module `services/runner` dengan port standar `:5160`.
  - [x] Middleware CORS dan error handling terstruktur.
- [x] **Engine Docker Riil (`docker.go`)**:
  - [x] Deteksi otomatis Docker engine lokal (`docker version`).
  - [x] Query container aktif dan terhenti secara riil (`docker ps -a --format "{{json .}}"`).
  - [x] Kontrol container: `start`, `stop`, `restart`, `remove` (`docker rm -f`).
  - [x] Streaming log riil container (`docker logs --tail 100`).
- [x] **4 Mode Deployment Ala Coolify**:
  - [x] **Mode 1 (Docker Hub Image)**: `docker run -d --name <name> -p <port> <image>`.
  - [x] **Mode 2 (GitHub Repository)**: `git clone --depth 1` + auto-detect Dockerfile/Compose + build & run.
  - [x] **Mode 3 (Raw Dockerfile)**: Dynamic build workspace + `docker build` + run.
  - [x] **Mode 4 (Docker Compose)**: Multi-container orchestration via `docker compose up -d --build`.
- [x] **Local Process Supervisor (`process.go`)**:
  - [x] Pemindaian proses lokal sistem operasi (PID, ProcessName, WorkingSet RSS RAM).
  - [x] Integrasi proses inti monorepo: `mts.exe` (PID 1828), `gateway`, `analytics`, `node.exe`.
  - [x] Kontrol terminasi proses (`taskkill /PID <pid> /F`).
- [x] **Integrasi Monorepo & Vuexy Dashboard**:
  - [x] Reverse proxy di Go Gateway (`services/gateway/main.go` -> `:5160/api/v1/runner/*`).
  - [x] Next.js API Routes: `/api/apps/workloads` & `/api/apps/workloads/logs`.
  - [x] Vuexy Modal Deploy dengan 4 Tab: _Docker Hub Image_, _GitHub Repository_, _Raw Dockerfile_, _Docker Compose_.
  - [x] Live log viewer dialog dengan pewarnaan ANSI dan tombol copy.
  - [x] Target otomasi `justfile`: `serve-runner`, `dev`, dan `dev-single`.

---

### Fase 10: `services/radius` — ToughRADIUS Broadband AAA Engine (Go)

_Tujuan: Membangun server RADIUS AAA (Authentication, Authorization, Accounting) murni Go berbasis arsitektur ToughRADIUS untuk ISP, PPPoE MikroTik, Hotspot, dan manajemen voucher broadband._

- [x] **Inisialisasi Module & Port Standar**:
  - [x] Setup Go module `services/radius` (Go 1.23).
  - [x] Port UDP RFC 2865 (Authentication): `:1812`.
  - [x] Port UDP RFC 2866 (Accounting): `:1813`.
  - [x] Port UDP RFC 3576 (CoA / PoD Disconnect): `:3799`.
  - [x] REST API & Manajemen HTTP: `:5170`.
- [x] **Enkoder/Dekoder Paket RADIUS Murni Go (`packet.go`)**:
  - [x] Parser biner RFC 2865 / 2866 / 3576 (Header 20 byte: Code, Identifier, Length, Authenticator).
  - [x] Dekripsi PAP User-Password berbasis MD5 hash XOR (`MD5(SharedSecret + RequestAuthenticator)`).
  - [x] Encoding Atribut Standar: `User-Name`, `NAS-IP-Address`, `NAS-Port`, `Framed-IP-Address`, `Session-Timeout`.
  - [x] Encoding Vendor-Specific Attribute (VSA 26): **MikroTik Vendor ID 14988**, Type 8 (`MikroTik-Rate-Limit`) dengan format `{rx}k/{tx}k` atau `{rx}M/{tx}M`.
  - [x] Perhitungan Response Authenticator (`MD5(Code + ID + Length + RequestAuth + Attributes + Secret)`).
- [x] **Data Store & Manajemen Entitas Ala ToughRADIUS (`models.go`)**:
  - [x] Network Access Server (`Nas`): IP, Shared Secret, CoA/PoD Port.
  - [x] Profil Kecepatan (`RateProfile`): Download/Upload Rate (Mbps), Quota (MB), Validitas Waktu, MikroTik Rate Limit string.
  - [x] Pelanggan & Voucher (`Subscriber`): Username, Password, Profile, Status (`ACTIVE`, `DISABLED`, `EXPIRED`), Kuota terpakai, Sisa waktu.
  - [x] Sesi Online (`OnlineSession`): Acct-Session-Id, IP Klien, MAC Address, NAS IP, Waktu Mulai, Total Upload/Download MB.
  - [x] Generator Batch Voucher Otomatis (Prefix kustom, pembuatan acak berbasis cryptographically strong string).
- [x] **Server Core & Listener UDP (`server.go`)**:
  - [x] `StartAuthServer`: Menangani `Access-Request`, validasi shared secret per-NAS, verifikasi akun & password, injeksi rate-limit MikroTik, return `Access-Accept` atau `Access-Reject`.
  - [x] `StartAcctServer`: Menangani `Accounting-Request` (Status-Type `Start`, `Stop`, `Interim-Update`), tracking kuota real-time, return `Accounting-Response`.
  - [x] `SendDisconnectRequest`: Mengirim paket UDP RFC 3576 `Disconnect-Request` ke port CoA MikroTik (:3799) untuk kick/putus koneksi user secara langsung.
- [x] **REST Management API (`main.go`)**:
  - [x] Endpoint overview & throughput statistics (`/api/v1/radius/overview`).
  - [x] Endpoint sesi aktif & disconnect kick (`/api/v1/radius/sessions`, `/api/v1/radius/sessions/disconnect`).
  - [x] Endpoint pelanggan & batch voucher (`/api/v1/radius/subscribers`, `/api/v1/radius/vouchers/generate`).
  - [x] Endpoint manajemen profil kecepatan (`/api/v1/radius/profiles`).
  - [x] Endpoint manajemen router NAS (`/api/v1/radius/nas`).
  - [x] Endpoint simulator autentikasi langsung (`/api/v1/radius/test-auth`).
- [x] **Integrasi Gateway & Web UI Next.js Vuexy**:
  - [x] Reverse-proxy Gateway: `/api/v1/radius/*` -> `:5170`.
  - [x] Halaman dashboard lengkap: `/apps/radius` dengan 5 Tab: _Active Sessions_, _Subscribers & Vouchers_, _Rate Profiles (MikroTik)_, _NAS Routers & CoA_, dan _Live Auth Simulator_.
  - [x] Modal Batch Voucher Generator dengan kustomisasi prefix dan profil.
  - [x] Generator skrip terminal RouterOS MikroTik untuk registrasi RADIUS server 1-klik.
  - [x] Target `justfile`: `serve-radius`, `dev`, dan `dev-single` telah tersinkronisasi 6 service.
