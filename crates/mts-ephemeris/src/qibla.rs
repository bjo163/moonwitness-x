use crate::topocentric::GeoLocation;
use mts_core::units::{Degrees, JulianDay};
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

/// Koordinat Geografis Ka'bah di Masjidil Haram, Makkah al-Mukarramah
pub const KAABA_LATITUDE_DEG: f64 = 21.422487;
pub const KAABA_LONGITUDE_DEG: f64 = 39.826206;
pub const KAABA_ELEVATION_METERS: f64 = 277.0;
pub const EARTH_RADIUS_KM: f64 = 6371.0088;

/// Informasi Lengkap Arah Kiblat dan Geodesi ke Makkah
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct QiblaBearing {
    /// Azimuth Kiblat dari Utara Sejati searah jarum jam (0..360°)
    pub bearing_deg: Degrees,
    /// Jarak Lingkaran Besar (Great Circle Geodesic) ke Ka'bah dalam Kilometer
    pub distance_km: f64,
    /// Kompas mata angin (contoh: "WNW", "NW", "E")
    pub cardinal_direction: String,
    /// Deskripsi orientasi relatif terhadap ufuk barat (contoh: "25.18° dari Barat ke Utara")
    pub west_offset_deg: f64,
}

pub struct QiblaCalculator;

impl QiblaCalculator {
    /// Menghitung arah azimuth Kiblat dan jarak geodesi dari posisi pengamat
    pub fn calculate(loc: &GeoLocation) -> QiblaBearing {
        let phi1 = loc.latitude.to_radians().0;
        let phi2 = KAABA_LATITUDE_DEG * PI / 180.0;
        let lambda1 = loc.longitude.to_radians().0;
        let lambda2 = KAABA_LONGITUDE_DEG * PI / 180.0;

        let delta_lambda = lambda2 - lambda1;

        // Formula Trigonometri Sferis Forward Azimuth:
        // tan(q) = sin(\Delta\lambda) / (cos(\phi_1) * tan(\phi_2) - sin(\phi_1) * cos(\Delta\lambda))
        let y = delta_lambda.sin();
        let x = phi1.cos() * phi2.tan() - phi1.sin() * delta_lambda.cos();
        let q_rad = y.atan2(x);
        let mut q_deg = q_rad * 180.0 / PI;
        if q_deg < 0.0 {
            q_deg += 360.0;
        }
        let bearing_deg = Degrees::new(q_deg);

        // Jarak Geodesi menggunakan Rumus Haversine:
        let d_phi = phi2 - phi1;
        let a = (d_phi / 2.0).sin().powi(2)
            + phi1.cos() * phi2.cos() * (delta_lambda / 2.0).sin().powi(2);
        let c = 2.0 * a.sqrt().asin();
        let distance_km = (EARTH_RADIUS_KM * c * 100.0).round() / 100.0;

        // Offset terhadap arah Barat (270°)
        let west_offset_deg = ((q_deg - 270.0) * 100.0).round() / 100.0;

        let cardinal_direction = Self::degrees_to_cardinal(q_deg);

        QiblaBearing {
            bearing_deg,
            distance_km,
            cardinal_direction,
            west_offset_deg,
        }
    }

    /// Mengonversi derajat azimuth ke nama mata angin 16 arah kompas
    pub fn degrees_to_cardinal(deg: f64) -> String {
        let normalized = (deg % 360.0 + 360.0) % 360.0;
        let directions = [
            "U (Utara)",
            "UUT (Utara-Utara Timur)",
            "TL (Timur Laut)",
            "TTL (Timur-Timur Laut)",
            "T (Timur)",
            "TTG (Timur-Tenggara)",
            "TG (Tenggara)",
            "STG (Selatan-Tenggara)",
            "S (Selatan)",
            "SBD (Selatan-Barat Daya)",
            "BD (Barat Daya)",
            "BBD (Barat-Barat Daya)",
            "B (Barat)",
            "BBL (Barat-Barat Laut)",
            "BL (Barat Laut)",
            "UBL (Utara-Barat Laut)",
        ];
        let index = ((normalized + 11.25) / 22.5).floor() as usize % 16;
        directions[index].to_string()
    }

    /// Menghitung apakah matahari saat ini sedang berada tepat di zenith Ka'bah (Istiwa A'zham / Rashdul Qiblah)
    /// Ketika Rashdul Qiblah terjadi, bayangan benda tegak lurus di belahan bumi siang mengarah persis ke Kiblat.
    pub fn is_rashdul_qiblah(solar_dec_deg: f64, solar_ra_deg: f64, jd: JulianDay) -> bool {
        // Deklinasi matahari harus berada dalam toleransi ~0.15 derajat dari lintang Ka'bah (21.42°)
        let dec_match = (solar_dec_deg - KAABA_LATITUDE_DEG).abs() < 0.15;
        if !dec_match {
            return false;
        }

        // Matahari harus berada di meridian Makkah (LST_makkah == RA_sun)
        let kaaba_loc = GeoLocation::new(KAABA_LATITUDE_DEG, KAABA_LONGITUDE_DEG, KAABA_ELEVATION_METERS);
        let lst = crate::topocentric::TopocentricConverter::lst(jd, kaaba_loc.longitude);
        let ha_makkah = (lst.0 - solar_ra_deg).abs() % 360.0;
        let hour_angle_diff = if ha_makkah > 180.0 { 360.0 - ha_makkah } else { ha_makkah };

        hour_angle_diff < 0.5 // Dalam ~2 menit busur dari zawwal Makkah
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jakarta_qibla() {
        // Jakarta Monas (-6.1754, 106.8272) arah kiblat sekitar ~295.14° (Barat Laut)
        let jkt = GeoLocation::jakarta();
        let q = QiblaCalculator::calculate(&jkt);

        assert!((q.bearing_deg.0 - 295.14).abs() < 0.5);
        assert!((q.distance_km - 7915.0).abs() < 50.0);
        assert!(q.cardinal_direction.contains("Barat Laut"));
    }

    #[test]
    fn test_bosscha_qibla() {
        let bosscha = GeoLocation::bosscha();
        let q = QiblaCalculator::calculate(&bosscha);

        assert!((q.bearing_deg.0 - 295.2).abs() < 0.5);
        assert!((q.distance_km - 8025.0).abs() < 50.0);
    }
}
