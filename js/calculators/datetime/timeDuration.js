/**
 * Time Duration — add or subtract hh:mm:ss durations, measure the span between
 * two times of day, and convert a duration into decimal hours for timesheets.
 */
import { qs, qsa, on } from '../../utils/dom.js';
import { fmt, fmtFixed, pad } from '../../utils/format.js';

/** Parse "1:30:15", "90m", "2h 15m" or a plain number of minutes into seconds. */
export function parseDuration(input) {
  const text = String(input).trim().toLowerCase();
  if (!text) return NaN;

  if (text.includes(':')) {
    const parts = text.split(':').map((p) => Number(p.trim()));
    if (parts.some((p) => !Number.isFinite(p))) return NaN;
    const [a, b = 0, c = 0] = parts;
    return parts.length === 2 ? a * 3600 + b * 60 : a * 3600 + b * 60 + c;
  }

  const unit = /(-?\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?|m|min|mins?|s|sec|secs?|d|days?)/g;
  let total = 0; let found = false; let match;
  while ((match = unit.exec(text)) !== null) {
    const value = Number(match[1]);
    const u = match[2][0];
    total += value * (u === 'd' ? 86400 : u === 'h' ? 3600 : u === 'm' ? 60 : 1);
    found = true;
  }
  if (found) return total;

  const plain = Number(text);
  return Number.isFinite(plain) ? plain * 60 : NaN;
}

/** Seconds → "3:07:20", negatives kept explicit. */
export function formatDuration(seconds) {
  const sign = seconds < 0 ? '−' : '';
  const abs = Math.round(Math.abs(seconds));
  return `${sign}${Math.floor(abs / 3600)}:${pad(Math.floor(abs / 60) % 60)}:${pad(abs % 60)}`;
}

const row = (value = '1:30:00', op = 'add') => `
  <tr class="dur-row">
    <td>
      <select class="d-op" aria-label="Operation">
        <option value="add"${op === 'add' ? ' selected' : ''}>+ Add</option>
        <option value="sub"${op === 'sub' ? ' selected' : ''}>− Subtract</option>
      </select>
    </td>
    <td><input type="text" class="d-value" value="${value}" placeholder="1:30:00 or 90m" aria-label="Duration"></td>
    <td class="mono d-parsed">—</td>
    <td><button class="icon-btn btn-sm js-remove" type="button" title="Remove row"><i class="fa-regular fa-trash-can"></i></button></td>
  </tr>`;

