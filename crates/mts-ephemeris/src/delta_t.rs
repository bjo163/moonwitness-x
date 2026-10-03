use mts_core::units::JulianDay;

/// Mesin Kalkulasi Delta T (\Delta T = TT - UT1) dalam Detik
///
/// Menggunakan formulasi polinomial Fred Espenak & Jean Meeus (NASA Eclipse Web Site)
/// yang mencakup rentang -3000 SM hingga +3000 Masehi.
pub struct DeltaT;

impl DeltaT {
    /// Menghitung perkiraan \Delta T dalam detik untuk tahun Masehi (pecahan)
    pub fn estimate(year: f64) -> f64 {
        if year < -500.0 {
            let u = (year - 1820.0) / 100.0;
            -20.0 + 32.0 * u * u
        } else if year < 500.0 {
            let u = year / 100.0;
            10583.6 - 1014.41 * u + 33.78311 * u.powi(2) - 5.952053 * u.powi(3)
                - 0.179840 * u.powi(4) + 0.022174192 * u.powi(5) + 0.0090316521 * u.powi(6)
        } else if year < 1600.0 {
            let u = (year - 1000.0) / 100.0;
            1574.2 - 556.01 * u + 71.23472 * u.powi(2) + 0.319781 * u.powi(3)
                - 0.8503463 * u.powi(4) - 0.005050998 * u.powi(5) + 0.0083572073 * u.powi(6)
        } else if year < 1700.0 {
            let t = year - 1600.0;
            120.0 - 0.9808 * t - 0.01532 * t.powi(2) + t.powi(3) / 7129.0
        } else if year < 1800.0 {
            let t = year - 1700.0;
            8.83 + 0.1603 * t - 0.0059285 * t.powi(2) + 0.00013336 * t.powi(3) - t.powi(4) / 1174000.0
        } else if year < 1860.0 {
            let t = year - 1800.0;
            13.72 - 0.332447 * t + 0.0068612 * t.powi(2) + 0.0041116 * t.powi(3)
                - 0.00037436 * t.powi(4) + 0.0000121272 * t.powi(5) - 0.0000001699 * t.powi(6)
                + 0.000000000875 * t.powi(7)
        } else if year < 1900.0 {
            let t = year - 1860.0;
            7.62 + 0.5737 * t - 0.251754 * t.powi(2) + 0.01680668 * t.powi(3)
                - 0.0004473624 * t.powi(4) + t.powi(5) / 233174.0
        } else if year < 1920.0 {
            let t = year - 1900.0;
            -2.79 + 1.494119 * t - 0.0598939 * t.powi(2) + 0.0061966 * t.powi(3)
                - 0.000197 * t.powi(4)
        } else if year < 1941.0 {
            let t = year - 1920.0;
            21.20 + 0.84493 * t - 0.076100 * t.powi(2) + 0.0020936 * t.powi(3)
        } else if year < 1961.0 {
            let t = year - 1941.0;
            29.07 + 0.407 * t - t.powi(2) / 233.0 + t.powi(3) / 2547.0
        } else if year < 1986.0 {
            let t = year - 1961.0;
            45.45 + 1.067 * t - t.powi(2) / 260.0 - t.powi(3) / 718.0
        } else if year < 2005.0 {
            let t = year - 2000.0;
            63.86 + 0.3345 * t - 0.060374 * t.powi(2) + 0.0017275 * t.powi(3)
                + 0.000651814 * t.powi(4) + 0.00002373599 * t.powi(5)
        } else if year < 2050.0 {
            let t = year - 2000.0;
            62.92 + 0.32217 * t + 0.005589 * t.powi(2)
        } else if year < 2150.0 {
            -20.0 + 32.0 * ((year - 1820.0) / 100.0).powi(2) - 0.5628 * (2150.0 - year)
        } else {
            let u = (year - 1820.0) / 100.0;
            -20.0 + 32.0 * u * u
        }
    }

    /// Mengonversi Julian Day TT (Terrestrial Time) ke Julian Day UT (Universal Time)
    pub fn tt_to_ut(jd_tt: JulianDay, year: f64) -> JulianDay {
        let dt_seconds = Self::estimate(year);
        JulianDay::new(jd_tt.0 - dt_seconds / 86400.0)
    }

    /// Mengonversi Julian Day UT ke Julian Day TT
    pub fn ut_to_tt(jd_ut: JulianDay, year: f64) -> JulianDay {
        let dt_seconds = Self::estimate(year);
        JulianDay::new(jd_ut.0 + dt_seconds / 86400.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_delta_t_year_2000() {
        let dt = DeltaT::estimate(2000.0);
        // Tahun 2000: Delta T sekitar 63.8 detik
        assert!((dt - 63.8).abs() < 1.5);
    }

    #[test]
    fn test_delta_t_year_2026() {
        let dt = DeltaT::estimate(2026.0);
        // Tahun 2026: Delta T sekitar 72 - 75 detik
        assert!(dt > 70.0 && dt < 80.0);
    }
}
