use mts_core::units::{Degrees, JulianDay};
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

/// Posisi Bulan Sejati di Langit (Meeus Astronomical Algorithms / Chapront ELP-2000)
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct LunarPosition {
    /// Bujur Ekliptika Geosentris Bulan (\lambda_{moon})
    pub ecliptic_longitude: Degrees,
    /// Lintang Ekliptika Geosentris Bulan (\beta_{moon})
    pub ecliptic_latitude: Degrees,
    /// Jarak Bumi - Bulan dalam Kilometer (\Delta_{km})
    pub distance_km: f64,
    /// Asensio Rekta Ekuatorial (\alpha_{moon})
    pub right_ascension: Degrees,
    /// Deklinasi Ekuatorial (\delta_{moon})
    pub declination: Degrees,
    /// Paralaks Horizontal Ekuatorial Bulan (\pi) dalam Derajat
    pub horizontal_parallax: Degrees,
}

pub struct LunarEphemeris;

impl LunarEphemeris {
    /// Menghitung posisi geosentris bulan pada Julian Day TT
    pub fn calculate(jd: JulianDay) -> LunarPosition {
        let t: f64 = jd.to_centuries().0;

        // 1. Argumen Dasar Orbit Bulan (dalam derajat)
        // L': Bujur Rata-rata Bulan
        let lp = 218.3164477 + 481267.88123421 * t - 0.0015786 * t * t + t.powi(3) / 538841.0;
        let lp_deg = Degrees::new(lp).normalize();

        // D: Elongasi Rata-rata Bulan
        let d = 297.8501921 + 445267.1114034 * t - 0.0018819 * t * t + t.powi(3) / 545868.0;
        let d_deg = Degrees::new(d).normalize();

        // M: Anomali Rata-rata Matahari
        let m = 357.5291092 + 35999.0502909 * t - 0.0001536 * t * t + t.powi(3) / 24490000.0;
        let m_deg = Degrees::new(m).normalize();

        // M': Anomali Rata-rata Bulan
        let mp = 134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + t.powi(3) / 69699.0;
        let mp_deg = Degrees::new(mp).normalize();

        // F: Argumen Lintang Bulan
        let f = 93.2720950 + 483202.0175233 * t - 0.0036539 * t * t - t.powi(3) / 3526000.0;
        let f_deg = Degrees::new(f).normalize();

        let d_rad: f64 = d_deg.to_radians().0;
        let m_rad: f64 = m_deg.to_radians().0;
        let mp_rad: f64 = mp_deg.to_radians().0;
        let f_rad: f64 = f_deg.to_radians().0;

        // Faktor eksentrisitas bumi E
        let e: f64 = 1.0 - 0.002516 * t - 0.0000074 * t * t;

        // 2. Perturbasi Periodik Terbesar untuk Bujur Bulan (\Sigma l) dalam seperseribu derajat (0.000001 deg)
        let mut sigma_l: f64 = 0.0;
        sigma_l += 6288774.0 * f64::sin(mp_rad);                                // Persamaan Pusat Pokok
        sigma_l += 1274027.0 * f64::sin(2.0 * d_rad - mp_rad);               // Evection
        sigma_l += 658314.0 * f64::sin(2.0 * d_rad);                          // Variasi
        sigma_l += 213618.0 * f64::sin(2.0 * mp_rad);
        sigma_l += -185116.0 * e * f64::sin(m_rad);                            // Annual Equation
        sigma_l += -114332.0 * f64::sin(2.0 * f_rad);                         // Pengurangan
        sigma_l += 58793.0 * f64::sin(2.0 * d_rad - 2.0 * mp_rad);
        sigma_l += 57066.0 * f64::sin(2.0 * d_rad - m_rad - mp_rad) * e;
        sigma_l += 53322.0 * f64::sin(2.0 * d_rad + mp_rad);
        sigma_l += 45758.0 * f64::sin(2.0 * d_rad - m_rad) * e;
        sigma_l += -40923.0 * f64::sin(m_rad - mp_rad) * e;
        sigma_l += -34720.0 * f64::sin(d_rad);
        sigma_l += -30383.0 * f64::sin(m_rad + mp_rad) * e;
        sigma_l += 15327.0 * f64::sin(2.0 * d_rad - 2.0 * f_rad);
        sigma_l += -12528.0 * f64::sin(2.0 * f_rad + mp_rad);
        sigma_l += 10980.0 * f64::sin(2.0 * f_rad - mp_rad);

        // 3. Perturbasi Periodik untuk Lintang Bulan (\Sigma b)
        let mut sigma_b: f64 = 0.0;
        sigma_b += 5128122.0 * f64::sin(f_rad);
        sigma_b += 280602.0 * f64::sin(mp_rad + f_rad);
        sigma_b += 277693.0 * f64::sin(mp_rad - f_rad);
        sigma_b += 173237.0 * f64::sin(2.0 * d_rad - f_rad);
        sigma_b += 55413.0 * f64::sin(2.0 * d_rad - mp_rad + f_rad);
        sigma_b += 46271.0 * f64::sin(2.0 * d_rad - mp_rad - f_rad);
        sigma_b += 32573.0 * f64::sin(2.0 * d_rad + f_rad);
        sigma_b += 17198.0 * f64::sin(2.0 * mp_rad + f_rad);
        sigma_b += 9266.0 * f64::sin(2.0 * d_rad + mp_rad - f_rad);
        sigma_b += 8822.0 * f64::sin(2.0 * mp_rad - f_rad);

        // 4. Perturbasi Periodik untuk Jarak Bumi - Bulan (\Sigma r) dalam meter
        let mut sigma_r: f64 = 0.0;
        sigma_r += -20905355.0 * f64::cos(mp_rad);
        sigma_r += -3699111.0 * f64::cos(2.0 * d_rad - mp_rad);
        sigma_r += -2955968.0 * f64::cos(2.0 * d_rad);
        sigma_r += -569925.0 * f64::cos(2.0 * mp_rad);
        sigma_r += 48888.0 * e * f64::cos(m_rad);
        sigma_r += -3149.0 * f64::cos(2.0 * f_rad);
        sigma_r += 246158.0 * f64::cos(2.0 * d_rad - 2.0 * mp_rad);
        sigma_r += -152138.0 * f64::cos(2.0 * d_rad - m_rad - mp_rad) * e;
        sigma_r += -170733.0 * f64::cos(2.0 * d_rad + mp_rad);

        // 5. Perhitungan Akhir Bujur, Lintang, dan Jarak
        let lon_deg = lp_deg.0 + (sigma_l / 1000000.0);
        let ecliptic_lon = Degrees::new(lon_deg).normalize();

        let lat_deg = sigma_b / 1000000.0;
        let ecliptic_lat = Degrees::new(lat_deg);

        let distance_km = 385000.56 + (sigma_r / 1000.0);

        // 6. Paralaks Horizontal Ekuatorial
        // sin(\pi) = 6378.14 / distance_km
        let hp_rad = f64::asin(6378.14 / distance_km);
        let horizontal_parallax = Degrees::new(hp_rad * 180.0 / PI);

        // 7. Kemiringan Ekliptika (\epsilon)
        let eps0 = 23.4392911 - (46.8150 * t) / 3600.0;
        let eps_rad = eps0 * PI / 180.0;

        // 8. Transformasi Koordinat Ekuator (\alpha dan \delta)
        let lam_rad = ecliptic_lon.to_radians().0;
        let bet_rad = ecliptic_lat.to_radians().0;

        let ra_y = lam_rad.sin() * eps_rad.cos() - bet_rad.tan() * eps_rad.sin();
        let ra_x = lam_rad.cos();
        let ra = ra_y.atan2(ra_x);
        let ra_deg = Degrees::new(ra * 180.0 / PI).normalize();

        let dec = bet_rad.sin() * eps_rad.cos() + bet_rad.cos() * eps_rad.sin() * lam_rad.sin();
        let dec_deg = Degrees::new(dec.asin() * 180.0 / PI);

        LunarPosition {
            ecliptic_longitude: ecliptic_lon,
            ecliptic_latitude: ecliptic_lat,
            distance_km,
            right_ascension: ra_deg,
            declination: dec_deg,
            horizontal_parallax,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lunar_distance_limits() {
        // Jarak bulan ke bumi harus berada di antara 356.000 km (perigee) dan 407.000 km (apogee)
        let pos = LunarEphemeris::calculate(JulianDay::J2000);
        assert!(pos.distance_km > 356000.0 && pos.distance_km < 407000.0);
    }

    #[test]
    fn test_lunar_latitude_limits() {
        // Lintang ekliptika bulan tidak pernah melebihi kemiringan orbit ~5.3 derajat
        let pos = LunarEphemeris::calculate(JulianDay::J2000);
        assert!(pos.ecliptic_latitude.0.abs() < 5.35);
    }
}
