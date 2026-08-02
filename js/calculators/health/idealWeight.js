/** Ideal Body Weight — Devine, Robinson, Miller, Hamwi and BMI range. */
import { qs } from '../../utils/dom.js';
import { fmtFixed, fmt } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

const INCHES_OVER_5FT = (cm) => Math.max(0, cm / 2.54 - 60);

export const FORMULAS = {
  devine: (cm, male) => (male ? 50 : 45.5) + 2.3 * INCHES_OVER_5FT(cm),
  robinson: (cm, male) => (male ? 52 : 49) + (male ? 1.9 : 1.7) * INCHES_OVER_5FT(cm),
  miller: (cm, male) => (male ? 56.2 : 53.1) + (male ? 1.41 : 1.36) * INCHES_OVER_5FT(cm),
  hamwi: (cm, male) => (male ? 48 : 45.5) + (male ? 2.7 : 2.2) * INCHES_OVER_5FT(cm)
};

export default {
  resultLabel: 'Ideal body weight',
  how: `
    <p>Every classical IBW formula has the same shape: a base weight for a five-foot frame, plus a
    fixed number of kilograms for each inch above that.</p>
    <code class="formula">Devine (1974)    men 50.0 kg + 2.30 kg/inch    women 45.5 kg + 2.30 kg/inch
Robinson (1983)  men 52.0 kg + 1.90 kg/inch    women 49.0 kg + 1.70 kg/inch
Miller (1983)    men 56.2 kg + 1.41 kg/inch    women 53.1 kg + 1.36 kg/inch
Hamwi (1964)     men 48.0 kg + 2.70 kg/inch    women 45.5 kg + 2.20 kg/inch</code>
    <h4>Where they came from</h4>
    <p>Devine's equation was invented to calculate drug doses, not to describe beauty or health, and
    the others are refinements fitted to different population data. That is why they disagree by
    several kilograms — there is no single "ideal" weight, only a plausible band.</p>
    <h4>Frame size</h4>
    <p>Skeletal build shifts the target by roughly ±10%: subtract 10% for a small frame, add 10% for
    a large one. The classic wrist test — measure your wrist circumference and compare it to your
    height — is what the optional adjustment below approximates.</p>
    <h4>The healthier comparison</h4>
    <p>The BMI-based range (18.5–24.9 × height²) is a wider and more defensible target than any
    single formula, so it is shown alongside. If your weight sits inside that band, you are within
    the healthy range regardless of what the point estimates say.</p>`,

  body: () => `
    <div class="grid grid-3">
      <div class="field">
        <label for="sex">Sex</label>
        <select id="sex"><option value="male">Male</option><option value="female">Female</option></select>
      </div>
      <div class="field"><label for="cm">Height (cm)</label><input type="number" id="cm" value="175" min="120" max="250" step="any"></div>
      <div class="field">
        <label for="frame">Body frame</label>
        <select id="frame">
          <option value="0.9">Small (−10%)</option>
          <option value="1" selected>Medium</option>
          <option value="1.1">Large (+10%)</option>
        </select>
      </div>
    </div>
    <div class="field"><label for="current">Current weight (kg, optional)</label><input type="number" id="current" min="0" step="any" placeholder="e.g. 80"></div>
    <div class="stat-grid mt-4" id="ibw-stats"></div>`,

  init(root, ctx) {
    const el = (id) => qs(`#${id}`, root);

    const calc = () => {
      if (!isNumber(el('cm').value)) return ctx.setError('Enter your height');
      const cm = Number(el('cm').value);
      const male = el('sex').value === 'male';
      const frame = Number(el('frame').value);
      const current = Number(el('current').value);
      if (cm < 120 || cm > 250) return ctx.setError('Height should be between 120 and 250 cm');

      const results = Object.entries(FORMULAS).map(([name, fn]) => [name, fn(cm, male) * frame]);
      const average = results.reduce((a, [, v]) => a + v, 0) / results.length;
      const metres = cm / 100;
      const bmiMin = 18.5 * metres * metres;
      const bmiMax = 24.9 * metres * metres;

      ctx.setResult(`${fmtFixed(average, 1)} kg`,
        `Average of four formulas · healthy BMI range <span class="mono">${fmtFixed(bmiMin, 1)}–${fmtFixed(bmiMax, 1)} kg</span>${isNumber(current) ? ` · you are <span class="mono">${fmtFixed(Math.abs(current - average), 1)} kg</span> ${current > average ? 'above' : 'below'}` : ''}`,
        { copy: average.toFixed(1) });

      qs('#ibw-stats', root).innerHTML = [
        ['Devine', `${fmtFixed(results[0][1], 1)} kg`],
        ['Robinson', `${fmtFixed(results[1][1], 1)} kg`],
        ['Miller', `${fmtFixed(results[2][1], 1)} kg`],
        ['Hamwi', `${fmtFixed(results[3][1], 1)} kg`],
        ['Average', `${fmtFixed(average, 1)} kg`],
        ['In pounds', `${fmtFixed(average / 0.45359237, 1)} lb`],
        ['Healthy BMI range', `${fmtFixed(bmiMin, 1)} – ${fmtFixed(bmiMax, 1)} kg`],
        ['Current BMI', isNumber(current) ? fmt(current / (metres * metres), 2) : '—'],
        ['Difference to target', isNumber(current) ? `${current > average ? '−' : '+'}${fmtFixed(Math.abs(current - average), 1)} kg` : '—']
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');
    };

    ctx.live(calc);
  }
};
