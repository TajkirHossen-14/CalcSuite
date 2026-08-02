/**
 * Final Grade Needed — solves the exam score required to reach a target
 * course grade, given the grade already banked and the weight of the final.
 */
import { qs } from '../../utils/dom.js';
import { fmt, fmtFixed } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

/** Pure solver, exported so it can be reused/tested independently. */
export function requiredScore({ current, target, finalWeight }) {
  const w = finalWeight / 100;
  if (w <= 0) return Infinity;
  return (target - current * (1 - w)) / w;
}

const verdict = (needed) => {
  if (needed <= 0) return { tone: 'success', icon: 'fa-solid fa-circle-check', text: 'Already secured — even a zero on the final keeps your target.' };
  if (needed <= 50) return { tone: 'success', icon: 'fa-solid fa-face-smile', text: 'Very comfortable. A modest score is enough.' };
  if (needed <= 80) return { tone: 'info', icon: 'fa-solid fa-book-open', text: 'Realistic with steady revision.' };
  if (needed <= 100) return { tone: 'warning', icon: 'fa-solid fa-triangle-exclamation', text: 'Tight — you need close to a perfect paper.' };
  return { tone: 'danger', icon: 'fa-solid fa-circle-xmark', text: 'Not reachable with this final alone. Ask about extra credit or aim at the next grade down.' };
};

export default {
  resultLabel: 'Score needed on the final',
  how: `
    <p>Your course grade is a weighted average of two things: everything you have already done, and
    the final exam. If the final is worth <em>w</em> of the course, the rest is worth
    <em>1 − w</em>:</p>
    <code class="formula">course = current × (1 − w) + final × w</code>
    <p>You know the course grade you want, so rearrange for the only unknown:</p>
    <code class="formula">final = ( target − current × (1 − w) ) ÷ w</code>
    <h4>Reading the answer</h4>
    <p>A negative result means the target is already locked in — you could skip the exam entirely
    and still make it. A result above 100 means the target is arithmetically out of reach: the
    remaining weight simply cannot carry that many points, so the honest move is to re-target one
    grade lower and see what that requires instead. The table below does exactly that for every
    common cut-off at once.</p>
    <h4>Getting "current grade" right</h4>
    <p>Enter the average of the work graded so far <strong>as a percentage of that work only</strong>,
    not as a fraction of the whole course. If your syllabus lists the final as 40%, the other 60% is
    what "current grade" describes.</p>`,

  body: () => `
    <div class="grid grid-3">
      <div class="field">
        <label for="current">Current grade (%)</label>
        <input type="number" id="current" value="78" step="any" min="0" max="100">
        <span class="field-hint">Average of graded work so far</span>
      </div>
      <div class="field">
        <label for="target">Target course grade (%)</label>
        <input type="number" id="target" value="85" step="any" min="0" max="100">
      </div>
      <div class="field">
        <label for="weight">Final exam weight (%)</label>
        <input type="number" id="weight" value="40" step="any" min="0.1" max="100">
      </div>
    </div>
    <div id="verdict" class="mt-3"></div>
    <h3 class="mt-4" style="font-size:var(--fs-md)">What each grade would take</h3>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Target</th><th>Needed on final</th><th>Verdict</th></tr></thead>
        <tbody id="ladder"></tbody>
      </table>
    </div>`,

  init(root, ctx) {
    const el = (id) => qs(`#${id}`, root);

    const calc = () => {
      const current = Number(el('current').value);
      const target = Number(el('target').value);
      const finalWeight = Number(el('weight').value);

      if (![current, target, finalWeight].every(isNumber)) return ctx.setError('Fill in all three fields');
      if (finalWeight <= 0 || finalWeight > 100) return ctx.setError('The final’s weight must be between 0 and 100%');

      const needed = requiredScore({ current, target, finalWeight });
      const v = verdict(needed);

      ctx.setResult(`${fmtFixed(needed, 2)}%`,
        `To finish on <span class="mono">${fmt(target, 2)}%</span> with the final worth <span class="mono">${fmt(finalWeight)}%</span>`,
        { copy: needed.toFixed(2) });

      el('verdict').innerHTML = `<div class="alert alert-${v.tone}"><i class="${v.icon}" aria-hidden="true"></i><span>${v.text}</span></div>`;

      const targets = [97, 93, 90, 87, 83, 80, 77, 73, 70, 60];
      el('ladder').innerHTML = targets.map((t) => {
        const n = requiredScore({ current, target: t, finalWeight });
        const tone = n <= 0 ? 'success' : n > 100 ? 'danger' : n > 90 ? 'warning' : '';
        const label = n <= 0 ? 'Already secured' : n > 100 ? 'Out of reach' : n > 90 ? 'Very tight' : 'Achievable';
        return `<tr${t === Math.round(target) ? ' style="background:var(--surface-3)"' : ''}>
          <td class="mono">${t}%</td>
          <td class="mono">${n <= 0 ? '0' : fmtFixed(n, 1)}%</td>
          <td>${tone ? `<span class="badge badge-${tone}">${label}</span>` : label}</td>
        </tr>`;
      }).join('');
    };

    ctx.live(calc);
  }
};
