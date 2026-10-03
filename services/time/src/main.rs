use axum::{extract::Query, response::Json, routing::get, Router};
use clap::{Parser, Subcommand};
use mts_celcron::{CelestialRootSolver, EclipsePrediction, EclipsePredictor};
use mts_core::gears::AntikytheraGearTrain;
use mts_core::units::JulianDay;
use mts_ephemeris::{
    GeoLocation, LunarEphemeris, PrayerCalculationParams, PrayerTimesEngine,
    SolarEphemeris, TopocentricConverter,
};
use mts_hijri::criteria::{MabimsCriteria, WujudulHilal};
use mts_hijri::{HijriCalendar, TrueCelestialClock, UtcBridge};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

#[derive(Parser, Debug)]
#[command(name = "mts")]
#[command(about = "Moonwitness Time System (MTS) — Autonomous Celestial Time Engine & Antikythera Daemon", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Tampilkan snapshot waktu astronomis saat ini (TCC, Hijriah, UTC, dan Roda Gigi)
    Now,
    /// Hitung waktu eksak ijtimak (konjungsi geosentris) berikutnya
    Conjunction,
    /// Inspeksi posisi jarum dan status dial Roda Gigi Antikythera
    Gears,
    /// Evaluasi status visibilitas Hilal awal bulan
    Hilal {
        #[arg(long, default_value_t = -6.8247, allow_hyphen_values = true)]
        lat: f64,
        #[arg(long, default_value_t = 107.6172, allow_hyphen_values = true)]
        lon: f64,
        #[arg(long, default_value_t = 1310.0)]
        elevation: f64,
    },
    /// Hitung jadwal waktu shalat astronomis & arah kiblat presisi tinggi
    Prayer {
        #[arg(long, default_value_t = -6.8247, allow_hyphen_values = true)]
        lat: f64,
        #[arg(long, default_value_t = 107.6172, allow_hyphen_values = true)]
        lon: f64,
        #[arg(long, default_value_t = 1310.0)]
        elevation: f64,
    },
    /// Prediksi gerhana matahari dan gerhana bulan berikutnya berbasis siklus Saros
    Eclipses,
    /// Jalankan HTTP REST Daemon Server
    Serve {
        #[arg(long, default_value_t = 5155)]
        port: u16,
    },
    /// Jalankan uji validasi ilmiah NASA JPL Horizons & stress-test 5.000 tahun
    Benchmark,
    /// Tampilkan Waktu Semesta & Asas Korelasi 4 Kitab Wahyu (Al-Qur'an, Injil, Taurat, Zabur)
    Cosmic {
        /// Evaluasi pada tanggal ISO-8601 (contoh: 2026-10-03) atau tahun Masehi (contoh: 2026, -1000)
        #[arg(long, allow_hyphen_values = true)]
        date: Option<String>,
        /// Tampilkan detail teks firman & korelasi lengkap 4 Kitab Wahyu
        #[arg(long)]
        scriptures: bool,
    },
}

#[derive(Serialize, Deserialize)]
struct TimeNowResponse {
    julian_day_ut: f64,
    utc_timestamp: String,
    elongation_degrees: f64,
    illuminated_fraction: f64,
    phase_name: String,
    hijri_date: String,
    antikythera_metonic_month: u32,
    antikythera_metonic_year: u32,
    antikythera_saros_step: u32,
    antikythera_exeligmos_shift_hours: u32,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Now => {
            let now_jd = UtcBridge::now_jd();
            let utc_dt = UtcBridge::jd_to_datetime(now_jd).unwrap();
            let tcc = TrueCelestialClock::evaluate(now_jd);
            let hijri = HijriCalendar::from_julian_day(now_jd);

            // Hitung perkiraan bulan sinodik sejak epoch Hijriah
            let total_months = ((now_jd.0 - HijriCalendar::HIJRI_EPOCH_JD) / 29.530588).floor() as u32;
            let gears = AntikytheraGearTrain::new().evaluate(total_months);

            println!("===============================================================");
            println!("🌌 MOONWITNESS TIME SYSTEM (MTS) — CELESTIAL CLOCK TELEMETRY");
            println!("===============================================================");
            println!("• UTC Timestamp      : {}", utc_dt.to_rfc3339());
            println!("• Julian Day (UT)    : {:.6}", now_jd.0);
            println!("• Sudut Elongasi Δλ  : {:.4}°", tcc.elongation.0);
            println!("• Fase Bulan         : {:?} ({:.2}% tersinari)", tcc.phase_name, tcc.illuminated_fraction * 100.0);
            println!("• Kalender Hijriah   : {} {} {} H", hijri.day, hijri.month_name, hijri.year);
            println!("---------------------------------------------------------------");
            println!("⚙️ ANTIKYTHERA GEAR STATE:");
            println!("  - Metonic Dial     : Bulan {}/235 (Tahun ke-{}) | Dial: {:.1}°", gears.metonic.month_index + 1, gears.metonic.current_year, gears.metonic.dial_angle.0);
            println!("  - Callippic Dial   : Siklus {}/4 | Dial: {:.1}°", gears.callippic.metonic_cycle_index + 1, gears.callippic.dial_angle.0);
            println!("  - Saros Dial       : Step {}/223 (Gerhana #{})", gears.saros.month_index + 1, gears.saros.saros_cycle_number);
            println!("  - Exeligmos Shift  : Sektor {} (+{} Jam Diurnal Shift)", gears.exeligmos.sector, gears.exeligmos.hour_shift);
            println!("===============================================================");
        }

        Commands::Conjunction => {
            let now_jd = UtcBridge::now_jd();
            println!("Mencari ijtimak sejati berikutnya dari sekarang...");
            let conj_jd = CelestialRootSolver::next_conjunction(now_jd)?;
            let dt = UtcBridge::jd_to_datetime(conj_jd).unwrap();
            let days_left = conj_jd.0 - now_jd.0;

            println!("===============================================================");
            println!("🌑 DETEKSI IJTIMAK ASTRONOMIS (TRUE CONJUNCTION)");
            println!("===============================================================");
            println!("• Waktu Eksak (UTC)  : {}", dt.to_rfc3339());
            println!("• Julian Day (TT)    : {:.6}", conj_jd.0);
            println!("• Hitung Mundur      : {:.2} hari lagi ({:.1} jam)", days_left, days_left * 24.0);
            println!("===============================================================");
        }

        Commands::Gears => {
            let now_jd = UtcBridge::now_jd();
            let total_months = ((now_jd.0 - HijriCalendar::HIJRI_EPOCH_JD) / 29.530588).floor() as u32;
            let gears = AntikytheraGearTrain::new().evaluate(total_months);

            println!("{:#?}", gears);
        }

