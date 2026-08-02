/**
 * Age Calculator — exact age in years, months and days using calendar
 * arithmetic (not an average-days approximation), plus next-birthday countdown.
 */
import { qs } from '../../utils/dom.js';
import { fmt } from '../../utils/format.js';
import { isValidDate } from '../../utils/validators.js';

const DAY = 86400000;

/**
 * Borrow-based calendar difference. Walks days → months → years, borrowing the
 * true length of the preceding month, which is what makes it leap-year safe.
 */
export function calendarAge(from, to) {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    days += prevMonth;
    months -= 1;
  }
  if (months < 0) { months += 12; years -= 1; }
  return { years, months, days };
}

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default {
  resultLabel: 'Age',
  how: `
    <p>Age looks trivial until you try to write it down. "How many days since you were born" is easy;
    "how many years, months and days" is not, because months are 28 to 31 days long and February
    changes length every fourth year.</p>
    <h4>The borrowing method</h4>
    <p>This tool subtracts the three calendar fields separately and then borrows, exactly like long
    subtraction:</p>
    <code class="formula">days   = today.day − birth.day
if days < 0   → borrow the real length of last month, months − 1
months = today.month − birth.month
if months < 0 → borrow 12 months, years − 1</code>
    <p>Because the borrow uses <em>the actual length of the preceding month</em>, someone born on
    31 January is 1 month old on 28 February in a common year and the count never drifts.</p>
    <h4>Leap-day birthdays</h4>
    <p>If you were born on 29 February, JavaScript's date object rolls a non-existent 29 February
    forward to 1 March, so your birthday is treated as 1 March in common years — the convention
    used by most English-speaking jurisdictions.</p>
    <h4>Time zones</h4>
    <p>All arithmetic runs in your local time zone with the clock zeroed to midnight, so a
    late-evening visit cannot make you a day older than you are.</p>`,

  body: () => `
    <div class="grid grid-2">
      <div class="field">
        <label for="dob">Date of birth</label>
        <input type="date" id="dob" value="1995-06-15" max="${iso(new Date())}">
      </div>
      <div class="field">
        <label for="asof">Age at date</label>
        <input type="date" id="asof" value="${iso(new Date())}">
        <span class="field-hint">Defaults to today — change it to age at any past or future date</span>
      </div>
    </div>
    <div class="stat-grid mt-4" id="age-stats"></div>
    <div id="birthday-note" class="mt-3"></div>`,

  init(root, ctx) {
    const calc = () => {
      const dobValue = qs('#dob', root).value;
      const asofValue = qs('#asof', root).value;
      if (!isValidDate(dobValue) || !isValidDate(asofValue)) return ctx.setError('Choose both dates');

      const [by, bm, bd] = dobValue.split('-').map(Number);
      const [ay, am, ad] = asofValue.split('-').map(Number);
      const birth = new Date(by, bm - 1, bd);
      const asOf = new Date(ay, am - 1, ad);

      if (birth > asOf) return ctx.setError('The birth date must come before the reference date');

      const { years, months, days } = calendarAge(birth, asOf);
      const totalDays = Math.round((asOf - birth) / DAY);
      const totalMonths = years * 12 + months;

      ctx.setResult(`${years} yr  ${months} mo  ${days} d`,
        `Born on a <strong>${WEEKDAYS[birth.getDay()]}</strong> · <span class="mono">${fmt(totalDays)}</span> days lived`,
        { copy: `${years} years, ${months} months, ${days} days` });

      // Next birthday from the reference date.
      let next = new Date(asOf.getFullYear(), bm - 1, bd);
      if (next < asOf) next = new Date(asOf.getFullYear() + 1, bm - 1, bd);
      const untilDays = Math.round((next - asOf) / DAY);

      qs('#age-stats', root).innerHTML = [
        ['Years', fmt(years)],
        ['Total months', fmt(totalMonths)],
        ['Total weeks', fmt(Math.floor(totalDays / 7))],
        ['Total days', fmt(totalDays)],
        ['Total hours', fmt(totalDays * 24)],
        ['Total minutes', fmt(totalDays * 1440)],
        ['Day of the week born', WEEKDAYS[birth.getDay()]],
        ['Next birthday', WEEKDAYS[next.getDay()]]
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');

      qs('#birthday-note', root).innerHTML = untilDays === 0
        ? '<div class="alert alert-success"><i class="fa-solid fa-cake-candles"></i><span>It is your birthday on this date. Happy birthday!</span></div>'
        : `<div class="alert alert-info"><i class="fa-regular fa-calendar-check"></i><span>Turning <strong>${years + 1}</strong> in <strong>${fmt(untilDays)}</strong> day${untilDays === 1 ? '' : 's'}, on ${next.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.</span></div>`;
    };

    ctx.live(calc);
  }
};