export default {
  resultLabel: 'Duration',
  how: `
    <p>Time arithmetic is base-60, which is why doing it in your head goes wrong. The reliable
    approach is to leave sexagesimal notation immediately: convert everything to seconds, do plain
    integer arithmetic, then convert back once at the end.</p>
    <code class="formula">seconds = hours × 3600 + minutes × 60 + seconds
h = ⌊total ÷ 3600⌋   m = ⌊total ÷ 60⌋ mod 60   s = total mod 60</code>
    <h4>Flexible input</h4>
    <p>The parser accepts several notations, so you can type whatever you have to hand:
    <code>1:30:00</code> (h:m:s), <code>90:00</code> (h:m), <code>2h 15m</code>, <code>45s</code>,
    <code>3d 4h</code>, or a bare number, which is read as minutes.</p>
    <h4>Overnight spans</h4>
    <p>In the "between two times" mode, an end time earlier than the start is assumed to cross
    midnight and a day is added — the behaviour a night-shift timesheet needs. Unpaid breaks are
    subtracted after the span is computed.</p>
    <h4>Decimal hours</h4>
    <p>Payroll systems usually want decimal hours rather than minutes, where 7 h 30 m is 7.5 and
    <em>not</em> 7.30. That conversion — total seconds ÷ 3600 — is the single most common source of
    timesheet errors, so it is shown for every result.</p>`,

  body: () => `
    <div class="tabs" role="tablist">
      <button class="tab is-active" data-tab="sum" type="button">Add &amp; subtract</button>
      <button class="tab" data-tab="span" type="button">Between two times</button>
    </div>

    <div class="tab-panel" data-panel="sum">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th style="width:9rem">Operation</th><th>Duration</th><th>Seconds</th><th></th></tr></thead>
          <tbody id="dur-rows">
            ${row('2:45:00', 'add')}
            ${row('1h 20m', 'add')}
            ${row('30m', 'sub')}
          </tbody>
        </table>
      </div>
      <div class="row mt-3">
        <button class="btn btn-sm" id="add-dur" type="button"><i class="fa-solid fa-plus"></i> Add duration</button>
        <span class="field-hint">Accepts <span class="mono">h:m:s</span>, <span class="mono">2h 15m</span>, <span class="mono">90</span> (minutes)</span>
      </div>
    </div>

    <div class="tab-panel" data-panel="span" hidden>
      <div class="grid grid-3">
        <div class="field"><label for="t-start">Start time</label><input type="time" id="t-start" value="09:00" step="60"></div>
        <div class="field"><label for="t-end">End time</label><input type="time" id="t-end" value="17:30" step="60"></div>
        <div class="field"><label for="t-break">Unpaid break (minutes)</label><input type="number" id="t-break" value="30" min="0" step="5"></div>
      </div>
      <div class="grid grid-2 mt-3">
        <div class="field"><label for="t-rate">Hourly rate (optional)</label><input type="number" id="t-rate" min="0" step="any" placeholder="e.g. 22.50"></div>
        <div class="field"><label for="t-days">Repeated over (days)</label><input type="number" id="t-days" value="5" min="1" step="1"></div>
      </div>
    </div>

    <div class="stat-grid mt-4" id="dur-stats"></div>`,

  init(root, ctx) {
    let mode = 'sum';
    const tile = ([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`;

    const sum = () => {
      let total = 0; let bad = 0;
      qsa('.dur-row', root).forEach((r) => {
        const seconds = parseDuration(qs('.d-value', r).value);
        const cell = qs('.d-parsed', r);
        if (!Number.isFinite(seconds)) { cell.textContent = '?'; cell.style.color = 'var(--danger)'; bad += 1; return; }
        cell.textContent = fmt(seconds);
        cell.style.color = '';
        total += qs('.d-op', r).value === 'sub' ? -seconds : seconds;
      });

      if (bad) return ctx.setError(`${bad} duration${bad === 1 ? '' : 's'} could not be read — try 1:30:00 or 90m`);

      ctx.setResult(formatDuration(total),
        `<span class="mono">${fmtFixed(total / 3600, 4)}</span> decimal hours · <span class="mono">${fmt(Math.round(total / 60))}</span> minutes`,
        { copy: formatDuration(total) });

      qs('#dur-stats', root).innerHTML = [
        ['h : m : s', formatDuration(total)],
        ['Decimal hours', fmtFixed(total / 3600, 4)],
        ['Total minutes', fmt(Math.round(total / 60))],
        ['Total seconds', fmt(Math.round(total))],
        ['Days', fmtFixed(total / 86400, 4)],
        ['Working days (8 h)', fmtFixed(total / 28800, 3)]
      ].map(tile).join('');
    };

    const span = () => {
      const start = qs('#t-start', root).value;
      const end = qs('#t-end', root).value;
      if (!start || !end) return ctx.setError('Enter both a start and an end time');

      const toSec = (t) => { const [h, m] = t.split(':').map(Number); return h * 3600 + m * 60; };
      let seconds = toSec(end) - toSec(start);
      const overnight = seconds < 0;
      if (overnight) seconds += 86400;

      const breakMin = Number(qs('#t-break', root).value) || 0;
      const net = seconds - breakMin * 60;
      const days = Math.max(1, Number(qs('#t-days', root).value) || 1);
      const rate = Number(qs('#t-rate', root).value);
      const hours = net / 3600;

      if (net < 0) return ctx.setError('The break is longer than the shift');

      ctx.setResult(formatDuration(net),
        `${overnight ? 'Overnight shift · ' : ''}<span class="mono">${fmtFixed(hours, 2)}</span> paid hours after a <span class="mono">${breakMin}</span> minute break`,
        { copy: formatDuration(net) });

      qs('#dur-stats', root).innerHTML = [
        ['Gross span', formatDuration(seconds)],
        ['Net worked', formatDuration(net)],
        ['Decimal hours', fmtFixed(hours, 2)],
        ['Over ' + days + ' days', formatDuration(net * days)],
        ['Hours over ' + days + ' days', fmtFixed(hours * days, 2)],
        ['Crosses midnight', overnight ? 'Yes' : 'No'],
        ['Pay for one day', rate > 0 ? fmtFixed(hours * rate, 2) : '—'],
        ['Pay for ' + days + ' days', rate > 0 ? fmtFixed(hours * rate * days, 2) : '—']
      ].map(tile).join('');
    };

    const calc = () => (mode === 'sum' ? sum() : span());

    on(qs('#add-dur', root), 'click', () => {
      qs('#dur-rows', root).insertAdjacentHTML('beforeend', row('0:15:00', 'add'));
      calc();
    });
    on(root, 'click', '.js-remove', (e, btn) => {
      if (qsa('.dur-row', root).length > 1) btn.closest('tr').remove();
      calc();
    });

    ctx.tabs((tab) => { mode = tab; calc(); });
    ctx.live(calc);
  }
};
