/** Profit Margin Calculator — cost, revenue, margin and markup in one solver. */
import { qs } from '../../utils/dom.js';
import { fmtFixed, fmt } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

export default {
  resultLabel: 'Gross margin',
  how: `
    <p>Margin and markup use the same profit but different denominators, which is why a 50% markup
    is only a 33.3% margin. Mixing them up is the fastest way to underprice a product.</p>
    <code class="formula">profit = revenue − cost
margin = profit / revenue × 100     (share of the selling price)
markup = profit / cost    × 100     (uplift on what you paid)

margin → markup :  m / (100 − m) × 100
markup → margin :  k / (100 + k) × 100</code>
    <h4>Three ways in</h4>
    <ul>
      <li><strong>From cost + revenue</strong> — you know both prices and want the percentages.</li>
      <li><strong>From cost + margin</strong> — you know what you paid and the margin you need; the
      tool solves <code>revenue = cost / (1 − margin/100)</code>.</li>
      <li><strong>From cost + markup</strong> — straightforward: <code>revenue = cost × (1 + markup/100)</code>.</li>
    </ul>
    <h4>The 100% margin trap</h4>
    <p>A 100% margin is impossible unless the item is free: it would require revenue to be entirely
    profit. Margins therefore stay below 100 while markups can be any size at all — a 400% markup is
    perfectly ordinary in hospitality.</p>`,

  body: () => `
    <div class="tabs" role="tablist">
      <button class="tab is-active" data-tab="both" type="button">Cost + revenue</button>
      <button class="tab" data-tab="margin" type="button">Cost + target margin</button>
      <button class="tab" data-tab="markup" type="button">Cost + markup</button>
    </div>
    <div class="grid grid-2">
      <div class="field"><label for="cost">Cost</label><input type="number" id="cost" value="40" min="0" step="any"></div>
      <div class="field" id="rev-field"><label for="revenue">Revenue (selling price)</label><input type="number" id="revenue" value="100" min="0" step="any"></div>
      <div class="field" id="margin-field" hidden><label for="margin">Target margin (%)</label><input type="number" id="margin" value="60" step="any"></div>
      <div class="field" id="markup-field" hidden><label for="markup">Markup (%)</label><input type="number" id="markup" value="150" step="any"></div>
      <div class="field"><label for="units">Units sold (optional)</label><input type="number" id="units" value="100" min="0" step="1"></div>
    </div>
    <div class="stat-grid mt-4" id="pm-stats"></div>`,

  init(root, ctx) {
    let mode = 'both';
    const el = (id) => qs(`#${id}`, root);

    const calc = () => {
      if (!isNumber(el('cost').value)) return ctx.setError('Enter a cost');
      const cost = Number(el('cost').value);
      let revenue;

      el('rev-field').hidden = mode !== 'both';
      el('margin-field').hidden = mode !== 'margin';
      el('markup-field').hidden = mode !== 'markup';

      if (mode === 'both') {
        if (!isNumber(el('revenue').value)) return ctx.setError('Enter a revenue');
        revenue = Number(el('revenue').value);
      } else if (mode === 'margin') {
        const m = Number(el('margin').value);
        if (!isNumber(m) || m >= 100) return ctx.setError('Margin must be below 100%');
        revenue = cost / (1 - m / 100);
      } else {
        const k = Number(el('markup').value);
        if (!isNumber(k)) return ctx.setError('Enter a markup');
        revenue = cost * (1 + k / 100);
      }

      if (revenue <= 0) return ctx.setError('Revenue must be greater than zero');
      const profit = revenue - cost;
      const margin = (profit / revenue) * 100;
      const markup = cost === 0 ? Infinity : (profit / cost) * 100;
      const units = Number(el('units').value) || 0;

      ctx.setResult(`${fmt(margin, 3)}%`,
        `Profit <span class="mono">${fmtFixed(profit, 2)}</span> on revenue <span class="mono">${fmtFixed(revenue, 2)}</span> (markup <span class="mono">${Number.isFinite(markup) ? `${fmt(markup, 3)}%` : '∞'}</span>)`,
        { copy: `${margin.toFixed(2)}%` });

      qs('#pm-stats', root).innerHTML = [
        ['Selling price', fmtFixed(revenue, 2)],
        ['Profit per unit', fmtFixed(profit, 2)],
        ['Gross margin', `${fmt(margin, 3)}%`],
        ['Markup', Number.isFinite(markup) ? `${fmt(markup, 3)}%` : '∞'],
        ['Cost as % of price', `${fmt((cost / revenue) * 100, 3)}%`],
        ['Break-even price', fmtFixed(cost, 2)],
        ['Profit on all units', units ? fmtFixed(profit * units, 2) : '—'],
        ['Revenue on all units', units ? fmtFixed(revenue * units, 2) : '—'],
        ['Price to double margin', margin < 50 ? fmtFixed(cost / (1 - (margin * 2) / 100), 2) : 'n/a']
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');
    };

    ctx.tabs((tab) => { mode = tab; calc(); });
    ctx.live(calc);
  }
};
