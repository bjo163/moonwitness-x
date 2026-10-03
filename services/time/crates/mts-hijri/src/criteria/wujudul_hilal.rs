use mts_core::units::Degrees;
use serde::{Deserialize, Serialize};

/// Hasil Evaluasi Kriteria Hilal
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct HilalEvaluationResult {
    /// Apakah kriteria terpenuhi untuk menandai awal bulan baru (1 Hijriah)
    pub is_new_month: bool,
    /// Ketinggian toposentrik bulan di atas ufuk saat matahari terbenam (derajat)
    pub altitude_deg: f64,
    /// Sudut elongasi bulan-matahari (derajat)
    pub elongation_deg: f64,
    /// Keterangan ringkas hasil analisis
    pub note: &'static str,
}

pub struct WujudulHilal;

impl WujudulHilal {
    /// Evaluasi Kriteria Wujudul Hilal:
    /// 1. Ijtimak (konjungsi) sudah terjadi sebelum terbenam matahari.
    /// 2. Pada saat matahari terbenam, piringan atas bulan masih berada di atas ufuk (alt > 0).
    pub fn evaluate(
        conjunction_before_sunset: bool,
        moon_altitude_at_sunset: Degrees,
        elongation: Degrees,
    ) -> HilalEvaluationResult {
        let is_above_horizon = moon_altitude_at_sunset.0 > 0.0;
        let is_new_month = conjunction_before_sunset && is_above_horizon;

        let note = if is_new_month {
            "Hilal sudah wujud: Ijtimak qablal ghurub & bulan di atas ufuk"
        } else if !conjunction_before_sunset {
            "Belum ijtimak sebelum matahari terbenam"
        } else {
            "Ijtimak sudah terjadi tetapi piringan bulan masih di bawah ufuk"
        };

        HilalEvaluationResult {
            is_new_month,
            altitude_deg: moon_altitude_at_sunset.0,
            elongation_deg: elongation.0,
            note,
        }
    }
}
