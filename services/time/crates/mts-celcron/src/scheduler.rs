use crate::solver::CelestialRootSolver;
use crate::trigger::{CelestialEventTrigger, CelestialEventType};
use mts_core::units::JulianDay;
use tokio::sync::broadcast;

/// Mesin Penjadwal Asinkron CelCron
pub struct CelestialScheduler {
    sender: broadcast::Sender<CelestialEventTrigger>,
}

impl Default for CelestialScheduler {
    fn default() -> Self {
        let (sender, _) = broadcast::channel(128);
        Self { sender }
    }
}

impl CelestialScheduler {
    pub fn new() -> Self {
        Self::default()
    }

    /// Berlangganan aliran event astronomis realtime
    pub fn subscribe(&self) -> broadcast::Receiver<CelestialEventTrigger> {
        self.sender.subscribe()
    }

    /// Menerbitkan event ke seluruh subscriber
    pub fn emit(&self, event: CelestialEventTrigger) {
        let _ = self.sender.send(event);
    }

    /// Mencari N ijtimak berikutnya secara berurutan
    pub fn upcoming_conjunctions(
        start_jd: JulianDay,
        count: usize,
    ) -> Result<Vec<CelestialEventTrigger>, &'static str> {
        let mut results = Vec::with_capacity(count);
        let mut cur = start_jd;

        for i in 0..count {
            let next_conj = CelestialRootSolver::next_conjunction(cur)?;
            results.push(CelestialEventTrigger::new(
                CelestialEventType::Conjunction,
                next_conj,
                format!("Ijtimak Sejati #{}", i + 1),
            ));
            // Maju 5 hari setelah ijtimak untuk mencari ijtimak berikutnya
            cur = next_conj + 5.0;
        }

        Ok(results)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_upcoming_conjunctions_sequence() {
        let list = CelestialScheduler::upcoming_conjunctions(JulianDay::J2000, 3);
        assert!(list.is_ok());
        let items = list.unwrap();
        assert_eq!(items.len(), 3);
        // Selisih antara dua ijtimak harus sekitar 29.5 hari
        let diff1 = items[1].timestamp_jd.0 - items[0].timestamp_jd.0;
        assert!((diff1 - 29.53).abs() < 1.0);
    }
}
