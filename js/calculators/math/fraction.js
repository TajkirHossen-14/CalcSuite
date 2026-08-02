/** Fraction Calculator — exact +, −, ×, ÷ and simplification. */
import { on, qs } from '../../utils/dom.js';
import { Fraction, gcd, lcm } from '../../core/Fraction.js';
import { fmt } from '../../utils/format.js';

export default {
  resultLabel: 'Result',
  how: `
    <p>Fractions are handled exactly — nothing is turned into a decimal along the way, so
    1/3 + 1/6 returns 1/2 rather than 0.5000000000000001.</p>
    <code class="formula">a/b + c/d = (a·d + c·b) / (b·d)
a/b − c/d = (a·d − c·b) / (b·d)
a/b × c/d = (a·c) / (b·d)
a/b ÷ c/d = (a·d) / (b·c)      — multiply by the reciprocal</code>
    <h4>Simplifying</h4>
    <p>Every result is reduced by dividing numerator and denominator by their greatest common
    divisor, found with the Euclidean algorithm (repeatedly replace the larger number with the
    remainder until one hits zero). The sign is normalised onto the numerator, so you'll never see
    something like 3/−4.</p>
    <h4>Input formats</h4>
    <p>Each operand accepts a simple fraction (<code>3/4</code>), a mixed number
    (<code>1 1/2</code>), a whole number (<code>5</code>) or a decimal (<code>0.75</code>), which is
    converted to its exact rational form first. Division by zero is caught and reported.</p>`,

  body: () => `
    <div class="row" style="gap:.75rem;align-items:flex-end;flex-wrap:wrap">
      <div class="field" style="flex:1 1 160px;margin:0">
        <label for="a">First fraction</label>
        <input type="text" id="a" value="3/4" class="mono" spellcheck="false" placeholder="3/4">
      </div>
      <div class="field" style="width:130px;margin:0">
        <label for="op">Operation</label>
        <select id="op">
          <option value="+">+ add</option>
          <option value="-">− subtract</option>
          <option value="*">× multiply</option>
          <option value="/">÷ divide</option>
        </select>
      </div>
      <div class="field" style="flex:1 1 160px;margin:0">
        <label for="b">Second fraction</label>
        <input type="text" id="b" value="5/6" class="mono" spellcheck="false" placeholder="5/6">
      </div>
      <button class="icon-btn" id="swap" type="button" title="Swap operands"><i class="fa-solid fa-right-left"></i></button>
    </div>
    <p class="field-error mt-3" id="frac-error"></p>
    <div class="stat-grid mt-4" id="frac-stats"></div>`,

  init(root, ctx) {
    const el = (id) => qs(`#${id}`, root);
    const err = el('frac-error');

    const calc = () => {
      const a = Fraction.parse(el('a').value);
      const b = Fraction.parse(el('b').value);
      if (!a || !b) {
        err.textContent = 'Use forms like 3/4, 1 1/2, 5 or 0.75.';
        ctx.setError('Invalid fraction');
        el('frac-stats').innerHTML = '';
        return;
      }
      err.textContent = '';
      const op = el('op').value;
      let result;
      try {
        result = op === '+' ? a.add(b) : op === '-' ? a.sub(b) : op === '*' ? a.mul(b) : a.div(b);
      } catch (error) { ctx.setError(error.message); return; }

      const symbol = { '+': '+', '-': '−', '*': '×', '/': '÷' }[op];
      ctx.setResult(result.toString(),
        `<span class="mono">${a.toString()} ${symbol} ${b.toString()}</span> = <span class="mono">${result.toString()}</span> = <span class="mono">${fmt(result.value, 10)}</span>`,
        { copy: result.toString() });

      el('frac-stats').innerHTML = [
        ['Mixed number', result.toMixed()],
        ['Decimal', fmt(result.value, 10)],
        ['Percentage', result.toPercent(4)],
        ['Reciprocal', result.n === 0 ? '—' : `${result.d}/${Math.abs(result.n)}`],
        ['Common denominator', lcm(a.d, b.d)],
        ['First simplified', a.toString()],
        ['Second simplified', b.toString()],
        ['GCD of denominators', gcd(a.d, b.d)]
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');
    };

    on(el('swap'), 'click', () => { [el('a').value, el('b').value] = [el('b').value, el('a').value]; calc(); });
    ctx.live(calc);
  }
};
