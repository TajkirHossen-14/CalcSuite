/** GPA Calculator — dynamic course rows with a live weighted average. */
import { qs, qsa, on, createEl } from '../../utils/dom.js';
import { fmt } from '../../utils/format.js';
import * as storage from '../../utils/storage.js';

/**
 * Letter grades in descending order of grade points. This 4.00 scale moves in
 * 0.25 steps and deliberately has no C− or D+ — it is the scale used across
 * Bangladeshi universities and many other South Asian institutions.
 */
const SCALE = [
  ['A+', 4.00], ['A', 3.75], ['A-', 3.50], ['B+', 3.25], ['B', 3.00],
  ['B-', 2.75], ['C+', 2.50], ['C', 2.25], ['D', 2.00], ['F', 0.00]
];

const POINTS = SCALE.map(([, points]) => points);
const TOP = POINTS[0];

/**
 * Snaps any grade-point figure onto the scale. Guards two cases: rows restored
 * from an older saved term (which may hold points this scale no longer offers,
 * e.g. 3.7) and float noise — without this the <select> would silently fall
 * back to the first option and quietly show the wrong grade.
 */
const snap = (value) => {
  // Number(null) and Number('') are both 0, which would snap a *missing* grade
  // to F and silently fail a course the user never graded. Treat blanks as unset.
  if (value === null || value === undefined || value === '') return TOP;
  const v = Number(value);
  if (!Number.isFinite(v)) return TOP;
  return POINTS.reduce((best, p) => (Math.abs(p - v) < Math.abs(best - v) ? p : best), TOP);
};

/** Highest letter whose grade points the GPA reaches; SCALE is descending. */
const letterFor = (gpa) => (SCALE.find(([, points]) => gpa >= points - 1e-9) || SCALE[SCALE.length - 1])[0];

const rowHTML = (name = '', credits = 3, grade = TOP) => `
  <tr class="gpa-row">
    <td><input type="text" class="c-name" value="${name}" placeholder="Course name" aria-label="Course name"></td>
    <td><input type="number" class="c-credits" value="${credits}" min="0" max="30" step="0.5" aria-label="Credit hours"></td>
    <td>
      <select class="c-grade" aria-label="Grade">
        ${SCALE.map(([label, points]) => `<option value="${points}"${points === snap(grade) ? ' selected' : ''}>${label} (${points.toFixed(2)})</option>`).join('')}
      </select>
    </td>
    <td class="num c-points">—</td>
    <td><button class="icon-btn js-remove" type="button" title="Remove course"><i class="fa-solid fa-xmark"></i></button></td>
  </tr>`;

