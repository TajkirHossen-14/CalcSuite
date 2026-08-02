/**
 * Power & Energy Cost — appliance consumption in kWh and what it costs to run,
 * plus the three algebraic forms of electrical power.
 */
import { qs, on } from '../../utils/dom.js';
import { fmt, fmtFixed, toSignificant } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

const APPLIANCES = [
  ['LED bulb', 9, 5],
  ['Laptop', 60, 8],
  ['Desktop PC', 200, 6],
  ['Fridge freezer', 150, 8],
  ['Washing machine', 700, 1],
  ['Electric kettle', 2200, 0.25],
  ['Air conditioner', 1400, 6],
  ['Electric heater', 2000, 4]
];

export default {
  resultLabel: 'Running cost',
  how: `
    <p>Electrical power is the rate at which energy is converted, measured in watts. One watt is one
    joule per second.</p>
    <code class="formula">P = V × I = I² × R = V² ÷ R</code>
    <p>Energy is power multiplied by time. Utilities bill in kilowatt-hours, which is simply
    1 000 watts sustained for one hour — 3.6 million joules:</p>
    <code class="formula">kWh = watts × hours ÷ 1000
cost = kWh × price per kWh</code>
    <h4>Why the kettle is cheap and the heater is not</h4>
    <p>A 2 200 W kettle draws far more power than a 150 W fridge, yet costs less to run, because it
    is on for four minutes a day and the fridge cycles all year. Consumption is the product of power
    <em>and</em> time, and people consistently underestimate the second factor. The comparison table
    makes that concrete for typical appliances.</p>
    <h4>Standby loads</h4>
    <p>Devices that idle at a few watts around the clock quietly add up: 5 W left on permanently is
    43.8 kWh a year. Set the hours per day to 24 to see the effect.</p>
    <h4>A caveat on rated power</h4>
    <p>The figure on an appliance's label is usually its maximum draw, not its average. Motors and
    thermostats cycle, so a fridge rated at 150 W might average 40 W. For an accurate bill, use a
    plug-in energy monitor and enter the measured kWh directly.</p>`,

  body: () => `
    <div class="grid grid-3">
      <div class="field">
        <label for="p-watts">Appliance power (W)</label>
        <input type="number" id="p-watts" value="1400" min="0" step="any">
      </div>
      <div class="field">
        <label for="p-hours">Hours used per day</label>
        <input type="number" id="p-hours" value="6" min="0" max="24" step="any">
      </div>
      <div class="field">
        <label for="p-rate">Price per kWh</label>
        <input type="number" id="p-rate" value="0.28" min="0" step="any">
      </div>
    </div>
    <div class="grid grid-3 mt-3">
      <div class="field">
        <label for="p-count">Number of units</label>
        <input type="number" id="p-count" value="1" min="1" step="1">
      </div>
      <div class="field">
        <label for="p-volts">Supply voltage (V)</label>
        <input type="number" id="p-volts" value="230" min="1" step="any">
      </div>
      <div class="field">
        <label for="p-preset">Quick preset</label>
        <select id="p-preset">
          <option value="">Choose an appliance…</option>
          ${APPLIANCES.map(([n, w, h]) => `<option value="${w}:${h}">${n} (${w} W)</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="stat-grid mt-4" id="power-stats"></div>
    <h3 class="mt-4" style="font-size:var(--fs-md)">Typical appliances at your tariff</h3>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Appliance</th><th>Power</th><th>Hours/day</th><th>kWh per year</th><th>Cost per year</th></tr></thead>
        <tbody id="appliance-table"></tbody>
      </table>
    </div>`,

  init(root, ctx) {
    const num = (id) => Number(qs(`#${id}`, root).value);

    const calc = () => {
      const watts = num('p-watts');
      const hours = num('p-hours');
      const rate = num('p-rate');
      const count = Math.max(1, num('p-count') || 1);
      const volts = num('p-volts');

      if (![watts, hours, rate].every(isNumber)) return ctx.setError('Enter the power, hours per day and price per kWh');
      if (watts < 0 || hours < 0 || rate < 0) return ctx.setError('Values cannot be negative');

      const totalWatts = watts * count;
      const kwhDay = (totalWatts * hours) / 1000;
      const costDay = kwhDay * rate;
      const amps = volts > 0 ? totalWatts / volts : NaN;
      const ohms = amps > 0 ? volts / amps : NaN;

      ctx.setResult(`${fmtFixed(costDay * 365, 2)} / year`,
        `${fmtFixed(kwhDay, 3)} kWh per day · <span class="mono">${fmtFixed(costDay, 2)}</span> per day · <span class="mono">${fmtFixed(costDay * 30.44, 2)}</span> per month`,
        { copy: (costDay * 365).toFixed(2) });

      qs('#power-stats', root).innerHTML = [
        ['Total load', `${fmt(totalWatts)} W`],
        ['kWh per day', fmtFixed(kwhDay, 3)],
        ['kWh per month', fmtFixed(kwhDay * 30.44, 2)],
        ['kWh per year', fmtFixed(kwhDay * 365, 1)],
        ['Cost per day', fmtFixed(costDay, 2)],
        ['Cost per week', fmtFixed(costDay * 7, 2)],
        ['Cost per month', fmtFixed(costDay * 30.44, 2)],
        ['Cost per year', fmtFixed(costDay * 365, 2)],
        ['Current drawn', Number.isFinite(amps) ? `${toSignificant(amps, 4)} A` : '—'],
        ['Equivalent resistance', Number.isFinite(ohms) ? `${toSignificant(ohms, 4)} Ω` : '—'],
        ['Energy per year (MJ)', fmtFixed(kwhDay * 365 * 3.6, 1)],
        ['CO₂ per year (kg)*', fmtFixed(kwhDay * 365 * 0.233, 1)]
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');

      qs('#appliance-table', root).innerHTML = APPLIANCES.map(([name, w, h]) => {
        const yearly = (w * h * 365) / 1000;
        return `<tr>
          <td>${name}</td>
          <td class="mono">${fmt(w)} W</td>
          <td class="mono">${h}</td>
          <td class="mono">${fmtFixed(yearly, 1)}</td>
          <td class="mono">${fmtFixed(yearly * rate, 2)}</td>
        </tr>`;
      }).join('');
    };

    on(qs('#p-preset', root), 'change', (e) => {
      const value = e.target.value;
      if (!value) return;
      const [w, h] = value.split(':');
      qs('#p-watts', root).value = w;
      qs('#p-hours', root).value = h;
      calc();
    });

    ctx.live(calc);
  }
};
