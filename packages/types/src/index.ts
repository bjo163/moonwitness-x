/**
 * Moonwitness Universe — Universal TypeScript Contracts & Types
 */

export interface CelestialClockState {
  julian_day_ut: number;
  utc_timestamp: string;
  elongation_degrees: number;
  illuminated_fraction: number;
  phase_name: string;
  hijri_date: string;
  antikythera_metonic_month: number;
  antikythera_metonic_year: number;
  antikythera_saros_step: number;
  antikythera_exeligmos_shift_hours: number;
}

export interface CosmicTimeState {
  julian_day_earth: number;
  age_of_universe_years: number;
  total_cosmic_seconds: number;
  age_of_earth_years: number;
  earth_to_universe_ratio: number;
  earth_kinematic_lag_years: number;
  current_period: string;
  scale_factor_a: number;
  redshift_z: number;
  hubble_parameter_km_s_mpc: number;
  cmb_temperature_kelvin: number;
  epoch_period_duration_years: number;
  divine_days_elapsed: number;
  divine_night_watches_elapsed: number;
  angelic_days_elapsed: number;
  angelic_lorentz_gamma: number;
  angelic_velocity_km_s: number;
  derived_speed_of_light_m_s: number;
  scriptural_matrix: ScriptureCorrelationMatrix;
}

export interface ScriptureCorrelationMatrix {
  taurat: TauratCorrelation;
  zabur: ZaburCorrelation;
  injil: InjilCorrelation;
  al_quran: QuranCorrelation;
}

export interface TauratCorrelation {
  scripture_name: string;
  creation_eons_count: number;
  eons_concept: string;
  earth_age_ratio: number;
  sabbatical_cycle_years: number;
  jubilee_cycle_years: number;
  light_manifestation: string;
}

export interface ZaburCorrelation {
  scripture_name: string;
  psalm_90_4_thousand_years_quotation: string;
  thousand_year_ratio_days: number;
  night_watch_compression: string;
  psalm_104_2_fabric_stretching: string;
  psalm_19_celestial_clock: string;
}

export interface InjilCorrelation {
  scripture_name: string;
  peter_3_8_bidirectional_relativity: string;
  hebrews_1_10_12_cosmic_entropy: string;
  alpha_omega_boundary: string;
}

export interface QuranCorrelation {
  scripture_name: string;
  sittati_ayyam: string;
  fussilat_earth_ratio: string;
  hajj_22_47_thousand_years: string;
  sajdah_32_5_light_speed: string;
  maarij_70_4_angelic_dilation: string;
  dzariyat_51_47_expanding_universe: string;
  anbiya_21_30_big_bang: string;
  anbiya_21_104_recollapse: string;
}

export interface ConjunctionEvent {
  conjunction_julian_day: number;
  conjunction_utc: string;
  days_remaining: number;
}

export interface HilalVisibilityState {
  latitude: number;
  longitude: number;
  elevation_meters: number;
  topocentric_altitude: number;
  elongation: number;
  is_mabims_passing: boolean;
  is_wujudul_hilal_passing: boolean;
  note: string;
}

export interface GearMeshNode {
  id: string;
  name: string;
  teeth: number;
  radius: number;
  rotation_deg: number;
  speed_ratio: number;
  center_x: number;
  center_y: number;
  color: string;
  label: string;
}

export interface AntikytheraGearsTelemetry {
  total_synodic_months: number;
  synodic_month_fraction: number;
  b1_master_deg: number;
  sun_wheel_deg: number;
  moon_wheel_deg: number;
  phase_ball_deg: number;
  metonic: {
    month_index: number;
    current_year: number;
    dial_angle_degrees: number;
    is_intercalary: boolean;
    progress_pct: number;
  };
  callippic: {
    month_in_callippic: number;
    metonic_cycle_index: number;
    dial_angle_degrees: number;
    progress_pct: number;
  };
  saros: {
    month_index: number;
    saros_cycle_number: number;
    dial_angle_degrees: number;
    progress_pct: number;
  };
  exeligmos: {
    sector: number;
    hour_shift: number;
    dial_angle_degrees: number;
    progress_pct: number;
  };
  gears_mesh: GearMeshNode[];
}

export interface HilalEvaluationResponse {
  latitude: number;
  longitude: number;
  elevation_meters: number;
  altitude: number;
  elongation: number;
  mabims_passed: boolean;
  wujudul_hilal_passed: boolean;
  mabims_note: string;
  wujud_note: string;
  odeh_zone: string;
  conjunction_utc: string;
  conjunction_julian_day: number;
  days_remaining: number;
  sunset_utc: string;
  sunset_azimuth: number;
  sun_altitude_at_sunset: number;
  moon_altitude_at_sunset: number;
  moon_azimuth_at_sunset: number;
  relative_azimuth: number;
  crescent_width_arcmin: number;
  crescent_tilt_deg: number;
  moonset_utc: string;
  lag_time_minutes: number;
  danjon_passed: boolean;
}

export interface PrayerTimesApiResponse {
  latitude: number;
  longitude: number;
  elevation_meters: number;
  timezone_offset_hours: number;
  utc_date: string;
  local_time: string;
  imsak_utc: string;
  fajr_utc: string;
  sunrise_utc: string;
  dhuhr_utc: string;
  asr_utc: string;
  sunset_utc: string;
  maghrib_utc: string;
  isha_utc: string;
  midnight_utc: string;
  last_third_utc: string;
  active_prayer: string;
  next_prayer: string;
  seconds_to_next_prayer: number;
  countdown_formatted: string;
  solar_altitude_deg: number;
  solar_azimuth_deg: number;
  shadow_ratio: number;
  qibla_bearing_deg: number;
  qibla_distance_km: number;
  qibla_cardinal: string;
  qibla_west_offset_deg: number;
}

export interface EclipsePrediction {
  kind: 'Solar' | 'Lunar';
  eclipse_type: 'Total' | 'Annular' | 'Hybrid' | 'Partial' | 'Penumbral';
  julian_day: number;
  utc_datetime_str: string;
  moon_latitude_deg: number;
  gamma: number;
  magnitude: number;
  saros_series: number;
  saros_step_in_cycle: number;
  description: string;
}

export interface EclipsesApiResponse {
  next_solar_eclipse: EclipsePrediction;
  next_lunar_eclipse: EclipsePrediction;
  antikythera_saros_step: number;
  antikythera_exeligmos_sector: number;
  total_synodic_months: number;
}

