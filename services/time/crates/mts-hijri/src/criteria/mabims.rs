use super::wujudul_hilal::HilalEvaluationResult;
use mts_core::units::Degrees;

/// Kriteria Imkanur Rukyat MABIMS Baru (Menteri Agama Brunei, Indonesia, Malaysia, Singapura)
/// Berlaku resmi sejak 2022:
/// 1. Tinggi hilal minimal 3.0 derajat.
/// 2. Sudut elongasi minimal 6.4 derajat.
pub struct MabimsCriteria;

impl MabimsCriteria {
    pub const MIN_ALTITUDE_DEG: f64 = 3.0;
    pub const MIN_ELONGATION_DEG: f64 = 6.4;

    pub fn evaluate(
        moon_altitude_at_sunset: Degrees,
        elongation: Degrees,
    ) -> HilalEvaluationResult {
        let alt_ok = moon_altitude_at_sunset.0 >= Self::MIN_ALTITUDE_DEG;
        let elong_ok = elongation.0 >= Self::MIN_ELONGATION_DEG;
        let is_new_month = alt_ok && elong_ok;

        let note = if is_new_month {
            "Memenuhi kriteria MABIMS baru (Tinggi >= 3.0° dan Elongasi >= 6.4°)"
        } else if !alt_ok && !elong_ok {
            "Tinggi dan Elongasi di bawah ambang batas MABIMS"
        } else if !alt_ok {
            "Tinggi hilal < 3.0° (Elongasi memenuhi)"
        } else {
            "Sudut elongasi < 6.4° (Tinggi memenuhi)"
        };

        HilalEvaluationResult {
            is_new_month,
            altitude_deg: moon_altitude_at_sunset.0,
            elongation_deg: elongation.0,
            note,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mabims_passing() {
        let res = MabimsCriteria::evaluate(Degrees::new(3.5), Degrees::new(7.0));
        assert!(res.is_new_month);
    }

    #[test]
    fn test_mabims_failing_alt() {
        let res = MabimsCriteria::evaluate(Degrees::new(2.8), Degrees::new(7.0));
        assert!(!res.is_new_month);
    }
}
