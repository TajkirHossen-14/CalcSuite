/**
 * Fraction.js — exact rational arithmetic shared by the fraction calculator
 * and the fraction ⟷ decimal ⟷ percentage converter.
 */
export const gcd = (a, b) => {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y) { [x, y] = [y, x % y]; }
  return x || 1;
};

export const lcm = (a, b) => Math.abs(Math.trunc(a) * Math.trunc(b)) / gcd(a, b);

export class Fraction {
  constructor(numerator, denominator = 1) {
    if (denominator === 0) throw new Error('Denominator cannot be zero');
    // Scale away any decimals so 0.5/1 becomes 5/10 before simplifying.
    let n = numerator; let d = denominator;
    while (!Number.isInteger(n) || !Number.isInteger(d)) { n *= 10; d *= 10; }
    const sign = Math.sign(n) * Math.sign(d) || 1;
    const g = gcd(n, d);
    this.n = (Math.abs(n) / g) * sign;
    this.d = Math.abs(d) / g;
  }

  static fromDecimal(value, maxDenominator = 1000000) {
    const x = Number(value);
    if (!Number.isFinite(x)) throw new Error('Not a number');
    if (Number.isInteger(x)) return new Fraction(x, 1);
    // Stern–Brocot / continued-fraction search for the best rational approximation.
    let [lowerN, lowerD, upperN, upperD] = [0, 1, 1, 0];
    const negative = x < 0;
    const target = Math.abs(x);
    let n = 1; let d = 1;
    for (let i = 0; i < 10000; i += 1) {
      const value2 = n / d;
      if (Math.abs(value2 - target) < 1e-12) break;
      if (value2 < target) { [lowerN, lowerD] = [n, d]; } else { [upperN, upperD] = [n, d]; }
      n = lowerN + upperN; d = lowerD + upperD;
      if (d > maxDenominator) break;
    }
    return new Fraction(negative ? -n : n, d);
  }

  /** Parse "3/4", "1 1/2", "-5", "0.75". */
  static parse(input) {
    const str = String(input).trim();
    if (!str) return null;
    const mixed = str.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixed) {
      const whole = Number(mixed[1]);
      const frac = new Fraction(Number(mixed[2]), Number(mixed[3]));
      const sign = whole < 0 ? -1 : 1;
      return new Fraction(Math.abs(whole) * frac.d + frac.n, frac.d).scale(sign);
    }
    const simple = str.match(/^(-?\d*\.?\d+)\s*\/\s*(-?\d*\.?\d+)$/);
    if (simple) {
      if (Number(simple[2]) === 0) return null;
      return new Fraction(Number(simple[1]), Number(simple[2]));
    }
    if (/^-?\d*\.?\d+$/.test(str)) return Fraction.fromDecimal(Number(str));
    return null;
  }

  scale(sign) { return new Fraction(this.n * sign, this.d); }
  add(other) { return new Fraction(this.n * other.d + other.n * this.d, this.d * other.d); }
  sub(other) { return new Fraction(this.n * other.d - other.n * this.d, this.d * other.d); }
  mul(other) { return new Fraction(this.n * other.n, this.d * other.d); }
  div(other) {
    if (other.n === 0) throw new Error('Cannot divide by zero');
    return new Fraction(this.n * other.d, this.d * other.n);
  }

  get value() { return this.n / this.d; }
  get isWhole() { return this.d === 1; }

  toString() { return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`; }

  toMixed() {
    if (Math.abs(this.n) < this.d) return this.toString();
    const whole = Math.trunc(this.n / this.d);
    const rem = Math.abs(this.n % this.d);
    return rem === 0 ? String(whole) : `${whole} ${rem}/${this.d}`;
  }

  toPercent(decimals = 4) {
    const p = (this.n / this.d) * 100;
    return `${Number(p.toFixed(decimals))}%`;
  }
}
