use crate::rational::GearRatio;
use crate::units::Degrees;
use serde::{Deserialize, Serialize};

/// Roda Gigi Koreksi Siklus Callippic
///
/// Rasio: 4 Siklus Metonik minus 1 hari = 76 Tahun Tropis = 940 Bulan Sinodik = 27.759 hari.
/// Digunakan pada sub-dial kecil di dalam dial Metonik Antikythera untuk mengoreksi
/// selisih 1 hari setiap 76 tahun.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct CallippicGear {
    pub ratio: GearRatio,
}

impl Default for CallippicGear {
    fn default() -> Self {
        Self {
            ratio: GearRatio::new(940, 76),
        }
    }
}

impl CallippicGear {
    pub const TOTAL_METONIC_CYCLES: u32 = 4;
    pub const TOTAL_MONTHS: u32 = 940;
    pub const TOTAL_YEARS: u32 = 76;

    pub fn new() -> Self {
        Self::default()
    }

    /// Menghitung kuadran siklus Callippic (0..3) dan posisi jarum dial
    pub fn step(&self, total_synodic_months: u32) -> CallippicState {
        let month_in_callippic = total_synodic_months % Self::TOTAL_MONTHS;
        let metonic_cycle_index = month_in_callippic / 235; // 0, 1, 2, 3
        
        // Jarum dial bergerak 90 derajat setiap 1 siklus Metonik (19 tahun)
        let dial_angle = Degrees::new(metonic_cycle_index as f64 * 90.0);

        CallippicState {
            month_in_callippic,
            metonic_cycle_index,
            dial_angle,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct CallippicState {
    pub month_in_callippic: u32,
    pub metonic_cycle_index: u32, // 0..3
    pub dial_angle: Degrees,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_callippic_quadrants() {
        let gear = CallippicGear::default();
        let q0 = gear.step(0);
        assert_eq!(q0.metonic_cycle_index, 0);
        assert_eq!(q0.dial_angle, Degrees::new(0.0));

        let q1 = gear.step(235);
        assert_eq!(q1.metonic_cycle_index, 1);
        assert_eq!(q1.dial_angle, Degrees::new(90.0));

        let q3 = gear.step(705);
        assert_eq!(q3.metonic_cycle_index, 3);
        assert_eq!(q3.dial_angle, Degrees::new(270.0));
    }
}
