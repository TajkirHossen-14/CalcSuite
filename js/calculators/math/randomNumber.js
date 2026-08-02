/** Random Number Generator — integers or decimals, batches, no-repeat mode. */
import { on, qs } from '../../utils/dom.js';
import { fmt } from '../../utils/format.js';
import { validateNumber } from '../../utils/validators.js';

/** Cryptographically strong float in [0, 1) when the API is available. */
function secureRandom() {
  if (window.crypto && window.crypto.getRandomValues) {
    const buffer = new Uint32Array(1);
    window.crypto.getRandomValues(buffer);
    return buffer[0] / 2 ** 32;
  }
  return Math.random();
}

export function generate({ min, max, count, integer, unique, decimals, crypto }) {
  const rng = crypto ? secureRandom : Math.random;
  const span = max - min;
  if (unique && integer) {
    const pool = [];
    for (let v = Math.ceil(min); v <= Math.floor(max); v += 1) pool.push(v);
    // Fisher–Yates shuffle, then take the first `count`.
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }
  return Array.from({ length: count }, () => {
    const value = min + rng() * span;
    return integer ? Math.floor(min + rng() * (span + 1)) : Number(value.toFixed(decimals));
  });
}

export default {
  resultLabel: 'Random result',
  how: `
    <p>A uniform random integer between min and max comes from scaling a random float:</p>
    <code class="formula">integer  = min + floor(random() × (max − min + 1))
decimal  = min + random() × (max − min)</code>
    <p>The <code>+ 1</code> matters: without it the maximum could never be drawn, because
    <code>Math.random()</code> returns values in [0, 1) — one is excluded.</p>
    <h4>Math.random vs crypto</h4>
    <p><code>Math.random()</code> is a fast pseudo-random generator: statistically fine for games and
    sampling, but predictable in principle. Tick "cryptographic quality" and the tool switches to
    <code>crypto.getRandomValues()</code>, which draws from the operating system's entropy pool —
    the right choice for passwords, tokens and draws that matter.</p>
    <h4>No repeats</h4>
    <p>Unique mode builds the full range of candidates and runs a Fisher–Yates shuffle, then takes
    the first n. That gives every arrangement equal probability in a single pass, and unlike
    "generate and retry" it can't slow to a crawl when you ask for nearly the whole range.</p>`,

  body: () => `
    <div class="grid grid-4 keep">
      <div class="field"><label for="min">Minimum</label><input type="number" id="min" value="1" step="any"></div>
      <div class="field"><label for="max">Maximum</label><input type="number" id="max" value="100" step="any"></div>
      <div class="field"><label for="count">How many</label><input type="number" id="count" value="5" min="1" max="1000" step="1"></div>
      <div class="field"><label for="decimals">Decimal places</label><input type="number" id="decimals" value="2" min="0" max="10" step="1" disabled></div>
    </div>
    <div class="row mt-3">
      <label class="checkbox"><input type="checkbox" id="integer" checked> Whole numbers only</label>
      <label class="checkbox"><input type="checkbox" id="unique"> No repeats</label>
      <label class="checkbox"><input type="checkbox" id="crypto"> Cryptographic quality</label>
      <label class="checkbox"><input type="checkbox" id="sorted"> Sort ascending</label>
    </div>
    <div class="row mt-4">
      <button class="btn btn-primary" id="roll" type="button"><i class="fa-solid fa-dice"></i> Generate</button>
      <button class="btn btn-sm" id="copy-all" type="button" data-copy=""><i class="fa-regular fa-copy"></i> Copy list</button>
    </div>
    <p class="field-error mt-3" id="rng-error"></p>
    <div class="unit-list mt-4" id="rng-output"></div>`,

  init(root, ctx) {
    const el = (id) => qs(`#${id}`, root);

    const roll = () => {
      const min = validateNumber(el('min'), { label: 'Minimum' });
      const max = validateNumber(el('max'), { label: 'Maximum' });
      const count = validateNumber(el('count'), { min: 1, max: 1000, integer: true, label: 'Count' });
      const err = el('rng-error');
      if (min === null || max === null || count === null) return;
      if (min >= max) { err.textContent = 'Maximum must be greater than minimum.'; ctx.setError('Invalid range'); return; }

      const integer = el('integer').checked;
      const unique = el('unique').checked;
      el('decimals').disabled = integer;

      if (unique && !integer) { err.textContent = 'No-repeat mode needs whole numbers.'; ctx.setError('Unique requires integers'); return; }
      const poolSize = Math.floor(max) - Math.ceil(min) + 1;
      if (unique && count > poolSize) { err.textContent = `Only ${poolSize} distinct values exist in that range.`; ctx.setError('Range too small'); return; }
      err.textContent = '';

      let values = generate({
        min, max, count, integer, unique,
        decimals: Number(el('decimals').value) || 0,
        crypto: el('crypto').checked
      });
      if (el('sorted').checked) values = [...values].sort((a, b) => a - b);

      const list = values.join(', ');
      ctx.setResult(values.length === 1 ? fmt(values[0]) : `${values.length} numbers`,
        `<span class="mono">${list}</span>`, { copy: list });
      el('copy-all').dataset.copy = list;
      el('rng-output').innerHTML = values.map((v, i) => `
        <div class="unit-item"><span class="u-name">#${i + 1}</span><span class="u-val">${fmt(v, 10)}</span></div>`).join('');
    };

    on(el('roll'), 'click', roll);
    on(root, 'change', roll);
    on(root, 'keydown', (event) => { if (event.key === 'Enter') roll(); });
    roll();
  }
};
