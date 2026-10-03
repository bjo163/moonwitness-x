//! # MTS CelCron: Celestial Event Scheduler Engine
//!
//! Menyediakan:
//! 1. Algoritma root finding Brent-Dekker untuk event astronomis (`solver`).
//! 2. Definisi event trigger (`trigger`).
//! 3. Scheduler asinkron dengan antrean prioritas event (`scheduler`).

pub mod eclipse;
pub mod scheduler;
pub mod solver;
pub mod trigger;

pub use eclipse::{EclipseKind, EclipsePrediction, EclipsePredictor, EclipseType};
pub use scheduler::CelestialScheduler;
pub use solver::CelestialRootSolver;
pub use trigger::{CelestialEventTrigger, CelestialEventType};
