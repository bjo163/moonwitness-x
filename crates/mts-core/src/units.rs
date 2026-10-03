use serde::{Deserialize, Serialize};
use std::f64::consts::PI;
use std::ops::{Add, AddAssign, Div, Mul, Neg, Sub, SubAssign};

/// Sudut dalam Derajat (Degrees, [0, 360))
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Serialize, Deserialize, Default)]
pub struct Degrees(pub f64);

/// Sudut dalam Radian (Radians, [0, 2*PI))
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Serialize, Deserialize, Default)]
pub struct Radians(pub f64);

/// Sudut dalam Detik Busur (ArcSeconds)
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Serialize, Deserialize, Default)]
pub struct ArcSeconds(pub f64);

/// Putaran Penuh (Turns / Rotations, 1 Turn = 360 Derajat = 2*PI Radian)
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Serialize, Deserialize, Default)]
pub struct Turns(pub f64);

/// Julian Day (Waktu Astronomis Kontinu)
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Serialize, Deserialize, Default)]
pub struct JulianDay(pub f64);

/// Julian Century (Abad Julian, 36525 hari sejak J2000.0)
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Serialize, Deserialize, Default)]
pub struct JulianCentury(pub f64);

// =========================================================================
// Konversi Sudut (Angle Conversions)
// =========================================================================

impl Degrees {
    pub const ZERO: Degrees = Degrees(0.0);
    pub const FULL_CIRCLE: Degrees = Degrees(360.0);
    pub const HALF_CIRCLE: Degrees = Degrees(180.0);

    pub fn new(deg: f64) -> Self {
        Degrees(deg)
    }

    pub fn to_radians(self) -> Radians {
        Radians(self.0 * PI / 180.0)
    }

    pub fn to_arcseconds(self) -> ArcSeconds {
        ArcSeconds(self.0 * 3600.0)
    }

    pub fn to_turns(self) -> Turns {
        Turns(self.0 / 360.0)
    }

    /// Menormalkan sudut ke rentang [0.0, 360.0)
    pub fn normalize(self) -> Self {
        let mut rem = self.0 % 360.0;
        if rem < 0.0 {
            rem += 360.0;
        }
        Degrees(rem)
    }

    /// Menormalkan sudut ke rentang bertanda [-180.0, +180.0)
    pub fn normalize_signed(self) -> Self {
        let mut d = self.normalize().0;
        if d >= 180.0 {
            d -= 360.0;
        }
        Degrees(d)
    }

    pub fn abs(self) -> Self {
        Degrees(self.0.abs())
    }
}

impl Radians {
    pub const ZERO: Radians = Radians(0.0);
    pub const PI_VAL: Radians = Radians(PI);
    pub const TWO_PI: Radians = Radians(2.0 * PI);

    pub fn new(rad: f64) -> Self {
        Radians(rad)
    }

    pub fn to_degrees(self) -> Degrees {
        Degrees(self.0 * 180.0 / PI)
    }

    pub fn to_turns(self) -> Turns {
        Turns(self.0 / (2.0 * PI))
    }

    /// Menormalkan radian ke rentang [0, 2*PI)
    pub fn normalize(self) -> Self {
        let two_pi = 2.0 * PI;
        let mut rem = self.0 % two_pi;
        if rem < 0.0 {
            rem += two_pi;
        }
        Radians(rem)
    }

    /// Menormalkan radian ke rentang [-PI, +PI)
    pub fn normalize_signed(self) -> Self {
        let mut r = self.normalize().0;
        if r >= PI {
            r -= 2.0 * PI;
        }
        Radians(r)
    }

    pub fn sin(self) -> f64 {
        self.0.sin()
    }

    pub fn cos(self) -> f64 {
        self.0.cos()
    }

    pub fn tan(self) -> f64 {
        self.0.tan()
    }
}

impl Turns {
    pub fn new(t: f64) -> Self {
        Turns(t)
    }

    pub fn to_degrees(self) -> Degrees {
        Degrees(self.0 * 360.0)
    }

    pub fn to_radians(self) -> Radians {
        Radians(self.0 * 2.0 * PI)
    }

    /// Fraksi siklus [0.0, 1.0)
    pub fn fraction(self) -> f64 {
        let mut rem = self.0 % 1.0;
        if rem < 0.0 {
            rem += 1.0;
        }
        rem
    }
}

