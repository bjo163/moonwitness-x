use super::wujudul_hilal::HilalEvaluationResult;
use mts_core::units::Degrees;

/// Kriteria Visibilitas Hilal Global Dr. Mohamad Shaukat Odeh (2006)
pub struct OdehCriteria;

impl OdehCriteria {
    /// Evaluasi nilai V-value Odeh berdasarkan lebar sabit W (arcmin) dan beda tinggi ARCV (deg)
    /// V = ARCV - (-0.1018 * W^3 + 0.7319 * W^2 - 6.3226 * W + 7.1651)
    pub fn evaluate(
        arc_of_vision_deg: Degrees,
        crescent_width_arcmin: f64,
        elongation: Degrees,
    ) -> HilalEvaluationResult {
        let w = crescent_width_arcmin;
        let arcv = arc_of_vision_deg.0;

        let threshold = -0.1018 * w.powi(3) + 0.7319 * w.powi(2) - 6.3226 * w + 7.1651;
        let v = arcv - threshold;

        let (is_new_month, note) = if v >= 5.65 {
            (true, "Visibel mata telanjang dengan mudah (Odeh Zona A)")
        } else if v >= 2.0 {
            (true, "Visibel mata telanjang pada kondisi sempurna / alat optik (Odeh Zona B)")
        } else if v >= -0.96 {
            (true, "Hanya visibel dengan bantuan teleskop optik (Odeh Zona C)")
        } else {
            (false, "Hilal mustahil terlihat bahkan dengan teleskop (Odeh Zona D)")
        };

        HilalEvaluationResult {
            is_new_month,
            altitude_deg: arcv,
            elongation_deg: elongation.0,
            note,
        }
    }
}
