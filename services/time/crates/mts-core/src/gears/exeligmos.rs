use crate::units::Degrees;
use serde::{Deserialize, Serialize};

/// Roda Gigi Siklus Exeligmos (Koreksi Rotasi Bumi 8 Jam pada Gerhana)
///
/// Rasio: 3 Siklus Saros = 669 Bulan Sinodik \approx 19.755,96 hari \approx 54 tahun 33 hari.
/// Satu siklus Saros memiliki kelebihan ~8 jam (1/3 hari), sehingga gerhana berikutnya
/// bergeser 120 derajat bujur barat bumi.
/// Sub-dial Exeligmos pada Antikythera memiliki 3 sektor:
/// - Sektor 0: +0 Jam
/// - Sektor 1: +8 Jam (Simbol \omega)
/// - Sektor 2: +16 Jam (Simbol \omega\omega)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct ExeligmosGear;

impl Default for ExeligmosGear {
    fn default() -> Self {
        Self
    }
}

impl ExeligmosGear {
    pub const TOTAL_SAROS_IN_EXELIGMOS: u32 = 3;

    pub fn new() -> Self {
        Self
    }

    /// Menghitung status Exeligmos dari nomor siklus Saros (0..)
    pub fn step(&self, saros_cycle_number: u32) -> ExeligmosState {
        let sector = saros_cycle_number % Self::TOTAL_SAROS_IN_EXELIGMOS;
        let hour_shift = (sector * 8) as u32;
        let dial_angle = Degrees::new(sector as f64 * 120.0);

        ExeligmosState {
            sector,
            hour_shift,
            dial_angle,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct ExeligmosState {
    pub sector: u32,        // 0, 1, 2
    pub hour_shift: u32,    // 0, 8, 16
    pub dial_angle: Degrees,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exeligmos_shift() {
        let gear = ExeligmosGear::new();
        let e0 = gear.step(0);
        assert_eq!(e0.sector, 0);
        assert_eq!(e0.hour_shift, 0);

        let e1 = gear.step(1);
        assert_eq!(e1.sector, 1);
        assert_eq!(e1.hour_shift, 8);

        let e2 = gear.step(2);
        assert_eq!(e2.sector, 2);
        assert_eq!(e2.hour_shift, 16);

        let e3 = gear.step(3);
        assert_eq!(e3.sector, 0);
        assert_eq!(e3.hour_shift, 0);
    }
}
