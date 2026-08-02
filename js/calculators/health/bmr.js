/** BMR & Daily Calorie Needs — Mifflin–St Jeor with activity multipliers. */
import { qs } from '../../utils/dom.js';
import { fmt, fmtFixed } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

const ACTIVITY = [
  ['1.2', 'Sedentary — desk job, little exercise'],
  ['1.375', 'Lightly active — 1–3 sessions a week'],
  ['1.55', 'Moderately active — 3–5 sessions a week'],
  ['1.725', 'Very active — 6–7 sessions a week'],
  ['1.9', 'Extra active — physical job or twice-daily training']
];

export const mifflin = (kg, cm, age, male) => 10 * kg + 6.25 * cm - 5 * age + (male ? 5 : -161);
export const harris = (kg, cm, age, male) => (male
  ? 88.362 + 13.397 * kg + 4.799 * cm - 5.677 * age
  : 447.593 + 9.247 * kg + 3.098 * cm - 4.330 * age);
export const katch = (kg, bodyFat) => 370 + 21.6 * (kg * (1 - bodyFat / 100));

export default {
  resultLabel: 'Daily calories (TDEE)',
  how: `
    <p>Basal metabolic rate is the energy your body burns doing nothing at all — breathing,
    circulation, brain activity, keeping warm. It is typically 60–70% of everything you spend in a day.</p>
    <code class="formula">Mifflin–St Jeor (the current standard)
  men    BMR = 10·kg + 6.25·cm − 5·age + 5
  women  BMR = 10·kg + 6.25·cm − 5·age − 161

TDEE = BMR × activity multiplier</code>
    <h4>Which formula?</h4>
    <p>Mifflin–St Jeor (1990) is used by default because it predicts measured rates more accurately
    than the older Harris–Benedict equation for modern populations. Both are shown for comparison.
    If you know your body-fat percentage, the Katch–McArdle formula is usually the most accurate of
    all, because it works from lean mass rather than total weight — muscle burns energy at rest,
    fat barely does.</p>
    <h4>Activity multipliers are estimates</h4>
    <p>The 1.2–1.9 scale is a coarse approximation and individual variation is large. Treat the TDEE
    as a starting point: track your weight for two or three weeks and adjust by 100–200 kcal until
    it moves the way you want.</p>
    <h4>Weight change targets</h4>
    <p>One kilogram of body fat stores roughly 7,700 kcal, so a 500 kcal daily deficit trends toward
    about 0.45 kg a week. The panel converts your TDEE into cut and bulk targets on that basis.</p>`,

  body: () => `
    <div class="grid grid-4 keep">
      <div class="field">
        <label for="sex">Sex</label>
        <select id="sex"><option value="male">Male</option><option value="female">Female</option></select>
      </div>
      <div class="field"><label for="age">Age (years)</label><input type="number" id="age" value="30" min="1" max="120" step="1"></div>
      <div class="field"><label for="kg">Weight (kg)</label><input type="number" id="kg" value="72" min="1" step="any"></div>
      <div class="field"><label for="cm">Height (cm)</label><input type="number" id="cm" value="175" min="30" step="any"></div>
    </div>
    <div class="grid grid-2">
      <div class="field">
        <label for="activity">Activity level</label>
        <select id="activity">${ACTIVITY.map(([v, l], i) => `<option value="${v}"${i === 2 ? ' selected' : ''}>${l}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label for="bodyfat">Body fat % (optional — enables Katch–McArdle)</label>
        <input type="number" id="bodyfat" min="3" max="60" step="any" placeholder="e.g. 18">
      </div>
    </div>
    <div class="stat-grid mt-4" id="bmr-stats"></div>
    <div class="table-wrap mt-4" id="activity-table"></div>`,

  init(root, ctx) {
    const el = (id) => qs(`#${id}`, root);

    const calc = () => {
      if (!['age', 'kg', 'cm'].every((id) => isNumber(el(id).value))) return ctx.setError('Fill in age, weight and height');
      const male = el('sex').value === 'male';
      const age = Number(el('age').value);
      const kg = Number(el('kg').value);
      const cm = Number(el('cm').value);
      const multiplier = Number(el('activity').value);
      const bodyFat = Number(el('bodyfat').value);

      if (age <= 0 || kg <= 0 || cm <= 0) return ctx.setError('Values must be greater than zero');

      const bmr = mifflin(kg, cm, age, male);
      const tdee = bmr * multiplier;
      const hb = harris(kg, cm, age, male);
      const km = isNumber(bodyFat) && bodyFat > 0 && bodyFat < 70 ? katch(kg, bodyFat) : null;

      ctx.setResult(`${fmtFixed(tdee, 0)} kcal`,
        `BMR <span class="mono">${fmtFixed(bmr, 0)} kcal</span> × activity <span class="mono">${multiplier}</span>`,
        { copy: tdee.toFixed(0) });

      qs('#bmr-stats', root).innerHTML = [
        ['BMR (Mifflin–St Jeor)', `${fmtFixed(bmr, 0)} kcal`],
        ['BMR (Harris–Benedict)', `${fmtFixed(hb, 0)} kcal`],
        ['BMR (Katch–McArdle)', km ? `${fmtFixed(km, 0)} kcal` : 'add body fat %'],
        ['Maintenance (TDEE)', `${fmtFixed(tdee, 0)} kcal`],
        ['Mild cut (−250)', `${fmtFixed(tdee - 250, 0)} kcal`],
        ['Standard cut (−500)', `${fmtFixed(tdee - 500, 0)} kcal`],
        ['Lean bulk (+300)', `${fmtFixed(tdee + 300, 0)} kcal`],
        ['Protein target (1.6 g/kg)', `${fmtFixed(kg * 1.6, 0)} g`],
        ['Water guide (35 ml/kg)', `${fmtFixed((kg * 35) / 1000, 1)} L`],
        ['Weekly loss at −500', '≈ 0.45 kg']
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');

      qs('#activity-table', root).innerHTML = `
        <table class="data-table">
          <thead><tr><th>Activity level</th><th>Multiplier</th><th>Daily calories</th></tr></thead>
          <tbody>${ACTIVITY.map(([v, l]) => `
            <tr${Number(v) === multiplier ? ' style="background:var(--primary-soft)"' : ''}>
              <td>${l}</td><td class="num">${v}</td><td class="num">${fmtFixed(bmr * Number(v), 0)} kcal</td>
            </tr>`).join('')}</tbody>
        </table>`;
    };

    ctx.live(calc);
  }
};
