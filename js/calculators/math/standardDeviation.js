/** Standard Deviation & Variance — population vs sample, with working shown. */
import { qs } from '../../utils/dom.js';
import { parseNumberList } from '../../utils/validators.js';
import { fmt } from '../../utils/format.js';

export function stats(values, sample = true) {
  const n = values.length;
  if (n < (sample ? 2 : 1)) return null;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const sumSquares = values.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  const divisor = sample ? n - 1 : n;
  const variance = sumSquares / divisor;
  const sd = Math.sqrt(variance);
  return { n, mean, sumSquares, variance, sd, divisor, cv: mean !== 0 ? (sd / Math.abs(mean)) * 100 : null, sem: sd / Math.sqrt(n) };
}

export default {
  resultLabel: 'Standard deviation',
  how: `
    <p>Standard deviation answers "how far from the mean does a typical value sit?". It is the
    square root of the variance, which is itself the average squared distance from the mean.</p>
    <code class="formula">mean      x̄ = Σx / n
variance  σ² = Σ(x − x̄)² / n        (population)
          s² = Σ(x − x̄)² / (n − 1)  (sample — Bessel's correction)
std dev   σ = √σ²</code>
    <h4>Why n − 1 for a sample?</h4>
    <p>When your numbers are a <em>sample</em> drawn from a larger population, the sample mean sits
    closer to your own data points than the true population mean does, so squared distances come
    out slightly too small. Dividing by n − 1 compensates and makes the estimate unbiased. Use
    population (÷n) only when the list is genuinely everything you care about.</p>
    <h4>Reading the result</h4>
    <p>For roughly bell-shaped data, about 68% of values fall within ±1σ of the mean, 95% within
    ±2σ and 99.7% within ±3σ. The coefficient of variation (σ as a percentage of the mean) lets you
    compare spread between datasets measured in different units.</p>`,

  body: () => `
    <div class="field">
      <label for="values">Data set</label>
      <textarea id="values" spellcheck="false">9, 2, 5, 4, 12, 7, 8, 11, 9, 3, 7, 4, 12, 5, 4, 10, 9, 6, 9, 4</textarea>
      <span class="field-hint">Commas, spaces or new lines. <span id="count-hint"></span></span>
    </div>
    <div class="tabs" role="tablist">
      <button class="tab is-active" data-tab="sample" type="button">Sample (n − 1)</button>
      <button class="tab" data-tab="population" type="button">Population (n)</button>
    </div>
    <div class="stat-grid" id="sd-stats"></div>
    <button class="btn btn-sm mt-3" id="toggle-working" type="button"><i class="fa-solid fa-table-list"></i> Show working</button>
    <div class="table-wrap mt-3" id="working-wrap" hidden>
      <table class="data-table"><thead><tr><th>x</th><th>x − x̄</th><th>(x − x̄)²</th></tr></thead>
      <tbody id="working"></tbody></table>
    </div>`,

  init(root, ctx) {
    let sample = true;
    let showWorking = false;

    const calc = () => {
      const values = parseNumberList(qs('#values', root).value);
      qs('#count-hint', root).textContent = `${values.length} values.`;
      const s = stats(values, sample);
      if (!s) { ctx.setError(sample ? 'A sample needs at least 2 values' : 'Enter at least one value'); qs('#sd-stats', root).innerHTML = ''; return; }

      ctx.setResult(fmt(s.sd, 8), `${sample ? 'Sample' : 'Population'} · variance <span class="mono">${fmt(s.variance, 8)}</span> · mean <span class="mono">${fmt(s.mean, 8)}</span>`, { copy: String(s.sd) });

      qs('#sd-stats', root).innerHTML = [
        ['Variance', fmt(s.variance, 8)],
        ['Mean', fmt(s.mean, 8)],
        ['Count (n)', s.n],
        ['Σ(x − x̄)²', fmt(s.sumSquares, 8)],
        ['Divisor used', s.divisor],
        ['Coeff. of variation', s.cv === null ? 'n/a' : `${fmt(s.cv, 3)}%`],
        ['Std. error of mean', fmt(s.sem, 6)],
        ['68% range (±1σ)', `${fmt(s.mean - s.sd, 5)} … ${fmt(s.mean + s.sd, 5)}`],
        ['95% range (±2σ)', `${fmt(s.mean - 2 * s.sd, 5)} … ${fmt(s.mean + 2 * s.sd, 5)}`]
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');

      if (showWorking) {
        qs('#working', root).innerHTML = values.slice(0, 200).map((v) => `
          <tr><td class="num">${fmt(v)}</td><td class="num">${fmt(v - s.mean, 6)}</td><td class="num">${fmt((v - s.mean) ** 2, 6)}</td></tr>`).join('');
      }
    };

    ctx.tabs((tab) => { sample = tab === 'sample'; calc(); });
    ctx.live(calc, { debounceMs: 180 });

    qs('#toggle-working', root).addEventListener('click', (event) => {
      showWorking = !showWorking;
      qs('#working-wrap', root).hidden = !showWorking;
      event.currentTarget.innerHTML = showWorking
        ? '<i class="fa-solid fa-eye-slash"></i> Hide working'
        : '<i class="fa-solid fa-table-list"></i> Show working';
      calc();
    });
  }
};
