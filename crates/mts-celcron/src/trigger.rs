use mts_core::units::JulianDay;
use mts_ephemeris::GeoLocation;
use serde::{Deserialize, Serialize};

/// Definisi Peristiwa Langit yang Memicu CelCron
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum CelestialEventType {
    /// Ijtimak Geosentris Sejati (\Delta\lambda = 0°)
    Conjunction,
    /// Kuartir Awal (\Delta\lambda = 90°)
    FirstQuarter,
    /// Purnama Sejati / Istiqbal (\Delta\lambda = 180°)
    Opposition,
    /// Kuartir Akhir (\Delta\lambda = 270°)
    LastQuarter,
    /// Pemeriksaan Visibilitas Hilal saat Terbenam Matahari Lokal
    HilalObservation(GeoLocation),
}

/// Payload Peristiwa yang Diterbitkan saat Event Terpicu
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CelestialEventTrigger {
    pub event_type: CelestialEventType,
    pub timestamp_jd: JulianDay,
    pub description: String,
}

impl CelestialEventTrigger {
    pub fn new(event_type: CelestialEventType, timestamp_jd: JulianDay, description: impl Into<String>) -> Self {
        Self {
            event_type,
            timestamp_jd,
            description: description.into(),
        }
    }
}
