/** Ratio Calculator — simplify, solve a proportion, scale and split. */
import { qs } from '../../utils/dom.js';
import { gcd } from '../../core/Fraction.js';
import { fmt } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

const num = (el) => (isNumber(el.value) ? Number(el.value) : null);

/** Reduce a ratio of possibly-decimal terms to whole numbers. */
export function simplifyRatio(a, b) {
  let x = a; let y = b; let guard = 0;
  while ((!Number.isInteger(x) || !Number.isInteger(y)) && guard < 10) { x *= 10; y *= 10; guard += 1; }
  const g = gcd(x, y);
  return [x / g, y / g, g];
}

export default {
  resultLabel: 'Simplified ratio',
  how: `
    <p>A ratio compares two quantities by division, so a : b, a/b and "a to b" all say the same
    thing. Two ratios are <em>equivalent</em> when their cross products match.</p>
    <code class="formula">simplify   : divide both terms by gcd(a, b)
proportion : a : b = c : x   →   x = b × c / a   (cross-multiply)
split      : one part = total / (a + b)</code>
    <h4>Decimal terms</h4>
    <p>If either term has a decimal point, both are multiplied by ten until they are whole numbers
    before the GCD reduction runs — so 2.5 : 10 becomes 25 : 100 and then 1 : 4.</p>
    <h4>Parts vs totals</h4>
    <p>A 3 : 2 ratio means five parts in total, so of 200 items that's 120 and 80. The split mode
    does that for you — a classic source of mistakes when mixing paint, concrete or cocktails.</p>`,

  body: () => `
    <div class="tabs" role="tablist">
      <button class="tab is-active" data-tab="simplify" type="button">Simplify</button>
      <button class="tab" data-tab="proportion" type="button">Solve proportion</button>
      <button class="tab" data-tab="scale" type="button">Scale &amp; split</button>
    </div>

    <div class="tab-panel" data-panel="simplify">
      <div class="grid grid-2 keep">
        <div class="field"><label for="s-a">Term A</label><input type="number" id="s-a" value="1920" step="any"></div>
        <div class="field"><label for="s-b">Term B</label><input type="number" id="s-b" value="1080" step="any"></div>
      </div>
    </div>

    <div class="tab-panel" data-panel="proportion" hidden>
      <div class="grid grid-4 keep">
        <div class="field"><label for="p-a">A</label><input type="number" id="p-a" value="3" step="any"></div>
        <div class="field"><label for="p-b">B</label><input type="number" id="p-b" value="4" step="any"></div>
        <div class="field"><label for="p-c">C</label><input type="number" id="p-c" value="9" step="any"></div>
        <div class="field"><label for="p-x">X (unknown)</label><input type="number" id="p-x" placeholder="?" readonly></div>
      </div>
      <p class="field-hint">Solving <span class="mono">A : B = C : X</span></p>
    </div>

    <div class="tab-panel" data-panel="scale" hidden>
      <div class="grid grid-3">
        <div class="field"><label for="c-a">Term A</label><input type="number" id="c-a" value="3" step="any"></div>
        <div class="field"><label for="c-b">Term B</label><input type="number" id="c-b" value="2" step="any"></div>
        <div class="field"><label for="c-total">Total to split</label><input type="number" id="c-total" value="200" step="any"></div>
      </div>
    </div>

    <div class="stat-grid mt-4" id="ratio-stats"></div>`,

  init(root, ctx) {
    let mode = 'simplify';
    const tiles = (list) => {
      qs('#ratio-stats', root).innerHTML = list
        .map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');
    };

    const calc = () => {
      if (mode === 'simplify') {
        const a = num(qs('#s-a', root)); const b = num(qs('#s-b', root));
        if (a === null || b === null) return ctx.setError('Enter both terms');
        if (b === 0) return ctx.setError('Term B cannot be zero');
        const [x, y, divisor] = simplifyRatio(a, b);
        ctx.setResult(`${fmt(x)} : ${fmt(y)}`, `<span class="mono">${fmt(a)} : ${fmt(b)}</span> divided through by <span class="mono">${fmt(divisor)}</span>`, { copy: `${x}:${y}` });
        tiles([
          ['As decimal', fmt(a / b, 8)],
          ['As fraction', `${x}/${y}`],
          ['As percentage', `${fmt((a / b) * 100, 4)}%`],
          ['Inverted', `${fmt(y)} : ${fmt(x)}`],
          ['Normalised to 1', `1 : ${fmt(b / a, 6)}`],
          ['Total parts', fmt(x + y)]
        ]);
      } else if (mode === 'proportion') {
        const a = num(qs('#p-a', root)); const b = num(qs('#p-b', root)); const c = num(qs('#p-c', root));
        if (a === null || b === null || c === null) return ctx.setError('Fill in A, B and C');
        if (a === 0) return ctx.setError('A cannot be zero');
        const x = (b * c) / a;
        qs('#p-x', root).value = Number(x.toPrecision(12));
        ctx.setResult(fmt(x, 8), `<span class="mono">${fmt(a)} : ${fmt(b)} = ${fmt(c)} : ${fmt(x, 8)}</span> — X = B × C ÷ A`, { copy: String(x) });
        tiles([['Ratio value A:B', fmt(a / b, 8)], ['Scale factor C ÷ A', fmt(c / a, 8)], ['Cross product B × C', fmt(b * c)]]);
      } else {
        const a = num(qs('#c-a', root)); const b = num(qs('#c-b', root)); const total = num(qs('#c-total', root));
        if (a === null || b === null || total === null) return ctx.setError('Fill in all three fields');
        const parts = a + b;
        if (parts === 0) return ctx.setError('The two terms cannot both be zero');
        const shareA = (total * a) / parts; const shareB = (total * b) / parts;
        ctx.setResult(`${fmt(shareA, 6)} : ${fmt(shareB, 6)}`, `<span class="mono">${fmt(total)}</span> split in the ratio <span class="mono">${fmt(a)} : ${fmt(b)}</span> (${fmt(parts)} parts)`, { copy: `${shareA} : ${shareB}` });
        tiles([
          ['Share A', fmt(shareA, 6)],
          ['Share B', fmt(shareB, 6)],
          ['One part', fmt(total / parts, 6)],
          ['A as % of total', `${fmt((a / parts) * 100, 3)}%`],
          ['B as % of total', `${fmt((b / parts) * 100, 3)}%`]
        ]);
      }
    };

    ctx.tabs((tab) => { mode = tab; calc(); });
    ctx.live(calc);
  }
};
