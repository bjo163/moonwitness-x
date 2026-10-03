use crate::rational::GearRatio;
use crate::units::Degrees;
use serde::{Deserialize, Serialize};

/// Roda Gigi Siklus Metonik (Metonic Dial)
///
/// Rasio: 235 Bulan Sinodik = 19 Tahun Matahari (Tropis).
/// Digunakan pada dial spiral belakang bagian atas Mekanisme Antikythera.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct MetonicGear {
    pub ratio: GearRatio,
}

impl Default for MetonicGear {
    fn default() -> Self {
        Self {
            ratio: GearRatio::new(235, 19),
        }
    }
}

impl MetonicGear {
    pub const TOTAL_MONTHS: u32 = 235;
    pub const TOTAL_YEARS: u32 = 19;

    /// Tahun-tahun dalam siklus 19 tahun yang memiliki 13 bulan (bulan kabisat/embolismic)
    /// Siklus tradisional Babilonia & Yunani Kuno: Tahun ke-3, 6, 8, 11, 14, 17, 19
    pub const EMBOLISMIC_YEARS: [u32; 7] = [3, 6, 8, 11, 14, 17, 19];

    pub fn new() -> Self {
        Self::default()
    }

    /// Apakah tahun ke-N dalam siklus Metonik (1..=19) adalah tahun kabisat (13 bulan)
    pub fn is_intercalary_year(year_in_cycle: u32) -> bool {
        Self::EMBOLISMIC_YEARS.contains(&year_in_cycle)
    }

    /// Menghitung posisi bulan (0..234) dan tahun (1..=19) dalam siklus
    pub fn step(&self, total_synodic_months: u32) -> MetonicState {
        let month_index = total_synodic_months % Self::TOTAL_MONTHS;
        
        // Pemetaan bulan ke tahun dalam siklus Metonik
        let mut accumulated_months = 0;
        let mut current_year = 1;
        let mut month_in_year = 1;

        for yr in 1..=Self::TOTAL_YEARS {
            let months_in_this_yr = if Self::is_intercalary_year(yr) { 13 } else { 12 };
            if accumulated_months + months_in_this_yr > month_index {
                current_year = yr;
                month_in_year = (month_index - accumulated_months) + 1;
                break;
            }
            accumulated_months += months_in_this_yr;
        }

        // Posisi jarum dial (pada spiral 5 putaran Antikythera)
        let angle_per_month = 360.0 * 5.0 / (Self::TOTAL_MONTHS as f64);
        let dial_angle = Degrees::new(month_index as f64 * angle_per_month).normalize();

        MetonicState {
            month_index,
            current_year,
            month_in_year,
            is_leap_year: Self::is_intercalary_year(current_year),
            dial_angle,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct MetonicState {
    pub month_index: u32,       // 0..234
    pub current_year: u32,      // 1..19
    pub month_in_year: u32,     // 1..12 atau 1..13
    pub is_leap_year: bool,
    pub dial_angle: Degrees,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metonic_total_months() {
        let mut total = 0;
        for yr in 1..=19 {
            total += if MetonicGear::is_intercalary_year(yr) { 13 } else { 12 };
        }
        assert_eq!(total, 235);
    }

    #[test]
    fn test_metonic_state_progression() {
        let gear = MetonicGear::default();
        let s0 = gear.step(0);
        assert_eq!(s0.month_index, 0);
        assert_eq!(s0.current_year, 1);
        assert_eq!(s0.month_in_year, 1);

        let s234 = gear.step(234);
        assert_eq!(s234.month_index, 234);
        assert_eq!(s234.current_year, 19);
    }
}
