use mts_core::units::{Degrees, JulianDay};
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

/// Posisi Matahari Sejati di Langit (Meeus Astronomical Algorithms / VSOP87)
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct SolarPosition {
    /// Bujur Ekliptika Tampak Matahari (Apparent Ecliptic Longitude, \lambda_{sun})
    pub apparent_longitude: Degrees,
    /// Asensio Rekta (Right Ascension, \alpha)
    pub right_ascension: Degrees,
    /// Deklinasi (Declination, \delta)
    pub declination: Degrees,
    /// Jarak Bumi - Matahari dalam Satuan Astronomi (AU)
    pub radius_vector_au: f64,
}

pub struct SolarEphemeris;

impl SolarEphemeris {
    /// Menghitung posisi matahari pada Julian Day TT
    pub fn calculate(jd: JulianDay) -> SolarPosition {
        let t: f64 = jd.to_centuries().0;

        // 1. Bujur Rata-rata Geometris Matahari (L0) dalam derajat
        let l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
        let l0 = Degrees::new(l0).normalize();

        // 2. Anomali Rata-rata Matahari (M) dalam derajat
        let m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
        let m_deg = Degrees::new(m).normalize();
        let m_rad: f64 = m_deg.to_radians().0;

        // 3. Eksentrisitas Orbit Bumi (e)
        let e: f64 = 0.016708634 - 0.000042037 * t - 0.0000001267 * t * t;

        // 4. Persamaan Pusat Matahari (C)
        let c = (1.914602 - 0.004817 * t - 0.000014 * t * t) * m_rad.sin()
            + (0.019993 - 0.000101 * t) * f64::sin(2.0 * m_rad)
            + 0.000289 * f64::sin(3.0 * m_rad);

        // 5. Bujur Sejati Matahari (\odot)
        let true_lon = Degrees::new(l0.0 + c).normalize();

        // 6. Jarak Bumi - Matahari (R) dalam AU
        let nu_rad = (m_deg.0 + c) * PI / 180.0;
        let r = (1.000001018 * (1.0 - e * e)) / (1.0 + e * nu_rad.cos());

        // 7. Koreksi Nutasi dan Aberasi Cahaya untuk Bujur Tampak (\lambda)
        let omega = 125.04 - 1934.136 * t; // Bujur simpul orbit bulan
        let omega_rad = omega * PI / 180.0;
        let apparent_lon = Degrees::new(true_lon.0 - 0.00569 - 0.00478 * omega_rad.sin()).normalize();

        // 8. Kemiringan Ekliptika Sejati (\epsilon)
        let eps0 = 23.4392911 - (46.8150 * t + 0.00059 * t * t - 0.001813 * t.powi(3)) / 3600.0;
        let eps = eps0 + 0.00256 * omega_rad.cos(); // Obliquity terkoreksi nutasi
        let eps_rad = eps * PI / 180.0;

        // 9. Transformasi ke Koordinat Ekuator (Right Ascension \alpha & Declination \delta)
        let lam_rad = apparent_lon.to_radians().0;
        let ra = (lam_rad.sin() * eps_rad.cos()).atan2(lam_rad.cos());
        let ra_deg = Degrees::new(ra * 180.0 / PI).normalize();

        let dec = (eps_rad.sin() * lam_rad.sin()).asin();
        let dec_deg = Degrees::new(dec * 180.0 / PI);

        SolarPosition {
            apparent_longitude: apparent_lon,
            right_ascension: ra_deg,
            declination: dec_deg,
            radius_vector_au: r,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_solar_at_j2000() {
        // Pada J2000.0 (1 Jan 2000 12h TT), bujur matahari sekitar ~280.46 derajat
        let pos = SolarEphemeris::calculate(JulianDay::J2000);
        assert!((pos.apparent_longitude.0 - 280.46).abs() < 1.0);
        assert!((pos.radius_vector_au - 0.983).abs() < 0.01); // Dekat perihelion di bulan Januari
    }

    #[test]
    fn test_solar_equinox() {
        // Vernal Equinox 2026 (~20 Maret 2026): Deklinasi matahari harus mendekati 0 derajat
        // JD ~ 2461120.0
        let pos = SolarEphemeris::calculate(JulianDay::new(2461120.0));
        assert!(pos.declination.0.abs() < 0.5);
    }
}
