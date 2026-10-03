use mts_core::units::{Degrees, JulianDay};
use mts_ephemeris::{LunarEphemeris, LunarPosition, SolarEphemeris, SolarPosition};
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

/// Nama Fase Bulan Berdasarkan Sudut Elongasi
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LunarPhaseName {
    NewMoon,        // Ijtimak / Bulan Baru (~0°)
    WaxingCrescent, // Hilal Awal Bulan (0° - 90°)
    FirstQuarter,   // Kuartir Awal (~90°)
    WaxingGibbous,  // Bulan Cembung Bertambah (90° - 180°)
    FullMoon,       // Purnama Sejati / Istiqbal (~180°)
    WaningGibbous,  // Bulan Cembung Berkurang (180° - 270°)
    LastQuarter,    // Kuartir Akhir (~270°)
    WaningCrescent, // Bulan Sabit Tua (270° - 360°)
}

/// Vektor Keadaan True Celestial Clock (TCC)
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct TrueCelestialClockState {
    pub jd_tt: JulianDay,
    /// Sudut Elongasi Ekliptika Geosentris: \Delta\lambda = \lambda_{moon} - \lambda_{sun} [0.0, 360.0)
    pub elongation: Degrees,
    /// Sudut Fase Bulan (Phase Angle, i) dalam Derajat
    pub phase_angle: Degrees,
    /// Fraksi Piringan Bulan yang Tersinari Matahari [0.0, 1.0]
    pub illuminated_fraction: f64,
    /// Nama Fase Bulan
    pub phase_name: LunarPhaseName,
    /// Posisi Matahari
    pub sun: SolarPosition,
    /// Posisi Bulan
    pub moon: LunarPosition,
}

pub struct TrueCelestialClock;

impl TrueCelestialClock {
    /// Menghitung keadaan astronomis TCC pada Julian Day TT tertentu
    pub fn evaluate(jd: JulianDay) -> TrueCelestialClockState {
        let sun = SolarEphemeris::calculate(jd);
        let moon = LunarEphemeris::calculate(jd);

        // Elongasi Geosentris: \Delta\lambda = \lambda_{moon} - \lambda_{sun} mod 360
        let elongation = Degrees::new(moon.ecliptic_longitude.0 - sun.apparent_longitude.0).normalize();

        // Sudut Fase Bulan (i):
        // cos(i) = -cos(\beta) * cos(\lambda - \lambda_{sun})
        let bet_rad = moon.ecliptic_latitude.to_radians().0;
        let elong_rad = elongation.to_radians().0;
        let cos_i = -bet_rad.cos() * elong_rad.cos();
        let i_rad = cos_i.clamp(-1.0, 1.0).acos();
        let phase_angle = Degrees::new(i_rad * 180.0 / PI);

        // Fraksi Pencahayaan: k = (1 + cos(i)) / 2
        let illuminated_fraction = (1.0 + i_rad.cos()) / 2.0;

        // Klasifikasi Nama Fase
        let e = elongation.0;
        let phase_name = if e < 1.5 || e > 358.5 {
            LunarPhaseName::NewMoon
        } else if e < 88.5 {
            LunarPhaseName::WaxingCrescent
        } else if e <= 91.5 {
            LunarPhaseName::FirstQuarter
        } else if e < 178.5 {
            LunarPhaseName::WaxingGibbous
        } else if e <= 181.5 {
            LunarPhaseName::FullMoon
        } else if e < 268.5 {
            LunarPhaseName::WaningGibbous
        } else if e <= 271.5 {
            LunarPhaseName::LastQuarter
        } else {
            LunarPhaseName::WaningCrescent
        };

        TrueCelestialClockState {
            jd_tt: jd,
            elongation,
            phase_angle,
            illuminated_fraction,
            phase_name,
            sun,
            moon,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tcc_illumination_bounds() {
        let tcc = TrueCelestialClock::evaluate(JulianDay::J2000);
        assert!(tcc.illuminated_fraction >= 0.0 && tcc.illuminated_fraction <= 1.0);
        assert!(tcc.elongation.0 >= 0.0 && tcc.elongation.0 < 360.0);
    }
}