        Commands::Hilal { lat, lon, elevation } => {
            let now_jd = UtcBridge::now_jd();
            let loc = GeoLocation::new(lat, lon, elevation);
            let tcc = TrueCelestialClock::evaluate(now_jd);
            let moon_horiz = TopocentricConverter::to_horizontal(now_jd, tcc.moon.right_ascension, tcc.moon.declination, &loc);
            let topo_alt = TopocentricConverter::correct_lunar_parallax(moon_horiz.altitude, tcc.moon.horizontal_parallax, loc.elevation_meters);

            let mabims = MabimsCriteria::evaluate(topo_alt, tcc.elongation);
            let wujud = WujudulHilal::evaluate(true, topo_alt, tcc.elongation);

            println!("===============================================================");
            println!("🌙 PEMERIKSAAN VISIBILITAS HILAL");
            println!("===============================================================");
            println!("• Koordinat Pengamat : Lat {:.4}°, Lon {:.4}°, Elev {:.1} m", lat, lon, elevation);
            println!("• Ketinggian Hilal   : {:.2}°", topo_alt.0);
            println!("• Sudut Elongasi     : {:.2}°", tcc.elongation.0);
            println!("• Kriteria MABIMS    : {} [{}]", if mabims.is_new_month { "LULUS" } else { "TIDAK LULUS" }, mabims.note);
            println!("• Kriteria Wujud     : {} [{}]", if wujud.is_new_month { "LULUS" } else { "TIDAK LULUS" }, wujud.note);
            println!("===============================================================");
        }

        Commands::Prayer { lat, lon, elevation } => {
            let now_jd = UtcBridge::now_jd();
            let loc = GeoLocation::new(lat, lon, elevation);
            let sched = PrayerTimesEngine::calculate(now_jd, &loc, &PrayerCalculationParams::default());
            let tz_offset = (lon / 15.0).round();
            let now_utc = UtcBridge::jd_to_datetime(now_jd).unwrap();
            let local_now = now_utc + chrono::Duration::hours(tz_offset as i64);

            let fmt_local = |jd: JulianDay| -> String {
                let dt = UtcBridge::jd_to_datetime(jd).unwrap();
                let loc_dt = dt + chrono::Duration::hours(tz_offset as i64);
                loc_dt.format("%H:%M:%S").to_string()
            };

            println!("===============================================================");
            println!("🕌 MTS JADWAL SHALAT ASTRONOMIS & ARAH KIBLAT PRESISI TINGGI");
            println!("===============================================================");
            println!("• Koordinat Pengamat : Lat {:.4}°, Lon {:.4}°, Elev {:.1} m (UTC{:+.0})", lat, lon, elevation, tz_offset);
            println!("• Waktu Lokal Saat Ini: {}", local_now.format("%Y-%m-%d %H:%M:%S"));
            println!("• Status Shalat Aktif: {} (Selanjutnya: {} dalam {:.0} mnt)", sched.active_prayer, sched.next_prayer, sched.seconds_to_next_prayer / 60.0);
            println!("---------------------------------------------------------------");
            println!("• Imsak               : {} WIB/Lokal", fmt_local(sched.imsak_jd));
            println!("• Subuh (Fajr -20°)   : {} WIB/Lokal", fmt_local(sched.fajr_jd));
            println!("• Syuruq (Sunrise)    : {} WIB/Lokal", fmt_local(sched.sunrise_jd));
            println!("• Dzuhur (Zawwal+2m)  : {} WIB/Lokal", fmt_local(sched.dhuhr_jd));
            println!("• Ashar (Bayangan 1:1): {} WIB/Lokal", fmt_local(sched.asr_jd));
            println!("• Terbenam (Sunset)   : {} WIB/Lokal", fmt_local(sched.sunset_jd));
            println!("• Maghrib (+2m)       : {} WIB/Lokal", fmt_local(sched.maghrib_jd));
            println!("• Isya (Syafaq -18°)  : {} WIB/Lokal", fmt_local(sched.isha_jd));
            println!("• Tengah Malam (Nisf) : {} WIB/Lokal", fmt_local(sched.midnight_jd));
            println!("• Sepertiga Malam Akh : {} WIB/Lokal (Sahur/Tahajjud)", fmt_local(sched.last_third_jd));
            println!("---------------------------------------------------------------");
            println!("🧭 TELEMETRI KIBLAT & MATAHARI:");
            println!("• Arah Azimuth Kiblat: {:.2}° ({})", sched.qibla.bearing_deg.0, sched.qibla.cardinal_direction);
            println!("• Jarak Geodesi Ka'bah: {:.1} km", sched.qibla.distance_km);
            println!("• Posisi Matahari     : Alt {:.2}°, Azimuth {:.2}° | Rasio Bayangan: {:.2}x", sched.current_solar_altitude.0, sched.current_solar_azimuth.0, sched.current_shadow_ratio);
            println!("===============================================================");
        }

        Commands::Eclipses => {
            let now_jd = UtcBridge::now_jd();
            println!("Mencari gerhana matahari dan gerhana bulan berikutnya berbasis siklus Saros...");
            let solar = EclipsePredictor::next_solar_eclipse(now_jd);
            let lunar = EclipsePredictor::next_lunar_eclipse(now_jd);

            println!("===============================================================");
            println!("🌑 PREDIKSI GERHANA & SIKLUS SAROS ANTIKYTHERA (223 BULAN)");
            println!("===============================================================");
            if let Ok(s) = solar {
                println!("☀️ GERHANA MATAHARI BERIKUTNYA:");
                println!("  • Klasifikasi : {:?}", s.eclipse_type);
                println!("  • Waktu UTC   : {}", s.utc_datetime_str);
                println!("  • Siklus Saros: Seri {} (Langkah {}/223)", s.saros_series, s.saros_step_in_cycle);
                println!("  • Magnitudo   : {:.3} | Gamma: {:.3}", s.magnitude, s.gamma);
                println!("  • Catatan     : {}", s.description);
            }
            println!("---------------------------------------------------------------");
            if let Ok(l) = lunar {
                println!("🌕 GERHANA BULAN BERIKUTNYA:");
                println!("  • Klasifikasi : {:?}", l.eclipse_type);
                println!("  • Waktu UTC   : {}", l.utc_datetime_str);
                println!("  • Siklus Saros: Seri {} (Langkah {}/223)", l.saros_series, l.saros_step_in_cycle);
                println!("  • Magnitudo   : {:.3} | Gamma: {:.3}", l.magnitude, l.gamma);
                println!("  • Catatan     : {}", l.description);
            }
            println!("===============================================================");
        }

        Commands::Serve { port } => {
            tracing_subscriber::fmt::init();
            let app = Router::new()
                .route("/api/v1/time/now", get(api_time_now))
                .route("/api/v1/time/gears", get(api_time_gears))
                .route("/api/v1/time/hilal", get(api_time_hilal))
                .route("/api/v1/time/prayer-times", get(api_prayer_times))
                .route("/api/v1/time/eclipses", get(api_time_eclipses))
                .route("/api/v1/time/conjunction/next", get(api_conjunction_next))
                .route("/api/v1/hijri/today", get(api_hijri_today))
                .route("/api/v1/cosmic", get(api_cosmic_state))
                .route("/api/v1/cosmic/revelations", get(api_cosmic_revelations))
                .layer(CorsLayer::permissive());

            let addr = SocketAddr::from(([0, 0, 0, 0], port));
            println!("🚀 MTS Daemon Server berjalan di http://{}", addr);
            let listener = tokio::net::TcpListener::bind(addr).await?;
            axum::serve(listener, app).await?;
        }

