/** Quadratic Equation Solver — real and complex roots, vertex, factored form. */
import { qs } from '../../utils/dom.js';
import { fmt } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

export function solveQuadratic(a, b, c) {
  if (a === 0) {
    if (b === 0) return { type: c === 0 ? 'identity' : 'none' };
    return { type: 'linear', roots: [-c / b] };
  }
  const discriminant = b * b - 4 * a * c;
  const vertexX = -b / (2 * a);
  const vertexY = a * vertexX * vertexX + b * vertexX + c;
  const base = { a, b, c, discriminant, vertexX, vertexY, axis: vertexX, opens: a > 0 ? 'upwards' : 'downwards' };

  if (discriminant > 0) {
    const sq = Math.sqrt(discriminant);
    return { ...base, type: 'two-real', roots: [(-b + sq) / (2 * a), (-b - sq) / (2 * a)] };
  }
  if (discriminant === 0) return { ...base, type: 'one-real', roots: [vertexX] };
  const imag = Math.sqrt(-discriminant) / (2 * a);
  return { ...base, type: 'complex', real: vertexX, imag: Math.abs(imag) };
}

export default {
  resultLabel: 'Roots',
  how: `
    <p>Every quadratic <code>ax² + bx + c = 0</code> is solved by the same formula, obtained by
    completing the square on the general form:</p>
    <code class="formula">x = (−b ± √(b² − 4ac)) / 2a

Δ = b² − 4ac  is the discriminant
Δ > 0 → two distinct real roots (the parabola crosses the x-axis twice)
Δ = 0 → one repeated root (it touches the axis at the vertex)
Δ < 0 → two complex conjugate roots (it never touches the axis)</code>
    <h4>The vertex</h4>
    <p>The turning point sits at <code>x = −b / 2a</code> — exactly halfway between the roots,
    because the ± in the formula is symmetric about that value. Substituting it back gives the
    minimum (a &gt; 0) or maximum (a &lt; 0) value of the expression.</p>
    <h4>Complex roots</h4>
    <p>When Δ is negative the square root becomes imaginary, and the answers arrive as a conjugate
    pair <code>p ± qi</code>. They are shown here rather than hidden behind "no solution", because
    they matter in signal processing, control theory and AC circuit analysis.</p>
    <h4>Degenerate cases</h4>
    <p>If a = 0 the equation is not quadratic at all; it is solved as the linear equation
    <code>bx + c = 0</code>. If a and b are both zero the tool says so explicitly.</p>`,

  body: () => `
    <div class="row" style="align-items:flex-end;gap:.6rem;flex-wrap:wrap">
      <div class="field" style="flex:1 1 110px;margin:0"><label for="a">a</label><input type="number" id="a" value="1" step="any"></div>
      <span style="padding-bottom:.7rem" class="mono">x² +</span>
      <div class="field" style="flex:1 1 110px;margin:0"><label for="b">b</label><input type="number" id="b" value="-3" step="any"></div>
      <span style="padding-bottom:.7rem" class="mono">x +</span>
      <div class="field" style="flex:1 1 110px;margin:0"><label for="c">c</label><input type="number" id="c" value="-10" step="any"></div>
      <span style="padding-bottom:.7rem" class="mono">= 0</span>
    </div>
    <div class="chip-row mt-4">
      <button class="chip js-preset" type="button" data-a="1" data-b="-3" data-c="-10">Two real roots</button>
      <button class="chip js-preset" type="button" data-a="1" data-b="-4" data-c="4">Repeated root</button>
      <button class="chip js-preset" type="button" data-a="1" data-b="2" data-c="5">Complex roots</button>
      <button class="chip js-preset" type="button" data-a="0" data-b="2" data-c="-8">Linear (a = 0)</button>
    </div>
    <div class="stat-grid mt-4" id="q-stats"></div>`,

  init(root, ctx) {
    const el = (id) => qs(`#${id}`, root);
    const tiles = (list) => {
      qs('#q-stats', root).innerHTML = list
        .map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');
    };

    const calc = () => {
      if (![el('a'), el('b'), el('c')].every((i) => isNumber(i.value))) return ctx.setError('Enter a, b and c');
      const a = Number(el('a').value); const b = Number(el('b').value); const c = Number(el('c').value);
      const s = solveQuadratic(a, b, c);
      const equation = `${fmt(a)}x² ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}x ${c < 0 ? '−' : '+'} ${fmt(Math.abs(c))} = 0`;

      if (s.type === 'identity') { ctx.setResult('Every x is a solution', 'With a = b = c = 0 the equation is 0 = 0.'); tiles([]); return; }
      if (s.type === 'none') { ctx.setResult('No solution', 'With a = b = 0 and c ≠ 0 the equation is never true.'); tiles([]); return; }
      if (s.type === 'linear') {
        ctx.setResult(`x = ${fmt(s.roots[0], 8)}`, `Not quadratic (a = 0), solved as <span class="mono">${fmt(b)}x ${c < 0 ? '−' : '+'} ${fmt(Math.abs(c))} = 0</span>`, { copy: String(s.roots[0]) });
        tiles([['Type', 'Linear equation'], ['Root', fmt(s.roots[0], 8)]]);
        return;
      }

      if (s.type === 'complex') {
        const text = `x = ${fmt(s.real, 6)} ± ${fmt(s.imag, 6)}i`;
        ctx.setResult(text, `Δ = <span class="mono">${fmt(s.discriminant, 8)}</span> — negative, so the roots are a complex conjugate pair`, { copy: text });
      } else {
        const roots = s.roots.map((r) => fmt(r, 8));
        ctx.setResult(s.type === 'one-real' ? `x = ${roots[0]} (repeated)` : `x₁ = ${roots[0]}, x₂ = ${roots[1]}`,
          `<span class="mono">${equation}</span> · Δ = <span class="mono">${fmt(s.discriminant, 8)}</span>`,
          { copy: roots.join(', ') });
      }

      const factored = s.type === 'two-real'
        ? `${fmt(a)}(x ${s.roots[0] < 0 ? '+' : '−'} ${fmt(Math.abs(s.roots[0]), 5)})(x ${s.roots[1] < 0 ? '+' : '−'} ${fmt(Math.abs(s.roots[1]), 5)})`
        : s.type === 'one-real' ? `${fmt(a)}(x ${s.roots[0] < 0 ? '+' : '−'} ${fmt(Math.abs(s.roots[0]), 5)})²`
          : 'Not factorable over the reals';

      tiles([
        ['Discriminant Δ', fmt(s.discriminant, 8)],
        ['Nature of roots', s.type === 'two-real' ? 'Two distinct real' : s.type === 'one-real' ? 'One repeated real' : 'Complex conjugates'],
        ['Vertex', `(${fmt(s.vertexX, 6)}, ${fmt(s.vertexY, 6)})`],
        ['Axis of symmetry', `x = ${fmt(s.axis, 6)}`],
        ['Parabola opens', s.opens],
        ['Sum of roots (−b/a)', fmt(-b / a, 8)],
        ['Product of roots (c/a)', fmt(c / a, 8)],
        ['Factored form', factored],
        ['y-intercept', fmt(c)]
      ]);
    };

    root.addEventListener('click', (event) => {
      const chip = event.target.closest('.js-preset');
      if (!chip) return;
      el('a').value = chip.dataset.a; el('b').value = chip.dataset.b; el('c').value = chip.dataset.c;
      calc();
    });

    ctx.live(calc);
  }
};
