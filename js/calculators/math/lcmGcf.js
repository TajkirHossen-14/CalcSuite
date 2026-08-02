/** LCM & GCF Calculator — Euclidean algorithm with prime factorisation. */
import { qs } from '../../utils/dom.js';
import { parseNumberList } from '../../utils/validators.js';
import { gcd, lcm } from '../../core/Fraction.js';
import { fmt } from '../../utils/format.js';

export function primeFactors(n) {
  let x = Math.abs(Math.trunc(n));
  const factors = [];
  for (let d = 2; d * d <= x; d += d === 2 ? 1 : 2) {
    while (x % d === 0) { factors.push(d); x /= d; }
  }
  if (x > 1) factors.push(x);
  return factors;
}

const factorString = (n) => {
  const factors = primeFactors(n);
  if (!factors.length) return String(n);
  const counts = factors.reduce((m, f) => m.set(f, (m.get(f) || 0) + 1), new Map());
  return [...counts.entries()].map(([base, exp]) => (exp === 1 ? base : `${base}^${exp}`)).join(' × ');
};

const divisors = (n) => {
  const out = [];
  const x = Math.abs(Math.trunc(n));
  for (let i = 1; i * i <= x; i += 1) {
    if (x % i === 0) { out.push(i); if (i !== x / i) out.push(x / i); }
  }
  return out.sort((a, b) => a - b);
};

export default {
  resultLabel: 'GCF (greatest common factor)',
  how: `
    <p>The greatest common factor is the largest number that divides every input exactly; the least
    common multiple is the smallest number every input divides exactly. They are computed with the
    Euclidean algorithm, which is over two thousand years old and still unbeaten for speed.</p>
    <code class="formula">gcd(a, b): while b ≠ 0 → (a, b) = (b, a mod b); answer is a
lcm(a, b) = |a × b| / gcd(a, b)
For a list: fold pairwise — gcd(a, b, c) = gcd(gcd(a, b), c)</code>
    <h4>Why the remainder trick works</h4>
    <p>Any number dividing both a and b must also divide a − b, and therefore a mod b. Each step
    shrinks the pair without changing their common divisors, so the process must terminate at the
    answer. gcd(48, 18) → gcd(18, 12) → gcd(12, 6) → gcd(6, 0) = 6.</p>
    <h4>Where you actually use them</h4>
    <p>GCF simplifies fractions (divide top and bottom by it) and splits things into equal groups.
    LCM finds common denominators and answers "when do these two cycles line up again?" — buses
    every 12 and 18 minutes coincide every 36 minutes.</p>`,

  body: () => `
    <div class="field">
      <label for="values">Numbers (two or more whole numbers)</label>
      <input type="text" id="values" class="mono" value="48, 180, 210" spellcheck="false" placeholder="12, 18, 24">
      <span class="field-hint">Commas or spaces. Decimals and negatives are rounded to positive integers.</span>
    </div>
    <p class="field-error" id="lcm-error"></p>
    <div class="stat-grid mt-4" id="lcm-stats"></div>
    <div class="mt-4" id="factor-table"></div>`,

  init(root, ctx) {
    const calc = () => {
      const values = parseNumberList(qs('#values', root).value)
        .map((v) => Math.abs(Math.trunc(v)))
        .filter((v) => v > 0);
      const err = qs('#lcm-error', root);

      if (values.length < 2) {
        err.textContent = 'Enter at least two positive whole numbers.';
        ctx.setError('Need two or more numbers');
        qs('#lcm-stats', root).innerHTML = '';
        qs('#factor-table', root).innerHTML = '';
        return;
      }
      if (values.some((v) => v > 1e12)) { err.textContent = 'Keep numbers below 10¹² so factorisation stays instant.'; return; }
      err.textContent = '';

      const g = values.reduce((acc, v) => gcd(acc, v));
      const l = values.reduce((acc, v) => lcm(acc, v));

      ctx.setResult(fmt(g), `LCM is <span class="mono">${fmt(l)}</span> · inputs <span class="mono">${values.join(', ')}</span>`, { copy: String(g) });

      const common = divisors(g);
      qs('#lcm-stats', root).innerHTML = [
        ['GCF / HCF', fmt(g)],
        ['LCM', fmt(l)],
        ['Numbers', values.length],
        ['Product', fmt(values.reduce((a, b) => a * b, 1))],
        ['Coprime?', g === 1 ? 'Yes — no shared factor' : 'No'],
        ['Common divisors', common.length <= 12 ? common.join(', ') : `${common.slice(0, 12).join(', ')} …`]
      ].map(([l2, v]) => `<div class="stat"><div class="stat-label">${l2}</div><div class="stat-value">${v}</div></div>`).join('');

      qs('#factor-table', root).innerHTML = `
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Number</th><th>Prime factorisation</th><th>Divisors</th></tr></thead>
          <tbody>${values.map((v) => `
            <tr><td class="num">${fmt(v)}</td><td class="num mono">${factorString(v)}</td><td class="num">${divisors(v).length}</td></tr>`).join('')}
            <tr><td><strong>GCF</strong></td><td class="num mono">${factorString(g)}</td><td class="num">—</td></tr>
            <tr><td><strong>LCM</strong></td><td class="num mono">${factorString(l)}</td><td class="num">—</td></tr>
          </tbody></table></div>`;
    };
    ctx.live(calc, { debounceMs: 150 });
  }
};
