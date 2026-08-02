/**
 * Grade Calculator — marks to percentage, plus the matching letter on a
 * selectable grading scale. Two modes: a single score, or a weighted set of
 * assignments that produces an overall course grade.
 */
import { qs, qsa, on } from '../../utils/dom.js';
import { fmt, fmtFixed } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

/** Grading scales as [minimum percentage, letter] pairs, highest first. */
export const SCALES = {
  'us-plus': {
    name: 'US letter with +/−',
    bands: [[97, 'A+'], [93, 'A'], [90, 'A−'], [87, 'B+'], [83, 'B'], [80, 'B−'],
      [77, 'C+'], [73, 'C'], [70, 'C−'], [67, 'D+'], [63, 'D'], [60, 'D−'], [0, 'F']]
  },
  'us-plain': {
    name: 'US letter (no +/−)',
    bands: [[90, 'A'], [80, 'B'], [70, 'C'], [60, 'D'], [0, 'F']]
  },
  uk: {
    name: 'UK honours',
    bands: [[70, 'First (1st)'], [60, 'Upper second (2:1)'], [50, 'Lower second (2:2)'],
      [40, 'Third (3rd)'], [0, 'Fail']]
  },
  gpa4: {
    name: '4.0 GPA points',
    bands: [[93, '4.0'], [90, '3.7'], [87, '3.3'], [83, '3.0'], [80, '2.7'], [77, '2.3'],
      [73, '2.0'], [70, '1.7'], [67, '1.3'], [63, '1.0'], [0, '0.0']]
  }
};

/** Higher-order lookup: returns a function that grades a percentage on one scale. */
export const grader = (scaleId) => (percent) => {
  const { bands } = SCALES[scaleId] || SCALES['us-plus'];
  const hit = bands.find(([min]) => percent >= min);
  return hit ? hit[1] : bands[bands.length - 1][1];
};

const assignmentRow = (name = '', score = '', total = 100, weight = '') => `
  <tr class="asg-row">
    <td><input type="text" class="a-name" value="${name}" placeholder="Assignment" aria-label="Assignment name"></td>
    <td><input type="number" class="a-score" value="${score}" step="any" min="0" aria-label="Score earned"></td>
    <td><input type="number" class="a-total" value="${total}" step="any" min="0" aria-label="Score possible"></td>
    <td><input type="number" class="a-weight" value="${weight}" step="any" min="0" placeholder="equal" aria-label="Weight"></td>
    <td class="mono a-pct">—</td>
    <td><button class="icon-btn btn-sm js-remove" type="button" title="Remove row"><i class="fa-regular fa-trash-can"></i></button></td>
  </tr>`;