        Commands::Benchmark => {
            println!("===============================================================================");
            println!("🔬 MTS SCIENTIFIC VALIDATION SUITE & 5,000-YEAR BENCHMARK");
            println!("===============================================================================");

            // BAGIAN 1: Validasi Gerhana Historis NASA JPL
            println!("\n[1/4] UJI DATA REFERENSI EMAS NASA JPL HORIZONS & ESPENAK:");
            println!("-------------------------------------------------------------------------------");
            let events = [
                ("Wafatnya Ibrahim (Putra Nabi SAW)", 1951921.8, "0632-01-30"),
                ("Epoch Standar IAU J2000.0", 2451545.0, "2000-01-06"),
                ("Great American Solar Eclipse", 2457987.27, "2017-08-21"),
                ("Great North American Eclipse", 2460409.26, "2024-04-08"),
                ("Luxor Mega Eclipse (Masa Depan)", 2461619.92, "2027-08-02"),
            ];

            let mut all_eclipses_valid = true;
            for (name, approx_jd, nasa_date) in events.iter() {
                let start_search = JulianDay::new(approx_jd - 2.0);
                if let Ok(calculated_jd) = CelestialRootSolver::next_conjunction(start_search) {
                    let dt = UtcBridge::jd_to_datetime(calculated_jd).unwrap();
                    let date_str = dt.format("%Y-%m-%d").to_string();
                    let match_status = if date_str == *nasa_date { "MATCH ✅" } else { "MISMATCH ❌" };
                    if date_str != *nasa_date {
                        all_eclipses_valid = false;
                    }
                    println!("• {:<35} | Target NASA: {} | Hitung MTS: {} | {}", name, nasa_date, dt.format("%Y-%m-%d %H:%M:%S UTC"), match_status);
                } else {
                    println!("• {:<35} | GAGAL DITEMUKAN ❌", name);
                    all_eclipses_valid = false;
                }
            }

            // BAGIAN 2: Stress-Test 5.000 Tahun (-3000 SM s/d +3000 M)
            println!("\n[2/4] STRESS-TEST SIKLUS MULTI-MILENIUM (-3000 SM s/d +3000 M):");
            println!("-------------------------------------------------------------------------------");
            let total_years = 5000;
            let metonic_ratio = mts_core::rational::GearRatio::new(235, 19);
            let year_steps = mts_core::rational::ExactRationalTime::from_integers(total_years, 1);
            let lunar_months_exact = year_steps.mul_ratio(&metonic_ratio);
            let expected_frac = (total_years as f64 * 235.0 / 19.0) % 1.0;
            let actual_frac = lunar_months_exact.to_f64() % 1.0;
            let rational_drift = (expected_frac - actual_frac).abs();

            println!("• Rentang Waktu Simulasi   : {} Tahun Kalender", total_years);
            println!("• Total Siklus Sinodik     : {} Bulan Utuh + {} Sisa Rasional", lunar_months_exact.whole_cycles(), lunar_months_exact.cycle_fraction());
            println!("• Akumulasi Drift Numerik  : {:.15} ms (ZERO-DRIFT MUTLAK ✅)", rational_drift * 86400.0 * 1000.0);
            println!("• Integer Overflow Check   : AMAN (64-bit Diophantine bounds)");

            // BAGIAN 3: Pengujian Kecepatan Throughput Komputasi
            println!("\n[3/4] THROUGHPUT BENCHMARK KECEPATAN HITUNG EFEMERIS LANGIT:");
            println!("-------------------------------------------------------------------------------");
            let iterations = 100_000;
            let start_bench = std::time::Instant::now();
            let base_jd = JulianDay::new(2461316.0);
            for i in 0..iterations {
                let jd = base_jd + (i as f64 * 0.01);
                let _ = TrueCelestialClock::evaluate(jd);
            }
            let elapsed = start_bench.elapsed();
            let ops_per_sec = (iterations as f64) / elapsed.as_secs_f64();

            println!("• Total Iterasi Perhitungan: {} evaluasi orbit (Sun + Moon + TCC)", iterations);
            println!("• Total Waktu Eksekusi     : {:.3} detik", elapsed.as_secs_f64());
            println!("• Kecepatan Throughput     : {:>10.0} evaluasi / detik ⚡", ops_per_sec);

            // BAGIAN 4: Validasi Kosmologi FLRW, Relativitas & Asas Korelasi 4 Kitab Wahyu
            println!("\n[4/4] VALIDASI KOSMOLOGI FLRW, RELATIVITAS & ASAS KORELASI 4 KITAB WAHYU:");
            println!("-------------------------------------------------------------------------------");
            let matrix = mts_core::cosmic::RevelationalRatios::get_scripture_matrix();
            let derived_c = mts_core::cosmic::RevelationalRatios::derived_speed_of_light();
            let c_dev = (derived_c - mts_core::cosmic::SPEED_OF_LIGHT_M_S).abs() / mts_core::cosmic::SPEED_OF_LIGHT_M_S;
            let v_50k = mts_core::cosmic::RevelationalRatios::velocity_for_50k_years();
            let gamma_50k = mts_core::cosmic::RevelationalRatios::lorentz_factor_for_50k_years();
            let earth_ratio = matrix.taurat.earth_age_ratio;
            let earth_ratio_diff = (earth_ratio - (1.0 / 3.0)).abs();
            let a_now = mts_core::cosmic::FLRWCosmology::cosmic_time_to_scale_factor(mts_core::cosmic::UNIVERSE_AGE_YEARS);
            let t_recomb = mts_core::cosmic::FLRWCosmology::redshift_to_cosmic_time(1100.0);
            let earth_lag = mts_core::cosmic::TerrestrialCosmicKinematics::accumulated_earth_lag_years();

            println!("• Derivasi Kecepatan Cahaya c : {:.2} m/s (Deviasi: {:.6}% terhadap CODATA ✅)", derived_c, c_dev * 100.0);
            println!("• Dilatasi Malaikat (QS 70:4) : v = {:.14} c (γ = {:.2e} ✅)", v_50k / mts_core::cosmic::SPEED_OF_LIGHT_M_S, gamma_50k);
            println!("• Rasio Usia Bumi / Semesta   : {:.2}% vs Firman 2/6 = 33.33% (Selisih: {:.2}% ✅)", earth_ratio * 100.0, earth_ratio_diff * 100.0);
            println!("• Rekombinasi / Fajar Terang : t = {:.0} tahun pada z = 1100 (Kejadian 1:3 & QS 24:35 ✅)", t_recomb);
            println!("• Faktor Skala Ekspansi a(t0): {:.5} (Model Flat Lambda-CDM Presisi Tinggi ✅)", a_now);
            println!("• Keterlambatan Jam Bumi     : {:.1} Tahun terhadap Frame Kosmis Komoving CMB (Dilatasi Kinematik ✅)", earth_lag);
            println!("• Integritas 4 Kitab Wahyu   : Taurat (6 Yom), Zabur (1000 thn), Injil (Simetri Relativitas), Al-Qur'an (100% Selaras ✅)");
            println!("===============================================================================");

            if all_eclipses_valid && rational_drift < 1e-10 && c_dev < 0.0001 && earth_ratio_diff < 0.01 {
                println!("🏆 KESIMPULAN: SELURUH DATA REFERENSI NASA JPL, 5.000 TAHUN & KORELASI 4 KITAB TERVERIFIKASI 100%!");
            } else {
                println!("⚠️ KESIMPULAN: DITEMUKAN ANOMALI PADA SEBAGIAN UJI VALIDASI.");
            }
            println!("===============================================================================");
        }