export default {
  resultLabel: 'Cumulative GPA',
  how: `
    <p>A grade point average is a <em>weighted</em> mean: each course counts in proportion to its
    credit hours, so a five-credit failure hurts far more than a one-credit one.</p>
    <code class="formula">quality points = grade points × credit hours
GPA = Σ(quality points) / Σ(credit hours)</code>
    <h4>Worked example</h4>
    <p>An A+ (4.00) in a 4-credit course and a C (2.25) in a 2-credit course give
    (4×4.00 + 2×2.25) ÷ (4 + 2) = 20.5 ÷ 6 = <strong>3.42</strong> — not 3.13, which is what a plain
    average of the two grades would wrongly suggest.</p>
    <h4>The grading scale used here</h4>
    <p>This tool uses the 4.00 scale that moves in quarter-point steps, standard at Bangladeshi
    universities and widely used across South Asia. Note that it has <strong>no C− and no D+</strong>:
    below C (2.25) the next step down is D (2.00), and anything lower is F.</p>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Letter</th><th class="num">Grade points</th></tr></thead>
        <tbody>
          ${SCALE.map(([label, points]) => `<tr><td><strong>${label}</strong></td><td class="num mono">${points.toFixed(2)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p>Scales differ between institutions — some award 4.30 for an A+, and weighted high-school
    scales push honours courses to 5.00. Check your registrar's table before quoting a number
    officially.</p>
    <h4>Prior credits</h4>
    <p>Enter your existing GPA and total credits to fold this term into a cumulative figure. The
    tool converts your history back into quality points, adds the new term, and re-divides.</p>`,

  body: () => `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Course</th><th>Credits</th><th>Grade</th><th>Quality pts</th><th></th></tr></thead>
        <tbody id="gpa-rows">
          ${rowHTML('Mathematics', 4, 4.00)}
          ${rowHTML('Physics', 3, 3.25)}
          ${rowHTML('Literature', 2, 3.50)}
        </tbody>
      </table>
    </div>
    <div class="row mt-3">
      <button class="btn btn-sm" id="add-row" type="button"><i class="fa-solid fa-plus"></i> Add course</button>
      <button class="btn btn-sm" id="clear-rows" type="button"><i class="fa-regular fa-trash-can"></i> Clear all</button>
      <button class="btn btn-sm" id="save-rows" type="button"><i class="fa-regular fa-bookmark"></i> Save</button>
      <span class="field-hint" id="save-note"></span>
    </div>
    <hr class="divider">
    <div class="grid grid-2">
      <div class="field"><label for="prev-gpa">Previous cumulative GPA (optional)</label><input type="number" id="prev-gpa" min="0" max="4" step="0.01" placeholder="3.42"></div>
      <div class="field"><label for="prev-credits">Credits already earned</label><input type="number" id="prev-credits" min="0" step="0.5" placeholder="60"></div>
    </div>
    <div class="stat-grid mt-4" id="gpa-stats"></div>`,

  init(root, ctx) {
    const body = qs('#gpa-rows', root);

    const calc = () => {
      let credits = 0; let points = 0;
      qsa('.gpa-row', root).forEach((row) => {
        const c = Number(qs('.c-credits', row).value) || 0;
        const g = Number(qs('.c-grade', row).value) || 0;
        credits += c;
        points += c * g;
        qs('.c-points', row).textContent = fmt(c * g, 2);
      });

      if (credits === 0) { ctx.setError('Add at least one course with credit hours'); qs('#gpa-stats', root).innerHTML = ''; return; }
      const termGpa = points / credits;

      const prevGpa = Number(qs('#prev-gpa', root).value);
      const prevCredits = Number(qs('#prev-credits', root).value);
      const hasPrior = prevGpa > 0 && prevCredits > 0;
      const cumulative = hasPrior
        ? (prevGpa * prevCredits + points) / (prevCredits + credits)
        : termGpa;

      ctx.setResult(fmt(cumulative, 3),
        `${hasPrior ? 'Cumulative' : 'Term'} GPA from <span class="mono">${fmt(credits)}</span> credits and <span class="mono">${fmt(points, 2)}</span> quality points`,
        { copy: cumulative.toFixed(2) });

      qs('#gpa-stats', root).innerHTML = [
        ['Term GPA', fmt(termGpa, 3)],
        ['Cumulative GPA', fmt(cumulative, 3)],
        ['Credits this term', fmt(credits)],
        ['Quality points', fmt(points, 2)],
        ['Total credits', fmt(credits + (hasPrior ? prevCredits : 0))],
        ['Equivalent letter', letterFor(cumulative)],
        ['Out of 4.00', `${fmt((cumulative / TOP) * 100, 1)}%`],
        ['Honours (≥3.50)', cumulative >= 3.5 ? 'Yes' : 'Not yet']
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');
    };

    on(qs('#add-row', root), 'click', () => {
      body.insertAdjacentHTML('beforeend', rowHTML('', 3, TOP));
      calc();
    });
    on(root, 'click', '.js-remove', (event, btn) => {
      const rows = qsa('.gpa-row', root);
      if (rows.length <= 1) { btn.closest('tr').querySelector('.c-name').value = ''; return; }
      btn.closest('tr').remove();
      calc();
    });
    on(qs('#clear-rows', root), 'click', () => { body.innerHTML = rowHTML('', 3, TOP); calc(); });
    on(qs('#save-rows', root), 'click', () => {
      const rows = qsa('.gpa-row', root).map((row) => ({
        name: qs('.c-name', row).value,
        credits: qs('.c-credits', row).value,
        grade: Number(qs('.c-grade', row).value)
      }));
      storage.set('gpa:rows', rows);
      qs('#save-note', root).textContent = 'Saved to this browser.';
    });

    const saved = storage.get('gpa:rows', null);
    if (Array.isArray(saved) && saved.length) {
      body.innerHTML = saved.map((r) => rowHTML(r.name, r.credits, r.grade)).join('');
    }

    ctx.live(calc);
  }
};
