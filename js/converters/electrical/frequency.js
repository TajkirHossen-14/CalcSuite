/** Frequency Converter — base unit: hertz. Period is the inverse override. */
import { unitTool, factorHow } from '../../core/unitTool.js';
import { linearUnits } from '../../core/UnitConverter.js';

const units = linearUnits([
  ['mHz', 'Millihertz', 'mHz', 1e-3, 'Hertz'],
  ['Hz', 'Hertz', 'Hz', 1, 'Hertz'],
  ['kHz', 'Kilohertz', 'kHz', 1e3, 'Hertz'],
  ['MHz', 'Megahertz', 'MHz', 1e6, 'Hertz'],
  ['GHz', 'Gigahertz', 'GHz', 1e9, 'Hertz'],
  ['THz', 'Terahertz', 'THz', 1e12, 'Hertz'],
  ['rpm', 'Revolutions per minute', 'RPM', 1 / 60, 'Rotational'],
  ['rps', 'Revolutions per second', 'RPS', 1, 'Rotational'],
  ['radps', 'Radians per second', 'rad/s', 1 / (2 * Math.PI), 'Rotational'],
  ['bpm', 'Beats per minute', 'BPM', 1 / 60, 'Rotational']
]);

units.period_s = { name: 'Period (seconds)', symbol: 's', group: 'Period', toBase: (s) => (s ? 1 / s : 0), fromBase: (hz) => (hz ? 1 / hz : 0) };
units.period_ms = { name: 'Period (milliseconds)', symbol: 'ms', group: 'Period', toBase: (ms) => (ms ? 1000 / ms : 0), fromBase: (hz) => (hz ? 1000 / hz : 0) };

export default unitTool({
  units,
  defaults: ['MHz', 'GHz'],
  quick: [
    { label: 'GHz → MHz', from: 'GHz', to: 'MHz', value: 2.4 },
    { label: 'Hz → period', from: 'Hz', to: 'period_ms', value: 50 },
    { label: 'RPM → Hz', from: 'rpm', to: 'Hz', value: 3000 },
    { label: 'rad/s → RPM', from: 'radps', to: 'rpm', value: 100 }
  ],
  how: `${factorHow('frequency', 'hertz', [
    '1 Hz = one cycle per second',
    '1 kHz = 10³ Hz, 1 MHz = 10⁶ Hz, 1 GHz = 10⁹ Hz',
    '1 RPM = 1/60 Hz — 3,000 RPM is exactly 50 Hz',
    '1 rad/s = 1/(2π) Hz, because one full turn is 2π radians'
  ])}
  <h4>Period is the reciprocal</h4>
  <p>Frequency and period describe the same wave from opposite ends, and they multiply to one:</p>
  <code class="formula">T = 1 / f        f = 1 / T</code>
  <p>So 50 Hz mains has a 20 ms period, and a 2.4 GHz Wi-Fi carrier repeats every 0.417 nanoseconds.
  Because that relationship is inverse rather than proportional, the period units supply their own
  conversion functions instead of a factor.</p>`
});
