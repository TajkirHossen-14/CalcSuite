/** Fraction ⟷ Decimal ⟷ Percentage — three views of one rational number. */
import { on, qs } from '../../utils/dom.js';
import { Fraction } from '../../core/Fraction.js';
import { fmt } from '../../utils/format.js';

/** Detect a repeating decimal expansion for n/d, e.g. 1/3 → 0.(3) */
function repeatingDecimal(n, d) {
  const sign = n < 0 ? '-' : '';
  let num = Math.abs(n);
  const den = Math.abs(d);
  const intPart = Math.floor(num / den);
  num %= den;
  if (num === 0) return `${sign}${intPart}`;
  const seen = new Map();
  let digits = '';
  while (num !== 0 && !seen.has(num)) {
    seen.set(num, digits.length);
    num *= 10;
    digits += Math.floor(num / den);
    num %= den;
  }
  if (num === 0) return `${sign}${intPart}.${digits}`;
  const start = seen.get(num);
  return `${sign}${intPart}.${digits.slice(0, start)}(${digits.slice(start)})`;
}

export default {
  resultLabel: 'Decimal value',
  how: `
    <p>A fraction, a decimal and a percentage are three notations for the same rational number,
    so this page keeps one value and re-renders it three ways.</p>
    <code class="formula">fraction → decimal : numerator ÷ denominator
decimal  → percent : × 100
percent  → fraction: p/100, then divide both parts by their GCD</code>
    <h4>Turning a decimal back into a fraction</h4>
    <p>Going the other way is the interesting direction. Naively writing 0.333 as 333/1000 is
    accurate but useless; you want 1/3. CalcSuite runs a Stern–Brocot (continued-fraction) search
    that walks towards the target value and stops at the simplest fraction that reproduces it,
    which is why 0.3333333 returns 1/3 and 0.375 returns 3/8.</p>
    <h4>Repeating decimals</h4>
    <p>Long division is performed with remainder tracking: the moment a remainder repeats, the
    digits must repeat too. The recurring block is shown in brackets — 1/7 = 0.(142857).</p>`,

  body: () => `
    <div class="grid grid-3">
      <div class="field">
        <label for="frac">Fraction</label>
        <input type="text" id="frac" value="3/4" class="mono" spellcheck="false" placeholder="3/4 or 1 1/2">
        <span class="field-hint">Accepts mixed numbers.</span>
      </div>
      <div class="field">
        <label for="deci">Decimal</label>
        <input type="number" id="deci" value="0.75" step="any">
        <span class="field-hint" id="repeat-hint"></span>
      </div>
      <div class="field">
        <label for="perc">Percentage</label>
        <div class="input-group">
          <input type="number" id="perc" value="75" step="any">
          <span class="input-suffix">%</span>
        </div>
      </div>
    </div>
    <p class="field-error" id="fd-error"></p>
    <div class="stat-grid mt-4">
      <div class="stat"><div class="stat-label">Simplified</div><div class="stat-value" id="simplified">—</div></div>
      <div class="stat"><div class="stat-label">Mixed number</div><div class="stat-value" id="mixed">—</div></div>
      <div class="stat"><div class="stat-label">Reciprocal</div><div class="stat-value" id="recip">—</div></div>
      <div class="stat"><div class="stat-label">In ppm</div><div class="stat-value" id="ppm">—</div></div>
    </div>`,

  init(root, ctx) {
    const el = (id) => qs(`#${id}`, root);
    const err = el('fd-error');
    let silent = false;

    const paint = (fraction, source) => {
      silent = true;
      const value = fraction.value;
      if (source !== 'frac') el('frac').value = fraction.toString();
      if (source !== 'deci') el('deci').value = Number(value.toPrecision(12));
      if (source !== 'perc') el('perc').value = Number((value * 100).toPrecision(12));

      const repeating = repeatingDecimal(fraction.n, fraction.d);
      el('repeat-hint').textContent = repeating.includes('(') ? `Exact: ${repeating}` : 'Terminating decimal';
      el('simplified').textContent = fraction.toString();
      el('mixed').textContent = fraction.toMixed();
      el('recip').textContent = fraction.n === 0 ? '—' : `${fraction.d}/${Math.abs(fraction.n)}${fraction.n < 0 ? ' (−)' : ''}`;
      el('ppm').textContent = fmt(value * 1e6, 2);

      ctx.setResult(Number(value.toPrecision(12)), `<span class="mono">${fraction.toString()}</span> = <span class="mono">${Number((value * 100).toPrecision(10))}%</span> = <span class="mono">${repeating}</span>`, { copy: String(Number(value.toPrecision(12))) });
      silent = false;
    };

    on(root, 'input', (event) => {
      if (silent) return;
      const id = event.target.id;
      try {
        if (id === 'frac') {
          const f = Fraction.parse(el('frac').value);
          if (!f) { err.textContent = 'Use a form like 3/4, 1 1/2 or 0.75.'; ctx.setError('Unparseable fraction'); return; }
          err.textContent = ''; paint(f, 'frac');
        } else if (id === 'deci') {
          const v = Number(el('deci').value);
          if (!Number.isFinite(v)) return;
          err.textContent = ''; paint(Fraction.fromDecimal(v), 'deci');
        } else if (id === 'perc') {
          const v = Number(el('perc').value);
          if (!Number.isFinite(v)) return;
          err.textContent = ''; paint(Fraction.fromDecimal(v / 100), 'perc');
        }
      } catch (e) {
        err.textContent = e.message;
      }
    });

    paint(new Fraction(3, 4), null);
  }
};
