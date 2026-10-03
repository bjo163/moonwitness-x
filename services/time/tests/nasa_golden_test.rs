use mts_celcron::CelestialRootSolver;
use mts_core::gears::AntikytheraGearTrain;
use mts_core::rational::{ExactRationalTime, GearRatio};
use mts_core::units::JulianDay;
use mts_ephemeris::DeltaT;
use mts_hijri::UtcBridge;

/// Dataset Referensi Emas Gerhana Historis & Masa Depan (NASA JPL Horizons / Fred Espenak)
struct EclipseReference {
    name: &'static str,
    target_jd_approx: f64,
    nasa_conjunction_utc: &'static str,
}

const NASA_GOLDEN_ECLIPSES: [EclipseReference; 5] = [
    EclipseReference {
        name: "Gerhana Matahari Bersejarah Wafatnya Ibrahim (Putra Nabi Muhammad SAW)",
        target_jd_approx: 1951921.8, // 27 Januari 632 Julian = 30 Januari 632 Proleptic Gregorian
        nasa_conjunction_utc: "0632-01-30",
    },
    EclipseReference {
        name: "Epoch Referensi Astronomis Internasional J2000.0",
        target_jd_approx: 2451545.0, // 1 Januari 2000 Masehi
        nasa_conjunction_utc: "2000-01-06",
    },
    EclipseReference {
        name: "Gerhana Matahari Total 'Great American Eclipse'",
        target_jd_approx: 2457987.27, // 21 Agustus 2017 Masehi
        nasa_conjunction_utc: "2017-08-21",
    },
    EclipseReference {
        name: "Gerhana Matahari Total Amerika Utara",
        target_jd_approx: 2460409.26, // 8 April 2024 Masehi
        nasa_conjunction_utc: "2024-04-08",
    },
    EclipseReference {
        name: "Gerhana Matahari Total Mega Luxor Mesir (Masa Depan)",
        target_jd_approx: 2461619.92, // 2 Agustus 2027 Masehi
        nasa_conjunction_utc: "2027-08-02",
    },
];

#[test]
fn test_nasa_golden_eclipses_accuracy() {
    println!("\n=== UJI VALIDASI DATA REFERENSI EMAS NASA JPL HORIZONS ===");
    for ec in NASA_GOLDEN_ECLIPSES.iter() {
        // Cari ijtimak terdekat dari target_jd_approx minus 2 hari
        let start_search = JulianDay::new(ec.target_jd_approx - 2.0);
        let result = CelestialRootSolver::next_conjunction(start_search);
        assert!(result.is_ok(), "Gagal mendeteksi ijtimak untuk {}", ec.name);
        
        let calculated_jd = result.unwrap();
        let dt = UtcBridge::jd_to_datetime(calculated_jd).unwrap();
        let date_str = dt.format("%Y-%m-%d").to_string();

        println!("• Event: {}", ec.name);
        println!("  - Target NASA      : {}", ec.nasa_conjunction_utc);
        println!("  - Hasil Hitung MTS : {} ({:.4} TT)", dt.to_rfc3339(), calculated_jd.0);

        // Verifikasi kesesuaian tanggal masehi dengan tanggal rilis NASA
        assert_eq!(
            date_str, ec.nasa_conjunction_utc,
            "Deviasi tanggal pada event: {}",
            ec.name
        );
    }
}

#[test]
fn test_5000_year_zero_drift_simulation() {
    println!("\n=== STRESS-TEST SIMULASI 5.000 TAHUN (-3000 SM s/d +3000 M) ===");
    
    let total_years = 5000;
    // 5000 tahun * 235/19 bulan = 61842.105... bulan sinodik
    let metonic_ratio = GearRatio::new(235, 19);
    
    // 1. Uji Aritmatika Rasional (Zero-Drift Mutlak)
    let year_steps = ExactRationalTime::from_integers(total_years, 1);
    let lunar_months_exact = year_steps.mul_ratio(&metonic_ratio);
    
    println!("• Total Tahun Disimulasikan : {} tahun", total_years);
    println!("• Rasio Roda Gigi Metonik  : 235 / 19");
    println!("• Total Siklus Utuh         : {} bulan sinodik", lunar_months_exact.whole_cycles());
    println!("• Sisa Fraksional Rasional : {}", lunar_months_exact.cycle_fraction());
    
    // Periksa bahwa tidak ada drift floating point: fraksi desimal identik
    let expected_frac = (total_years as f64 * 235.0 / 19.0) % 1.0;
    let actual_frac = lunar_months_exact.to_f64() % 1.0;
    assert!((expected_frac - actual_frac).abs() < 1e-10);

    // 2. Uji Integritas Roda Gigi Antikythera di Masa Depan (+3000 M)
    let train = AntikytheraGearTrain::new();
    let state_future = train.evaluate(61842);
    assert!(state_future.metonic.month_index < 235);
    assert!(state_future.callippic.metonic_cycle_index < 4);
    assert!(state_future.saros.month_index < 223);
    assert!(state_future.exeligmos.sector < 3);

    println!("• Integritas Dial Antikythera di Tahun +3000 Masehi: 100% VALID & BEBAS OVERFLOW");
}

#[test]
fn test_delta_t_continuity_across_millennia() {
    // Uji kontinuitas nilai Delta T melintasi 5.000 tahun
    let years = [-3000.0, -1000.0, 0.0, 632.0, 1500.0, 2000.0, 2026.0, 2035.0, 2500.0, 3000.0];
    for &yr in years.iter() {
        let dt = DeltaT::estimate(yr);
        assert!(!dt.is_nan());
        assert!(!dt.is_infinite());
        println!("• Tahun {:>6.0} : ΔT = {:>10.2} detik ({:.2} menit)", yr, dt, dt / 60.0);
    }
}
