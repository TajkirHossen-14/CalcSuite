/**
 * format.js — number/date formatting helpers.
 */

const locale = undefined; // use the visitor's locale

/** Human-friendly number: thousands separators, sensible precision, sci-notation for extremes. */
export function fmt(value, maxDecimals = 6) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-7) return n.toExponential(4).replace('e', ' × 10^');
  const decimals = abs >= 1000 ? Math.min(maxDecimals, 2)
    : abs >= 1 ? maxDecimals
      : Math.min(12, maxDecimals + Math.ceil(-Math.log10(abs)));
  return new Intl.NumberFormat(locale, { maximumFractionDigits: decimals }).format(n);
}

/** Fixed-decimal formatting with grouping (money-like). */
export function fmtFixed(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

export function fmtCurrency(value, currency = 'USD') {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
  } catch (_) {
    return `${fmtFixed(n, 2)} ${currency}`;
  }
}

export const fmtPercent = (value, decimals = 2) => `${fmtFixed(value, decimals)}%`;

/** Strip trailing zeros from a fixed-decimal string: 1.500 -> 1.5 */
export const trimZeros = (str) => String(str).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');

/** Round to n significant digits (converter output). */
export function toSignificant(value, digits = 10) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return n === 0 ? '0' : '—';
  const rounded = Number(n.toPrecision(digits));
  const abs = Math.abs(rounded);
  if (abs >= 1e16 || abs < 1e-9) return rounded.toExponential(6);
  return trimZeros(rounded.toFixed(Math.max(0, digits - Math.floor(Math.log10(abs)) - 1)));
}

export function fmtDate(date, opts = { dateStyle: 'medium' }) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, opts).format(d);
}

export function fmtRelative(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(timestamp);
}

/** Pluralise: plural(1,'day') -> '1 day' */
export const plural = (count, noun, suffix = 's') => `${fmt(count)} ${noun}${Math.abs(count) === 1 ? '' : suffix}`;

/** Pad a number with leading zeros. */
export const pad = (n, size = 2) => String(Math.trunc(Math.abs(n))).padStart(size, '0');
