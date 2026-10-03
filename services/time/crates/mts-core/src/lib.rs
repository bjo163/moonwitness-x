//! # MTS Core: Antikythera Mathematical & Harmonic Engine
//!
//! Crate ini menyediakan implementasi murni tanpa dependensi eksternal berat
//! untuk:
//! 1. Aritmatika bilangan rasional tanpa floating-point drift (`rational`).
//! 2. Satuan fisik dimensional strongly-typed (`units`: Degrees, Radians, JulianDay).
//! 3. Simulasi roda gigi Antikythera (`gears`: Metonik, Callippic, Saros, Exeligmos).
//! 4. Mekanisme anomali eksentrisitas pin-and-slot Keplerian (`pin_slot`).

pub mod cosmic;
pub mod gears;
pub mod pin_slot;
pub mod rational;
pub mod units;

pub use cosmic::{
    CosmicPeriod, CosmicTimeEngine, CosmicTimeState, RevelationalRatios, SPEED_OF_LIGHT_M_S,
    UNIVERSE_AGE_YEARS,
};
pub use gears::{AntikytheraGearTrain, AntikytheraState};
pub use pin_slot::PinSlotMechanism;
pub use rational::{ExactRationalTime, GearRatio};
pub use units::{ArcSeconds, Degrees, JulianCentury, JulianDay, Radians, Turns};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_antikythera_full_train() {
        let train = AntikytheraGearTrain::new();
        let state = train.evaluate(235); // Tepat 1 siklus Metonik selesai
        assert_eq!(state.metonic.month_index, 0);
        assert_eq!(state.callippic.metonic_cycle_index, 1);
        assert_eq!(state.saros.month_index, 12); // 235 % 223 = 12
        assert_eq!(state.saros.saros_cycle_number, 1);
        assert_eq!(state.exeligmos.sector, 1); // +8 jam
        assert_eq!(state.exeligmos.hour_shift, 8);
    }
}
