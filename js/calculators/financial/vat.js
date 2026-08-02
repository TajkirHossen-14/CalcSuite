/** VAT / Sales Tax Calculator — add tax or strip it back out. */
import { qs, on } from '../../utils/dom.js';
import { fmtFixed, fmt } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

const PRESETS = [
  ['UK VAT', 20], ['EU standard (avg)', 21], ['Germany', 19], ['France', 20], ['Ireland', 23],
  ['India GST', 18], ['Australia GST', 10], ['Canada GST', 5], ['Singapore GST', 9], ['UAE VAT', 5]
];

export default {
  resultLabel: 'Gross (tax inclusive)',
  how: `
    <p>Value-added tax and sales tax are proportional surcharges, so the arithmetic is a
    multiplication in one direction and a division in the other. Getting the direction wrong is the
    single most common accounting slip.</p>
    <code class="formula">Adding tax     gross = net × (1 + rate/100)
                tax   = gross − net
Removing tax   net   = gross / (1 + rate/100)
                tax   = gross − net</code>
    <h4>Why you can't just subtract the percentage</h4>
    <p>To strip 20% VAT from a €120 gross price you divide by 1.2 to get €100 — you do <em>not</em>
    subtract 20% of 120 (which would wrongly give €96). The tax was calculated on the smaller net
    figure, so removing it means undoing a multiplication.</p>
    <p>A handy shortcut for 20%: the VAT portion of a gross price is exactly one sixth of it.</p>
    <h4>Net, tax, gross</h4>
    <p>Net is the price before tax (what the seller keeps), tax is the government's share, and gross
    is what the customer actually pays. All three are always shown so you can copy whichever your
    invoice needs.</p>`,

  body: () => `
    <div class="tabs" role="tablist">
      <button class="tab is-active" data-tab="add" type="button">Add tax (net → gross)</button>
      <button class="tab" data-tab="remove" type="button">Remove tax (gross → net)</button>
    </div>
    <div class="grid grid-2">
      <div class="field">
        <label for="amount" id="amount-label">Net amount (excluding tax)</label>
        <input type="number" id="amount" value="100" min="0" step="any">
      </div>
      <div class="field">
        <label for="rate">Tax rate (%)</label>
        <div class="input-group">
          <input type="number" id="rate" value="20" step="any">
          <span class="input-suffix">%</span>
        </div>
      </div>
    </div>
    <div class="chip-row">
      ${PRESETS.map(([name, rate]) => `<button class="chip js-rate" type="button" data-rate="${rate}">${name} ${rate}%</button>`).join('')}
    </div>
    <div class="stat-grid mt-4" id="vat-stats"></div>`,

  init(root, ctx) {
    let mode = 'add';
    const el = (id) => qs(`#${id}`, root);

    const calc = () => {
      if (!isNumber(el('amount').value) || !isNumber(el('rate').value)) return ctx.setError('Enter an amount and a rate');
      const amount = Number(el('amount').value);
      const rate = Number(el('rate').value);
      if (rate <= -100) return ctx.setError('Rate must be greater than −100%');

      el('amount-label').textContent = mode === 'add' ? 'Net amount (excluding tax)' : 'Gross amount (including tax)';

      const net = mode === 'add' ? amount : amount / (1 + rate / 100);
      const gross = mode === 'add' ? amount * (1 + rate / 100) : amount;
      const tax = gross - net;

      ctx.setResult(fmtFixed(mode === 'add' ? gross : net, 2),
        `Net <span class="mono">${fmtFixed(net, 2)}</span> + tax <span class="mono">${fmtFixed(tax, 2)}</span> = gross <span class="mono">${fmtFixed(gross, 2)}</span>`,
        { copy: (mode === 'add' ? gross : net).toFixed(2) });

      qs('#vat-stats', root).innerHTML = [
        ['Net (excl. tax)', fmtFixed(net, 2)],
        ['Tax amount', fmtFixed(tax, 2)],
        ['Gross (incl. tax)', fmtFixed(gross, 2)],
        ['Tax rate', `${fmt(rate, 3)}%`],
        ['Tax as % of gross', `${fmt((tax / (gross || 1)) * 100, 3)}%`],
        ['Gross multiplier', fmt(1 + rate / 100, 5)],
        ['Divisor to strip tax', fmt(1 + rate / 100, 5)]
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');
    };

    on(root, 'click', '.js-rate', (event, chip) => { el('rate').value = chip.dataset.rate; calc(); });
    ctx.tabs((tab) => { mode = tab; calc(); });
    ctx.live(calc);
  }
};
