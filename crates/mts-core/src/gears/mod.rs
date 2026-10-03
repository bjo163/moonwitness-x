pub mod callippic;
pub mod exeligmos;
pub mod metonic;
pub mod saros;

pub use callippic::{CallippicGear, CallippicState};
pub use exeligmos::{ExeligmosGear, ExeligmosState};
pub use metonic::{MetonicGear, MetonicState};
pub use saros::{SarosGear, SarosState};

use serde::{Deserialize, Serialize};

/// Komposit Seluruh Rangkaian Roda Gigi Antikythera (Master Train)
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AntikytheraGearTrain {
    pub metonic: MetonicGear,
    pub callippic: CallippicGear,
    pub saros: SarosGear,
    pub exeligmos: ExeligmosGear,
}

impl Default for AntikytheraGearTrain {
    fn default() -> Self {
        Self {
            metonic: MetonicGear::default(),
            callippic: CallippicGear::default(),
            saros: SarosGear::default(),
            exeligmos: ExeligmosGear::default(),
        }
    }
}

impl AntikytheraGearTrain {
    pub fn new() -> Self {
        Self::default()
    }

    /// Evaluasi seluruh status dial roda gigi secara simultan dari jumlah bulan sinodik
    pub fn evaluate(&self, total_synodic_months: u32) -> AntikytheraState {
        let metonic_state = self.metonic.step(total_synodic_months);
        let callippic_state = self.callippic.step(total_synodic_months);
        let saros_state = self.saros.step(total_synodic_months);
        let exeligmos_state = self.exeligmos.step(saros_state.saros_cycle_number);

        AntikytheraState {
            total_synodic_months,
            metonic: metonic_state,
            callippic: callippic_state,
            saros: saros_state,
            exeligmos: exeligmos_state,
        }
    }
}

/// Snapshot Keadaan Seluruh Dial Roda Gigi
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AntikytheraState {
    pub total_synodic_months: u32,
    pub metonic: MetonicState,
    pub callippic: CallippicState,
    pub saros: SarosState,
    pub exeligmos: ExeligmosState,
}
