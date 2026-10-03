use chrono::{DateTime, TimeZone, Utc};
use mts_core::units::JulianDay;

pub struct UtcBridge;

impl UtcBridge {
    /// Julian Day untuk Unix Epoch (1 Januari 1970 00:00:00 UTC) = 2440587.5
    pub const UNIX_EPOCH_JD: f64 = 2440587.5;

    /// Mengonversi Julian Day UT ke chrono DateTime<Utc>
    pub fn jd_to_datetime(jd: JulianDay) -> Option<DateTime<Utc>> {
        let seconds_since_unix = (jd.0 - Self::UNIX_EPOCH_JD) * 86400.0;
        let secs = seconds_since_unix.floor() as i64;
        let nsecs = ((seconds_since_unix - secs as f64) * 1_000_000_000.0).round() as u32;
        Utc.timestamp_opt(secs, nsecs.min(999_999_999)).single()
    }

    /// Mengonversi DateTime<Utc> ke Julian Day UT
    pub fn datetime_to_jd(dt: &DateTime<Utc>) -> JulianDay {
        let secs = dt.timestamp() as f64;
        let nsecs = dt.timestamp_subsec_nanos() as f64;
        let total_secs = secs + (nsecs / 1_000_000_000.0);
        JulianDay::new(Self::UNIX_EPOCH_JD + (total_secs / 86400.0))
    }

    /// Mengambil waktu saat ini sebagai Julian Day UT
    pub fn now_jd() -> JulianDay {
        Self::datetime_to_jd(&Utc::now())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_unix_epoch_roundtrip() {
        let epoch = Utc.timestamp_opt(0, 0).unwrap();
        let jd = UtcBridge::datetime_to_jd(&epoch);
        assert_eq!(jd.0, UtcBridge::UNIX_EPOCH_JD);
        let back = UtcBridge::jd_to_datetime(jd).unwrap();
        assert_eq!(back, epoch);
    }
}
