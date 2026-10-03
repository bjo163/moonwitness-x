use mts_core::units::JulianDay;
use serde::{Deserialize, Serialize};
use crate::ummalqura_data::{HIJRI_OFFSET, MONTH_STARTS};

/// Nama-Nama Bulan dalam Kalender Hijriah (Standard Bahasa Indonesia / Transliterasi Baku)
pub const HIJRI_MONTH_NAMES: [&str; 12] = [
    "Muharram",
    "Safar",
    "Rabi'ul Awwal",
    "Rabi'ul Akhir",
    "Jumadil Awwal",
    "Jumadil Akhir",
    "Rajab",
    "Sya'ban",
    "Ramadhan",
    "Syawwal",
    "Dzulqa'dah",
    "Dzulhijjah",
];

/// Standar Perhitungan Kalender Hijriah
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum HijriStandard {
    /// Kalender Resmi Umm al-Qura (Arab Saudi & Rujukan Global Astronomis)
    UmmAlQura,
    /// Kalender Tabular Siklus 30 Tahun (Hisab Urfi / MABIMS Imkanur Rukyat)
    CivilTabular,
}

/// Representasi Tanggal Kalender Hijriah
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub struct HijriDate {
    pub year: i32,
    pub month: u8,  // 1..=12
    pub day: u8,    // 1..=30
    pub month_name: &'static str,
}

impl HijriDate {
    pub fn new(year: i32, month: u8, day: u8) -> Self {
        assert!((1..=12).contains(&month), "Bulan Hijriah harus 1..=12");
        assert!((1..=30).contains(&day), "Hari Hijriah harus 1..=30");
        Self {
            year,
            month,
            day,
            month_name: HIJRI_MONTH_NAMES[(month - 1) as usize],
        }
    }

    pub fn formatted(&self) -> String {
        format!("{} {} {} H", self.day, self.month_name, self.year)
    }
}

pub struct HijriCalendar;

impl HijriCalendar {
    /// Epoch Kalender Hijriah (1 Muharram 1 H = 16 Juli 622 Masehi Julian) = JD 1948439.5
    pub const HIJRI_EPOCH_JD: f64 = 1948439.5;
    /// Panjang rata-rata bulan sinodik astronomis (hari)
    pub const MEAN_SYNODIC_MONTH_DAYS: f64 = 29.530588853;

    /// Mengonversi Julian Day (JD) menjadi penanggalan Hijriah deterministik.
    /// Secara otomatis memprioritaskan kalender astronomis resmi Umm al-Qura
    /// untuk rentang tahun 1343 H hingga 1500 H (1924 M - 2077 M),
    /// dan menggunakan algoritma Tabular Siklus 30-Tahun untuk tahun di luar rentang tersebut.
    pub fn from_julian_day(jd: JulianDay) -> HijriDate {
        if let Some(date) = Self::from_julian_day_umm_al_qura(jd) {
            date
        } else {
            Self::from_julian_day_tabular(jd)
        }
    }

    /// Mengonversi Julian Day dengan memilih standar kalender secara spesifik
    pub fn from_julian_day_with_standard(jd: JulianDay, standard: HijriStandard) -> HijriDate {
        match standard {
            HijriStandard::UmmAlQura => {
                Self::from_julian_day_umm_al_qura(jd).unwrap_or_else(|| Self::from_julian_day_tabular(jd))
            }
            HijriStandard::CivilTabular => Self::from_julian_day_tabular(jd),
        }
    }

    /// Perhitungan presisi berbasis dataset resmi Kalender Umm al-Qura (KACST)
    pub fn from_julian_day_umm_al_qura(jd: JulianDay) -> Option<HijriDate> {
        let jdn = (jd.0 + 0.5).floor() as i64;
        let rjd = (jdn - 2_400_000) as i32;

        let first_rjd = MONTH_STARTS[0];
        let last_rjd = *MONTH_STARTS.last()?;

        if rjd < first_rjd || rjd >= last_rjd + 30 {
            return None;
        }

        let idx = match MONTH_STARTS.binary_search(&rjd) {
            Ok(exact) => exact,
            Err(insert) => {
                if insert == 0 {
                    0
                } else {
                    insert - 1
                }
            }
        };

        let months = idx as i32 + HIJRI_OFFSET;
        let years = months / 12;
        let year = years + 1;
        let month = (months % 12) + 1;
        let day = (rjd - MONTH_STARTS[idx] + 1).clamp(1, 30);

        Some(HijriDate::new(year, month as u8, day as u8))
    }

