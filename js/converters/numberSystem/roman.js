/** Roman Numeral Converter — both directions, 1 to 3,999,999. */
import { on, qs } from '../../utils/dom.js';
import { fmt } from '../../utils/format.js';

const TABLE = [
  [1000000, 'M̄'], [900000, 'C̄M̄'], [500000, 'D̄'], [400000, 'C̄D̄'], [100000, 'C̄'],
  [90000, 'X̄C̄'], [50000, 'L̄'], [40000, 'X̄L̄'], [10000, 'X̄'], [9000, 'MX̄'],
  [5000, 'V̄'], [4000, 'MV̄'], [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'],
  [5, 'V'], [4, 'IV'], [1, 'I']
];
const VALUES = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

export function toRoman(num) {
  let n = Math.trunc(num);
  if (!Number.isFinite(n) || n < 1 || n > 3999999) return null;
  return TABLE.reduce((acc, [value, symbol]) => {
    while (n >= value) { acc += symbol; n -= value; }
    return acc;
  }, '');
}

export function fromRoman(str) {
  const s = String(str).toUpperCase().replace(/\s/g, '');
  if (!s) return null;
  const plain = s.replace(/\u0304/g, ''); // strip overlines (vinculum) for validation
  if (!/^[IVXLCDM]+$/.test(plain)) return null;
  // Handle the vinculum (×1000) notation character by character.
  let total = 0; let prev = 0;
  const chars = [...s];
  for (let i = chars.length - 1; i >= 0; i -= 1) {
    let ch = chars[i];
    let multiplier = 1;
    if (ch === '\u0304') { i -= 1; ch = chars[i]; multiplier = 1000; }
    const value = (VALUES[ch] || 0) * multiplier;
    if (value < prev) total -= value;
    else { total += value; prev = value; }
  }
  return total > 0 ? total : null;
}

const isCanonical = (input, number) => toRoman(number) === String(input).toUpperCase().replace(/\s/g, '');

export default {
  resultLabel: 'Converted value',
  how: `
    <p>Roman numerals are additive with a subtractive shortcut: symbols are written largest-first
    and added up, except when a smaller symbol sits immediately before a larger one, in which case
    it is subtracted (IV = 4, not 6).</p>
    <code class="formula">Number → Roman : greedily subtract the largest value that still fits
Roman → Number : scan right-to-left, subtract any symbol smaller than the one after it</code>
    <p>The greedy table already contains the six subtractive pairs (CM, CD, XC, XL, IX, IV), which
    is what guarantees canonical output — 1990 becomes MCMXC, never MXM.</p>
    <h4>Beyond 3,999</h4>
    <p>Classical numerals stop at MMMCMXCIX (3,999). For larger values the Romans used a
    <em>vinculum</em>: an overline meaning "×1000", so V̄ is 5,000 and X̄ is 10,000. This converter
    supports that notation up to 3,999,999.</p>
    <h4>Reading direction matters</h4>
    <p>The parser also tells you whether what you typed is the <em>canonical</em> spelling. IIII
    reads as 4 (and clock faces really do use it), but the standard form is IV.</p>`,

  body: () => `
    <div class="conv-row">
      <div class="field">
        <label for="num">Number</label>
        <input type="number" id="num" value="2026" min="1" max="3999999" step="1" class="conv-value">
        <span class="field-hint">1 – 3,999,999</span>
      </div>
      <button class="swap-btn" id="swap" type="button" title="Focus the other field"><i class="fa-solid fa-right-left"></i></button>
      <div class="field">
        <label for="rom">Roman numeral</label>
        <input type="text" id="rom" value="MMXXVI" class="conv-value mono" spellcheck="false" style="text-transform:uppercase">
        <span class="field-hint" id="canon-hint"></span>
      </div>
    </div>
    <p class="field-error" id="rom-error"></p>
    <div class="stat-grid mt-4">
      <div class="stat"><div class="stat-label">Breakdown</div><div class="stat-value" id="breakdown" style="font-size:var(--fs-sm)">—</div></div>
      <div class="stat"><div class="stat-label">Symbol count</div><div class="stat-value" id="sym-count">—</div></div>
      <div class="stat"><div class="stat-label">Year reading</div><div class="stat-value" id="year-read" style="font-size:var(--fs-sm)">—</div></div>
    </div>`,

  init(root, ctx) {
    const numEl = qs('#num', root);
    const romEl = qs('#rom', root);
    const err = qs('#rom-error', root);
    let silent = false;

    const paintExtras = (n, roman) => {
      const parts = [];
      let rest = n;
      TABLE.forEach(([value, symbol]) => { while (rest >= value) { parts.push(`${symbol}=${fmt(value)}`); rest -= value; } });
      qs('#breakdown', root).textContent = parts.slice(0, 8).join(' + ') || '—';
      qs('#sym-count', root).textContent = [...roman.replace(/\u0304/g, '')].length;
      qs('#year-read', root).textContent = n >= 1000 && n <= 2999 ? `Often a year: ${n}` : '—';
    };

    const fromNumber = () => {
      const n = Number(numEl.value);
      const roman = toRoman(n);
      if (!roman) { err.textContent = 'Enter a whole number between 1 and 3,999,999.'; ctx.setError('Out of range'); return; }
      err.textContent = '';
      silent = true; romEl.value = roman; silent = false;
      qs('#canon-hint', root).textContent = 'Canonical form';
      ctx.setResult(roman, `<span class="mono">${fmt(n)}</span> in Roman numerals`, { copy: roman });
      paintExtras(n, roman);
    };

    const fromRomanInput = () => {
      const raw = romEl.value.trim();
      if (!raw) { err.textContent = ''; ctx.clearResult(); return; }
      const n = fromRoman(raw);
      if (n === null) { romEl.classList.add('is-invalid'); err.textContent = 'Only the letters I, V, X, L, C, D and M are valid.'; ctx.setError('Not a Roman numeral'); return; }
      romEl.classList.remove('is-invalid');
      err.textContent = '';
      silent = true; numEl.value = n; silent = false;
      qs('#canon-hint', root).textContent = isCanonical(raw, n) ? 'Canonical form' : `Non-standard — the usual spelling is ${toRoman(n)}`;
      ctx.setResult(fmt(n), `<span class="mono">${raw.toUpperCase()}</span> as a number`, { copy: String(n) });
      paintExtras(n, toRoman(n) || raw);
    };

    on(numEl, 'input', () => { if (!silent) fromNumber(); });
    on(romEl, 'input', () => { if (!silent) fromRomanInput(); });
    on(qs('#swap', root), 'click', () => { romEl.focus(); romEl.select(); });

    fromNumber();
  }
};
