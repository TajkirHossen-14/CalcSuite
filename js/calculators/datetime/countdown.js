/**
 * Countdown Timer — a live ticking countdown to any moment.
 *
 * This is the one tool that owns a repeating timer, so it demonstrates the
 * router's teardown contract: init() returns a cleanup function that clears the
 * interval when the user navigates away. Without it the timer would keep firing
 * against detached DOM nodes for the rest of the session.
 */
import { qs, qsa, on, toast } from '../../utils/dom.js';
import { fmt, pad } from '../../utils/format.js';
import { get, set } from '../../utils/storage.js';

const PRESETS = [
  { id: 'newyear', label: 'New Year', build: () => new Date(new Date().getFullYear() + 1, 0, 1, 0, 0, 0) },
  { id: 'hour', label: 'In 1 hour', build: () => new Date(Date.now() + 3600000) },
  { id: 'tomorrow', label: 'Tomorrow 09:00', build: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
  { id: 'week', label: 'In 7 days', build: () => new Date(Date.now() + 7 * 86400000) }
];

const localInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Break a millisecond span into calendar-ish parts. */
export function breakdown(ms) {
  const abs = Math.max(0, ms);
  const totalSeconds = Math.floor(abs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor(totalSeconds / 3600) % 24,
    minutes: Math.floor(totalSeconds / 60) % 60,
    seconds: totalSeconds % 60,
    totalSeconds
  };
}

export default {
  resultLabel: 'Time remaining',
  how: `
    <p>The countdown is a single subtraction repeated once a second:</p>
    <code class="formula">remaining = target − Date.now()</code>
    <p>The millisecond result is then divided down into days, hours, minutes and seconds. Nothing is
    stored on a server — the target is kept in your browser's local storage, so reloading the page
    or coming back tomorrow resumes the same countdown.</p>
    <h4>Why the timer is cleaned up</h4>
    <p>A ticking clock needs <code>setInterval</code>, and an interval keeps running even after its
    elements are removed from the page. This tool therefore returns a teardown function to the
    router, which calls it the moment you navigate to another tool. That single line is the
    difference between a tidy single-page app and one that leaks a timer per visit.</p>
    <h4>Drift</h4>
    <p>Rather than counting down from a stored number, every tick recomputes the difference against
    the system clock. Browsers throttle timers in background tabs, so a naive counter would fall
    behind; recomputing from the clock means the display is always correct the instant you return
    to the tab.</p>`,

  body: () => {
    const target = new Date(new Date().getFullYear() + 1, 0, 1, 0, 0, 0);
    return `
    <div class="grid grid-2">
      <div class="field">
        <label for="cd-target">Count down to</label>
        <input type="datetime-local" id="cd-target" value="${localInput(target)}">
      </div>
      <div class="field">
        <label for="cd-title">Event name</label>
        <input type="text" id="cd-title" value="New Year" maxlength="60" placeholder="Launch day">
      </div>
    </div>
    <div class="chips mt-3" id="cd-presets" role="group" aria-label="Quick presets">
      ${PRESETS.map((p) => `<button class="chip" type="button" data-preset="${p.id}">${p.label}</button>`).join('')}
    </div>
    <div class="stat-grid mt-4" id="cd-parts">
      ${['Days', 'Hours', 'Minutes', 'Seconds'].map((l) => `
        <div class="stat"><div class="stat-label">${l}</div><div class="stat-value mono" data-part="${l.toLowerCase()}">0</div></div>`).join('')}
    </div>
    <div class="stat-grid mt-3" id="cd-stats"></div>
    <div id="cd-note" class="mt-3"></div>`;
  },

  init(root, ctx) {
    const targetInput = qs('#cd-target', root);
    const titleInput = qs('#cd-title', root);

    // Restore a previously saved countdown.
    const saved = get('countdown', null);
    if (saved && saved.target) {
      targetInput.value = saved.target;
      titleInput.value = saved.title || '';
    }

    let reached = false;

    const tick = () => {
      const raw = targetInput.value;
      if (!raw) return ctx.setError('Pick a target date and time');
      const target = new Date(raw);
      if (Number.isNaN(target.getTime())) return ctx.setError('That date and time could not be read');

      const diff = target - Date.now();
      const past = diff < 0;
      const { days, hours, minutes, seconds, totalSeconds } = breakdown(Math.abs(diff));
      const name = titleInput.value.trim();

      const parts = { days, hours, minutes, seconds };
      qsa('[data-part]', root).forEach((el) => { el.textContent = String(parts[el.dataset.part]); });

      const clock = `${days > 0 ? `${days}d ` : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      ctx.setResult(clock,
        past
          ? `${name || 'That moment'} passed <strong>${fmt(days)}</strong> day${days === 1 ? '' : 's'} ago`
          : `until ${name ? `<strong>${name}</strong> — ` : ''}${target.toLocaleString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        { copy: clock, record: false });

      qs('#cd-stats', root).innerHTML = [
        ['Total hours', fmt(Math.floor(totalSeconds / 3600))],
        ['Total minutes', fmt(Math.floor(totalSeconds / 60))],
        ['Total seconds', fmt(totalSeconds)],
        ['Weeks', `${fmt(Math.floor(days / 7))} w ${days % 7} d`]
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');

      if (past && !reached) {
        reached = true;
        qs('#cd-note', root).innerHTML = '<div class="alert alert-success"><i class="fa-solid fa-flag-checkered"></i><span>This moment has already arrived — the timer is now counting up.</span></div>';
      } else if (!past) {
        reached = false;
        qs('#cd-note', root).innerHTML = totalSeconds < 60
          ? '<div class="alert alert-warning"><i class="fa-solid fa-hourglass-end"></i><span>Under a minute to go.</span></div>'
          : '';
      }
    };

    const save = () => set('countdown', { target: targetInput.value, title: titleInput.value });

    on(root, 'click', '[data-preset]', (e, btn) => {
      const preset = PRESETS.find((p) => p.id === btn.dataset.preset);
      if (!preset) return;
      targetInput.value = localInput(preset.build());
      titleInput.value = preset.label;
      qsa('.chip', root).forEach((c) => c.classList.toggle('is-active', c === btn));
      save();
      tick();
      toast(`Counting down to ${preset.label}`, 'fa-solid fa-hourglass-half');
    });

    on(root, 'input', () => { save(); tick(); });
    on(root, 'change', () => { save(); tick(); });

    tick();
    const timer = setInterval(tick, 1000);

    // Returned to the router — stops the clock on navigation away.
    return () => clearInterval(timer);
  }
};
