/**
 * Age in Days & Hours — a life measured in every unit at once, with a live
 * seconds counter and a few grounded biological estimates.
 */
import { qs, on } from '../../utils/dom.js';
import { fmt, fmtFixed } from '../../utils/format.js';
import { isValidDate } from '../../utils/validators.js';
import { calendarAge } from '../datetime/age.js';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Rough but honest physiological averages, used for the "in your lifetime" tiles. */
const RATES = {
  heartbeats: 75 * 60 * 24,     // ~75 bpm
  breaths: 15 * 60 * 24,        // ~15 breaths/min
  blinks: 15 * 60 * 16,         // ~15/min while awake, 16 waking hours
  sleepHours: 8,
  steps: 5000
};

export default {
  resultLabel: 'Days alive',
  how: `
    <p>Every figure here comes from one number: the milliseconds between your birth moment and now.
    Divide it by the length of a unit and you have your age in that unit.</p>
    <code class="formula">days    = ms ÷ 86 400 000
hours   = ms ÷ 3 600 000
minutes = ms ÷ 60 000</code>
    <h4>Why months and years are different</h4>
    <p>Days, hours and minutes are fixed-length, so a division is exact. Months and years are not —
    they vary between 28 and 31 days, and between 365 and 366. Those two rows therefore come from
    proper calendar arithmetic (subtract the fields, borrow the real month length) rather than from
    dividing by an average, which is why they will not exactly match "days ÷ 30.44".</p>
    <h4>The biological estimates</h4>
    <p>Heartbeats, breaths and blinks are honest order-of-magnitude estimates, not measurements:
    they assume 75 beats and 15 breaths per minute around the clock, and 15 blinks a minute during
    sixteen waking hours. Real rates vary with age, fitness and activity, so treat these as a sense
    of scale — the interesting part is the exponent, not the digits.</p>
    <h4>The ticking counter</h4>
    <p>The seconds figure updates once a second using an interval that the router clears the moment
    you leave the page, so nothing keeps running in the background.</p>`,

  body: () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `
    <div class="grid grid-2">
      <div class="field">
        <label for="birth-date">Date of birth</label>
        <input type="date" id="birth-date" value="1995-06-15" max="${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}">
      </div>
      <div class="field">
        <label for="birth-time">Time of birth (optional)</label>
        <input type="time" id="birth-time" value="00:00">
        <span class="field-hint">Sharpens the hour and minute counts</span>
      </div>
    </div>
    <label class="checkbox mt-3"><input type="checkbox" id="live-tick" checked> <span>Keep the counters ticking live</span></label>
    <div class="stat-grid mt-4" id="units-stats"></div>
    <h3 class="mt-4" style="font-size:var(--fs-md)">Estimated over your lifetime</h3>
    <div class="stat-grid" id="bio-stats"></div>`;
  },

  init(root, ctx) {
    const tick = () => {
      const dateValue = qs('#birth-date', root).value;
      if (!isValidDate(dateValue)) return ctx.setError('Choose your date of birth');

      const timeValue = qs('#birth-time', root).value || '00:00';
      const [y, m, d] = dateValue.split('-').map(Number);
      const [hh, mm] = timeValue.split(':').map(Number);
      const birth = new Date(y, m - 1, d, hh || 0, mm || 0, 0);
      const now = new Date();

      if (birth > now) return ctx.setError('That date is in the future');

      const ms = now - birth;
      const days = ms / DAY;
      const wholeDays = Math.floor(days);
      const { years, months, days: remDays } = calendarAge(
        new Date(birth.getFullYear(), birth.getMonth(), birth.getDate()),
        new Date(now.getFullYear(), now.getMonth(), now.getDate())
      );

      ctx.setResult(fmt(wholeDays),
        `${years} years, ${months} months and ${remDays} days — that is <span class="mono">${fmt(Math.floor(ms / SECOND))}</span> seconds`,
        { copy: String(wholeDays), record: false });

      const tile = ([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`;

      qs('#units-stats', root).innerHTML = [
        ['Years', `${years} y ${months} m ${remDays} d`],
        ['Decimal years', fmtFixed(days / 365.2425, 4)],
        ['Total months', fmt(years * 12 + months)],
        ['Weeks', `${fmt(Math.floor(wholeDays / 7))} w ${wholeDays % 7} d`],
        ['Days', fmt(wholeDays)],
        ['Hours', fmt(Math.floor(ms / HOUR))],
        ['Minutes', fmt(Math.floor(ms / MINUTE))],
        ['Seconds', fmt(Math.floor(ms / SECOND))],
        ['Milliseconds', fmt(ms)],
        ['Leap days lived', fmt(countLeapDays(birth, now))],
        ['Full moons seen', fmt(Math.floor(days / 29.530588))],
        ['Earth orbits', fmtFixed(days / 365.2425, 2)]
      ].map(tile).join('');

      qs('#bio-stats', root).innerHTML = [
        ['Heartbeats', fmt(Math.floor(days * RATES.heartbeats))],
        ['Breaths', fmt(Math.floor(days * RATES.breaths))],
        ['Blinks', fmt(Math.floor(days * RATES.blinks))],
        ['Hours asleep', fmt(Math.floor(days * RATES.sleepHours))],
        ['Years asleep', fmtFixed((days * RATES.sleepHours) / 24 / 365.2425, 2)],
        ['Steps walked', fmt(Math.floor(days * RATES.steps))]
      ].map(tile).join('');
    };

    /** Count 29 Februaries between two dates. */
    function countLeapDays(from, to) {
      let count = 0;
      for (let year = from.getFullYear(); year <= to.getFullYear(); year += 1) {
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        if (!isLeap) continue;
        const feb29 = new Date(year, 1, 29);
        if (feb29 >= from && feb29 <= to) count += 1;
      }
      return count;
    }

    let timer = null;
    const setTicking = () => {
      if (timer) { clearInterval(timer); timer = null; }
      if (qs('#live-tick', root).checked) timer = setInterval(tick, 1000);
    };

    on(root, 'input', () => { tick(); setTicking(); });
    on(root, 'change', () => { tick(); setTicking(); });

    tick();
    setTicking();

    return () => { if (timer) clearInterval(timer); };
  }
};
