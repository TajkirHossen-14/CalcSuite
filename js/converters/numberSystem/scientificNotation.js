/** Scientific / engineering / E-notation converter. */
import { on, qs } from '../../utils/dom.js';
import { fmt } from '../../utils/format.js';

const SI_PREFIXES = {
  '-24': 'yocto (y)', '-21': 'zepto (z)', '-18': 'atto (a)', '-15': 'femto (f)', '-12': 'pico (p)',
  '-9': 'nano (n)', '-6': 'micro (µ)', '-3': 'milli (m)', 0: '—', 3: 'kilo (k)', 6: 'mega (M)',
  9: 'giga (G)', 12: 'tera (T)', 15: 'peta (P)', 18: 'exa (E)', 21: 'zetta (Z)', 24: 'yotta (Y)'
};

const engineering = (value, digits = 6) => {
  if (value === 0) return '0 × 10^0';
  const exp3 = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
  const mantissa = value / 10 ** exp3;
  return `${Number(mantissa.toPrecision(digits))} × 10^${exp3}`;
};

export default {
  resultLabel: 'Scientific notation',
  how: `
    <p>Scientific notation writes any number as a mantissa between 1 and 10 multiplied by a power
    of ten. It keeps very large and very small quantities readable and makes significant figures
    explicit.</p>
    <code class="formula">1,234,000 → 1.234 × 10⁶
0.00056   → 5.6 × 10⁻⁴
E-notation: 1.234e6, the form JavaScript itself prints</code>
    <h4>Engineering notation</h4>
    <p>Engineering notation is the same idea with the exponent forced to a multiple of three, so it
    lines up with SI prefixes: 47,000 Ω is 47 × 10³ Ω — 47 kΩ. The panel shows the matching prefix
    whenever one exists.</p>
    <h4>Significant figures</h4>
    <p>The mantissa is rounded with <code>toPrecision()</code>, so choosing 3 significant digits
    turns 6.02214076 × 10²³ into 6.02 × 10²³. Trailing zeros in the mantissa <em>are</em>
    significant, which is exactly why scientists prefer this form over plain decimals.</p>`,

  body: () => `
    <div class="grid grid-2">
      <div class="field">
        <label for="decimal">Decimal number</label>
        <input type="text" id="decimal" class="mono" value="299792458" spellcheck="false">
        <span class="field-hint">Plain form, e.g. 0.000045 or 6500000</span>
      </div>
      <div class="field">
        <label for="sci">Scientific / E-notation</label>
        <input type="text" id="sci" class="mono" spellcheck="false" placeholder="2.998e8">
        <span class="field-hint">Accepts 2.998e8, 2.998E8 or 2.998 x 10^8</span>
      </div>
    </div>
    <div class="grid grid-2">
      <div class="field">
        <label for="digits">Significant digits: <span id="digits-out">6</span></label>
        <input type="range" id="digits" min="1" max="15" value="6">
      </div>
      <div class="field">
        <label>Coefficient &amp; exponent</label>
        <div class="input-group">
          <input type="number" id="mantissa" step="any" aria-label="Mantissa">
          <span class="input-suffix">× 10^</span>
          <input type="number" id="exponent" step="1" aria-label="Exponent">
        </div>
      </div>
    </div>
    <p class="field-error" id="sci-error"></p>
    <div class="stat-grid mt-4">
      <div class="stat"><div class="stat-label">Engineering</div><div class="stat-value" id="eng">—</div></div>
      <div class="stat"><div class="stat-label">SI prefix</div><div class="stat-value" id="prefix">—</div></div>
      <div class="stat"><div class="stat-label">Order of magnitude</div><div class="stat-value" id="order">—</div></div>
      <div class="stat"><div class="stat-label">Expanded</div><div class="stat-value" id="expanded" style="font-size:var(--fs-sm)">—</div></div>
    </div>`,

  init(root, ctx) {
    const el = (id) => qs(`#${id}`, root);
    const err = el('sci-error');
    let silent = false;

    const paint = (value, source) => {
      const digits = Number(el('digits').value);
      el('digits-out').textContent = digits;
      if (!Number.isFinite(value)) { ctx.setError('Enter a valid number'); return; }
      silent = true;

      const exponential = value === 0 ? '0e+0' : value.toExponential(digits - 1);
      const [mantissaStr, expStr] = exponential.split('e');
      const mantissa = Number(mantissaStr);
      const exponent = Number(expStr);

      if (source !== 'decimal') el('decimal').value = value === 0 ? '0' : Number(value.toPrecision(15)).toString();
      if (source !== 'sci') el('sci').value = exponential;
      if (source !== 'parts') { el('mantissa').value = mantissa; el('exponent').value = exponent; }

      el('eng').textContent = engineering(value, digits);
      const engExp = value === 0 ? 0 : Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
      el('prefix').textContent = SI_PREFIXES[String(engExp)] || '—';
      el('order').textContent = value === 0 ? '—' : `10^${Math.floor(Math.log10(Math.abs(value)))}`;
      el('expanded').textContent = Math.abs(exponent) <= 20 ? Number(value.toPrecision(15)).toLocaleString(undefined, { maximumFractionDigits: 20 }) : exponential;

      err.textContent = '';
      ctx.setResult(`${mantissa} × 10^${exponent}`, `<span class="mono">${exponential}</span> · plain: <span class="mono">${fmt(value, 10)}</span>`, { copy: exponential });
      silent = false;
    };

    const parseSci = (str) => {
      const clean = String(str).trim().toLowerCase().replace(/\s|,/g, '').replace(/[×x]10\^?/, 'e').replace('^', '');
      const n = Number(clean);
      return Number.isFinite(n) ? n : NaN;
    };

    on(root, 'input', (event) => {
      if (silent) return;
      const id = event.target.id;
      if (id === 'decimal') paint(parseSci(el('decimal').value), 'decimal');
      else if (id === 'sci') paint(parseSci(el('sci').value), 'sci');
      else if (id === 'mantissa' || id === 'exponent') {
        const m = Number(el('mantissa').value); const e = Number(el('exponent').value);
        if (!Number.isFinite(m) || !Number.isFinite(e)) return;
        paint(m * 10 ** e, 'parts');
      } else if (id === 'digits') paint(parseSci(el('decimal').value), 'digits');
    });

    paint(299792458, null);
  }
};