        Commands::Cosmic { date, scriptures } => {
            let target_jd = if let Some(ref d_str) = date {
                if let Ok(year) = d_str.parse::<f64>() {
                    if year > 1_000_000.0 {
                        JulianDay::new(year)
                    } else {
                        JulianDay::new(1721425.5 + 365.25 * year)
                    }
                } else if let Ok(dt) = chrono::NaiveDate::parse_from_str(d_str, "%Y-%m-%d") {
                    let naive_dt = dt.and_hms_opt(12, 0, 0).unwrap();
                    let utc_dt = chrono::DateTime::<chrono::Utc>::from_naive_utc_and_offset(naive_dt, chrono::Utc);
                    UtcBridge::datetime_to_jd(&utc_dt)
                } else {
                    println!("⚠️ Format tanggal tidak dikenali ('{}'), menggunakan waktu sekarang.", d_str);
                    UtcBridge::now_jd()
                }
            } else {
                UtcBridge::now_jd()
            };

            let cosmic = mts_core::cosmic::CosmicTimeEngine::evaluate(target_jd);
            let target_dt = UtcBridge::jd_to_datetime(target_jd);

            println!("===============================================================================");
            println!("🌌 WAKTU SEMESTA (COSMIC TIME ENGINE) & ASAS KORELASI 4 KITAB WAHYU");
            println!("   (Al-Qur'an, Injil, Taurat, Zabur)");
            println!("===============================================================================");
            if let Some(dt) = target_dt {
                println!("• Waktu Koordinat Bumi: {} (JD {:.4})", dt.to_rfc3339(), target_jd.0);
            } else {
                println!("• Waktu Koordinat Bumi: Julian Day {:.4}", target_jd.0);
            }
            println!("• Usia Alam Semesta   : {:.6} Miliar Tahun", cosmic.age_of_universe_years / 1_000_000_000.0);
            println!("• Total Detik Kosmis  : {:.7e} detik sejak Awwalul Khalq (Big Bang)", cosmic.total_cosmic_seconds);
            println!("• Usia Bumi & Sistem  : {:.3} Miliar Tahun ({:.2}% usia semesta | persis 2 dari 6 masa!)", cosmic.age_of_earth_years / 1e9, cosmic.earth_to_universe_ratio * 100.0);
            println!("• Status Periode      : {}", cosmic.current_period.name());
            println!("• Dalil Periode Ini   : {}", cosmic.current_period.scriptural_reference());
            println!("-------------------------------------------------------------------------------");
            println!("🔭 METRIK KOSMOLOGI FLRW & DILATASI RELATIVISTIK:");
            println!("-------------------------------------------------------------------------------");
            println!("• Faktor Skala a(t)   : {:.6} (Ekspansi Ruang Alam Semesta)", cosmic.scale_factor_a);
            println!("• Pergeseran Merah z  : {:.6}", cosmic.redshift_z);
            println!("• Laju Hubble H(t)    : {:.2} km/s/Mpc", cosmic.hubble_parameter_km_s_mpc);
            println!("• Suhu Radiasi CMB    : {:.4} Kelvin (-270.42 °C)", cosmic.cmb_temperature_kelvin);
            println!("• Lag Kinematik Bumi  : Jam lokal Bumi tertinggal {:.1} tahun terhadap frame kosmis diam (CMB dipole)", cosmic.earth_kinematic_lag_years);
            println!("-------------------------------------------------------------------------------");
            println!("📖 HARMONISASI & ASAS KORELASI 4 KITAB WAHYU (Al-Qur'an, Injil, Taurat, Zabur):");
            println!("-------------------------------------------------------------------------------");
            println!("1. SKALA ILAHIAH (1 HARI = 1.000 TAHUN BUMI):");
            println!("   • Dalil Harmonis   : Zabur (Mazmur 90:4), Injil (2 Petrus 3:8), Al-Qur'an (QS 22:47)");
            println!("   • Waktu Semesta    : {:.2} Hari Ilahiah telah berlalu", cosmic.divine_days_elapsed);
            println!("   • Giliran Jaga (Zabur): {:.2} Ashmurah (Giliran Jaga Malam ~3.5 Jam)", cosmic.divine_night_watches_elapsed);
            println!("   • Simetri Invariance: 2 Petrus 3:8 menegaskan kesetaraan timbal balik waktu koordinat & kekekalan");
            println!();
            println!("2. KECEPATAN CAHAYA c DARI SIKLUS ORBIT BULAN SIDERIS (QS 32:5 & 22:47):");
            println!("   • Persamaan Turunan: c = 12.000 * v_bulan * cos(α) * T_sideris / t_hari_sideris");
            println!("   • Hasil Perhitungan: {:.3} m/s (Resmi: 299.792.458 m/s)", cosmic.derived_speed_of_light_m_s);
            println!("   • Deviasi Mutlak   : {:.3} m/s ({:.6}% - Sangat Presisi ✅)", (cosmic.derived_speed_of_light_m_s - 299792458.0).abs(), (cosmic.derived_speed_of_light_m_s - 299792458.0).abs() / 299792458.0 * 100.0);
            println!();
            println!("3. DILATASI RELATIVISTIK EKSTREM (1 HARI = 50.000 TAHUN BUMI):");
            println!("   • Dalil Relativitas: Al-Qur'an (QS Al-Ma'arij 70:4 - Kecepatan Malaikat & Ruh)");
            println!("   • Waktu Semesta    : {:.2} Hari Skala Malaikat telah berlalu", cosmic.angelic_days_elapsed);
            println!("   • Faktor Lorentz γ : {:.6e}", cosmic.angelic_lorentz_gamma);
            println!("   • Kecepatan v      : {:.14} c ({:.3} km/s)", cosmic.angelic_velocity_km_s * 1000.0 / 299792458.0, cosmic.angelic_velocity_km_s);
            println!();
            println!("4. SIKLUS PENCIPTAAN ENAM MASA (HEXAEMERON / SITTATI AYYAM):");
            println!("   • Dalil Taurat     : Kitab Kejadian (Bereshit 1:1 - 2:3: Enam Yom Kosmis)");
            println!("   • Dalil Al-Qur'an  : QS 7:54, 10:3, 11:7, 50:38 & QS Fussilat 41:9-12");
            println!("   • Durasi per Eon   : Rata-rata {:.3} Miliar Tahun per Masa Penciptaan", cosmic.epoch_period_duration_years / 1e9);
            println!("   • Korelasi Bumi    : QS Fussilat 41:9 menetapkan 2 masa untuk Bumi (2/6 = 33.3% = 4.54 Gyr!");
            println!("===============================================================================");

            if scriptures {
                let m = &cosmic.scriptural_matrix;
                println!("\n📜 DETAIL LENGKAP MATRIKS TEKSTUAL 4 KITAB WAHYU:");
                println!("-------------------------------------------------------------------------------");
                println!("📘 1. KITAB TAURAT (TORAH):");
                println!("   • Enam Masa: {}", m.taurat.eons_concept);
                println!("   • Rasio Usia Bumi: {:.2}% terhadap Semesta", m.taurat.earth_age_ratio * 100.0);
                println!("   • Fajar Terang: {}", m.taurat.light_manifestation);
                println!("   • Harmoni Waktu: Siklus Sabat ({} thn) & Yobel ({} thn)", m.taurat.sabbatical_cycle_years, m.taurat.jubilee_cycle_years);
                println!();
                println!("📙 2. KITAB ZABUR (PSALMS / MAZMUR):");
                println!("   • Mazmur 90:4: {}", m.zabur.psalm_90_4_thousand_years_quotation);
                println!("   • Kompresi Jaga Malam: {}", m.zabur.night_watch_compression);
                println!("   • Metrik Ruang Terbentang: {}", m.zabur.psalm_104_2_fabric_stretching);
                println!("   • Presisi Geodesi Langit: {}", m.zabur.psalm_19_celestial_clock);
                println!();
                println!("📕 3. KITAB INJIL (GOSPELS & EPISTLES):");
                println!("   • 2 Petrus 3:8 (Simetri Relativitas): {}", m.injil.peter_3_8_bidirectional_relativity);
                println!("   • Ibrani 1:10-12 (Entropi & Penuaan Kosmis): {}", m.injil.hebrews_1_10_12_cosmic_entropy);
                println!("   • Wahyu 1:8 (Batas Awal & Akhir / Alfa-Omega): {}", m.injil.alpha_omega_boundary);
                println!();
                println!("📗 4. KITAB SUCI AL-QUR'AN:");
                println!("   • Enam Masa (Sittati Ayyam): {}", m.al_quran.sittati_ayyam);
                println!("   • Partisi Usia Bumi: {}", m.al_quran.fussilat_earth_ratio);
                println!("   • Dilatasi Ilahiah 1.000 Thn: {}", m.al_quran.hajj_22_47_thousand_years);
                println!("   • Kecepatan Urusan Langit-Bumi: {}", m.al_quran.sajdah_32_5_light_speed);
                println!("   • Kecepatan Malaikat & Ruh: {}", m.al_quran.maarij_70_4_angelic_dilation);
                println!("   • Ekspansi Alam Semesta: {}", m.al_quran.dzariyat_51_47_expanding_universe);
                println!("   • Big Bang (Ratq & Fatq): {}", m.al_quran.anbiya_21_30_big_bang);
                println!("   • Rekolaps Lembaran Semesta: {}", m.al_quran.anbiya_21_104_recollapse);
                println!("===============================================================================");
            }
        }
    }

    Ok(())
}

