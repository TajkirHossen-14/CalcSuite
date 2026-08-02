/** Simple & Compound Interest Calculator. */
import { qs } from '../../utils/dom.js';
import { fmtFixed, fmt } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

const FREQ = [['1', 'Annually'], ['2', 'Semi-annually'], ['4', 'Quarterly'], ['12', 'Monthly'], ['52', 'Weekly'], ['365', 'Daily']];

export default {
  resultLabel: 'Final balance',
  how: `
    <p>Simple interest is charged on the original principal only. Compound interest is charged on
    the principal <em>plus</em> the interest already added, which is why the two curves separate so
    dramatically over long periods.</p>
    <code class="formula">Simple    A = P × (1 + r × t)
Compound  A = P × (1 + r/n)^(n × t)
With regular deposits (added at the end of each period):
          A = P(1 + i)^N + PMT × ((1 + i)^N − 1) / i     where i = r/n, N = n × t</code>
    <h4>Compounding frequency</h4>
    <p>The more often interest is capitalised, the more you earn from the same headline rate. 10%
    compounded annually gives 10.00% a year; compounded monthly it gives 10.47%; daily, 10.52%. That
    effective figure is the APY, and it's what the tool reports so two offers can be compared fairly.</p>
    <code class="formula">APY = (1 + r/n)ⁿ − 1</code>
    <h4>The rule of 72</h4>
    <p>Divide 72 by the annual percentage rate for a quick doubling time: at 8%, money doubles in
    roughly nine years. The panel shows both that estimate and the exact logarithmic answer,
    <code>ln(2) / ln(1 + i)</code>.</p>`,

  body: () => `
    <div class="tabs" role="tablist">
      <button class="tab is-active" data-tab="compound" type="button">Compound</button>
      <button class="tab" data-tab="simple" type="button">Simple</button>
    </div>
    <div class="grid grid-2">
      <div class="field"><label for="principal">Principal amount</label><input type="number" id="principal" value="10000" min="0" step="any"></div>
      <div class="field"><label for="rate">Annual interest rate (%)</label><input type="number" id="rate" value="7.5" step="any"></div>
      <div class="field"><label for="years">Time period (years)</label><input type="number" id="years" value="10" min="0" step="any"></div>
      <div class="field" id="freq-field">
        <label for="freq">Compounding frequency</label>
        <select id="freq">${FREQ.map(([v, l]) => `<option value="${v}"${v === '12' ? ' selected' : ''}>${l}</option>`).join('')}</select>
      </div>
      <div class="field" id="pmt-field">
        <label for="pmt">Regular deposit each period (optional)</label>
        <input type="number" id="pmt" value="0" min="0" step="any">
      </div>
      <div class="field"><label for="currency">Currency symbol</label><input type="text" id="currency" value="$" maxlength="3"></div>
    </div>
    <div class="stat-grid mt-4" id="int-stats"></div>
    <div class="table-wrap mt-4" id="growth-wrap"></div>`,

  init(root, ctx) {
    let mode = 'compound';
    const el = (id) => qs(`#${id}`, root);

    const calc = () => {
      const fields = ['principal', 'rate', 'years'].map((id) => el(id));
      if (!fields.every((f) => isNumber(f.value))) return ctx.setError('Fill in principal, rate and years');
      const P = Number(el('principal').value);
      const r = Number(el('rate').value) / 100;
      const t = Number(el('years').value);
      const n = mode === 'simple' ? 1 : Number(el('freq').value);
      const pmt = mode === 'simple' ? 0 : Number(el('pmt').value) || 0;
      const cur = el('currency').value || '';
      if (P < 0 || t < 0) return ctx.setError('Principal and time must be positive');

      el('freq-field').hidden = mode === 'simple';
      el('pmt-field').hidden = mode === 'simple';

      const i = r / n;
      const N = n * t;
      let final; let contributions = P;
      if (mode === 'simple') {
        final = P * (1 + r * t);
      } else {
        const growth = (1 + i) ** N;
        const fvDeposits = i === 0 ? pmt * N : pmt * ((growth - 1) / i);
        final = P * growth + fvDeposits;
        contributions = P + pmt * N;
      }
      const interest = final - contributions;
      const apy = mode === 'simple' ? r : (1 + i) ** n - 1;
      const doubling = i > 0 ? Math.log(2) / (n * Math.log(1 + i)) : Infinity;

      ctx.setResult(`${cur}${fmtFixed(final, 2)}`,
        `${mode === 'simple' ? 'Simple' : 'Compound'} interest on <span class="mono">${cur}${fmtFixed(P, 2)}</span> at <span class="mono">${fmt(r * 100, 4)}%</span> for <span class="mono">${fmt(t)}</span> years`,
        { copy: final.toFixed(2) });

      qs('#int-stats', root).innerHTML = [
        ['Interest earned', `${cur}${fmtFixed(interest, 2)}`],
        ['Total contributed', `${cur}${fmtFixed(contributions, 2)}`],
        ['Effective rate (APY)', `${fmt(apy * 100, 4)}%`],
        ['Growth multiple', `${fmt(final / (P || 1), 4)}×`],
        ['Interest as % of total', `${fmt((interest / (final || 1)) * 100, 2)}%`],
        ['Doubling time', Number.isFinite(doubling) ? `${fmt(doubling, 2)} years` : '—'],
        ['Rule of 72 estimate', r > 0 ? `${fmt(72 / (r * 100), 2)} years` : '—'],
        ['Periods', mode === 'simple' ? '1 per year' : `${fmt(N)} total`]
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');

      const rows = [];
      const yearsToShow = Math.min(Math.ceil(t), 40);
      for (let y = 1; y <= yearsToShow; y += 1) {
        let balance;
        if (mode === 'simple') balance = P * (1 + r * y);
        else {
          const g = (1 + i) ** (n * y);
          balance = P * g + (i === 0 ? pmt * n * y : pmt * ((g - 1) / i));
        }
        const paid = P + pmt * n * y;
        rows.push(`<tr><td>Year ${y}</td><td class="num">${cur}${fmtFixed(paid, 2)}</td><td class="num">${cur}${fmtFixed(balance - paid, 2)}</td><td class="num">${cur}${fmtFixed(balance, 2)}</td></tr>`);
      }
      qs('#growth-wrap', root).innerHTML = rows.length
        ? `<table class="data-table"><thead><tr><th>Period</th><th>Contributed</th><th>Interest</th><th>Balance</th></tr></thead><tbody>${rows.join('')}</tbody></table>`
        : '';
    };

    ctx.tabs((tab) => { mode = tab; calc(); });
    ctx.live(calc);
  }
};
