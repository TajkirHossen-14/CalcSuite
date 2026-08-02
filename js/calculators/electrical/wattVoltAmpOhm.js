/**
 * Watt–Volt–Amp–Ohm — the full power wheel. Any two of the four quantities
 * determine the other two, giving twelve distinct formulas in one tool.
 */
import { qs, qsa, on } from '../../utils/dom.js';
import { toSignificant } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';
import { engineering } from './ohmsLaw.js';

const LABELS = { p: 'Power (W)', v: 'Voltage (V)', i: 'Current (A)', r: 'Resistance (Ω)' };
/* Open on a worked example (a 60 W bulb on mains) so the page is live immediately. */
const DEFAULTS = { p: '60', v: '230', i: '', r: '' };
const UNITS = { p: 'W', v: 'V', i: 'A', r: 'Ω' };

/**
 * Solve the wheel from exactly two knowns.
 * Returns { p, v, i, r, used } or null when the pair is unsolvable.
 */
export function solveWheel(known) {
  const has = (k) => Number.isFinite(known[k]);
  let { p, v, i, r } = known;
  let used = '';

  if (has('v') && has('i')) { p = v * i; r = i === 0 ? NaN : v / i; used = 'P = V·I,  R = V/I'; }
  else if (has('v') && has('r')) { if (r === 0) return null; i = v / r; p = (v * v) / r; used = 'I = V/R,  P = V²/R'; }
  else if (has('v') && has('p')) { if (v === 0) return null; i = p / v; r = (v * v) / p; used = 'I = P/V,  R = V²/P'; }
  else if (has('i') && has('r')) { v = i * r; p = i * i * r; used = 'V = I·R,  P = I²R'; }
  else if (has('i') && has('p')) { if (i === 0) return null; v = p / i; r = p / (i * i); used = 'V = P/I,  R = P/I²'; }
  else if (has('p') && has('r')) { if (p < 0 || r < 0) return null; v = Math.sqrt(p * r); i = Math.sqrt(p / r); used = 'V = √(P·R),  I = √(P/R)'; }
  else return null;

  return { p, v, i, r, used };
}

