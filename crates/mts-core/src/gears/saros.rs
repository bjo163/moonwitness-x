use crate::units::Degrees;
use serde::{Deserialize, Serialize};

/// Roda Gigi Siklus Saros (Prediksi Gerhana)
///
/// Rasio: 223 Bulan Sinodik \approx 242 Bulan Drakonik \approx 239 Bulan Anomalistik \approx 6585.3213 hari.
/// Digunakan pada dial spiral belakang bagian bawah Mekanisme Antikythera (4 putaran spiral).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct SarosGear;

impl Default for SarosGear {
    fn default() -> Self {
        Self
    }
}

impl SarosGear {
    pub const TOTAL_MONTHS: u32 = 223;

    pub fn new() -> Self {
        Self
    }

    /// Menghitung posisi bulan dalam siklus Saros (0..222)
    pub fn step(&self, total_synodic_months: u32) -> SarosState {
        let month_index = total_synodic_months % Self::TOTAL_MONTHS;
        
        // Pada dial spiral 4 putaran Antikythera (223 pembagian)
        let angle_per_month = 360.0 * 4.0 / (Self::TOTAL_MONTHS as f64);
        let dial_angle = Degrees::new(month_index as f64 * angle_per_month).normalize();

        // Siklus Saros ke-N sejak permulaan
        let saros_cycle_number = total_synodic_months / Self::TOTAL_MONTHS;

        SarosState {
            month_index,
            saros_cycle_number,
            dial_angle,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct SarosState {
    pub month_index: u32,           // 0..222
    pub saros_cycle_number: u32,
    pub dial_angle: Degrees,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_saros_progression() {
        let gear = SarosGear::new();
        let s0 = gear.step(0);
        assert_eq!(s0.month_index, 0);
        assert_eq!(s0.saros_cycle_number, 0);

        let s223 = gear.step(223);
        assert_eq!(s223.month_index, 0);
        assert_eq!(s223.saros_cycle_number, 1);
    }
}