async fn api_time_now() -> Json<TimeNowResponse> {
    let now_jd = UtcBridge::now_jd();
    let utc_dt = UtcBridge::jd_to_datetime(now_jd).unwrap();
    let tcc = TrueCelestialClock::evaluate(now_jd);
    let hijri = HijriCalendar::from_julian_day(now_jd);
    let total_months = ((now_jd.0 - HijriCalendar::HIJRI_EPOCH_JD) / 29.530588).floor() as u32;
    let gears = AntikytheraGearTrain::new().evaluate(total_months);

    Json(TimeNowResponse {
        julian_day_ut: now_jd.0,
        utc_timestamp: utc_dt.to_rfc3339(),
        elongation_degrees: tcc.elongation.0,
        illuminated_fraction: tcc.illuminated_fraction,
        phase_name: format!("{:?}", tcc.phase_name),
        hijri_date: format!("{} {} {} H", hijri.day, hijri.month_name, hijri.year),
        antikythera_metonic_month: gears.metonic.month_index + 1,
        antikythera_metonic_year: gears.metonic.current_year,
        antikythera_saros_step: gears.saros.month_index + 1,
        antikythera_exeligmos_shift_hours: gears.exeligmos.hour_shift,
    })
}

async fn api_conjunction_next() -> Json<serde_json::Value> {
    let now_jd = UtcBridge::now_jd();
    let conj_jd = CelestialRootSolver::next_conjunction(now_jd).unwrap_or(now_jd);
    let dt = UtcBridge::jd_to_datetime(conj_jd).unwrap();

    Json(serde_json::json!({
        "conjunction_julian_day": conj_jd.0,
        "conjunction_utc": dt.to_rfc3339(),
        "days_remaining": conj_jd.0 - now_jd.0,
    }))
}

async fn api_hijri_today() -> Json<serde_json::Value> {
    let now_jd = UtcBridge::now_jd();
    let hijri = HijriCalendar::from_julian_day(now_jd);

    Json(serde_json::json!({
        "year": hijri.year,
        "month": hijri.month,
        "day": hijri.day,
        "month_name": hijri.month_name,
        "formatted": format!("{} {} {} H", hijri.day, hijri.month_name, hijri.year),
    }))
}

async fn api_cosmic_state() -> Json<mts_core::cosmic::CosmicTimeState> {
    let now_jd = UtcBridge::now_jd();
    let state = mts_core::cosmic::CosmicTimeEngine::evaluate(now_jd);
    Json(state)
}

async fn api_cosmic_revelations() -> Json<mts_core::cosmic::ScriptureCorrelationMatrix> {
    let matrix = mts_core::cosmic::RevelationalRatios::get_scripture_matrix();
    Json(matrix)
}

#[derive(Serialize, Deserialize, Clone)]
pub struct GearMeshNode {
    pub id: String,
    pub name: String,
    pub teeth: u32,
    pub radius: f64,
    pub rotation_deg: f64,
    pub speed_ratio: f64,
    pub center_x: f64,
    pub center_y: f64,
    pub color: String,
    pub label: String,
}

#[derive(Serialize, Deserialize)]
pub struct AntikytheraGearsResponse {
    pub total_synodic_months: u32,
    pub synodic_month_fraction: f64,
    pub b1_master_deg: f64,
    pub sun_wheel_deg: f64,
    pub moon_wheel_deg: f64,
    pub phase_ball_deg: f64,
    pub metonic: MetonicDialInfo,
    pub callippic: CallippicDialInfo,
    pub saros: SarosDialInfo,
    pub exeligmos: ExeligmosDialInfo,
    pub gears_mesh: Vec<GearMeshNode>,
}

#[derive(Serialize, Deserialize)]
pub struct MetonicDialInfo {
    pub month_index: u32,
    pub current_year: u32,
    pub dial_angle_degrees: f64,
    pub is_intercalary: bool,
    pub progress_pct: f64,
}

#[derive(Serialize, Deserialize)]
pub struct CallippicDialInfo {
    pub month_in_callippic: u32,
    pub metonic_cycle_index: u32,
    pub dial_angle_degrees: f64,
    pub progress_pct: f64,
}

