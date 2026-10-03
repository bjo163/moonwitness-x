use crate::units::Radians;
use serde::{Deserialize, Serialize};

/// Mekanisme Pin-and-Slot Eksentrik Antikythera
///
/// Mekanisme ini menggunakan dua roda gigi bersumbu terpisah sejauh jarak $d$
/// di mana sebuah pasak (*pin*) pada roda 1 meluncur di dalam celah (*slot*) roda 2.
/// Ini mereproduksi variasi kecepatan sudut bulan (Hukum Kepler II)
/// 1.500 tahun sebelum hukum Kepler dirumuskan.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct PinSlotMechanism {
    /// Eksentrisitas e = d / R (rasio offset sumbu terhadap radius roda gigi)
    /// Nilai orbit bulan bumi: ~0.0549
    pub eccentricity: f64,
}

impl Default for PinSlotMechanism {
    fn default() -> Self {
        Self {
            eccentricity: 0.054900489, // Eksentrisitas rata-rata orbit bulan
        }
    }
}

impl PinSlotMechanism {
    pub fn new(eccentricity: f64) -> Self {
        Self { eccentricity }
    }

    /// Menghitung sudut keluaran \theta dari sudut masukan seragam \alpha
    ///
    /// Persamaan eksak geometri pin-and-slot:
    /// tan(\theta - \alpha) = (e * sin \alpha) / (1 - e * cos \alpha)
    pub fn calculate_output_angle(&self, input_alpha: Radians) -> Radians {
        let alpha = input_alpha.0;
        let e = self.eccentricity;

        let num = e * alpha.sin();
        let denom = 1.0 - e * alpha.cos();

        let delta = num.atan2(denom);
        Radians::new(alpha + delta).normalize()
    }

    /// Menghitung deviasi anomali sudut (Persamaan Pusat / Equation of the Center)
    /// \Delta\theta = \theta - \alpha
    pub fn equation_of_center(&self, mean_anomaly: Radians) -> Radians {
        let out = self.calculate_output_angle(mean_anomaly);
        (out - mean_anomaly).normalize_signed()
    }

    /// Menghitung faktor kecepatan sudut relatif d\theta / d\alpha
    /// Nilai > 1.0 berarti bergerak lebih cepat (saat perigee: \alpha = 0)
    /// Nilai < 1.0 berarti bergerak lebih lambat (saat apogee: \alpha = \pi)
    pub fn angular_velocity_factor(&self, input_alpha: Radians) -> f64 {
        let alpha = input_alpha.0;
        let e = self.eccentricity;
        let cos_a = alpha.cos();

        // Turunan d/da [ a + atan2(e sin a, 1 - e cos a) ]
        // = (1 - e^2) / (1 - 2e cos a + e^2)
        (1.0 - e * e) / (1.0 - 2.0 * e * cos_a + e * e)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::units::Degrees;
    use std::f64::consts::PI;

    #[test]
    fn test_perigee_velocity_maximum() {
        let ps = PinSlotMechanism::default();
        // Pada perigee (alpha = 0), kecepatan sudut harus maksimum (> 1.0)
        let factor_perigee = ps.angular_velocity_factor(Radians::new(0.0));
        assert!(factor_perigee > 1.0);
        // Pada apogee (alpha = PI), kecepatan sudut harus minimum (< 1.0)
        let factor_apogee = ps.angular_velocity_factor(Radians::new(PI));
        assert!(factor_apogee < 1.0);
        assert!(factor_perigee > factor_apogee);
    }

    #[test]
    fn test_equation_of_center_range() {
        let ps = PinSlotMechanism::default();
        // Anomali maksimum orbit bulan sekitar ~6.289 derajat (2 * e rad ~= 0.1098 rad ~= 6.29 deg)
        let mut max_dev_deg = 0.0;
        for i in 0..360 {
            let mean = Degrees::new(i as f64).to_radians();
            let eq = ps.equation_of_center(mean).to_degrees().0.abs();
            if eq > max_dev_deg {
                max_dev_deg = eq;
            }
        }
        // Deviasi maksimum harus berada di kisaran 3.0 - 6.5 derajat
        assert!(max_dev_deg > 3.0 && max_dev_deg < 6.5);
    }
}
