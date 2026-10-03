use mts_core::cosmic::{
    CosmicPeriod, CosmicTimeEngine, FLRWCosmology, RevelationalRatios,
    TerrestrialCosmicKinematics, CMB_TEMPERATURE_K, EARTH_AGE_YEARS,
    HUBBLE_CONSTANT_KM_S_MPC, SPEED_OF_LIGHT_M_S, UNIVERSE_AGE_YEARS,
};

#[test]
fn test_four_scriptures_mathematical_concordance() {
    println!("\n===============================================================================");
    println!("📖 UJI VALIDASI ASAS KORELASI 4 KITAB WAHYU (Al-Qur'an, Injil, Taurat, Zabur)");
    println!("===============================================================================");

    let matrix = RevelationalRatios::get_scripture_matrix();

    // 1. KITAB TAURAT (Bereshit / Kejadian & Leviticus)
    println!("\n[1/4] KITAB TAURAT:");
    println!("• Kitab              : {}", matrix.taurat.scripture_name);
    println!("• 6 Masa Penciptaan  : {} Eon (Yom)", matrix.taurat.creation_eons_count);
    println!("• Konsep Yom         : {}", matrix.taurat.eons_concept);
    println!("• Rasio Bumi/Semesta : {:.4} ({:.2}%)", matrix.taurat.earth_age_ratio, matrix.taurat.earth_age_ratio * 100.0);
    println!("• Harmoni Sabat/Yobel: Siklus {} Tahun & {} Tahun", matrix.taurat.sabbatical_cycle_years, matrix.taurat.jubilee_cycle_years);
    println!("• Fajar Cahaya       : {}", matrix.taurat.light_manifestation);

    assert_eq!(matrix.taurat.creation_eons_count, 6);
    assert_eq!(matrix.taurat.sabbatical_cycle_years, 7);
    assert_eq!(matrix.taurat.jubilee_cycle_years, 50);
    // Rasio usia bumi / semesta harus mendekati 1/3 (2 dari 6 masa penciptaan)
    assert!((matrix.taurat.earth_age_ratio - (1.0 / 3.0)).abs() < 0.01);

    // 2. KITAB ZABUR (Tehillim / Mazmur Daud)
    println!("\n[2/4] KITAB ZABUR:");
    println!("• Kitab              : {}", matrix.zabur.scripture_name);
    println!("• Mazmur 90:4        : {}", matrix.zabur.psalm_90_4_thousand_years_quotation);
    println!("• Rasio 1.000 Tahun  : {:.2} hari bumi per 1 hari ilahiah", matrix.zabur.thousand_year_ratio_days);
    println!("• Giliran Jaga Malam : {}", matrix.zabur.night_watch_compression);
    println!("• Bentangan Langit   : {}", matrix.zabur.psalm_104_2_fabric_stretching);
    println!("• Jam Mekanika Langit: {}", matrix.zabur.psalm_19_celestial_clock);

    assert!(matrix.zabur.thousand_year_ratio_days > 365_000.0);
    assert!(matrix.zabur.psalm_104_2_fabric_stretching.contains("Mazmur 104:2"));

    // 3. KITAB INJIL (Perjanjian Baru / Gospels & Epistles)
    println!("\n[3/4] KITAB INJIL:");
    println!("• Kitab              : {}", matrix.injil.scripture_name);
    println!("• 2 Petrus 3:8       : {}", matrix.injil.peter_3_8_bidirectional_relativity);
    println!("• Entropi Termodinamika: {}", matrix.injil.hebrews_1_10_12_cosmic_entropy);
    println!("• Batas Alfa & Omega : {}", matrix.injil.alpha_omega_boundary);

    assert!(matrix.injil.peter_3_8_bidirectional_relativity.contains("2 Petrus 3:8"));
    assert!(matrix.injil.hebrews_1_10_12_cosmic_entropy.contains("Ibrani 1:10-12"));
    assert!(matrix.injil.alpha_omega_boundary.contains("Alfa dan Omega"));

    // 4. KITAB AL-QUR'AN
    println!("\n[4/4] AL-QUR'AN AL-KARIM:");
    println!("• Kitab              : {}", matrix.al_quran.scripture_name);
    println!("• 6 Masa (Sittati Ayyam): {}", matrix.al_quran.sittati_ayyam);
    println!("• Partisi QS Fussilat: {}", matrix.al_quran.fussilat_earth_ratio);
    println!("• QS Al-Hajj 22:47   : {}", matrix.al_quran.hajj_22_47_thousand_years);
    println!("• Derivasi Cahaya c  : {}", matrix.al_quran.sajdah_32_5_light_speed);
    println!("• Dilatasi Malaikat  : {}", matrix.al_quran.maarij_70_4_angelic_dilation);
    println!("• Ekspansi Ruang     : {}", matrix.al_quran.dzariyat_51_47_expanding_universe);
    println!("• Singularitas Awal  : {}", matrix.al_quran.anbiya_21_30_big_bang);
    println!("• Rekolaps Semesta   : {}", matrix.al_quran.anbiya_21_104_recollapse);

    // Verifikasi Kecepatan Cahaya
    let derived_c = RevelationalRatios::derived_speed_of_light();
    let c_error = (derived_c - SPEED_OF_LIGHT_M_S).abs() / SPEED_OF_LIGHT_M_S;
    println!("\n⚡ VALIDASI DERIVASI KECEPATAN CAHAYA DARI 12.000 ORBIT BULAN SIDERIS:");
    println!("  - Hasil Turunan Teori  : {:.3} m/s", derived_c);
    println!("  - Nilai Resmi CODATA c : {:.3} m/s", SPEED_OF_LIGHT_M_S);
    println!("  - Deviasi Relatif      : {:.6}% (AKURASI SANGAT TINGGI ✅)", c_error * 100.0);
    assert!(c_error < 0.0001);

    // Verifikasi Kecepatan Lorentz 50.000 Tahun
    let gamma_50k = RevelationalRatios::lorentz_factor_for_50k_years();
    let v_50k = RevelationalRatios::velocity_for_50k_years();
    let beta_50k = v_50k / SPEED_OF_LIGHT_M_S;
    println!("\n🚀 VALIDASI DILATASI RELATIVISTIK MALAIKAT (QS 70:4 - 50.000 TAHUN):");
    println!("  - Faktor Lorentz γ     : {:.6e}", gamma_50k);
    println!("  - Kecepatan Relativistik: {:.14} c", beta_50k);
    println!("  - Selisih dari c       : {:.6e} m/s", SPEED_OF_LIGHT_M_S - v_50k);
    assert!(beta_50k > 0.99999999999999);
}

