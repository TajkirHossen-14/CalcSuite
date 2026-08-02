/** GPA Calculator — dynamic course rows with a live weighted average. */
import { qs, qsa, on, createEl } from '../../utils/dom.js';
import { fmt } from '../../utils/format.js';
import * as storage from '../../utils/storage.js';

const SCALE = [
  ['A+', 4.0], ['A', 4.0], ['A−', 3.7], ['B+', 3.3], ['B', 3.0], ['B−', 2.7],
  ['C+', 2.3], ['C', 2.0], ['C−', 1.7], ['D+', 1.3], ['D', 1.0], ['F', 0.0]
];

const rowHTML = (name = '', credits = 3, grade = 4) => `
  <tr class="gpa-row">
    <td><input type="text" class="c-name" value="${name}" placeholder="Course name" aria-label="Course name"></td>
    <td><input type="number" class="c-credits" value="${credits}" min="0" max="30" step="0.5" aria-label="Credit hours"></td>
    <td>
      <select class="c-grade" aria-label="Grade">
        ${SCALE.map(([label, points]) => `<option value="${points}"${points === grade ? ' selected' : ''}>${label} (${points.toFixed(1)})</option>`).join('')}
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
    <p>An A (4.0) in a 4-credit course and a C (2.0) in a 2-credit course give
    (4×4 + 2×2) ÷ (4 + 2) = 20 ÷ 6 = <strong>3.33</strong> — not 3.0, which is what a plain average
    of the two grades would wrongly suggest.</p>
    <h4>Scales differ</h4>
    <p>This tool uses the common US 4.0 scale with plus/minus steps. Institutions vary: some cap A+
    at 4.0 (as here), others award 4.3; weighted high-school scales push honours courses to 5.0.
    Check your registrar's table before quoting a number officially.</p>
    <h4>Prior credits</h4>
    <p>Enter your existing GPA and total credits to fold this term into a cumulative figure. The
    tool converts your history back into quality points, adds the new term, and re-divides.</p>`,

  body: () => `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Course</th><th>Credits</th><th>Grade</th><th>Quality pts</th><th></th></tr></thead>
        <tbody id="gpa-rows">
          ${rowHTML('Mathematics', 4, 4)}
          ${rowHTML('Physics', 3, 3.3)}
          ${rowHTML('Literature', 2, 3.7)}
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
      <div class="field"><label for="prev-gpa">Previous cumulative GPA (optional)</label><input type="number" id="prev-gpa" min="0" max="4.3" step="0.01" placeholder="3.42"></div>
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

      const letter = cumulative >= 3.85 ? 'A' : cumulative >= 3.5 ? 'A−' : cumulative >= 3.15 ? 'B+' : cumulative >= 2.85 ? 'B' : cumulative >= 2.5 ? 'B−' : cumulative >= 2 ? 'C' : cumulative >= 1 ? 'D' : 'F';
      qs('#gpa-stats', root).innerHTML = [
        ['Term GPA', fmt(termGpa, 3)],
        ['Cumulative GPA', fmt(cumulative, 3)],
        ['Credits this term', fmt(credits)],
        ['Quality points', fmt(points, 2)],
        ['Total credits', fmt(credits + (hasPrior ? prevCredits : 0))],
        ['Approx. letter', letter],
        ['Percentage equivalent', `${fmt((cumulative / 4) * 100, 1)}%`],
        ["Dean's list (≥3.5)", cumulative >= 3.5 ? 'Yes' : 'Not yet']
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');
    };

    on(qs('#add-row', root), 'click', () => {
      body.insertAdjacentHTML('beforeend', rowHTML('', 3, 4));
      calc();
    });
    on(root, 'click', '.js-remove', (event, btn) => {
      const rows = qsa('.gpa-row', root);
      if (rows.length <= 1) { btn.closest('tr').querySelector('.c-name').value = ''; return; }
      btn.closest('tr').remove();
      calc();
    });
    on(qs('#clear-rows', root), 'click', () => { body.innerHTML = rowHTML('', 3, 4); calc(); });
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
