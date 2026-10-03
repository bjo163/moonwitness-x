use num_bigint::BigInt;
use num_rational::{BigRational, Ratio};
use num_traits::{ToPrimitive, Zero};
use serde::{Deserialize, Serialize};

/// Rasio Roda Gigi Standar (64-bit integer rational)
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub struct GearRatio {
    numer: i64,
    denom: i64,
}

impl GearRatio {
    /// Membuat rasio baru Z1 / Z2 (menyederhanakan ke bentuk terkecil)
    pub fn new(numer: i64, denom: i64) -> Self {
        assert!(denom != 0, "Denominator gigi tidak boleh nol");
        let r = Ratio::new(numer, denom);
        Self {
            numer: *r.numer(),
            denom: *r.denom(),
        }
    }

    pub fn numer(&self) -> i64 {
        self.numer
    }

    pub fn denom(&self) -> i64 {
        self.denom
    }

    pub fn to_ratio(&self) -> Ratio<i64> {
        Ratio::new(self.numer, self.denom)
    }

    pub fn to_f64(&self) -> f64 {
        self.numer as f64 / self.denom as f64
    }

    /// Perkalian rasio roda gigi bersusun (Gear train compound)
    pub fn multiply(&self, other: &GearRatio) -> Self {
        let r1 = self.to_ratio();
        let r2 = other.to_ratio();
        let res = r1 * r2;
        Self {
            numer: *res.numer(),
            denom: *res.denom(),
        }
    }

    /// Membalik rasio (Inverse ratio)
    pub fn recip(&self) -> Self {
        Self::new(self.denom, self.numer)
    }
}

/// Representasi Waktu Rasional Tanpa Batas (Arbitrary Precision Rational Time)
/// Mencegah akumulasi drift numerik berapapun abad/milenium yang disimulasikan.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub struct ExactRationalTime {
    inner: BigRational,
}

impl ExactRationalTime {
    pub fn zero() -> Self {
        Self {
            inner: BigRational::zero(),
        }
    }

    pub fn from_integers(numer: i64, denom: i64) -> Self {
        Self {
            inner: BigRational::new(BigInt::from(numer), BigInt::from(denom)),
        }
    }

    pub fn from_gear_ratio(ratio: &GearRatio) -> Self {
        Self::from_integers(ratio.numer(), ratio.denom())
    }

    /// Menambahkan putaran waktu
    pub fn add(&self, other: &Self) -> Self {
        Self {
            inner: &self.inner + &other.inner,
        }
    }

    /// Mengurangkan putaran waktu
    pub fn sub(&self, other: &Self) -> Self {
        Self {
            inner: &self.inner - &other.inner,
        }
    }

    /// Mengalikan dengan rasio gigi
    pub fn mul_ratio(&self, ratio: &GearRatio) -> Self {
        let r = BigRational::new(BigInt::from(ratio.numer()), BigInt::from(ratio.denom()));
        Self {
            inner: &self.inner * r,
        }
    }

    /// Mengambil bagian bulat (siklus penuh)
    pub fn whole_cycles(&self) -> BigInt {
        self.inner.to_integer()
    }

    /// Mengambil fraksi sisa siklus [0, 1)
    pub fn cycle_fraction(&self) -> BigRational {
        let whole = self.inner.to_integer();
        &self.inner - BigRational::from(whole)
    }

    /// Konversi ke f64 untuk visualisasi/render
    pub fn to_f64(&self) -> f64 {
        self.inner.to_f64().unwrap_or(0.0)
    }

    /// Menghitung posisi derajat [0.0, 360.0)
    pub fn to_degrees_f64(&self) -> f64 {
        let frac = self.cycle_fraction();
        let deg_factor = BigRational::from_integer(BigInt::from(360));
        let deg = frac * deg_factor;
        deg.to_f64().unwrap_or(0.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gear_reduction() {
        let g1 = GearRatio::new(38, 48);
        let g2 = GearRatio::new(48, 24);
        let res = g1.multiply(&g2);
        assert_eq!(res.numer(), 19);
        assert_eq!(res.denom(), 12);
    }

    #[test]
    fn test_zero_drift_addition() {
        // Simulasi 19 tahun * 235/19 = tepat 235 siklus
        let metonic_ratio = GearRatio::new(235, 19);
        let year_input = ExactRationalTime::from_integers(19, 1);
        let lunar_output = year_input.mul_ratio(&metonic_ratio);
        assert_eq!(lunar_output.whole_cycles(), BigInt::from(235));
        assert_eq!(lunar_output.cycle_fraction(), BigRational::zero());
    }
}
