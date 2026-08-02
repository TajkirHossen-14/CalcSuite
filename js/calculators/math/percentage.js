/**
 * Percentage Calculator — four sub-modes, all live, no submit button.
 */
import { qs } from '../../utils/dom.js';
import { fmt } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

const num = (el) => (el && isNumber(el.value) ? Number(el.value) : null);

export default {
  resultLabel: 'Result',
  how: `
    <p>Percent simply means “per hundred”, so every mode below is the same fraction rearranged
    to solve for a different unknown.</p>
    <code class="formula">X% of Y            →  Y × X / 100
X is what % of Y   →  X / Y × 100
% change           →  (new − old) / |old| × 100
increase / decrease→  base × (1 ± rate/100)</code>
    <h4>Two details people get wrong</h4>
    <ul>
      <li><strong>Percentage points vs percent.</strong> Going from 20% to 25% is a 5 percentage-point
      rise but a 25% relative increase. This tool always reports the relative change.</li>
      <li><strong>Increases and decreases don't cancel.</strong> +10% then −10% lands at 99% of the
      original, because the second percentage is taken from a larger base.</li>
    </ul>
    <p>Everything recalculates on the <code>input</code> event, so results appear as you type —
    there is deliberately no “Calculate” button.</p>`,

  body: () => `
    <div class="tabs" role="tablist">
      <button class="tab is-active" data-tab="of" type="button">X% of Y</button>
      <button class="tab" data-tab="is" type="button">X is what % of Y</button>
      <button class="tab" data-tab="change" type="button">% change</button>
      <button class="tab" data-tab="delta" type="button">Increase / decrease</button>
    </div>

    <div class="tab-panel" data-panel="of">
      <div class="grid grid-2">
        <div class="field"><label for="of-p">Percentage (%)</label><input type="number" id="of-p" value="15" step="any"></div>
        <div class="field"><label for="of-y">Of value</label><input type="number" id="of-y" value="200" step="any"></div>
      </div>
    </div>

    <div class="tab-panel" data-panel="is" hidden>
      <div class="grid grid-2">
        <div class="field"><label for="is-x">Value X</label><input type="number" id="is-x" value="30" step="any"></div>
        <div class="field"><label for="is-y">Is what % of Y</label><input type="number" id="is-y" value="120" step="any"></div>
      </div>
    </div>

    <div class="tab-panel" data-panel="change" hidden>
      <div class="grid grid-2">
        <div class="field"><label for="ch-old">From (original)</label><input type="number" id="ch-old" value="80" step="any"></div>
        <div class="field"><label for="ch-new">To (new)</label><input type="number" id="ch-new" value="100" step="any"></div>
      </div>
    </div>

    <div class="tab-panel" data-panel="delta" hidden>
      <div class="grid grid-3">
        <div class="field"><label for="d-base">Starting value</label><input type="number" id="d-base" value="250" step="any"></div>
        <div class="field"><label for="d-rate">Rate (%)</label><input type="number" id="d-rate" value="20" step="any"></div>
        <div class="field"><label for="d-dir">Direction</label>
          <select id="d-dir"><option value="inc">Increase</option><option value="dec">Decrease</option></select>
        </div>
      </div>
    </div>

    <div class="stat-grid mt-4" id="pct-stats"></div>`,

  init(root, ctx) {
    let mode = 'of';
    const stats = qs('#pct-stats', root);

    const calc = () => {
      const set = (value, sub, tiles = []) => {
        ctx.setResult(value, sub);
        stats.innerHTML = tiles.map((t) => `
          <div class="stat"><div class="stat-label">${t.label}</div><div class="stat-value">${t.value}</div></div>`).join('');
      };

      if (mode === 'of') {
        const p = num(qs('#of-p', root)); const y = num(qs('#of-y', root));
        if (p === null || y === null) return ctx.setError('Enter both values');
        const out = (y * p) / 100;
        set(fmt(out), `<span class="mono">${fmt(p)}% of ${fmt(y)}</span>`, [
          { label: 'Remaining', value: fmt(y - out) },
          { label: 'As fraction', value: `${fmt(p / 100, 4)} × ${fmt(y)}` },
          { label: 'Double it', value: fmt(out * 2) }
        ]);
      } else if (mode === 'is') {
        const x = num(qs('#is-x', root)); const y = num(qs('#is-y', root));
        if (x === null || y === null) return ctx.setError('Enter both values');
        if (y === 0) return ctx.setError('The total cannot be zero');
        const pct = (x / y) * 100;
        set(`${fmt(pct, 4)}%`, `<span class="mono">${fmt(x)} ÷ ${fmt(y)} × 100</span>`, [
          { label: 'As decimal', value: fmt(x / y, 6) },
          { label: 'Remaining %', value: `${fmt(100 - pct, 4)}%` },
          { label: 'Difference', value: fmt(y - x) }
        ]);
      } else if (mode === 'change') {
        const a = num(qs('#ch-old', root)); const b = num(qs('#ch-new', root));
        if (a === null || b === null) return ctx.setError('Enter both values');
        if (a === 0) return ctx.setError('The original value cannot be zero');
        const change = ((b - a) / Math.abs(a)) * 100;
        const word = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'no change';
        set(`${change > 0 ? '+' : ''}${fmt(change, 4)}%`, `An <strong>${word}</strong> of <span class="mono">${fmt(Math.abs(b - a))}</span>`, [
          { label: 'Absolute change', value: fmt(b - a) },
          { label: 'Ratio new/old', value: fmt(b / a, 6) },
          { label: 'Direction', value: word }
        ]);
      } else {
        const base = num(qs('#d-base', root)); const rate = num(qs('#d-rate', root));
        const dir = qs('#d-dir', root).value;
        if (base === null || rate === null) return ctx.setError('Enter both values');
        const delta = (base * rate) / 100;
        const out = dir === 'inc' ? base + delta : base - delta;
        set(fmt(out), `<span class="mono">${fmt(base)} ${dir === 'inc' ? '+' : '−'} ${fmt(rate)}% (${fmt(delta)})</span>`, [
          { label: 'Amount changed', value: fmt(delta) },
          { label: 'Multiplier', value: fmt(dir === 'inc' ? 1 + rate / 100 : 1 - rate / 100, 6) },
          { label: 'Reverse to original', value: fmt(out / (dir === 'inc' ? 1 + rate / 100 : 1 - rate / 100), 6) }
        ]);
      }
    };

    ctx.tabs((tab) => { mode = tab; calc(); });
    ctx.live(calc);
  }
};
