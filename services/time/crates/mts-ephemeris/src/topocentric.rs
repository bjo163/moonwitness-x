use mts_core::units::{Degrees, JulianDay};
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

/// Lokasi Geografis Pengamat di Permukaan Bumi
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct GeoLocation {
    /// Garis Lintang dalam Derajat (-90.0 s/d +90.0, Positif = Utara)
    pub latitude: Degrees,
    /// Garis Bujur dalam Derajat (-180.0 s/d +180.0, Positif = Timur)
    pub longitude: Degrees,
    /// Ketinggian Pengamat di Atas Permukaan Laut dalam Meter (mdpl)
    pub elevation_meters: f64,
}

impl GeoLocation {
    pub fn new(latitude_deg: f64, longitude_deg: f64, elevation_meters: f64) -> Self {
        Self {
            latitude: Degrees::new(latitude_deg),
            longitude: Degrees::new(longitude_deg),
            elevation_meters,
        }
    }

    /// Lokasi Patokan: Observatorium Bosscha, Lembang, Indonesia
    pub fn bosscha() -> Self {
        Self::new(-6.8247, 107.6172, 1310.0)
    }

    /// Lokasi Patokan: Mekkah (Masjidil Haram)
    pub fn mecca() -> Self {
        Self::new(21.4225, 39.8262, 277.0)
    }

    /// Lokasi Patokan: Jakarta (Monas)
    pub fn jakarta() -> Self {
        Self::new(-6.1754, 106.8272, 8.0)
    }
}

/// Posisi Toposentrik di Ufuk Pengamat Lokal (Horizontal Coordinates)
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct HorizontalCoordinates {
    /// Ketinggian di Atas Ufuk (Altitude, h) dalam Derajat
    pub altitude: Degrees,
    /// Azimuth (A) dalam Derajat diukur dari Utara ke Timur (0..360)
    pub azimuth: Degrees,
    /// Ketinggian Terkoreksi Refraksi Atmosfer
    pub apparent_altitude: Degrees,
}

pub struct TopocentricConverter;

impl TopocentricConverter {
    /// Menghitung Greenwich Mean Sidereal Time (GMST) dalam Derajat
    pub fn gmst(jd: JulianDay) -> Degrees {
        let t = jd.to_centuries().0;
        let theta = 280.46061837 + 360.98564736629 * (jd.0 - 2451545.0)
            + 0.000387933 * t * t - t.powi(3) / 38710000.0;
        Degrees::new(theta).normalize()
    }

    /// Menghitung Local Sidereal Time (LST) dalam Derajat
    pub fn lst(jd: JulianDay, geo_lon: Degrees) -> Degrees {
        let gmst = Self::gmst(jd);
        Degrees::new(gmst.0 + geo_lon.0).normalize()
    }

    /// Mengonversi Koordinat Ekuator Geosentris (\alpha, \delta) ke Toposentrik Horizontal (Alt, Az)
    pub fn to_horizontal(
        jd: JulianDay,
        ra: Degrees,
        dec: Degrees,
        loc: &GeoLocation,
    ) -> HorizontalCoordinates {
        let lst = Self::lst(jd, loc.longitude);
        let ha_deg = Degrees::new(lst.0 - ra.0).normalize();
        let ha_rad = ha_deg.to_radians().0;

        let lat_rad = loc.latitude.to_radians().0;
        let dec_rad = dec.to_radians().0;

        // sin(h) = sin(\phi) * sin(\delta) + cos(\phi) * cos(\delta) * cos(H)
        let sin_alt = lat_rad.sin() * dec_rad.sin() + lat_rad.cos() * dec_rad.cos() * ha_rad.cos();
        let alt_rad = sin_alt.asin();
        let alt_deg = Degrees::new(alt_rad * 180.0 / PI);

        // cos(A) = (sin(\delta) - sin(\phi) * sin(h)) / (cos(\phi) * cos(h))
        let cos_alt = alt_rad.cos();
        let az_rad = if cos_alt.abs() > 1e-7 {
            let num = dec_rad.sin() - lat_rad.sin() * sin_alt;
            let den = lat_rad.cos() * cos_alt;
            let cos_a = (num / den).clamp(-1.0, 1.0);
            let a = cos_a.acos();
            if ha_rad.sin() > 0.0 {
                2.0 * PI - a
            } else {
                a
            }
        } else {
            0.0
        };
        let az_deg = Degrees::new(az_rad * 180.0 / PI).normalize();

        // Koreksi Refraksi Atmosfer Bennett (1982)
        let refraction_deg = if alt_deg.0 > -1.0 {
            let h = alt_deg.0;
            // R dalam menit busur: R = 1 / tan(h + 7.31 / (h + 4.4))
            let r_arcmin = 1.0 / ((h + 7.31 / (h + 4.4)) * PI / 180.0).tan();
            r_arcmin / 60.0
        } else {
            0.0
        };

        let apparent_alt = Degrees::new(alt_deg.0 + refraction_deg);

        HorizontalCoordinates {
            altitude: alt_deg,
            azimuth: az_deg,
            apparent_altitude: apparent_alt,
        }
    }

    /// Koreksi Paralaks Toposentrik Bulan
    /// Memperhitungkan posisi pengamat di permukaan bumi (bukan di pusat bumi)
    pub fn correct_lunar_parallax(
        geo_alt: Degrees,
        horizontal_parallax: Degrees,
        elevation_meters: f64,
    ) -> Degrees {
        let pi_rad = horizontal_parallax.to_radians().0;
        let alt_rad = geo_alt.to_radians().0;

        // Koreksi elevasi pengamat (Dip ufuk)
        let dip_deg = 0.0293 * elevation_meters.sqrt() / 60.0;
        
        // Paralaks toposentrik mengurangi ketinggian bulan: h_topo \approx h_geo - \pi * cos(h_geo)
        let parallax_correction = pi_rad * alt_rad.cos();
        let topo_alt_deg = geo_alt.0 - (parallax_correction * 180.0 / PI) - dip_deg;

        Degrees::new(topo_alt_deg)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sidereal_time_validity() {
        let gmst = TopocentricConverter::gmst(JulianDay::J2000);
        // GMST pada J2000.0 sekitar 280.46 derajat (18.697 jam)
        assert!((gmst.0 - 280.46).abs() < 1.0);
    }

    #[test]
    fn test_horizontal_conversion() {
        let loc = GeoLocation::jakarta();
        let coords = TopocentricConverter::to_horizontal(
            JulianDay::J2000,
            Degrees::new(280.0),
            Degrees::new(-23.0),
            &loc,
        );
        assert!(coords.azimuth.0 >= 0.0 && coords.azimuth.0 < 360.0);
    }
}