#[test]
fn test_flrw_cosmic_time_evolution_and_epochs() {
    println!("\n=== UJI VALIDASI EVOLUSI KOSMOLOGI FLRW & 6 PERIODE KOSMIS ===");

    // 1. Uji Fajar Terang Pertama / Rekombinasi Atom (Genesis 1:3 & QS 24:35)
    // Redshift z = 1100 -> Radiasi Latar CMB terpancar
    let t_recombination = FLRWCosmology::redshift_to_cosmic_time(1100.0);
    println!("• Fajar Terang Pertama (z = 1100) : {:.0} Tahun setelah Big Bang", t_recombination);
    assert!(t_recombination > 300_000.0 && t_recombination < 450_000.0);

    // Suhu CMB pada z = 1100 harus sekitar 3000 Kelvin
    let a_recomb = 1.0 / 1101.0;
    let t_cmb_recomb = FLRWCosmology::cmb_temperature(a_recomb);
    println!("• Suhu CMB saat Rekombinasi      : {:.1} K (~3000 K)", t_cmb_recomb);
    assert!((t_cmb_recomb - 3000.0).abs() < 100.0);

    // 2. Uji Fajar Kosmis & Bintang Pertama (z = 20)
    let t_cosmic_dawn = FLRWCosmology::redshift_to_cosmic_time(20.0);
    println!("• Fajar Kosmis / Bintang Pertama (z = 20): {:.1} Juta Tahun", t_cosmic_dawn / 1e6);
    assert!(t_cosmic_dawn > 100e6 && t_cosmic_dawn < 300e6);

    // 3. Uji Pembentukan Tata Surya & Akresi Bumi (4.543 Miliar Tahun lalu)
    // t_earth_formation = 13.787 Gyr - 4.543 Gyr = 9.244 Gyr
    let t_earth_acc = UNIVERSE_AGE_YEARS - EARTH_AGE_YEARS;
    let z_earth_acc = FLRWCosmology::cosmic_time_to_redshift(t_earth_acc);
    let a_earth_acc = FLRWCosmology::cosmic_time_to_scale_factor(t_earth_acc);
    println!("• Akresi Bumi & Tata Surya       : {:.3} Gyr (z = {:.3}, a = {:.3})", t_earth_acc / 1e9, z_earth_acc, a_earth_acc);
    assert!((z_earth_acc - 0.43).abs() < 0.1);

    // 4. Uji Waktu Semesta Saat Ini (z = 0, a = 1)
    let a_now = FLRWCosmology::cosmic_time_to_scale_factor(UNIVERSE_AGE_YEARS);
    let h_now = FLRWCosmology::hubble_parameter(a_now);
    let cmb_now = FLRWCosmology::cmb_temperature(a_now);
    println!("• Faktor Skala Saat Ini a(t0)   : {:.5} (Target: 1.00000)", a_now);
    println!("• Parameter Hubble H0           : {:.2} km/s/Mpc", h_now);
    println!("• Suhu CMB Saat Ini             : {:.4} K", cmb_now);

    assert!((a_now - 1.0).abs() < 0.01);
    assert!((h_now - HUBBLE_CONSTANT_KM_S_MPC).abs() < 0.5);
    assert!((cmb_now - CMB_TEMPERATURE_K).abs() < 0.05);

    // 5. Uji Monotonisitas: Faktor skala a(t) harus selalu bertambah dengan waktu
    let times = [1e5, 1e7, 1e9, 5e9, 9.2e9, 13.787e9, 20e9];
    let mut prev_a = 0.0;
    for &t in times.iter() {
        let a = FLRWCosmology::cosmic_time_to_scale_factor(t);
        assert!(a > prev_a, "Non-monotonic expansion at t = {}", t);
        prev_a = a;
    }
}

