//! # MTS Hijri: Deterministic Hijri Calendar & True Celestial Clock Engine
//!
//! Menyediakan:
//! 1. True Celestial Clock (TCC) state vector dan klasifikasi fase bulan (`tcc`).
//! 2. Evaluasi kriteria penentuan awal bulan: Wujudul Hilal, MABIMS, Odeh (`criteria`).
//! 3. Generator kalender Hijriah deterministik (`calendar`).
//! 4. Jembatan konversi dua arah ke UTC dan POSIX Epoch (`utc_bridge`).

pub mod calendar;
pub mod criteria;
pub mod tcc;
pub mod ummalqura_data;
pub mod utc_bridge;

pub use calendar::{HijriCalendar, HijriDate, HijriStandard, HIJRI_MONTH_NAMES};
pub use criteria::{HilalEvaluationResult, MabimsCriteria, OdehCriteria, WujudulHilal};
pub use tcc::{LunarPhaseName, TrueCelestialClock, TrueCelestialClockState};
pub use utc_bridge::UtcBridge;
