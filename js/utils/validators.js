/**
 * validators.js — input parsing/validation helpers shared by all tools.
 */

/** True for finite numeric values (accepts numeric strings, rejects '' and NaN). */
export function isNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed === '') return false;
  return Number.isFinite(Number(trimmed));
}

/** Parse to Number or return the fallback (default NaN). */
export function toNumber(value, fallback = NaN) {
  return isNumber(value) ? Number(String(value).trim()) : fallback;
}

export const inRange = (value, min, max) => isNumber(value) && Number(value) >= min && Number(value) <= max;
export const isPositive = (value) => isNumber(value) && Number(value) > 0;
export const isNonNegative = (value) => isNumber(value) && Number(value) >= 0;
export const isInteger = (value) => isNumber(value) && Number.isInteger(Number(value));

/** Parse a list of numbers from comma / space / newline / semicolon separated text. */
export function parseNumberList(text) {
  if (typeof text !== 'string') return [];
  return text
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter((t) => t !== '')
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

/** Are all characters of `str` legal digits in the given radix (2–36)? */
export function isValidInBase(str, base) {
  const clean = String(str).trim().replace(/^[-+]/, '').replace('.', '');
  if (clean === '') return false;
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, base);
  return clean.toLowerCase().split('').every((ch) => digits.includes(ch));
}

export const isValidDate = (value) => value instanceof Date ? !Number.isNaN(value.getTime()) : !Number.isNaN(new Date(value).getTime());

/**
 * Attach/remove an inline validation message under a field.
 * Returns the boolean validity so it can be chained in conditions.
 */
export function setFieldError(input, message = '') {
  if (!input) return !message;
  const field = input.closest('.field') || input.parentElement;
  let slot = field ? field.querySelector('.field-error') : null;
  if (message) {
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    if (!slot && field) {
      slot = document.createElement('p');
      slot.className = 'field-error';
      field.append(slot);
    }
    if (slot) slot.textContent = message;
  } else {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    if (slot) slot.textContent = '';
  }
  return !message;
}

/** Validate a numeric input element against optional rules; shows inline errors. */
export function validateNumber(input, { min = -Infinity, max = Infinity, integer = false, required = true, label = 'Value' } = {}) {
  const raw = input.value;
  if (raw.trim() === '') return setFieldError(input, required ? `${label} is required` : '') ? null : null;
  if (!isNumber(raw)) { setFieldError(input, `${label} must be a number`); return null; }
  const num = Number(raw);
  if (integer && !Number.isInteger(num)) { setFieldError(input, `${label} must be a whole number`); return null; }
  if (num < min) { setFieldError(input, `${label} must be ≥ ${min}`); return null; }
  if (num > max) { setFieldError(input, `${label} must be ≤ ${max}`); return null; }
  setFieldError(input, '');
  return num;
}