// =========================================================================
// Julian Day & Century
// =========================================================================

impl JulianDay {
    /// Epoch J2000.0 standar (1 Januari 2000, 12:00 TT) = JD 2451545.0
    pub const J2000: JulianDay = JulianDay(2451545.0);

    pub fn new(jd: f64) -> Self {
        JulianDay(jd)
    }

    /// Mengonversi JD menjadi Julian Centuries sejak J2000.0 (T)
    pub fn to_centuries(self) -> JulianCentury {
        JulianCentury((self.0 - Self::J2000.0) / 36525.0)
    }

    /// Menghitung selisih hari
    pub fn days_since(self, earlier: JulianDay) -> f64 {
        self.0 - earlier.0
    }
}

impl JulianCentury {
    pub fn new(t: f64) -> Self {
        JulianCentury(t)
    }

    pub fn to_julian_day(self) -> JulianDay {
        JulianDay(JulianDay::J2000.0 + self.0 * 36525.0)
    }
}

// =========================================================================
// Operator Overloading
// =========================================================================

impl Add for Degrees {
    type Output = Self;
    fn add(self, rhs: Self) -> Self {
        Degrees(self.0 + rhs.0)
    }
}

impl AddAssign for Degrees {
    fn add_assign(&mut self, rhs: Self) {
        self.0 += rhs.0;
    }
}

impl Sub for Degrees {
    type Output = Self;
    fn sub(self, rhs: Self) -> Self {
        Degrees(self.0 - rhs.0)
    }
}

impl SubAssign for Degrees {
    fn sub_assign(&mut self, rhs: Self) {
        self.0 -= rhs.0;
    }
}

impl Mul<f64> for Degrees {
    type Output = Self;
    fn mul(self, rhs: f64) -> Self {
        Degrees(self.0 * rhs)
    }
}

impl Div<f64> for Degrees {
    type Output = Self;
    fn div(self, rhs: f64) -> Self {
        Degrees(self.0 / rhs)
    }
}

impl Neg for Degrees {
    type Output = Self;
    fn neg(self) -> Self {
        Degrees(-self.0)
    }
}

impl Add for Radians {
    type Output = Self;
    fn add(self, rhs: Self) -> Self {
        Radians(self.0 + rhs.0)
    }
}

impl Sub for Radians {
    type Output = Self;
    fn sub(self, rhs: Self) -> Self {
        Radians(self.0 - rhs.0)
    }
}

impl Mul<f64> for Radians {
    type Output = Self;
    fn mul(self, rhs: f64) -> Self {
        Radians(self.0 * rhs)
    }
}

impl Div<f64> for Radians {
    type Output = Self;
    fn div(self, rhs: f64) -> Self {
        Radians(self.0 / rhs)
    }
}

impl Neg for Radians {
    type Output = Self;
    fn neg(self) -> Self {
        Radians(-self.0)
    }
}

impl Add<f64> for JulianDay {
    type Output = Self;
    fn add(self, days: f64) -> Self {
        JulianDay(self.0 + days)
    }
}

impl Sub<f64> for JulianDay {
    type Output = Self;
    fn sub(self, days: f64) -> Self {
        JulianDay(self.0 - days)
    }
}

impl Sub for JulianDay {
    type Output = f64;
    fn sub(self, rhs: Self) -> f64 {
        self.0 - rhs.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_degree_normalization() {
        assert_eq!(Degrees(370.0).normalize(), Degrees(10.0));
        assert_eq!(Degrees(-30.0).normalize(), Degrees(330.0));
        assert_eq!(Degrees(350.0).normalize_signed(), Degrees(-10.0));
        assert_eq!(Degrees(10.0).normalize_signed(), Degrees(10.0));
    }

    #[test]
    fn test_conversions() {
        let d = Degrees(180.0);
        let r = d.to_radians();
        assert!((r.0 - PI).abs() < 1e-12);
        assert_eq!(d.to_turns().0, 0.5);
    }

    #[test]
    fn test_julian_conversions() {
        let jd = JulianDay::J2000;
        assert_eq!(jd.to_centuries().0, 0.0);
        let century_after = JulianDay(JulianDay::J2000.0 + 36525.0);
        assert_eq!(century_after.to_centuries().0, 1.0);
    }
}
