/** Speed Converter — base unit: metre per second. */
import { unitTool, factorHow } from '../../core/unitTool.js';
import { linearUnits } from '../../core/UnitConverter.js';

const units = linearUnits([
  ['mps', 'Metre per second', 'm/s', 1],
  ['kph', 'Kilometre per hour', 'km/h', 1 / 3.6],
  ['mph', 'Mile per hour', 'mph', 0.44704],
  ['fps', 'Foot per second', 'ft/s', 0.3048],
  ['kn', 'Knot', 'kn', 0.514444444444],
  ['mach', 'Mach (at sea level, 15 °C)', 'Ma', 340.29],
  ['c', 'Speed of light', 'c', 299792458],
  ['minkm', 'Minutes per kilometre (pace)', 'min/km', null]
]);

// Pace is inversely proportional to speed, so it overrides the linear factor.
units.minkm = {
  name: 'Minutes per kilometre (pace)',
  symbol: 'min/km',
  toBase: (pace) => (pace > 0 ? 1000 / (pace * 60) : 0),
  fromBase: (mps) => (mps > 0 ? 1000 / (mps * 60) : 0)
};

export default unitTool({
  units,
  defaults: ['kph', 'mph'],
  quick: [
    { label: '100 km/h → mph', from: 'kph', to: 'mph', value: 100 },
    { label: '60 mph → km/h', from: 'mph', to: 'kph', value: 60 },
    { label: 'm/s → km/h', from: 'mps', to: 'kph', value: 10 },
    { label: 'Running pace', from: 'kph', to: 'minkm', value: 12 }
  ],
  how: `${factorHow('speed', 'metres per second', [
    '1 km/h = 1000/3600 = 0.2777… m/s',
    '1 mph = 0.44704 m/s exactly (1,609.344 m ÷ 3,600 s)',
    '1 knot = 1 nautical mile per hour = 0.514444 m/s',
    'Mach 1 ≈ 340.29 m/s at sea level and 15 °C — it falls with temperature, so this is an approximation'
  ])}
  <h4>Pace is the odd one out</h4>
  <p>Minutes per kilometre is an <em>inverse</em> measure: the faster you go, the smaller the number.
  It cannot be a simple multiplier, so it supplies its own conversion closures
  (<code>1000 / (pace × 60)</code>) exactly like the temperature scales do. Handy mental anchors:
  a 6:00 min/km pace is 10 km/h, and 5:00 min/km is 12 km/h.</p>`
});
