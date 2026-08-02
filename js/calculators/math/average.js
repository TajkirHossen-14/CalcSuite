/** Average Calculator — mean, median, mode, range and more. */
import { qs } from '../../utils/dom.js';
import { parseNumberList } from '../../utils/validators.js';
import { fmt } from '../../utils/format.js';

export function describe(values) {
  const n = values.length;
  if (!n) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;

  const counts = values.reduce((map, v) => map.set(v, (map.get(v) || 0) + 1), new Map());
  const maxCount = Math.max(...counts.values());
  const modes = maxCount > 1 ? [...counts.entries()].filter(([, c]) => c === maxCount).map(([v]) => v) : [];

  const geometric = values.every((v) => v > 0) ? Math.exp(values.reduce((a, b) => a + Math.log(b), 0) / n) : null;
  const harmonic = values.every((v) => v !== 0) ? n / values.reduce((a, b) => a + 1 / b, 0) : null;

  return { n, sum, mean, median, modes, maxCount, min: sorted[0], max: sorted[n - 1], range: sorted[n - 1] - sorted[0], geometric, harmonic };
}

export default {
  resultLabel: 'Mean (average)',
  how: `
    <p>Three different numbers all get called "the average", and they answer different questions.</p>
    <code class="formula">mean   = Σx / n                 the balance point
median = middle value once sorted (average of the middle two if n is even)
mode   = the value that occurs most often (there can be several, or none)</code>
    <h4>Which one should you use?</h4>
    <ul>
      <li><strong>Mean</strong> uses every value, which also means one outlier drags it around.
      Nine people earning 30k and one earning 1M have a mean salary of 127k.</li>
      <li><strong>Median</strong> only cares about position, so it survives outliers — that's why
      incomes and house prices are reported as medians.</li>
      <li><strong>Mode</strong> is the only average that works on categories, and the only one that
      can legitimately not exist.</li>
    </ul>
    <h4>The other two means</h4>
    <p>The geometric mean (the nth root of the product) is correct for growth rates and ratios; the
    harmonic mean (n divided by the sum of reciprocals) is correct for averaging speeds. Both are
    shown when the data allows them.</p>
    <p>Input is split on commas, spaces, semicolons or new lines, so you can paste a column
    straight from a spreadsheet.</p>`,

  body: () => `
    <div class="field">
      <label for="values">Numbers</label>
      <textarea id="values" spellcheck="false" placeholder="12, 7, 3, 9, 12, 15">12, 7, 3, 9, 12, 15, 20, 4</textarea>
      <span class="field-hint">Separate with commas, spaces or new lines. <span id="count-hint"></span></span>
    </div>
    <div class="stat-grid" id="avg-stats"></div>`,

  init(root, ctx) {
    const calc = () => {
      const values = parseNumberList(qs('#values', root).value);
      qs('#count-hint', root).textContent = `${values.length} value${values.length === 1 ? '' : 's'} detected.`;
      const s = describe(values);
      if (!s) { ctx.setError('Enter at least one number'); qs('#avg-stats', root).innerHTML = ''; return; }

      ctx.setResult(fmt(s.mean, 8), `Sum <span class="mono">${fmt(s.sum)}</span> ÷ count <span class="mono">${s.n}</span>`, { copy: String(s.mean) });

      const tiles = [
        ['Median', fmt(s.median, 8)],
        ['Mode', s.modes.length ? `${s.modes.map((m) => fmt(m)).join(', ')} (×${s.maxCount})` : 'none'],
        ['Count', s.n],
        ['Sum', fmt(s.sum)],
        ['Minimum', fmt(s.min)],
        ['Maximum', fmt(s.max)],
        ['Range', fmt(s.range)],
        ['Geometric mean', s.geometric === null ? 'n/a (needs positives)' : fmt(s.geometric, 6)],
        ['Harmonic mean', s.harmonic === null ? 'n/a (contains zero)' : fmt(s.harmonic, 6)]
      ];
      qs('#avg-stats', root).innerHTML = tiles.map(([label, value]) => `
        <div class="stat"><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`).join('');
    };
    ctx.live(calc, { debounceMs: 180 });
  }
};