    /// Algoritma Tabular / Hisab Urfi Siklus 30 Tahun (11 tahun kabisat, 19 tahun basithah)
    pub fn from_julian_day_tabular(jd: JulianDay) -> HijriDate {
        let jdn = (jd.0 + 0.5).floor() as i64;
        let days = jdn - 1948440; // 0 pada 1 Muharram 1 H (16 Juli 622 M Julian)
        
        if days < 0 {
            return HijriDate::new(1, 1, 1);
        }

        let cycle = days / 10631;
        let mut d = (days % 10631) as i32;

        const LEAP_YEARS: [u8; 11] = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
        let is_leap_year = |y: i32| -> bool {
            let yr_in_cycle = ((y - 1) % 30) + 1;
            LEAP_YEARS.contains(&(yr_in_cycle as u8))
        };

        let mut y_in_cycle = 1;
        for y in 1..=30 {
            let days_in_yr = if is_leap_year(y) { 355 } else { 354 };
            if d < days_in_yr {
                y_in_cycle = y;
                break;
            }
            d -= days_in_yr;
        }

        let year = (cycle as i32 * 30) + y_in_cycle;
        let is_leap = is_leap_year(year);

        let month_days = [
            30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30,
            if is_leap { 30 } else { 29 },
        ];

        let mut month = 1;
        for (m_idx, &m_len) in month_days.iter().enumerate() {
            if d < m_len {
                month = m_idx + 1;
                break;
            }
            d -= m_len;
        }

        let day = (d + 1).clamp(1, 30);
        HijriDate::new(year, month as u8, day as u8)
    }

    /// Mengonversi Tanggal Hijriah ke perkiraan Julian Day awal bulan tersebut
    pub fn to_julian_day_approx(year: i32, month: u8) -> JulianDay {
        let total_months = ((year - 1) * 12) + (month as i32 - 1);
        let idx = total_months - HIJRI_OFFSET;
        if idx >= 0 && (idx as usize) < MONTH_STARTS.len() {
            let rjd = MONTH_STARTS[idx as usize];
            JulianDay::new(rjd as f64 + 2_400_000.0)
        } else {
            let jd = Self::HIJRI_EPOCH_JD + (total_months as f64 * Self::MEAN_SYNODIC_MONTH_DAYS);
            JulianDay::new(jd)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hijri_epoch_conversion() {
        // Epoch 1 Muharram 1 H: 16 Juli 622 M Julian (JD 1948439.5)
        let epoch = JulianDay::new(HijriCalendar::HIJRI_EPOCH_JD + 0.5);
        let date = HijriCalendar::from_julian_day(epoch);
        assert_eq!(date.year, 1);
        assert_eq!(date.month, 1);
        assert_eq!(date.day, 1);
        assert_eq!(date.month_name, "Muharram");
    }

    #[test]
    fn test_october_3_2026_conversion() {
        // 3 Oktober 2026 ~ JD 2461316.685357
        // Standard Umm al-Qura = 22 Rabi'ul Akhir 1448 H (Bukan 20!)
        let jd = JulianDay::new(2461316.685357);
        let uq_date = HijriCalendar::from_julian_day_with_standard(jd, HijriStandard::UmmAlQura);
        assert_eq!(uq_date.year, 1448);
        assert_eq!(uq_date.month, 4);
        assert_eq!(uq_date.day, 22);
        assert_eq!(uq_date.month_name, "Rabi'ul Akhir");
        assert_eq!(uq_date.formatted(), "22 Rabi'ul Akhir 1448 H");

        // Standard Civil Tabular
        let tab_date = HijriCalendar::from_julian_day_with_standard(jd, HijriStandard::CivilTabular);
        assert_eq!(tab_date.year, 1448);
        assert_eq!(tab_date.month, 4);
        assert!(tab_date.day == 20 || tab_date.day == 21);
    }

    #[test]
    fn test_modern_hijri_year() {
        let jd = JulianDay::new(2461120.0);
        let date = HijriCalendar::from_julian_day(jd);
        assert!(date.year >= 1447 && date.year <= 1448);
    }
}