#[test]
fn test_terrestrial_cmb_kinematic_time_dilation() {
    println!("\n=== UJI DILATASI WAKTU KINEMATIK BUMI TERHADAP FRAME KOSMIS ===");

    let dilation = TerrestrialCosmicKinematics::kinematic_time_dilation_factor();
    let lag_years = TerrestrialCosmicKinematics::accumulated_earth_lag_years();

    println!("• Faktor Dilatasi Kinematik Bumi : {:.10}", dilation);
    println!("• Selisih Laju Detik Jam Bumi   : {:.4e} detik/detik", 1.0 - dilation);
    println!("• Keterlambatan Waktu per Tahun : {:.2} detik/tahun", (1.0 - dilation) * 31557600.0);
    println!("• Akumulasi Lag Jam Bumi         : {:.1} Tahun selama usia Bumi", lag_years);

    // Jam lokal bumi tertinggal ~24 detik per tahun dari jam comoving kosmis diam
    let annual_lag_seconds = (1.0 - dilation) * 31557600.0;
    assert!((annual_lag_seconds - 24.0).abs() < 1.0);
    // Jam bumi tertinggal ~3.454 tahun selama 4.543 Miliar tahun bumi
    assert!(lag_years > 3000.0 && lag_years < 4000.0);
}

#[test]
fn test_historical_scriptural_eras_cosmic_timestamp() {
    println!("\n=== UJI EVALUASI WAKTU SEMESTA PADA ERA SEJARAH MANUSIA & WAHYU ===");

    let historical_eras = [
        ("Era Penciptaan Akresi Bumi (Genesis)", -4_543_000_000.0),
        ("Era Nabi Ibrahim / Abraham", -2000.0),
        ("Era Nabi Musa & Penurunan Taurat", -1300.0),
        ("Era Nabi Daud & Penurunan Zabur", -1000.0),
        ("Era Nabi Isa Al-Masih & Penurunan Injil", 30.0),
        ("Era Nabi Muhammad SAW & Al-Qur'an (Hijrah)", 622.0),
        ("Epoch Standar Astronomis IAU J2000.0", 2000.0),
        ("Tahun Berjalan Saat Ini", 2026.0),
    ];

    for (era_name, year) in historical_eras.iter() {
        let state = CosmicTimeEngine::evaluate_at_year(*year);
        println!("• {:<42} (Tahun {:>11.0}):", era_name, year);
        println!("  - Usia Semesta Total : {:.6} Miliar Tahun", state.age_of_universe_years / 1e9);
        println!("  - Total Detik Kosmis : {:.5e} s", state.total_cosmic_seconds);
        println!("  - Hari Ilahiah       : {:.2} Hari (Zabur 90:4 / 2 Petrus 3:8 / QS 22:47)", state.divine_days_elapsed);
        println!("  - Hari Skala Malaikat: {:.2} Hari (QS 70:4)", state.angelic_days_elapsed);
        println!("  - Status Periode     : {:?}", state.current_period);

        assert!(state.age_of_universe_years > 9_000_000_000.0);
        assert_eq!(state.current_period, CosmicPeriod::Period6_SolarSystemAndLife);
    }
}