export default {
  resultLabel: 'Power wheel',
  how: `
    <p>Four quantities — power, voltage, current and resistance — are linked by two independent
    equations, Ohm's law and the power law. Two independent equations pin down two unknowns, which
    is why <strong>any two knowns are always enough</strong>.</p>
    <code class="formula">P = V·I     P = I²·R     P = V²/R
V = I·R     V = P/I      V = √(P·R)
I = V/R     I = P/V      I = √(P/R)
R = V/I     R = V²/P     R = P/I²</code>
    <p>Those twelve expressions are the classic "power wheel" printed on engineering pocket cards.
    They are not twelve separate facts: each is an algebraic rearrangement of the same two rules.</p>
    <h4>The one asymmetry</h4>
    <p>Knowing power and resistance requires a square root, which loses the sign — the maths cannot
    tell whether the current flows one way or the other, only its magnitude. Every other pair is a
    plain multiplication or division.</p>
    <h4>Practical use</h4>
    <p>The wheel is how you size components. A 60 W bulb on 230 V draws 0.26 A and behaves like a
    882 Ω resistor when hot, so it needs nothing more than a 1 A fuse. Enter those two figures and
    the other two appear, along with the running cost of leaving it on.</p>`,

  body: () => `
    <p class="field-hint mb-3">Fill in exactly two boxes — the remaining two are calculated.</p>
    <div class="grid grid-4">
      ${Object.entries(LABELS).map(([k, label]) => `
        <div class="field">
          <label for="w-${k}">${label}</label>
          <input type="number" id="w-${k}" class="wheel-input" data-key="${k}" step="any"
                 value="${DEFAULTS[k]}" placeholder="—">
        </div>`).join('')}
    </div>
    <div class="row mt-3">
      <button class="btn btn-sm" id="wheel-clear" type="button"><i class="fa-regular fa-circle-xmark"></i> Clear</button>
      <button class="btn btn-sm" data-fill="v:230,p:60" type="button">60 W bulb</button>
      <button class="btn btn-sm" data-fill="v:12,r:4" type="button">12 V, 4 Ω</button>
      <button class="btn btn-sm" data-fill="i:2.5,r:100" type="button">2.5 A, 100 Ω</button>
      <span class="field-hint" id="formula-used"></span>
    </div>
    <div class="stat-grid mt-4" id="wheel-stats"></div>
    <div id="wheel-note" class="mt-3"></div>`,

  init(root, ctx) {
    const inputs = () => qsa('.wheel-input', root);

    const calc = () => {
      const known = {};
      let count = 0;
      inputs().forEach((el) => {
        const raw = el.value.trim();
        const ok = raw !== '' && isNumber(raw);
        known[el.dataset.key] = ok ? Number(raw) : NaN;
        if (ok) count += 1;
        el.classList.toggle('is-derived', false);
      });

      const note = qs('#wheel-note', root);
      const stats = qs('#wheel-stats', root);

      if (count < 2) {
        note.innerHTML = '';
        stats.innerHTML = '';
        qs('#formula-used', root).textContent = '';
        return ctx.setError('Enter any two values');
      }
      if (count > 2) {
        note.innerHTML = '<div class="alert alert-info"><i class="fa-solid fa-circle-info"></i><span>More than two values entered — the first two in P, V, I, R order are used and the rest are recalculated.</span></div>';
      } else {
        note.innerHTML = '';
      }

      // Keep only the first two knowns so the system stays determined.
      const order = ['p', 'v', 'i', 'r'].filter((k) => Number.isFinite(known[k])).slice(0, 2);
      const pair = { p: NaN, v: NaN, i: NaN, r: NaN };
      order.forEach((k) => { pair[k] = known[k]; });

      const solved = solveWheel(pair);
      if (!solved) return ctx.setError('That combination cannot be solved — check for zeros or negative values');

      const { p, v, i, r, used } = solved;
      if (![p, v, i, r].every(Number.isFinite)) return ctx.setError('That combination produced an undefined result');

      qs('#formula-used', root).textContent = `Using ${used}`;

      // Write the derived values back into the empty boxes.
      inputs().forEach((el) => {
        const k = el.dataset.key;
        if (order.includes(k)) return;
        el.value = Number(solved[k].toPrecision(6));
        el.classList.add('is-derived');
      });

      ctx.setResult(`${engineering(p, 'W')}`,
        `V = <span class="mono">${engineering(v, 'V')}</span> · I = <span class="mono">${engineering(i, 'A')}</span> · R = <span class="mono">${engineering(r, 'Ω')}</span>`,
        { copy: `P=${toSignificant(p, 6)}W V=${toSignificant(v, 6)}V I=${toSignificant(i, 6)}A R=${toSignificant(r, 6)}Ω` });

      stats.innerHTML = [
        ['Power', engineering(p, 'W')],
        ['Voltage', engineering(v, 'V')],
        ['Current', engineering(i, 'A')],
        ['Resistance', engineering(r, 'Ω')],
        ['Conductance', engineering(r ? 1 / r : NaN, 'S')],
        ['Energy per hour', `${toSignificant(p / 1000, 4)} kWh`],
        ['Energy per day', `${toSignificant((p * 24) / 1000, 4)} kWh`],
        ['Milliamps', `${toSignificant(i * 1000, 5)} mA`]
      ].map(([l, val]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${val}</div></div>`).join('');
    };

    on(qs('#wheel-clear', root), 'click', () => {
      inputs().forEach((el) => { el.value = ''; el.classList.remove('is-derived'); });
      calc();
    });

    on(root, 'click', '[data-fill]', (e, btn) => {
      inputs().forEach((el) => { el.value = ''; });
      btn.dataset.fill.split(',').forEach((pairText) => {
        const [k, val] = pairText.split(':');
        const field = qs(`#w-${k}`, root);
        if (field) field.value = val;
      });
      calc();
    });

    // Clearing a derived box should not immediately refill it mid-typing.
    on(root, 'focusin', '.wheel-input', (e, el) => el.classList.remove('is-derived'));

    ctx.live(calc, { debounceMs: 120 });
  }
};
