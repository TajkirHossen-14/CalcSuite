/** BMI Calculator — metric/imperial, colour-coded category. */
import { qs } from '../../utils/dom.js';
import { fmt, fmtFixed } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

export const CATEGORIES = [
  { max: 16, name: 'Severe thinness', tone: 'danger' },
  { max: 17, name: 'Moderate thinness', tone: 'warning' },
  { max: 18.5, name: 'Mild thinness', tone: 'warning' },
  { max: 25, name: 'Healthy weight', tone: 'success' },
  { max: 30, name: 'Overweight', tone: 'warning' },
  { max: 35, name: 'Obese class I', tone: 'danger' },
  { max: 40, name: 'Obese class II', tone: 'danger' },
  { max: Infinity, name: 'Obese class III', tone: 'danger' }
];

export const bmiOf = (kg, m) => kg / (m * m);
export const categoryOf = (bmi) => CATEGORIES.find((c) => bmi < c.max);

export default {
  resultLabel: 'Body mass index',
  how: `
    <p>BMI compares your mass to the square of your height, giving a single number that is
    independent of the units you measured in.</p>
    <code class="formula">Metric    BMI = kg / m²
Imperial  BMI = 703 × lb / in²      (703 converts the units)</code>
    <h4>What the bands mean</h4>
    <p>The World Health Organization bands are: under 18.5 underweight, 18.5–24.9 healthy,
    25–29.9 overweight, 30 and above obese. They describe populations, not individuals.</p>
    <h4>Why the square?</h4>
    <p>Body mass scales roughly with volume (height cubed), but humans get wider as well as taller
    in a way that lands closer to height squared in practice. That approximation is why BMI
    systematically over-rates tall people and under-rates short ones — an acknowledged flaw of the
    index since Quetelet devised it in the 1830s.</p>
    <h4>Its real limits</h4>
    <p>BMI cannot tell muscle from fat, ignores where fat is stored, and was derived from European
    adults, so it is a screening signal only. A muscular athlete can score "obese" while being
    perfectly healthy. Waist-to-height ratio — keep your waist under half your height — is a useful
    companion measure, so it's shown alongside.</p>`,

  body: () => `
    <div class="tabs" role="tablist">
      <button class="tab is-active" data-tab="metric" type="button">Metric</button>
      <button class="tab" data-tab="imperial" type="button">Imperial</button>
    </div>

    <div class="tab-panel" data-panel="metric">
      <div class="grid grid-2 keep">
        <div class="field"><label for="kg">Weight (kg)</label><input type="number" id="kg" value="72" min="1" step="any"></div>
        <div class="field"><label for="cm">Height (cm)</label><input type="number" id="cm" value="175" min="30" step="any"></div>
      </div>
      <div class="field"><label for="waist-cm">Waist (cm, optional)</label><input type="number" id="waist-cm" min="0" step="any" placeholder="e.g. 84"></div>
    </div>

    <div class="tab-panel" data-panel="imperial" hidden>
      <div class="grid grid-3">
        <div class="field"><label for="lb">Weight (lb)</label><input type="number" id="lb" value="160" min="1" step="any"></div>
        <div class="field"><label for="ft">Height (ft)</label><input type="number" id="ft" value="5" min="1" step="1"></div>
        <div class="field"><label for="inch">Height (in)</label><input type="number" id="inch" value="9" min="0" max="11" step="any"></div>
      </div>
      <div class="field"><label for="waist-in">Waist (in, optional)</label><input type="number" id="waist-in" min="0" step="any" placeholder="e.g. 33"></div>
    </div>

    <div id="bmi-scale" class="mt-3"></div>
    <div class="stat-grid mt-4" id="bmi-stats"></div>`,

  init(root, ctx) {
    let metric = true;
    const el = (id) => qs(`#${id}`, root);

    const calc = () => {
      let kg; let metres; let waistCm;
      if (metric) {
        if (!isNumber(el('kg').value) || !isNumber(el('cm').value)) return ctx.setError('Enter weight and height');
        kg = Number(el('kg').value);
        metres = Number(el('cm').value) / 100;
        waistCm = Number(el('waist-cm').value) || 0;
      } else {
        if (!isNumber(el('lb').value) || !isNumber(el('ft').value)) return ctx.setError('Enter weight and height');
        kg = Number(el('lb').value) * 0.45359237;
        metres = (Number(el('ft').value) * 12 + (Number(el('inch').value) || 0)) * 0.0254;
        waistCm = (Number(el('waist-in').value) || 0) * 2.54;
      }
      if (kg <= 0 || metres <= 0) return ctx.setError('Values must be greater than zero');

      const bmi = bmiOf(kg, metres);
      const category = categoryOf(bmi);
      const healthyMin = 18.5 * metres * metres;
      const healthyMax = 24.9 * metres * metres;

      ctx.setResult(fmt(bmi, 2),
        `<span class="badge badge-${category.tone}">${category.name}</span> · healthy range for your height is <span class="mono">${fmtFixed(healthyMin, 1)}–${fmtFixed(healthyMax, 1)} kg</span>`,
        { copy: bmi.toFixed(1) });

      const pos = Math.max(0, Math.min(100, ((bmi - 12) / 30) * 100));
      qs('#bmi-scale', root).innerHTML = `
        <div style="position:relative;height:14px;border-radius:999px;overflow:hidden;background:linear-gradient(90deg,#58b6ff 0%,#35d07f 22%,#35d07f 43%,#ffb84d 60%,#ff6b6b 100%)">
          <div style="position:absolute;left:${pos}%;top:-3px;width:4px;height:20px;background:var(--text);border-radius:2px;transform:translateX(-2px);transition:left var(--t-mid)"></div>
        </div>
        <div class="row" style="justify-content:space-between;font-size:var(--fs-xs);color:var(--text-faint);margin-top:.25rem">
          <span>12</span><span>18.5</span><span>25</span><span>30</span><span>42</span>
        </div>`;

      qs('#bmi-stats', root).innerHTML = [
        ['Category', category.name],
        ['Healthy weight range', `${fmtFixed(healthyMin, 1)} – ${fmtFixed(healthyMax, 1)} kg`],
        ['In pounds', `${fmtFixed(healthyMin / 0.45359237, 1)} – ${fmtFixed(healthyMax / 0.45359237, 1)} lb`],
        ['Difference to healthy', bmi < 18.5 ? `${fmtFixed(healthyMin - kg, 1)} kg to gain` : bmi > 24.9 ? `${fmtFixed(kg - healthyMax, 1)} kg to lose` : 'Already in range'],
        ['BMI prime', fmt(bmi / 25, 3)],
        ['Ponderal index', `${fmt(kg / metres ** 3, 2)} kg/m³`],
        ['Waist-to-height', waistCm ? fmt(waistCm / (metres * 100), 3) : '—'],
        ['Waist verdict', waistCm ? (waistCm / (metres * 100) < 0.5 ? 'Within guidance (<0.5)' : 'Above guidance') : '—']
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');
    };

    ctx.tabs((tab) => { metric = tab === 'metric'; calc(); });
    ctx.live(calc);
  }
};
