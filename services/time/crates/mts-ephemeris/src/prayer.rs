use crate::qibla::{QiblaBearing, QiblaCalculator};
use crate::solar::SolarEphemeris;
use crate::topocentric::{GeoLocation, TopocentricConverter};
use mts_core::units::{Degrees, JulianDay};
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

/// Parameter Konvensi Perhitungan Waktu Shalat Astronomis
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct PrayerCalculationParams {
    /// Sudut depresi matahari untuk waktu Subuh (Fajr) dalam derajat (default: -20.0° MABIMS/Kemenag)
    pub fajr_angle: f64,
    /// Sudut depresi matahari untuk waktu Isya dalam derajat (default: -18.0° MABIMS/Kemenag)
    pub isha_angle: f64,
    /// Rasio panjang bayangan untuk Ashar (1.0 = Syafi'i/Maliki/Hambali, 2.0 = Hanafi)
    pub asr_shadow_factor: f64,
    /// Waktu kehati-hatian (ihtiyat) dalam menit (default: 2.0 menit)
    pub ihtiyat_minutes: f64,
}

impl Default for PrayerCalculationParams {
    fn default() -> Self {
        Self {
            fajr_angle: -20.0,
            isha_angle: -18.0,
            asr_shadow_factor: 1.0,
            ihtiyat_minutes: 2.0,
        }
    }
}

/// Jadwal Waktu Shalat Lengkap & Telemetri Matahari
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PrayerTimesSchedule {
    pub imsak_jd: JulianDay,
    pub fajr_jd: JulianDay,
    pub sunrise_jd: JulianDay,
    pub dhuhr_jd: JulianDay,
    pub asr_jd: JulianDay,
    pub sunset_jd: JulianDay,
    pub maghrib_jd: JulianDay,
    pub isha_jd: JulianDay,
    pub midnight_jd: JulianDay,
    pub last_third_jd: JulianDay,

    pub active_prayer: String,
    pub next_prayer: String,
    pub seconds_to_next_prayer: f64,

    pub current_solar_altitude: Degrees,
    pub current_solar_azimuth: Degrees,
    pub current_shadow_ratio: f64,

    pub qibla: QiblaBearing,
}

pub struct PrayerTimesEngine;

impl PrayerTimesEngine {
    /// Menghitung jadwal waktu shalat astronomis presisi tinggi untuk posisi pengamat pada hari Julian Day tertentu
    pub fn calculate(
        jd: JulianDay,
        loc: &GeoLocation,
        params: &PrayerCalculationParams,
    ) -> PrayerTimesSchedule {
        // Tentukan perkiraan tengah hari lokal (Local Noon)
        // JD tengah hari UT adalah JD.floor() + 0.5. Offset bujur: -lon / 360
        let approx_noon_jd = JulianDay::new((jd.0 + loc.longitude.0 / 360.0).round() - loc.longitude.0 / 360.0);

        // Cari waktu eksak kulminasi matahari (Transit / Zawwal) secara iteratif
        let transit_jd = Self::refine_solar_transit(approx_noon_jd, loc);
        let solar_transit = SolarEphemeris::calculate(transit_jd);

        let phi_rad = loc.latitude.to_radians().0;
        let delta_rad = solar_transit.declination.to_radians().0;

        // Dip ufuk karena ketinggian pengamat (meter di atas laut)
        let dip_deg = 0.0293 * loc.elevation_meters.sqrt() / 60.0;
        let standard_horizon_deg = -0.8333 - dip_deg;

        let ihtiyat_days = params.ihtiyat_minutes / 1440.0;

        // 1. Waktu Syuruq (Terbit) dan Terbenam Geometris
        let sunrise_dt = Self::hour_angle_offset(phi_rad, delta_rad, standard_horizon_deg)
            .unwrap_or(0.25);
        let sunrise_jd = JulianDay::new(transit_jd.0 - sunrise_dt);
        let sunset_jd = JulianDay::new(transit_jd.0 + sunrise_dt);

        // 2. Subuh (Fajr)
        let fajr_dt = Self::hour_angle_offset(phi_rad, delta_rad, params.fajr_angle)
            .unwrap_or(0.3);
        let fajr_jd = JulianDay::new(transit_jd.0 - fajr_dt + ihtiyat_days);

        // 3. Imsak (10 menit sebelum Subuh)
        let imsak_jd = JulianDay::new(fajr_jd.0 - (10.0 / 1440.0));

        // 4. Dzuhur (Transit + Ihtiyat)
        let dhuhr_jd = JulianDay::new(transit_jd.0 + ihtiyat_days);

        // 5. Ashar (berdasarkan rasio panjang bayangan)
        // Panjang bayangan saat tengah hari: s0 = tan(|phi - delta|)
        let s0 = (phi_rad - delta_rad).abs().tan();
        let s_asr = params.asr_shadow_factor + s0;
        let asr_alt_rad = (1.0 / s_asr).atan();
        let asr_alt_deg = asr_alt_rad * 180.0 / PI;

        let asr_dt = Self::hour_angle_offset(phi_rad, delta_rad, asr_alt_deg)
            .unwrap_or(0.18);
        let asr_jd = JulianDay::new(transit_jd.0 + asr_dt + ihtiyat_days);

        // 6. Maghrib (Terbenam + Ihtiyat)
        let maghrib_jd = JulianDay::new(sunset_jd.0 + ihtiyat_days);

        // 7. Isya (Syafaq Ahmar/Abyadh sirna)
        let isha_dt = Self::hour_angle_offset(phi_rad, delta_rad, params.isha_angle)
            .unwrap_or(0.32);
        let isha_jd = JulianDay::new(transit_jd.0 + isha_dt + ihtiyat_days);

        // 8. Tengah Malam Astronomis (Nisf al-Layl) dan Sepertiga Malam Terakhir
        // Dihitung dari Maghrib sampai Subuh hari berikutnya (~24 jam setelah Subuh hari ini)
        let next_fajr_jd = JulianDay::new(fajr_jd.0 + 1.0);
        let night_duration = next_fajr_jd.0 - maghrib_jd.0;
        let midnight_jd = JulianDay::new(maghrib_jd.0 + night_duration * 0.5);
        let last_third_jd = JulianDay::new(maghrib_jd.0 + night_duration * (2.0 / 3.0));

        // 9. Status Saat Ini (Current solar altitude & active prayer)
        let current_sun = SolarEphemeris::calculate(jd);
        let current_horiz = TopocentricConverter::to_horizontal(
            jd,
            current_sun.right_ascension,
            current_sun.declination,
            loc,
        );

        let shadow_ratio = if current_horiz.apparent_altitude.0 > 0.0 {
            1.0 / current_horiz.apparent_altitude.to_radians().0.tan()
        } else {
            999.0
        };

        // Identifikasi shalat aktif dan hitung mundur shalat berikutnya
        let (active_prayer, next_prayer, next_prayer_jd) = if jd.0 < fajr_jd.0 {
            ("Malam / Tahajjud".into(), "Subuh".into(), fajr_jd)
        } else if jd.0 < sunrise_jd.0 {
            ("Subuh".into(), "Syuruq".into(), sunrise_jd)
        } else if jd.0 < dhuhr_jd.0 {
            ("Syuruq / Dhuha".into(), "Dzuhur".into(), dhuhr_jd)
        } else if jd.0 < asr_jd.0 {
            ("Dzuhur".into(), "Ashar".into(), asr_jd)
        } else if jd.0 < maghrib_jd.0 {
            ("Ashar".into(), "Maghrib".into(), maghrib_jd)
        } else if jd.0 < isha_jd.0 {
            ("Maghrib".into(), "Isya".into(), isha_jd)
        } else {
            ("Isya".into(), "Subuh (Besok)".into(), next_fajr_jd)
        };

        let seconds_to_next_prayer = ((next_prayer_jd.0 - jd.0) * 86400.0).max(0.0);

        let qibla = QiblaCalculator::calculate(loc);

        PrayerTimesSchedule {
            imsak_jd,
            fajr_jd,
            sunrise_jd,
            dhuhr_jd,
            asr_jd,
            sunset_jd,
            maghrib_jd,
            isha_jd,
            midnight_jd,
            last_third_jd,
            active_prayer,
            next_prayer,
            seconds_to_next_prayer,
            current_solar_altitude: current_horiz.apparent_altitude,
            current_solar_azimuth: current_horiz.azimuth,
            current_shadow_ratio: (shadow_ratio * 100.0).round() / 100.0,
            qibla,
        }
    }

