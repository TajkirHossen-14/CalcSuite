/** Discount Calculator — forward, reverse and "stacked discounts" modes. */
import { qs } from '../../utils/dom.js';
import { fmtFixed, fmt } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';
import { parseNumberList } from '../../utils/validators.js';

export default {
  resultLabel: 'Final price',
  how: `
    <p>A discount is a proportion removed from a price, so every mode here is one equation solved
    for a different unknown.</p>
    <code class="formula">final    = original × (1 − d/100)
discount = original − final
rate     = (original − final) / original × 100
original = final / (1 − d/100)          (working backwards)</code>
    <h4>Stacked discounts don't add up</h4>
    <p>"30% off, then an extra 20% off" is not 50% off. The second cut applies to the already
    reduced price, so the multipliers compound:</p>
    <code class="formula">0.70 × 0.80 = 0.56  →  44% off, not 50%</code>
    <p>The stacked mode multiplies each rate in turn and reports the single equivalent discount, so
    you can see exactly what a promotion is really worth.</p>
    <h4>Reverse mode</h4>
    <p>Given what you paid and what the ticket said, reverse mode recovers the discount percentage —
    useful for checking whether the "was" price on a sale tag is doing what it claims.</p>`,

  body: () => `
    <div class="tabs" role="tablist">
      <button class="tab is-active" data-tab="forward" type="button">Price after discount</button>
      <button class="tab" data-tab="reverse" type="button">Find the discount %</button>
      <button class="tab" data-tab="stack" type="button">Stacked discounts</button>
    </div>

    <div class="tab-panel" data-panel="forward">
      <div class="grid grid-2">
        <div class="field"><label for="f-price">Original price</label><input type="number" id="f-price" value="249.99" min="0" step="any"></div>
        <div class="field"><label for="f-rate">Discount (%)</label><input type="number" id="f-rate" value="35" step="any"></div>
      </div>
    </div>

    <div class="tab-panel" data-panel="reverse" hidden>
      <div class="grid grid-2">
        <div class="field"><label for="r-price">Original price</label><input type="number" id="r-price" value="80" min="0" step="any"></div>
        <div class="field"><label for="r-final">Price you paid</label><input type="number" id="r-final" value="52" min="0" step="any"></div>
      </div>
    </div>

    <div class="tab-panel" data-panel="stack" hidden>
      <div class="grid grid-2">
        <div class="field"><label for="s-price">Original price</label><input type="number" id="s-price" value="100" min="0" step="any"></div>
        <div class="field"><label for="s-rates">Discounts applied in order (%)</label>
          <input type="text" id="s-rates" class="mono" value="30, 20, 10">
          <span class="field-hint">Comma separated, applied one after another.</span>
        </div>
      </div>
    </div>

    <div class="stat-grid mt-4" id="disc-stats"></div>`,

  init(root, ctx) {
    let mode = 'forward';
    const el = (id) => qs(`#${id}`, root);
    const tiles = (list) => {
      qs('#disc-stats', root).innerHTML = list
        .map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');
    };

    const calc = () => {
      if (mode === 'forward') {
        if (!isNumber(el('f-price').value) || !isNumber(el('f-rate').value)) return ctx.setError('Enter price and discount');
        const price = Number(el('f-price').value); const rate = Number(el('f-rate').value);
        const saved = (price * rate) / 100;
        const final = price - saved;
        ctx.setResult(fmtFixed(final, 2), `<span class="mono">${fmtFixed(price, 2)}</span> less <span class="mono">${fmt(rate, 3)}%</span> (saves <span class="mono">${fmtFixed(saved, 2)}</span>)`, { copy: final.toFixed(2) });
        tiles([
          ['You save', fmtFixed(saved, 2)],
          ['You pay', fmtFixed(final, 2)],
          ['Paying % of original', `${fmt(100 - rate, 3)}%`],
          ['Price multiplier', fmt(1 - rate / 100, 4)],
          ['Half price would be', fmtFixed(price / 2, 2)]
        ]);
      } else if (mode === 'reverse') {
        if (!isNumber(el('r-price').value) || !isNumber(el('r-final').value)) return ctx.setError('Enter both prices');
        const price = Number(el('r-price').value); const final = Number(el('r-final').value);
        if (price <= 0) return ctx.setError('Original price must be above zero');
        const saved = price - final;
        const rate = (saved / price) * 100;
        ctx.setResult(`${fmt(rate, 3)}% off`, `Saved <span class="mono">${fmtFixed(saved, 2)}</span> on <span class="mono">${fmtFixed(price, 2)}</span>`, { copy: `${rate.toFixed(2)}%` });
        tiles([
          ['Amount saved', fmtFixed(saved, 2)],
          ['Fraction paid', `${fmt((final / price) * 100, 3)}%`],
          ['Markdown ratio', fmt(final / price, 4)],
          ['Discount type', rate >= 50 ? 'Clearance level' : rate >= 20 ? 'Genuine sale' : 'Modest reduction']
        ]);
      } else {
        const price = Number(el('s-price').value);
        const rates = parseNumberList(el('s-rates').value);
        if (!isNumber(el('s-price').value) || !rates.length) return ctx.setError('Enter a price and at least one discount');
        const multiplier = rates.reduce((acc, r) => acc * (1 - r / 100), 1);
        const final = price * multiplier;
        const equivalent = (1 - multiplier) * 100;
        ctx.setResult(fmtFixed(final, 2), `Equivalent to a single <strong>${fmt(equivalent, 3)}%</strong> discount, not <span class="mono">${fmt(rates.reduce((a, b) => a + b, 0), 3)}%</span>`, { copy: final.toFixed(2) });
        let running = price;
        tiles([
          ['Equivalent single discount', `${fmt(equivalent, 3)}%`],
          ['Naive sum of discounts', `${fmt(rates.reduce((a, b) => a + b, 0), 3)}%`],
          ['Total saved', fmtFixed(price - final, 2)],
          ['Combined multiplier', fmt(multiplier, 5)],
          ...rates.map((r, i) => {
            running *= 1 - r / 100;
            return [`After ${fmt(r)}% (step ${i + 1})`, fmtFixed(running, 2)];
          })
        ]);
      }
    };

    ctx.tabs((tab) => { mode = tab; calc(); });
    ctx.live(calc);
  }
};