export default {
  resultLabel: 'Grade',
  how: `
    <p>A percentage grade is nothing more than the fraction of the available marks you actually
    earned, rescaled to a hundred.</p>
    <code class="formula">percentage = (score ÷ total) × 100</code>
    <h4>Weighted courses</h4>
    <p>Most courses are not a single test. When each component carries its own weight — homework
    20%, midterm 30%, final 50% — the overall grade is the weighted mean of the component
    percentages, not the raw sum of points:</p>
    <code class="formula">overall = Σ(percentageᵢ × weightᵢ) ÷ Σ(weightᵢ)</code>
    <p>Leaving the weight column blank makes every listed assignment count equally, which is the
    same as giving them all the same weight. Because the divisor is the sum of the weights you
    actually entered, the figures stay meaningful even when your weights do not add up to exactly
    100 — useful mid-semester when some components have not been graded yet.</p>
    <h4>About the letter scales</h4>
    <p>Letter boundaries are institutional conventions, not mathematics. The four scales offered
    here cover the common US cut-offs (with and without plus/minus), UK honours classifications and
    the standard 4.0 grade-point mapping. Always check your own syllabus: some departments round
    89.5 up to an A−, others do not round at all.</p>`,

  body: () => `
    <div class="tabs" role="tablist">
      <button class="tab is-active" data-tab="single" type="button">Single score</button>
      <button class="tab" data-tab="weighted" type="button">Weighted course</button>
    </div>

    <div class="tab-panel" data-panel="single">
      <div class="grid grid-2">
        <div class="field"><label for="s-score">Marks earned</label><input type="number" id="s-score" value="42" step="any" min="0"></div>
        <div class="field"><label for="s-total">Marks possible</label><input type="number" id="s-total" value="50" step="any" min="0"></div>
      </div>
    </div>

    <div class="tab-panel" data-panel="weighted" hidden>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Assignment</th><th>Score</th><th>Out of</th><th>Weight</th><th>%</th><th></th></tr></thead>
          <tbody id="asg-rows">
            ${assignmentRow('Homework', 88, 100, 20)}
            ${assignmentRow('Midterm', 74, 100, 30)}
            ${assignmentRow('Final exam', 81, 100, 50)}
          </tbody>
        </table>
      </div>
      <div class="row mt-3">
        <button class="btn btn-sm" id="add-asg" type="button"><i class="fa-solid fa-plus"></i> Add assignment</button>
        <span class="field-hint" id="weight-note"></span>
      </div>
    </div>

    <hr class="divider">
    <div class="field">
      <label for="scale">Grading scale</label>
      <select id="scale">
        ${Object.entries(SCALES).map(([id, s], i) => `<option value="${id}"${i === 0 ? ' selected' : ''}>${s.name}</option>`).join('')}
      </select>
    </div>
    <div class="stat-grid mt-4" id="grade-stats"></div>`,

  init(root, ctx) {
    let mode = 'single';
    const stats = qs('#grade-stats', root);

    const calc = () => {
      const toLetter = grader(qs('#scale', root).value);
      let percent = NaN;
      let detail = '';
      let tiles = [];

      if (mode === 'single') {
        const score = Number(qs('#s-score', root).value);
        const total = Number(qs('#s-total', root).value);
        if (!isNumber(score) || !isNumber(total)) return ctx.setError('Enter both the marks earned and the marks possible');
        if (total <= 0) return ctx.setError('Marks possible must be greater than zero');
        percent = (score / total) * 100;
        detail = `<span class="mono">${fmt(score)}</span> out of <span class="mono">${fmt(total)}</span>`;
        tiles = [
          ['Percentage', `${fmtFixed(percent, 2)}%`],
          ['Letter grade', toLetter(percent)],
          ['Marks lost', fmt(Math.max(0, total - score), 2)],
          ['Fraction', `${fmt(score)}/${fmt(total)}`]
        ];
      } else {
        let weighted = 0; let weightSum = 0; let earned = 0; let possible = 0; let counted = 0;
        qsa('.asg-row', root).forEach((row) => {
          const score = Number(qs('.a-score', row).value);
          const total = Number(qs('.a-total', row).value);
          const rawWeight = qs('.a-weight', row).value.trim();
          const cell = qs('.a-pct', row);
          if (!isNumber(score) || !isNumber(total) || total <= 0) { cell.textContent = '—'; return; }
          const pct = (score / total) * 100;
          const weight = rawWeight === '' ? 1 : Number(rawWeight);
          if (!isNumber(weight) || weight < 0) { cell.textContent = '—'; return; }
          cell.textContent = `${fmtFixed(pct, 1)}%`;
          weighted += pct * weight;
          weightSum += weight;
          earned += score;
          possible += total;
          counted += 1;
        });

        if (weightSum <= 0) { stats.innerHTML = ''; return ctx.setError('Add at least one assignment with a score and a total'); }
        percent = weighted / weightSum;
        const declared = qsa('.asg-row', root).filter((r) => qs('.a-weight', r).value.trim() !== '').length;
        qs('#weight-note', root).textContent = declared
          ? `Weights total ${fmt(weightSum, 2)}${Math.abs(weightSum - 100) < 0.01 ? ' — a complete course' : ' — results are normalised to this total'}`
          : 'No weights entered, so every assignment counts equally.';
        detail = `Weighted mean of <span class="mono">${counted}</span> assignment${counted === 1 ? '' : 's'}`;
        tiles = [
          ['Weighted grade', `${fmtFixed(percent, 2)}%`],
          ['Letter grade', toLetter(percent)],
          ['Unweighted points', `${fmt(earned, 2)} / ${fmt(possible, 2)}`],
          ['Points percentage', `${fmtFixed(possible ? (earned / possible) * 100 : 0, 2)}%`],
          ['Weight accounted for', fmt(weightSum, 2)],
          ['Assignments counted', fmt(counted)]
        ];
      }

      ctx.setResult(`${fmtFixed(percent, 2)}%  ·  ${toLetter(percent)}`, detail, { copy: `${percent.toFixed(2)}% (${toLetter(percent)})` });
      stats.innerHTML = tiles.map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');
    };

    ctx.tabs((tab) => { mode = tab; calc(); });
    on(qs('#add-asg', root), 'click', () => {
      qs('#asg-rows', root).insertAdjacentHTML('beforeend', assignmentRow('', '', 100, ''));
      calc();
    });
    on(root, 'click', '.js-remove', (e, btn) => {
      const rows = qsa('.asg-row', root);
      if (rows.length > 1) btn.closest('tr').remove();
      calc();
    });
    ctx.live(calc);
  }
};