    /// Menghitung selisih waktu (dalam pecahan hari) dari transit untuk mencapai ketinggian tertentu
    fn hour_angle_offset(phi_rad: f64, delta_rad: f64, target_alt_deg: f64) -> Option<f64> {
        let h_rad = target_alt_deg * PI / 180.0;
        let num = h_rad.sin() - phi_rad.sin() * delta_rad.sin();
        let den = phi_rad.cos() * delta_rad.cos();

        if den.abs() < 1e-9 {
            return None;
        }

        let cos_ha = (num / den).clamp(-1.0, 1.0);
        let ha_rad = cos_ha.acos();
        let ha_deg = ha_rad * 180.0 / PI;

        // 360° per hari sideris (~1.0027379 rotasi per hari matahari rata-rata)
        Some(ha_deg / (360.0 * 1.0027379))
    }

    /// Mencari waktu eksak ketika matahari melintasi meridian pengamat (Local Solar Transit)
    fn refine_solar_transit(approx_jd: JulianDay, loc: &GeoLocation) -> JulianDay {
        let mut jd = approx_jd;
        for _ in 0..3 {
            let sun = SolarEphemeris::calculate(jd);
            let lst = TopocentricConverter::lst(jd, loc.longitude);
            let mut ha_deg = lst.0 - sun.right_ascension.0;
            while ha_deg > 180.0 {
                ha_deg -= 360.0;
            }
            while ha_deg < -180.0 {
                ha_deg += 360.0;
            }

            let dt_days = ha_deg / (360.0 * 1.0027379);
            jd = JulianDay::new(jd.0 - dt_days);
        }
        jd
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prayer_schedule_chronology() {
        let loc = GeoLocation::bosscha();
        let now_jd = JulianDay::new(2461316.5); // ~3 Oktober 2026 00:00 UT
        let params = PrayerCalculationParams::default();
        let sched = PrayerTimesEngine::calculate(now_jd, &loc, &params);

        // Verifikasi urutan kronologis waktu shalat:
        // Imsak < Subuh < Syuruq < Dzuhur < Ashar < Sunset <= Maghrib < Isya
        assert!(sched.imsak_jd.0 < sched.fajr_jd.0);
        assert!(sched.fajr_jd.0 < sched.sunrise_jd.0);
        assert!(sched.sunrise_jd.0 < sched.dhuhr_jd.0);
        assert!(sched.dhuhr_jd.0 < sched.asr_jd.0);
        assert!(sched.asr_jd.0 < sched.sunset_jd.0);
        assert!(sched.sunset_jd.0 <= sched.maghrib_jd.0);
        assert!(sched.maghrib_jd.0 < sched.isha_jd.0);

        // Verifikasi Qibla
        assert!((sched.qibla.bearing_deg.0 - 295.2).abs() < 1.0);
    }
}
