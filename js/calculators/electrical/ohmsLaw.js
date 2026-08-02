/**
 * Ohm's Law Calculator — enter any two of voltage, current and resistance and
 * the third is solved instantly. Power is reported as a bonus fourth quantity.
 */
import { qs, qsa, on } from '../../utils/dom.js';
import { fmt, toSignificant } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

/** SI multipliers offered next to each field. */
const SCALES = {
  v: [['1e-3', 'mV'], ['1', 'V'], ['1e3', 'kV']],
  i: [['1e-6', 'µA'], ['1e-3', 'mA'], ['1', 'A']],
  r: [['1', 'Ω'], ['1e3', 'kΩ'], ['1e6', 'MΩ']]
};

/** Format a value with an automatic engineering prefix. */
export function engineering(value, unit) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const steps = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n']];
  const [div, prefix] = steps.find(([d]) => abs >= d) || [1e-9, 'n'];
  return `${toSignificant(value / div, 5)} ${prefix}${unit}`;
}

/* Which entry of SCALES[key] starts selected — the plain SI unit in each case. */
const DEFAULT_SCALE = { v: 1, i: 2, r: 0 };

const scaleSelect = (id, key) => `
  <select class="unit-select" id="${id}" aria-label="Unit">
    ${SCALES[key].map(([value, label], index) => `<option value="${value}"${index === DEFAULT_SCALE[key] ? ' selected' : ''}>${label}</option>`).join('')}
  </select>`;

export default {
  resultLabel: 'Solved quantity',
  how: `
    <p>Ohm's law is the single most useful relationship in electronics. Georg Ohm published it in
    1827: through a resistive conductor, current is proportional to voltage.</p>
    <code class="formula">V = I × R      I = V ÷ R      R = V ÷ I</code>
    <p>Leave exactly one field empty and it is solved from the other two. Fill all three and the
    tool checks them for consistency instead, which is a fast way to spot a measurement error on the
    bench.</p>
    <h4>Power comes free</h4>
    <p>Combining Ohm's law with P = V × I gives the two substituted forms, so the power dissipated
    is always known once any two quantities are:</p>
    <code class="formula">P = V × I = I² × R = V² ÷ R</code>
    <p>That is the number that matters when choosing a resistor: a 220 Ω resistor across 12 V burns
    0.65 W and will cook a quarter-watt part.</p>
    <h4>Where it stops working</h4>
    <p>Ohm's law describes <em>ohmic</em> components — resistors, wire, heating elements — under
    steady conditions. Diodes, LEDs and transistors are non-linear and do not obey it. In AC
    circuits, resistance generalises to impedance, and the reactive part of that impedance is not
    captured here.</p>`,

  body: () => `
    <p class="field-hint mb-3">Fill in any two boxes — leave the one you want to find blank.</p>
    <div class="grid grid-3">
      <div class="field">
        <label for="v">Voltage (V)</label>
        <div class="input-group"><input type="number" id="v" step="any" value="12" placeholder="e.g. 12">${scaleSelect('v-scale', 'v')}</div>
      </div>
      <div class="field">
        <label for="i">Current (I)</label>
        <div class="input-group"><input type="number" id="i" step="any" placeholder="e.g. 250">${scaleSelect('i-scale', 'i')}</div>
      </div>
      <div class="field">
        <label for="r">Resistance (R)</label>
        <div class="input-group"><input type="number" id="r" step="any" value="470">${scaleSelect('r-scale', 'r')}</div>
      </div>
    </div>
    <div class="row mt-3">
      <button class="btn btn-sm" id="clear-all" type="button"><i class="fa-regular fa-circle-xmark"></i> Clear</button>
      <button class="btn btn-sm" data-example="5,,220" type="button">LED example</button>
      <button class="btn btn-sm" data-example="230,,60" type="button">Mains heater</button>
      <button class="btn btn-sm" data-example="3.7,0.5," type="button">Li-ion load</button>
    </div>
    <div id="ohm-note" class="mt-3"></div>
    <div class="stat-grid mt-3" id="ohm-stats"></div>`,

  init(root, ctx) {
    const read = (id, scaleId) => {
      const raw = qs(`#${id}`, root).value.trim();
      if (raw === '' || !isNumber(raw)) return NaN;
      return Number(raw) * Number(qs(`#${scaleId}`, root).value);
    };

    const calc = () => {
      let V = read('v', 'v-scale');
      let I = read('i', 'i-scale');
      let R = read('r', 'r-scale');

      const known = [V, I, R].filter(Number.isFinite).length;
      const note = qs('#ohm-note', root);

      if (known < 2) {
        note.innerHTML = '';
        qs('#ohm-stats', root).innerHTML = '';
        return ctx.setError('Enter any two of voltage, current and resistance');
      }

      let solvedFor = '';
      if (known === 2) {
        if (!Number.isFinite(V)) { V = I * R; solvedFor = 'Voltage'; }
        else if (!Number.isFinite(I)) {
          if (R === 0) return ctx.setError('Resistance of zero would mean infinite current');
          I = V / R; solvedFor = 'Current';
        } else {
          if (I === 0) return ctx.setError('Current of zero would mean infinite resistance');
          R = V / I; solvedFor = 'Resistance';
        }
        note.innerHTML = '';
      } else {
        const expected = I * R;
        const off = Math.abs(expected - V) / (Math.abs(V) || 1);
        solvedFor = 'Check';
        note.innerHTML = off < 0.005
          ? '<div class="alert alert-success"><i class="fa-solid fa-circle-check"></i><span>All three values are consistent with V = I × R.</span></div>'
          : `<div class="alert alert-warning"><i class="fa-solid fa-triangle-exclamation"></i><span>These do not agree: I × R gives <strong>${engineering(expected, 'V')}</strong>, but you entered <strong>${engineering(V, 'V')}</strong>. Clear one field to solve for it.</span></div>`;
      }

      const P = V * I;
      const unit = solvedFor === 'Voltage' ? engineering(V, 'V') : solvedFor === 'Current' ? engineering(I, 'A') : solvedFor === 'Resistance' ? engineering(R, 'Ω') : engineering(P, 'W');

      ctx.setResult(unit,
        `V = <span class="mono">${engineering(V, 'V')}</span> · I = <span class="mono">${engineering(I, 'A')}</span> · R = <span class="mono">${engineering(R, 'Ω')}</span> · P = <span class="mono">${engineering(P, 'W')}</span>`,
        { copy: unit });

      qs('#ohm-stats', root).innerHTML = [
        ['Voltage', engineering(V, 'V')],
        ['Current', engineering(I, 'A')],
        ['Resistance', engineering(R, 'Ω')],
        ['Power', engineering(P, 'W')],
        ['P = I²R', engineering(I * I * R, 'W')],
        ['P = V²/R', R ? engineering((V * V) / R, 'W') : '—'],
        ['Energy in 1 hour', `${fmt(P / 1000, 4)} kWh`],
        ['Suggested resistor rating', `${toSignificant(Math.max(0.125, P * 2), 3)} W or higher`]
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');
    };

    on(qs('#clear-all', root), 'click', () => {
      qsa('input[type="number"]', root).forEach((el) => { el.value = ''; });
      calc();
    });

    on(root, 'click', '[data-example]', (e, btn) => {
      const [v, i, r] = btn.dataset.example.split(',');
      qs('#v', root).value = v;
      qs('#i', root).value = i;
      qs('#r', root).value = r;
      qs('#v-scale', root).value = '1';
      qs('#i-scale', root).value = '1';
      qs('#r-scale', root).value = '1';
      calc();
    });

    ctx.live(calc);
  }
};
