use mts_core::units::JulianDay;
use mts_ephemeris::{LunarEphemeris, SolarEphemeris};

pub struct CelestialRootSolver;

impl CelestialRootSolver {
    /// Menghitung selisih sudut elongasi relatif terhadap sudut target
    /// Mengembalikan sudut bertanda [-180, +180) dalam derajat
    pub fn elongation_error(jd: JulianDay, target_elongation_deg: f64) -> f64 {
        let sun = SolarEphemeris::calculate(jd);
        let moon = LunarEphemeris::calculate(jd);
        let diff = moon.ecliptic_longitude.0 - sun.apparent_longitude.0 - target_elongation_deg;
        let mut rem = diff % 360.0;
        if rem < -180.0 {
            rem += 360.0;
        } else if rem >= 180.0 {
            rem -= 360.0;
        }
        rem
    }

    /// Algoritma Brent-Dekker Hybrid untuk mencari waktu eksak (JulianDay)
    /// di mana sudut elongasi mencapai nilai target
    ///
    /// Rentang pencarian [a, b] harus mengapit akar (f(a) * f(b) <= 0)
    pub fn brent_find_event(
        mut a: JulianDay,
        mut b: JulianDay,
        target_elongation_deg: f64,
        tolerance_days: f64,
        max_iterations: u32,
    ) -> Result<JulianDay, &'static str> {
        let mut fa = Self::elongation_error(a, target_elongation_deg);
        let mut fb = Self::elongation_error(b, target_elongation_deg);

        if fa * fb > 0.0 {
            return Err("Batas pencarian [a, b] tidak mengapit perubahan fase/event");
        }

        if fa.abs() < fb.abs() {
            std::mem::swap(&mut a, &mut b);
            std::mem::swap(&mut fa, &mut fb);
        }

        let mut c = a;
        let mut fc = fa;
        let mut mflag = true;
        let mut d = JulianDay::new(0.0);

        for _ in 0..max_iterations {
            if fb.abs() < 1e-9 || (b.0 - a.0).abs() < tolerance_days {
                return Ok(b);
            }

            let s = if (fa - fc).abs() > 1e-12 && (fb - fc).abs() > 1e-12 {
                // Inverse quadratic interpolation
                let term1 = (a.0 * fb * fc) / ((fa - fb) * (fa - fc));
                let term2 = (b.0 * fa * fc) / ((fb - fa) * (fb - fc));
                let term3 = (c.0 * fa * fb) / ((fc - fa) * (fc - fb));
                term1 + term2 + term3
            } else {
                // Secant method
                b.0 - fb * (b.0 - a.0) / (fb - fa)
            };

            // Kondisi bisection fallback
            let cond1 = !((s > (3.0 * a.0 + b.0) / 4.0 && s < b.0) || (s < (3.0 * a.0 + b.0) / 4.0 && s > b.0));
            let cond2 = mflag && (s - b.0).abs() >= (b.0 - c.0).abs() / 2.0;
            let cond3 = !mflag && (s - b.0).abs() >= (c.0 - d.0).abs() / 2.0;
            let cond4 = mflag && (b.0 - c.0).abs() < tolerance_days;
            let cond5 = !mflag && (c.0 - d.0).abs() < tolerance_days;

            let s_final = if cond1 || cond2 || cond3 || cond4 || cond5 {
                mflag = true;
                (a.0 + b.0) / 2.0 // Bisection
            } else {
                mflag = false;
                s
            };

            d = c;
            c = b;
            fc = fb;

            let fs = Self::elongation_error(JulianDay::new(s_final), target_elongation_deg);

            if fa * fs < 0.0 {
                b = JulianDay::new(s_final);
                fb = fs;
            } else {
                a = JulianDay::new(s_final);
                fa = fs;
            }

            if fa.abs() < fb.abs() {
                std::mem::swap(&mut a, &mut b);
                std::mem::swap(&mut fa, &mut fb);
            }
        }

        Ok(b)
    }

    /// Mencari waktu fase astronomis tertentu (target_elongation_deg)
    /// yang terjadi setelah start_jd (0.0 = Ijtimak/New Moon, 180.0 = Istiqbal/Full Moon)
    pub fn next_phase(start_jd: JulianDay, target_elongation_deg: f64) -> Result<JulianDay, &'static str> {
        let mut cur = start_jd;
        let step = 1.0; // 1 hari
        let max_search_days = 35.0; // Lebih dari 1 bulan sinodik

        for _ in 0..(max_search_days as usize) {
            let next = cur + step;
            let err_cur = Self::elongation_error(cur, target_elongation_deg);
            let err_next = Self::elongation_error(next, target_elongation_deg);

            if err_cur * err_next <= 0.0 && err_cur < 0.0 && err_next >= 0.0 {
                // Konvergensi ke presisi 0.1 detik (1 detik = 1/86400 hari ~= 1.15e-5 hari)
                return Self::brent_find_event(cur, next, target_elongation_deg, 1e-6, 50);
            }
            cur = next;
        }

        Err("Tidak ditemukan perubahan fase dalam rentang 35 hari ke depan")
    }

    /// Mencari Ijtimak Sejati (True Conjunction / New Moon, \Delta\lambda = 0.0)
    /// yang terjadi setelah start_jd
    pub fn next_conjunction(start_jd: JulianDay) -> Result<JulianDay, &'static str> {
        Self::next_phase(start_jd, 0.0)
    }

    /// Mencari Istiqbal Sejati (True Opposition / Full Moon, \Delta\lambda = 180.0)
    /// yang terjadi setelah start_jd
    pub fn next_opposition(start_jd: JulianDay) -> Result<JulianDay, &'static str> {
        Self::next_phase(start_jd, 180.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_next_conjunction_convergence() {
        // Cari ijtimak setelah J2000.0 (Januari 2000)
        let res = CelestialRootSolver::next_conjunction(JulianDay::J2000);
        assert!(res.is_ok());
        let conj_jd = res.unwrap();
        // Cek bahwa elongasi di titik ini benar-benar nol (selisih < 0.001 derajat)
        let err = CelestialRootSolver::elongation_error(conj_jd, 0.0);
        assert!(err.abs() < 0.001);
    }
}
