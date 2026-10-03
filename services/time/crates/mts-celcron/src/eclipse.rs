use crate::solver::CelestialRootSolver;
use mts_core::units::JulianDay;
use mts_ephemeris::{LunarEphemeris, SolarEphemeris};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EclipseKind {
    Solar,
    Lunar,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EclipseType {
    Total,
    Annular,
    Hybrid,
    Partial,
    Penumbral,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EclipsePrediction {
    pub kind: EclipseKind,
    pub eclipse_type: EclipseType,
    pub julian_day: JulianDay,
    pub utc_datetime_str: String,
    pub moon_latitude_deg: f64,
    pub gamma: f64,
    pub magnitude: f64,
    pub saros_series: u32,
    pub saros_step_in_cycle: u32,
    pub description: String,
}

pub struct EclipsePredictor;

impl EclipsePredictor {
    /// Mencari gerhana matahari berikutnya setelah start_jd
    pub fn next_solar_eclipse(start_jd: JulianDay) -> Result<EclipsePrediction, &'static str> {
        let mut cur = start_jd;
        for _ in 0..30 {
            let conj_jd = CelestialRootSolver::next_conjunction(cur)?;
            let moon = LunarEphemeris::calculate(conj_jd);
            let beta = moon.ecliptic_latitude.0;

            // Batas gerhana matahari: |lintang bulan| < 1.55 derajat
            if beta.abs() < 1.55 {
                let sun = SolarEphemeris::calculate(conj_jd);
                let (e_type, mag, gamma) = Self::classify_solar(beta, moon.distance_km, sun.radius_vector_au);
                let (saros_num, saros_step) = Self::calculate_solar_saros(conj_jd);

                let dt = chrono::DateTime::from_timestamp_millis(
                    ((conj_jd.0 - 2440587.5) * 86400000.0) as i64,
                ).unwrap_or_default();

                let desc = match e_type {
                    EclipseType::Total => format!("Gerhana Matahari Total (Saros {})", saros_num),
                    EclipseType::Annular => format!("Gerhana Matahari Cincin (Saros {})", saros_num),
                    EclipseType::Hybrid => format!("Gerhana Matahari Hibrida / Cincin-Total (Saros {})", saros_num),
                    EclipseType::Partial => format!("Gerhana Matahari Sebagian (Saros {})", saros_num),
                    _ => "Gerhana Matahari".into(),
                };

                return Ok(EclipsePrediction {
                    kind: EclipseKind::Solar,
                    eclipse_type: e_type,
                    julian_day: conj_jd,
                    utc_datetime_str: dt.to_rfc3339(),
                    moon_latitude_deg: (beta * 1000.0).round() / 1000.0,
                    gamma: (gamma * 1000.0).round() / 1000.0,
                    magnitude: (mag * 1000.0).round() / 1000.0,
                    saros_series: saros_num,
                    saros_step_in_cycle: saros_step,
                    description: desc,
                });
            }
            cur = conj_jd + 20.0;
        }

        Err("Tidak ditemukan gerhana matahari dalam 30 bulan ke depan")
    }

    /// Mencari gerhana bulan berikutnya setelah start_jd
    pub fn next_lunar_eclipse(start_jd: JulianDay) -> Result<EclipsePrediction, &'static str> {
        let mut cur = start_jd;
        for _ in 0..30 {
            let opp_jd = CelestialRootSolver::next_opposition(cur)?;
            let moon = LunarEphemeris::calculate(opp_jd);
            let beta = moon.ecliptic_latitude.0;

            // Batas gerhana bulan: |lintang bulan| < 1.45 derajat
            if beta.abs() < 1.45 {
                let (e_type, mag, gamma) = Self::classify_lunar(beta);
                let (saros_num, saros_step) = Self::calculate_lunar_saros(opp_jd);

                let dt = chrono::DateTime::from_timestamp_millis(
                    ((opp_jd.0 - 2440587.5) * 86400000.0) as i64,
                ).unwrap_or_default();

                let desc = match e_type {
                    EclipseType::Total => format!("Gerhana Bulan Total (Saros {})", saros_num),
                    EclipseType::Partial => format!("Gerhana Bulan Sebagian (Saros {})", saros_num),
                    EclipseType::Penumbral => format!("Gerhana Bulan Penumbra (Saros {})", saros_num),
                    _ => "Gerhana Bulan".into(),
                };

                return Ok(EclipsePrediction {
                    kind: EclipseKind::Lunar,
                    eclipse_type: e_type,
                    julian_day: opp_jd,
                    utc_datetime_str: dt.to_rfc3339(),
                    moon_latitude_deg: (beta * 1000.0).round() / 1000.0,
                    gamma: (gamma * 1000.0).round() / 1000.0,
                    magnitude: (mag * 1000.0).round() / 1000.0,
                    saros_series: saros_num,
                    saros_step_in_cycle: saros_step,
                    description: desc,
                });
            }
            cur = opp_jd + 20.0;
        }

        Err("Tidak ditemukan gerhana bulan dalam 30 bulan ke depan")
    }

    /// Klasifikasi gerhana matahari berdasarkan lintang bulan dan rasio ukuran piringan
    fn classify_solar(beta_deg: f64, moon_dist_km: f64, sun_dist_au: f64) -> (EclipseType, f64, f64) {
        let abs_beta = beta_deg.abs();
        let gamma = beta_deg / 0.997; // Parameter gamma Meeus

        // Diameter sudut matahari (detik busur): ~1919.26 / R_au
        let sun_ang_rad = (1919.26 / sun_dist_au) / 2.0;
        // Diameter sudut bulan (detik busur): ~358474 / dist_km * 206265
        let moon_ang_rad = (1737.4 / moon_dist_km) * 206265.0;

        let ratio = moon_ang_rad / sun_ang_rad;

        if abs_beta < 0.99 {
            let mag = if ratio >= 1.0 { 1.0 + (ratio - 1.0) * 0.5 } else { ratio };
            if ratio >= 1.015 {
                (EclipseType::Total, mag, gamma)
            } else if ratio <= 0.985 {
                (EclipseType::Annular, mag, gamma)
            } else {
                (EclipseType::Hybrid, mag, gamma)
            }
        } else {
            let mag = (1.55 - abs_beta) / (1.55 - 0.99) * 0.95;
            (EclipseType::Partial, mag.max(0.05), gamma)
        }
    }

    /// Klasifikasi gerhana bulan
    fn classify_lunar(beta_deg: f64) -> (EclipseType, f64, f64) {
        let abs_beta = beta_deg.abs();
        let gamma = beta_deg / 0.46;

        if abs_beta < 0.46 {
            let mag = 1.0 + (0.46 - abs_beta) / 0.46 * 0.8;
            (EclipseType::Total, mag, gamma)
        } else if abs_beta < 0.95 {
            let mag = (0.95 - abs_beta) / (0.95 - 0.46);
            (EclipseType::Partial, mag, gamma)
        } else {
            let mag = (1.45 - abs_beta) / (1.45 - 0.95) * 0.9;
            (EclipseType::Penumbral, mag, gamma)
        }
    }

    /// Menghitung nomor seri Saros Matahari dan langkah dalam siklus 223 bulan
    fn calculate_solar_saros(jd: JulianDay) -> (u32, u32) {
        // Titik acuan: Great American Solar Eclipse 2017-08-21 (JD 2457987.27) = Saros 145
        let ref_jd = 2457987.27;
        let synodic_month = 29.530588853;
        let delta_months = ((jd.0 - ref_jd) / synodic_month).round() as i64;

        // Derivasi matematis rasio roda gigi Antikythera:
        // Tiap 1 bulan sinodik, pergeseran posisi seri Saros adalah (38 mod 223)
        let saros_shift = (delta_months * 38) % 223;
        let saros_num = (145 + saros_shift).rem_euclid(223) as u32;

        let total_months_epoch = ((jd.0 - 2451545.0) / synodic_month).floor() as u32;
        let step_in_cycle = (total_months_epoch % 223) + 1;

        (if saros_num == 0 { 223 } else { saros_num }, step_in_cycle)
    }

    /// Menghitung nomor seri Saros Bulan
    fn calculate_lunar_saros(jd: JulianDay) -> (u32, u32) {
        // Titik acuan: Total Lunar Eclipse 2018-07-27 (JD 2458327.34) = Saros 129
        let ref_jd = 2458327.34;
        let synodic_month = 29.530588853;
        let delta_months = ((jd.0 - ref_jd) / synodic_month).round() as i64;

        let saros_shift = (delta_months * 38) % 223;
        let saros_num = (129 + saros_shift).rem_euclid(223) as u32;

        let total_months_epoch = ((jd.0 - 2451545.0) / synodic_month).floor() as u32;
        let step_in_cycle = (total_months_epoch % 223) + 1;

        (if saros_num == 0 { 223 } else { saros_num }, step_in_cycle)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_solar_eclipse_search() {
        // Cari gerhana matahari setelah 1 Januari 2026 (JD ~ 2461041.5)
        let res = EclipsePredictor::next_solar_eclipse(JulianDay::new(2461041.5));
        assert!(res.is_ok());
        let eclipse = res.unwrap();
        assert_eq!(eclipse.kind, EclipseKind::Solar);
        assert!(eclipse.julian_day.0 > 2461041.5);
    }

    #[test]
    fn test_lunar_eclipse_search() {
        // Cari gerhana bulan setelah 1 Januari 2026 (JD ~ 2461041.5)
        let res = EclipsePredictor::next_lunar_eclipse(JulianDay::new(2461041.5));
        assert!(res.is_ok());
        let eclipse = res.unwrap();
        assert_eq!(eclipse.kind, EclipseKind::Lunar);
        assert!(eclipse.julian_day.0 > 2461041.5);
    }
}
