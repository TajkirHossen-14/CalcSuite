/**
 * Date Difference — the span between two dates in every useful unit, with a
 * proper business-day count and an add/subtract mode for date arithmetic.
 */
import { qs, qsa } from '../../utils/dom.js';
import { fmt } from '../../utils/format.js';
import { isValidDate } from '../../utils/validators.js';
import { calendarAge } from './age.js';

const DAY = 86400000;
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const long = (d) => d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** Whole business days between two dates, counting the start and skipping weekends. */
export function businessDays(start, end) {
  let count = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/** Add a signed number of business days to a date. */
function addBusinessDays(date, amount) {
  const out = new Date(date);
  const step = amount < 0 ? -1 : 1;
  let left = Math.abs(amount);
  while (left > 0) {
    out.setDate(out.getDate() + step);
    const day = out.getDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return out;
}

export default {
  resultLabel: 'Difference',
  how: `
    <p>Two dates can be compared in two very different ways, and this tool shows both because they
    rarely agree.</p>
    <h4>Elapsed days</h4>
    <p>Subtract the two timestamps and divide by 86 400 000 milliseconds. Both dates are normalised
    to local midnight first, so daylight-saving transitions — which make some days 23 or 25 hours
    long — cannot introduce a rounding error.</p>
    <h4>Calendar span</h4>
    <p>"1 year, 2 months, 5 days" cannot be derived from a day count, because a year is not a fixed
    number of days. The span is built by subtracting the year, month and day fields separately and
    borrowing the real length of the preceding month when a field goes negative.</p>
    <h4>Business days</h4>
    <p>The working-day count walks the range one day at a time and skips Saturdays and Sundays. It
    counts the start date and excludes the end date, the convention used for payroll and delivery
    estimates. Public holidays vary by country and are deliberately not assumed.</p>
    <h4>Add / subtract mode</h4>
    <p>The second tab performs the inverse operation: pick a starting date, choose a unit and an
    amount, and get the resulting date. Adding months clamps to the end of a short month, so
    31 January plus one month is 28 February rather than an invalid 31 February.</p>`,

  body: () => {
    const today = new Date();
    const later = new Date(today.getTime() + 90 * DAY);
    return `
    <div class="tabs" role="tablist">
      <button class="tab is-active" data-tab="between" type="button">Between two dates</button>
      <button class="tab" data-tab="addsub" type="button">Add / subtract</button>
    </div>

    <div class="tab-panel" data-panel="between">
      <div class="grid grid-2">
        <div class="field"><label for="d-start">Start date</label><input type="date" id="d-start" value="${iso(today)}"></div>
        <div class="field"><label for="d-end">End date</label><input type="date" id="d-end" value="${iso(later)}"></div>
      </div>
      <label class="checkbox mt-3"><input type="checkbox" id="inclusive"> <span>Count the end date as a full day (inclusive)</span></label>
      <div class="stat-grid mt-4" id="diff-stats"></div>
    </div>

    <div class="tab-panel" data-panel="addsub" hidden>
      <div class="grid grid-4">
        <div class="field"><label for="a-start">From date</label><input type="date" id="a-start" value="${iso(today)}"></div>
        <div class="field"><label for="a-dir">Operation</label>
          <select id="a-dir"><option value="1">Add</option><option value="-1">Subtract</option></select>
        </div>
        <div class="field"><label for="a-amount">Amount</label><input type="number" id="a-amount" value="30" step="1"></div>
        <div class="field"><label for="a-unit">Unit</label>
          <select id="a-unit">
            <option value="days">Days</option>
            <option value="business">Business days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
            <option value="years">Years</option>
          </select>
        </div>
      </div>
      <div class="stat-grid mt-4" id="add-stats"></div>
    </div>`;
  },

  init(root, ctx) {
    let mode = 'between';
    const tile = ([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`;

    const between = () => {
      const sv = qs('#d-start', root).value;
      const ev = qs('#d-end', root).value;
      if (!isValidDate(sv) || !isValidDate(ev)) return ctx.setError('Choose both dates');

      const [sy, sm, sd] = sv.split('-').map(Number);
      const [ey, em, ed] = ev.split('-').map(Number);
      let start = new Date(sy, sm - 1, sd);
      let end = new Date(ey, em - 1, ed);
      const reversed = start > end;
      if (reversed) [start, end] = [end, start];

      const inclusive = qs('#inclusive', root).checked;
      const bonus = inclusive ? 1 : 0;
      const days = Math.round((end - start) / DAY) + bonus;
      const { years, months, days: remDays } = calendarAge(start, end);
      const bdays = businessDays(start, end) + (inclusive && ![0, 6].includes(end.getDay()) ? 1 : 0);

      ctx.setResult(`${fmt(days)} day${days === 1 ? '' : 's'}`,
        `${years ? `${years} yr ` : ''}${months ? `${months} mo ` : ''}${remDays} d — ${long(start)} → ${long(end)}${reversed ? ' (dates swapped)' : ''}`,
        { copy: String(days) });

      qs('#diff-stats', root).innerHTML = [
        ['Calendar span', `${years}y ${months}m ${remDays}d`],
        ['Total days', fmt(days)],
        ['Weeks', `${fmt(Math.floor(days / 7))} w ${days % 7} d`],
        ['Business days', fmt(bdays)],
        ['Weekend days', fmt(days - bdays)],
        ['Total hours', fmt(days * 24)],
        ['Total minutes', fmt(days * 1440)],
        ['Total seconds', fmt(days * 86400)],
        ['Start weekday', start.toLocaleDateString(undefined, { weekday: 'long' })],
        ['End weekday', end.toLocaleDateString(undefined, { weekday: 'long' })]
      ].map(tile).join('');
    };

    const addSub = () => {
      const sv = qs('#a-start', root).value;
      if (!isValidDate(sv)) return ctx.setError('Choose a starting date');
      const [y, m, d] = sv.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      const sign = Number(qs('#a-dir', root).value);
      const amount = Number(qs('#a-amount', root).value) * sign;
      const unit = qs('#a-unit', root).value;
      if (!Number.isFinite(amount)) return ctx.setError('Enter an amount');

      let result;
      if (unit === 'business') {
        result = addBusinessDays(start, amount);
      } else {
        result = new Date(start);
        if (unit === 'days') result.setDate(result.getDate() + amount);
        if (unit === 'weeks') result.setDate(result.getDate() + amount * 7);
        if (unit === 'years') result.setFullYear(result.getFullYear() + amount);
        if (unit === 'months') {
          const targetDay = result.getDate();
          result.setDate(1);
          result.setMonth(result.getMonth() + amount);
          const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
          result.setDate(Math.min(targetDay, lastDay));
        }
      }

      const spanDays = Math.round((result - start) / DAY);
      ctx.setResult(long(result),
        `${sign > 0 ? 'Adding' : 'Subtracting'} <span class="mono">${Math.abs(amount)}</span> ${unit === 'business' ? 'business days' : unit} to ${long(start)}`,
        { copy: iso(result) });

      qs('#add-stats', root).innerHTML = [
        ['Resulting date', iso(result)],
        ['Weekday', result.toLocaleDateString(undefined, { weekday: 'long' })],
        ['Days moved', fmt(spanDays)],
        ['Day of year', fmt(Math.ceil((result - new Date(result.getFullYear(), 0, 0)) / DAY))]
      ].map(tile).join('');
    };

    const calc = () => (mode === 'between' ? between() : addSub());
    ctx.tabs((tab) => { mode = tab; calc(); });
    ctx.live(calc);
  }
};