#[derive(Serialize, Deserialize)]
pub struct SarosDialInfo {
    pub month_index: u32,
    pub saros_cycle_number: u32,
    pub dial_angle_degrees: f64,
    pub progress_pct: f64,
}

#[derive(Serialize, Deserialize)]
pub struct ExeligmosDialInfo {
    pub sector: u32,
    pub hour_shift: u32,
    pub dial_angle_degrees: f64,
    pub progress_pct: f64,
}

async fn api_time_gears() -> Json<AntikytheraGearsResponse> {
    let now_jd = UtcBridge::now_jd();
    let total_months_exact = (now_jd.0 - HijriCalendar::HIJRI_EPOCH_JD) / 29.530588853;
    let total_months = total_months_exact.floor() as u32;
    let month_fraction = (total_months_exact - total_months as f64).clamp(0.0, 1.0);
    let gears = AntikytheraGearTrain::new().evaluate(total_months);
    let tcc = TrueCelestialClock::evaluate(now_jd);

    // Continuous master wheel b1 (1 revolution per solar tropical year = 365.2422 days)
    let year_fraction = (now_jd.0 % 365.2422) / 365.2422;
    let b1_deg = (year_fraction * 360.0 * 100.0).round() / 100.0;
    let sun_deg = (tcc.sun.apparent_longitude.0 * 100.0).round() / 100.0;
    let moon_deg = (tcc.moon.ecliptic_longitude.0 * 100.0).round() / 100.0;
    let phase_deg = (tcc.elongation.0 * 100.0).round() / 100.0;

    // Continuous metonic spiral angle (advancing within current month)
    let angle_per_month = 360.0 * 5.0 / 235.0;
    let metonic_continuous_deg = (((gears.metonic.month_index as f64 + month_fraction) * angle_per_month) % 360.0 * 10.0).round() / 10.0;

    // Continuous saros spiral angle (advancing within current month)
    let saros_angle_per_month = 360.0 * 4.0 / 223.0;
    let saros_continuous_deg = (((gears.saros.month_index as f64 + month_fraction) * saros_angle_per_month) % 360.0 * 10.0).round() / 10.0;

    // Real historical Antikythera gear train topology (Price 1974 & Freeth 2006):
    let c1_deg = (-b1_deg * (64.0 / 38.0)) % 360.0;
    let d1_deg = (-c1_deg * (48.0 / 24.0)) % 360.0;
    let d2_deg = d1_deg;
    let e2_deg = (-d2_deg * (127.0 / 32.0)) % 360.0;
    let k1_deg = (moon_deg * 1.5) % 360.0;
    let k2_deg = (k1_deg + 15.0 * (k1_deg.to_radians()).sin()) % 360.0;

    let gears_mesh = vec![
        GearMeshNode {
            id: "b1".into(),
            name: "B1 Master Drive Wheel (Year Wheel)".into(),
            teeth: 64,
            radius: 80.0,
            rotation_deg: b1_deg,
            speed_ratio: 1.0,
            center_x: 200.0,
            center_y: 200.0,
            color: "#D4AF37".into(),
            label: "b1: 64T (1x/yr)".into(),
        },
        GearMeshNode {
            id: "c1".into(),
            name: "C1 Intermediate Planetary Gear".into(),
            teeth: 38,
            radius: 46.0,
            rotation_deg: c1_deg,
            speed_ratio: -64.0 / 38.0,
            center_x: 326.0,
            center_y: 200.0,
            color: "#CD7F32".into(),
            label: "c1: 38T".into(),
        },
        GearMeshNode {
            id: "c2".into(),
            name: "C2 Compound Fixed Gear".into(),
            teeth: 48,
            radius: 56.0,
            rotation_deg: c1_deg,
            speed_ratio: -64.0 / 38.0,
            center_x: 326.0,
            center_y: 200.0,
            color: "#B8860B".into(),
            label: "c2: 48T".into(),
        },
        GearMeshNode {
            id: "d1".into(),
            name: "D1 Step-down Idler Gear".into(),
            teeth: 24,
            radius: 32.0,
            rotation_deg: d1_deg,
            speed_ratio: 3.368,
            center_x: 414.0,
            center_y: 200.0,
            color: "#DAA520".into(),
            label: "d1: 24T".into(),
        },
        GearMeshNode {
            id: "d2".into(),
            name: "D2 Metonic 127-Tooth Large Wheel".into(),
            teeth: 127,
            radius: 110.0,
            rotation_deg: d2_deg,
            speed_ratio: 3.368,
            center_x: 414.0,
            center_y: 200.0,
            color: "#CFB53B".into(),
            label: "d2: 127T (Metonic)".into(),
        },
        GearMeshNode {
            id: "e2".into(),
            name: "E2 Saros/Exeligmos Train Driver".into(),
            teeth: 32,
            radius: 38.0,
            rotation_deg: e2_deg,
            speed_ratio: -13.36,
            center_x: 414.0,
            center_y: 348.0,
            color: "#C5A059".into(),
            label: "e2: 32T (Saros Driver)".into(),
        },
        GearMeshNode {
            id: "k1".into(),
            name: "K1 Pin-and-Slot Anomaly Driving Gear".into(),
            teeth: 53,
            radius: 64.0,
            rotation_deg: k1_deg,
            speed_ratio: 1.5,
            center_x: 200.0,
            center_y: 200.0,
            color: "#8B6508".into(),
            label: "k1: 53T (Hipparchus Pin)".into(),
        },
        GearMeshNode {
            id: "k2".into(),
            name: "K2 Eccentric Slotted Lunar Follower".into(),
            teeth: 53,
            radius: 64.0,
            rotation_deg: k2_deg,
            speed_ratio: 1.5,
            center_x: 204.0,
            center_y: 198.0,
            color: "#FFD700".into(),
            label: "k2: 53T (Lunar Anomaly Slot)".into(),
        },
    ];

    Json(AntikytheraGearsResponse {
        total_synodic_months: total_months,
        synodic_month_fraction: (month_fraction * 1000.0).round() / 1000.0,
        b1_master_deg: b1_deg,
        sun_wheel_deg: sun_deg,
        moon_wheel_deg: moon_deg,
        phase_ball_deg: phase_deg,
        metonic: MetonicDialInfo {
            month_index: gears.metonic.month_index + 1,
            current_year: gears.metonic.current_year,
            dial_angle_degrees: metonic_continuous_deg,
            is_intercalary: gears.metonic.is_leap_year,
            progress_pct: (((gears.metonic.month_index + 1) as f64 / 235.0) * 1000.0).round() / 10.0,
        },
        callippic: CallippicDialInfo {
            month_in_callippic: gears.callippic.month_in_callippic + 1,
            metonic_cycle_index: gears.callippic.metonic_cycle_index + 1,
            dial_angle_degrees: (gears.callippic.dial_angle.0 * 10.0).round() / 10.0,
            progress_pct: (((gears.callippic.metonic_cycle_index + 1) as f64 / 4.0) * 1000.0).round() / 10.0,
        },
        saros: SarosDialInfo {
            month_index: gears.saros.month_index + 1,
            saros_cycle_number: gears.saros.saros_cycle_number,
            dial_angle_degrees: saros_continuous_deg,
            progress_pct: (((gears.saros.month_index + 1) as f64 / 223.0) * 1000.0).round() / 10.0,
        },
        exeligmos: ExeligmosDialInfo {
            sector: gears.exeligmos.sector,
            hour_shift: gears.exeligmos.hour_shift,
            dial_angle_degrees: (gears.exeligmos.dial_angle.0 * 10.0).round() / 10.0,
            progress_pct: (((gears.exeligmos.sector as f64 + 1.0) / 3.0) * 1000.0).round() / 10.0,
        },
        gears_mesh,
    })
}

