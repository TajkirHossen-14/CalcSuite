/**
 * Tip Calculator — tip, total and per-person split with rounding options.
 */
import { qs, qsa, on } from '../../utils/dom.js';
import { fmt, fmtFixed } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

const PRESETS = [10, 12.5, 15, 18, 20, 25];

export default {
  resultLabel: 'Total to pay',
  how: `
    <p>The arithmetic is one multiplication and one division:</p>
    <code class="formula">tip   = bill × rate ÷ 100
total = bill + tip
each  = total ÷ people</code>
    <h4>Tip before or after tax?</h4>
    <p>Conventions differ. In much of the United States the polite default is to tip on the
    pre-tax subtotal, because sales tax is not part of the service. The toggle below lets you strip
    a tax percentage out of the bill first, so the tip is calculated on the food and drink alone —
    the total still includes the tax, of course.</p>
    <h4>Rounding</h4>
    <p>Three rounding modes are offered. Rounding the <em>total</em> is what most people actually do
    at the table: you decide what to hand over, and the tip absorbs the difference — so the
    effective tip percentage shown will drift from the one you asked for. Rounding the
    <em>per-person</em> share makes splitting painless and guarantees the group covers the bill,
    with a small surplus.</p>
    <h4>Custom rates</h4>
    <p>Local norms vary enormously: roughly 15–20% in the US and Canada, 5–10% in much of Europe,
    and nothing at all in Japan, where tipping can cause offence. The preset buttons are a starting
    point, not advice — type any rate you like.</p>`,

  body: () => `
    <div class="grid grid-3">
      <div class="field"><label for="bill">Bill amount</label><input type="number" id="bill" value="86.40" min="0" step="any" inputmode="decimal"></div>
      <div class="field"><label for="rate">Tip rate (%)</label><input type="number" id="rate" value="18" min="0" step="any"></div>
      <div class="field"><label for="people">Split between</label><input type="number" id="people" value="4" min="1" step="1"></div>
    </div>

    <div class="chips mt-3" role="group" aria-label="Tip presets">
      ${PRESETS.map((p) => `<button class="chip${p === 18 ? ' is-active' : ''}" type="button" data-tip="${p}">${p}%</button>`).join('')}
    </div>

    <hr class="divider">
    <div class="grid grid-2">
      <div class="field">
        <label for="rounding">Rounding</label>
        <select id="rounding">
          <option value="none">No rounding — exact amounts</option>
          <option value="total">Round the total up</option>
          <option value="each">Round each person's share up</option>
        </select>
      </div>
      <div class="field">
        <label for="tax">Sales tax already in the bill (%)</label>
        <input type="number" id="tax" value="0" min="0" step="any">
        <span class="field-hint">Set above zero to tip on the pre-tax subtotal</span>
      </div>
    </div>

    <div class="stat-grid mt-4" id="tip-stats"></div>
    <h3 class="mt-4" style="font-size:var(--fs-md)">If you tipped a different amount</h3>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Rate</th><th>Tip</th><th>Total</th><th>Per person</th></tr></thead>
        <tbody id="tip-table"></tbody>
      </table>
    </div>`,

  init(root, ctx) {
    const num = (id) => Number(qs(`#${id}`, root).value);

    const calc = () => {
      const bill = num('bill');
      const rate = num('rate');
      const people = Math.max(1, Math.floor(num('people')) || 1);
      const taxPct = num('tax') || 0;
      const rounding = qs('#rounding', root).value;

      if (!isNumber(bill) || !isNumber(rate)) return ctx.setError('Enter the bill amount and a tip rate');
      if (bill < 0 || rate < 0) return ctx.setError('Amounts cannot be negative');

      const subtotal = taxPct > 0 ? bill / (1 + taxPct / 100) : bill;
      let tip = (subtotal * rate) / 100;
      let total = bill + tip;
      let each = total / people;

      if (rounding === 'total') {
        total = Math.ceil(total);
        tip = total - bill;
        each = total / people;
      } else if (rounding === 'each') {
        each = Math.ceil(each * 100) / 100;
        each = Math.ceil(each);
        total = each * people;
        tip = total - bill;
      }

      const effective = subtotal > 0 ? (tip / subtotal) * 100 : 0;

      ctx.setResult(fmtFixed(total, 2),
        `Tip <span class="mono">${fmtFixed(tip, 2)}</span> · <span class="mono">${fmtFixed(each, 2)}</span> each for ${people} ${people === 1 ? 'person' : 'people'}`,
        { copy: total.toFixed(2) });

      qs('#tip-stats', root).innerHTML = [
        ['Bill', fmtFixed(bill, 2)],
        [taxPct > 0 ? 'Pre-tax subtotal' : 'Tipped on', fmtFixed(subtotal, 2)],
        ['Tip', fmtFixed(tip, 2)],
        ['Total', fmtFixed(total, 2)],
        ['Per person', fmtFixed(each, 2)],
        ['Tip per person', fmtFixed(tip / people, 2)],
        ['Effective tip rate', `${fmtFixed(effective, 2)}%`],
        ['Rounding added', fmtFixed(Math.max(0, total - (bill + (subtotal * rate) / 100)), 2)]
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');

      qs('#tip-table', root).innerHTML = PRESETS.map((p) => {
        const t = (subtotal * p) / 100;
        const tot = bill + t;
        return `<tr${Math.abs(p - rate) < 0.001 ? ' style="background:var(--surface-3)"' : ''}>
          <td class="mono">${p}%</td>
          <td class="mono">${fmtFixed(t, 2)}</td>
          <td class="mono">${fmtFixed(tot, 2)}</td>
          <td class="mono">${fmtFixed(tot / people, 2)}</td>
        </tr>`;
      }).join('');
    };

    on(root, 'click', '[data-tip]', (e, btn) => {
      qs('#rate', root).value = btn.dataset.tip;
      qsa('.chip', root).forEach((c) => c.classList.toggle('is-active', c === btn));
      calc();
    });

    on(qs('#rate', root), 'input', () => {
      const value = Number(qs('#rate', root).value);
      qsa('.chip', root).forEach((c) => c.classList.toggle('is-active', Number(c.dataset.tip) === value));
    });

    ctx.live(calc);
  }
};
