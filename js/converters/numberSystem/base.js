/**
 * Base Converter — binary ⟷ decimal ⟷ octal ⟷ hex (plus any radix 2–36),
 * all representations shown simultaneously.
 */
import { on, qs, qsa } from '../../utils/dom.js';
import { isValidInBase } from '../../utils/validators.js';
import { fmt } from '../../utils/format.js';

const FIELDS = [
  { id: 'bin', base: 2, label: 'Binary', hint: 'digits 0–1' },
  { id: 'oct', base: 8, label: 'Octal', hint: 'digits 0–7' },
  { id: 'dec', base: 10, label: 'Decimal', hint: 'digits 0–9' },
  { id: 'hex', base: 16, label: 'Hexadecimal', hint: 'digits 0–9, A–F' }
];

/** Convert a string in `fromBase` to `toBase`, tolerating fractional parts. */
export function convertBase(input, fromBase, toBase, fractionDigits = 12) {
  const str = String(input).trim().replace(/\s+/g, '');
  if (str === '') return '';
  const negative = str.startsWith('-');
  const body = str.replace(/^[-+]/, '');
  const [intPart, fracPart = ''] = body.split('.');

  const intValue = intPart === '' ? 0n : [...intPart.toLowerCase()].reduce(
    (acc, ch) => acc * BigInt(fromBase) + BigInt(parseInt(ch, 36)), 0n
  );
  let out = intValue.toString(toBase).toUpperCase();

  if (fracPart) {
    let frac = [...fracPart.toLowerCase()].reduce((acc, ch, i) => acc + parseInt(ch, 36) / fromBase ** (i + 1), 0);
    let digits = '';
    for (let i = 0; i < fractionDigits && frac > 0; i += 1) {
      frac *= toBase;
      const digit = Math.floor(frac);
      digits += digit.toString(toBase).toUpperCase();
      frac -= digit;
    }
    if (digits) out += `.${digits}`;
  }
  return (negative ? '-' : '') + out;
}

export default {
  resultLabel: 'Decimal value',
  how: `
    <p>A positional number system is just a promise about what each column is worth. In base
    <em>b</em>, the digit <em>d</em> sitting <em>n</em> places left of the point contributes
    <code>d × bⁿ</code>. Converting therefore always happens in two moves: read the input into a
    single integer, then repeatedly divide that integer by the target base to spell it back out.</p>
    <code class="formula">1011₂ = 1×2³ + 0×2² + 1×2¹ + 1×2⁰ = 11₁₀
11₁₀  → 11 ÷ 16 = 0 remainder B  →  B₁₆</code>
    <h4>Big numbers stay exact</h4>
    <p>Integers are parsed with <code>BigInt</code>, so a 200-bit binary string converts to hex
    without losing a single digit — <code>parseInt</code> would silently round anything past 2⁵³.
    Fractional parts fall back to floating point and are truncated to 12 digits, because most
    fractions are non-terminating in another base (0.1₁₀ = 0.0001100110011…₂).</p>
    <h4>Validation</h4>
    <p>Each field only accepts digits legal in its own base: typing <code>9</code> into the octal
    box, or <code>G</code> into hex, is flagged immediately instead of producing a wrong answer.</p>`,

  body: () => `
    <div class="grid grid-2">
      ${FIELDS.map((f) => `
        <div class="field">
          <label for="base-${f.id}">${f.label} <span class="text-faint">(base ${f.base})</span></label>
          <div class="input-group">
            <input type="text" id="base-${f.id}" class="mono" data-base="${f.base}" spellcheck="false" autocomplete="off"
                   value="${f.base === 10 ? '255' : convertBase('255', 10, f.base)}">
            <button class="btn" type="button" data-copy-src="base-${f.id}" title="Copy"><i class="fa-regular fa-copy"></i></button>
          </div>
          <span class="field-hint">${f.hint}</span>
        </div>`).join('')}
    </div>

    <hr class="divider">
    <div class="grid grid-2">
      <div class="field">
        <label for="custom-base">Any other base</label>
        <div class="input-group">
          <input type="number" id="custom-base" min="2" max="36" value="36" aria-label="Custom radix">
          <input type="text" id="base-custom" class="mono" data-base="36" spellcheck="false" autocomplete="off">
        </div>
        <span class="field-hint">Radix 2–36 (0–9 then A–Z).</span>
      </div>
      <div class="field">
        <label>Bit information</label>
        <div class="stat-grid">
          <div class="stat"><div class="stat-label">Bits needed</div><div class="stat-value" id="bit-count">—</div></div>
          <div class="stat"><div class="stat-label">Bytes</div><div class="stat-value" id="byte-count">—</div></div>
          <div class="stat"><div class="stat-label">Fits in</div><div class="stat-value" id="fits-in">—</div></div>
        </div>
      </div>
    </div>
    <p class="field-error" id="base-error"></p>`,

  init(root, ctx) {
    const error = qs('#base-error', root);
    let silent = false;

    const paint = (sourceId, value, base) => {
      silent = true;
      const inputs = qsa('[data-base]', root);
      inputs.forEach((input) => {
        if (input.id === sourceId) return;
        input.value = value === '' ? '' : convertBase(value, base, Number(input.dataset.base));
      });

      const decimal = value === '' ? '' : convertBase(value, base, 10);
      const asNumber = decimal === '' ? NaN : Number(decimal);
      const bits = decimal === '' ? 0 : BigInt(decimal.split('.')[0].replace('-', '') || '0').toString(2).replace(/^0$/, '').length;
      qs('#bit-count', root).textContent = bits || '—';
      qs('#byte-count', root).textContent = bits ? Math.ceil(bits / 8) : '—';
      qs('#fits-in', root).textContent = !bits ? '—' : bits <= 8 ? 'uint8' : bits <= 16 ? 'uint16' : bits <= 32 ? 'uint32' : bits <= 64 ? 'uint64' : 'BigInt';

      qsa('[data-copy-src]', root).forEach((b) => { b.dataset.copy = qs(`#${b.dataset.copySrc}`, root).value; });

      if (decimal !== '') {
        ctx.setResult(
          Number.isFinite(asNumber) ? fmt(asNumber, 8) : decimal,
          `bin <span class="mono">${convertBase(value, base, 2)}</span> · oct <span class="mono">${convertBase(value, base, 8)}</span> · hex <span class="mono">${convertBase(value, base, 16)}</span>`,
          { copy: decimal }
        );
      } else ctx.clearResult();
      silent = false;
    };

    on(root, 'input', (event) => {
      if (silent) return;
      const input = event.target;
      if (input.id === 'custom-base') {
        const radix = Math.min(36, Math.max(2, Number(input.value) || 10));
        const customField = qs('#base-custom', root);
        customField.dataset.base = radix;
        paint('base-dec', qs('#base-dec', root).value, 10);
        return;
      }
      if (!input.dataset.base) return;
      const base = Number(input.dataset.base);
      const raw = input.value.trim();
      if (raw === '') { error.textContent = ''; paint(input.id, '', base); ctx.clearResult(); return; }
      if (!isValidInBase(raw, base)) {
        input.classList.add('is-invalid');
        error.textContent = `“${raw}” contains digits that don't exist in base ${base}.`;
        return;
      }
      input.classList.remove('is-invalid');
      error.textContent = '';
      paint(input.id, raw, base);
    });

    paint('base-dec', '255', 10);
  }
};