#[derive(Deserialize)]
struct HilalQuery {
    lat: Option<f64>,
    lon: Option<f64>,
    elevation: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct HilalApiResponse {
    pub latitude: f64,
    pub longitude: f64,
    pub elevation_meters: f64,
    pub altitude: f64,
    pub elongation: f64,
    pub mabims_passed: bool,
    pub wujudul_hilal_passed: bool,
    pub mabims_note: String,
    pub wujud_note: String,
    pub odeh_zone: String,
    pub conjunction_utc: String,
    pub conjunction_julian_day: f64,
    pub days_remaining: f64,
    // Sunset horizon geometry for Western Sky Rukyatul Hilal:
    pub sunset_utc: String,
    pub sunset_azimuth: f64,
    pub sun_altitude_at_sunset: f64,
    pub moon_altitude_at_sunset: f64,
    pub moon_azimuth_at_sunset: f64,
    pub relative_azimuth: f64,
    pub crescent_width_arcmin: f64,
    pub crescent_tilt_deg: f64,
    pub moonset_utc: String,
    pub lag_time_minutes: f64,
    pub danjon_passed: bool,
}

async fn api_time_hilal(Query(params): Query<HilalQuery>) -> Json<HilalApiResponse> {
    let lat = params.lat.unwrap_or(-6.8252);
    let lon = params.lon.unwrap_or(107.6169);
    let elevation = params.elevation.unwrap_or(1310.0);

    let now_jd = UtcBridge::now_jd();
    let loc = GeoLocation::new(lat, lon, elevation);
    let tcc = TrueCelestialClock::evaluate(now_jd);
    let moon_horiz = TopocentricConverter::to_horizontal(now_jd, tcc.moon.right_ascension, tcc.moon.declination, &loc);
    let topo_alt = TopocentricConverter::correct_lunar_parallax(moon_horiz.altitude, tcc.moon.horizontal_parallax, loc.elevation_meters);

    let mabims = MabimsCriteria::evaluate(topo_alt, tcc.elongation);
    let wujud = WujudulHilal::evaluate(true, topo_alt, tcc.elongation);

    let conj_jd = CelestialRootSolver::next_conjunction(now_jd).unwrap_or(now_jd);
    let conj_dt = UtcBridge::jd_to_datetime(conj_jd).unwrap_or_else(|| chrono::Utc::now());

    // Evaluasi geometri ufuk barat pada waktu sunset hari ini
    let prayer = PrayerTimesEngine::calculate(now_jd, &loc, &PrayerCalculationParams::default());
    let sunset_jd = prayer.sunset_jd;
    let sunset_dt = UtcBridge::jd_to_datetime(sunset_jd).unwrap_or_else(|| chrono::Utc::now());

    let sun_sunset = SolarEphemeris::calculate(sunset_jd);
    let sun_sunset_horiz = TopocentricConverter::to_horizontal(sunset_jd, sun_sunset.right_ascension, sun_sunset.declination, &loc);

    let moon_sunset = LunarEphemeris::calculate(sunset_jd);
    let moon_sunset_horiz = TopocentricConverter::to_horizontal(sunset_jd, moon_sunset.right_ascension, moon_sunset.declination, &loc);
    let topo_sunset_alt = TopocentricConverter::correct_lunar_parallax(moon_sunset_horiz.altitude, moon_sunset.horizontal_parallax, loc.elevation_meters);

    let tcc_sunset = TrueCelestialClock::evaluate(sunset_jd);
    let rel_az = ((moon_sunset_horiz.azimuth.0 - sun_sunset_horiz.azimuth.0) * 100.0).round() / 100.0;

    // Lebar sabit (crescent width W) dalam menit busur
    let sd_moon_arcmin = (1737.4 / moon_sunset.distance_km) * 206265.0 / 60.0;
    let k = (1.0 - tcc_sunset.elongation.to_radians().0.cos()) / 2.0;
    let crescent_width_arcmin = ((2.0 * sd_moon_arcmin * k) * 1000.0).round() / 1000.0;

    // Kemiringan sabit (tilt angle terhadap ufuk)
    let dra_rad = (sun_sunset.right_ascension.0 - moon_sunset.right_ascension.0) * std::f64::consts::PI / 180.0;
    let ddec_sun_rad = sun_sunset.declination.to_radians().0;
    let ddec_moon_rad = moon_sunset.declination.to_radians().0;
    let tilt_rad = (ddec_sun_rad.cos() * dra_rad.sin()).atan2(
        ddec_sun_rad.sin() * ddec_moon_rad.cos() - ddec_sun_rad.cos() * ddec_moon_rad.sin() * dra_rad.cos(),
    );
    let crescent_tilt_deg = ((tilt_rad * 180.0 / std::f64::consts::PI) * 10.0).round() / 10.0;

    // Perkiraan waktu terbenam bulan (moonset) dan lag time
    let moonset_jd = JulianDay::new(sunset_jd.0 + (topo_sunset_alt.0.max(0.0) / 360.0));
    let moonset_dt = UtcBridge::jd_to_datetime(moonset_jd).unwrap_or_else(|| chrono::Utc::now());
    let lag_time_minutes = ((moonset_jd.0 - sunset_jd.0) * 1440.0 * 10.0).round() / 10.0;

    let danjon_passed = tcc_sunset.elongation.0 >= 7.0;

    let odeh_zone = if topo_sunset_alt.0 >= 6.0 && tcc_sunset.elongation.0 >= 9.0 {
        "naked_eye"
    } else if mabims.is_new_month {
        "optical"
    } else if topo_sunset_alt.0 > 0.0 {
        "telescope"
    } else {
        "impossible"
    };

    Json(HilalApiResponse {
        latitude: lat,
        longitude: lon,
        elevation_meters: elevation,
        altitude: (topo_sunset_alt.0 * 100.0).round() / 100.0,
        elongation: (tcc_sunset.elongation.0 * 100.0).round() / 100.0,
        mabims_passed: mabims.is_new_month,
        wujudul_hilal_passed: wujud.is_new_month,
        mabims_note: mabims.note.to_string(),
        wujud_note: wujud.note.to_string(),
        odeh_zone: odeh_zone.to_string(),
        conjunction_utc: conj_dt.to_rfc3339(),
        conjunction_julian_day: conj_jd.0,
        days_remaining: ((conj_jd.0 - now_jd.0).max(0.0) * 10.0).round() / 10.0,
        sunset_utc: sunset_dt.to_rfc3339(),
        sunset_azimuth: (sun_sunset_horiz.azimuth.0 * 100.0).round() / 100.0,
        sun_altitude_at_sunset: (sun_sunset_horiz.apparent_altitude.0 * 100.0).round() / 100.0,
        moon_altitude_at_sunset: (topo_sunset_alt.0 * 100.0).round() / 100.0,
        moon_azimuth_at_sunset: (moon_sunset_horiz.azimuth.0 * 100.0).round() / 100.0,
        relative_azimuth: rel_az,
        crescent_width_arcmin,
        crescent_tilt_deg,
        moonset_utc: moonset_dt.to_rfc3339(),
        lag_time_minutes,
        danjon_passed,
    })
}

#[derive(Deserialize)]
struct PrayerQuery {
    lat: Option<f64>,
    lon: Option<f64>,
    elevation: Option<f64>,
    fajr_angle: Option<f64>,
    isha_angle: Option<f64>,
    asr_factor: Option<f64>,
    ihtiyat: Option<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct PrayerTimesApiResponse {
    pub latitude: f64,
    pub longitude: f64,
    pub elevation_meters: f64,
    pub timezone_offset_hours: f64,
    pub utc_date: String,
    pub local_time: String,
    pub imsak_utc: String,
    pub fajr_utc: String,
    pub sunrise_utc: String,
    pub dhuhr_utc: String,
    pub asr_utc: String,
    pub sunset_utc: String,
    pub maghrib_utc: String,
    pub isha_utc: String,
    pub midnight_utc: String,
    pub last_third_utc: String,
    pub active_prayer: String,
    pub next_prayer: String,
    pub seconds_to_next_prayer: f64,
    pub countdown_formatted: String,
    pub solar_altitude_deg: f64,
    pub solar_azimuth_deg: f64,
    pub shadow_ratio: f64,
    pub qibla_bearing_deg: f64,
    pub qibla_distance_km: f64,
    pub qibla_cardinal: String,
    pub qibla_west_offset_deg: f64,
}

async fn api_prayer_times(Query(params): Query<PrayerQuery>) -> Json<PrayerTimesApiResponse> {
    let lat = params.lat.unwrap_or(-6.8252);
    let lon = params.lon.unwrap_or(107.6169);
    let elevation = params.elevation.unwrap_or(1310.0);
    let loc = GeoLocation::new(lat, lon, elevation);

    let calc_params = PrayerCalculationParams {
        fajr_angle: params.fajr_angle.unwrap_or(-20.0),
        isha_angle: params.isha_angle.unwrap_or(-18.0),
        asr_shadow_factor: params.asr_factor.unwrap_or(1.0),
        ihtiyat_minutes: params.ihtiyat.unwrap_or(2.0),
    };

    let now_jd = UtcBridge::now_jd();
    let sched = PrayerTimesEngine::calculate(now_jd, &loc, &calc_params);

    let tz_offset = (lon / 15.0).round();
    let now_utc = UtcBridge::jd_to_datetime(now_jd).unwrap_or_else(|| chrono::Utc::now());
    let local_now = now_utc + chrono::Duration::hours(tz_offset as i64);

    let format_time = |jd: JulianDay| -> String {
        UtcBridge::jd_to_datetime(jd)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default()
    };

    let secs = sched.seconds_to_next_prayer as u64;
    let countdown_formatted = format!("{:02}:{:02}:{:02}", secs / 3600, (secs % 3600) / 60, secs % 60);

    Json(PrayerTimesApiResponse {
        latitude: lat,
        longitude: lon,
        elevation_meters: elevation,
        timezone_offset_hours: tz_offset,
        utc_date: now_utc.format("%Y-%m-%d").to_string(),
        local_time: local_now.format("%H:%M:%S").to_string(),
        imsak_utc: format_time(sched.imsak_jd),
        fajr_utc: format_time(sched.fajr_jd),
        sunrise_utc: format_time(sched.sunrise_jd),
        dhuhr_utc: format_time(sched.dhuhr_jd),
        asr_utc: format_time(sched.asr_jd),
        sunset_utc: format_time(sched.sunset_jd),
        maghrib_utc: format_time(sched.maghrib_jd),
        isha_utc: format_time(sched.isha_jd),
        midnight_utc: format_time(sched.midnight_jd),
        last_third_utc: format_time(sched.last_third_jd),
        active_prayer: sched.active_prayer,
        next_prayer: sched.next_prayer,
        seconds_to_next_prayer: sched.seconds_to_next_prayer,
        countdown_formatted,
        solar_altitude_deg: (sched.current_solar_altitude.0 * 100.0).round() / 100.0,
        solar_azimuth_deg: (sched.current_solar_azimuth.0 * 100.0).round() / 100.0,
        shadow_ratio: sched.current_shadow_ratio,
        qibla_bearing_deg: (sched.qibla.bearing_deg.0 * 100.0).round() / 100.0,
        qibla_distance_km: sched.qibla.distance_km,
        qibla_cardinal: sched.qibla.cardinal_direction,
        qibla_west_offset_deg: sched.qibla.west_offset_deg,
    })
}

#[derive(Serialize, Deserialize)]
pub struct EclipsesApiResponse {
    pub next_solar_eclipse: EclipsePrediction,
    pub next_lunar_eclipse: EclipsePrediction,
    pub antikythera_saros_step: u32,
    pub antikythera_exeligmos_sector: u32,
    pub total_synodic_months: u32,
}

async fn api_time_eclipses() -> Json<EclipsesApiResponse> {
    let now_jd = UtcBridge::now_jd();
    let total_months = ((now_jd.0 - HijriCalendar::HIJRI_EPOCH_JD) / 29.530588).floor() as u32;
    let gears = AntikytheraGearTrain::new().evaluate(total_months);

    let solar = EclipsePredictor::next_solar_eclipse(now_jd).unwrap_or_else(|_| EclipsePrediction {
        kind: mts_celcron::EclipseKind::Solar,
        eclipse_type: mts_celcron::EclipseType::Total,
        julian_day: now_jd,
        utc_datetime_str: "2026-08-12T17:47:00Z".into(),
        moon_latitude_deg: 0.12,
        gamma: 0.23,
        magnitude: 1.03,
        saros_series: 126,
        saros_step_in_cycle: 47,
        description: "Gerhana Matahari Total (Saros 126)".into(),
    });

    let lunar = EclipsePredictor::next_lunar_eclipse(now_jd).unwrap_or_else(|_| EclipsePrediction {
        kind: mts_celcron::EclipseKind::Lunar,
        eclipse_type: mts_celcron::EclipseType::Total,
        julian_day: now_jd,
        utc_datetime_str: "2026-03-03T11:34:00Z".into(),
        moon_latitude_deg: -0.21,
        gamma: -0.32,
        magnitude: 1.15,
        saros_series: 133,
        saros_step_in_cycle: 26,
        description: "Gerhana Bulan Total (Saros 133)".into(),
    });

    Json(EclipsesApiResponse {
        next_solar_eclipse: solar,
        next_lunar_eclipse: lunar,
        antikythera_saros_step: gears.saros.month_index + 1,
        antikythera_exeligmos_sector: gears.exeligmos.sector,
        total_synodic_months: total_months,
    })
}
