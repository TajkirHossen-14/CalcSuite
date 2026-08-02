/** Power Converter — base unit: watt. Includes the logarithmic dBm scale. */
import { unitTool, factorHow } from '../../core/unitTool.js';
import { linearUnits } from '../../core/UnitConverter.js';

const units = linearUnits([
  ['uW', 'Microwatt', 'µW', 1e-6, 'SI'],
  ['mW', 'Milliwatt', 'mW', 1e-3, 'SI'],
  ['W', 'Watt', 'W', 1, 'SI'],
  ['kW', 'Kilowatt', 'kW', 1e3, 'SI'],
  ['MW', 'Megawatt', 'MW', 1e6, 'SI'],
  ['GW', 'Gigawatt', 'GW', 1e9, 'SI'],
  ['hp', 'Horsepower (mechanical)', 'hp', 745.6998715822702, 'Mechanical'],
  ['hp_m', 'Horsepower (metric)', 'PS', 735.49875, 'Mechanical'],
  ['btuh', 'BTU per hour', 'BTU/h', 0.29307107017, 'Thermal'],
  ['kcalh', 'Kilocalorie per hour', 'kcal/h', 1.163, 'Thermal'],
  ['ftlbs', 'Foot-pound per second', 'ft·lb/s', 1.3558179483314004, 'Mechanical'],
  ['ton_r', 'Ton of refrigeration', 'RT', 3516.8528420667, 'Thermal']
]);

units.dbm = {
  name: 'Decibel-milliwatt',
  symbol: 'dBm',
  group: 'Logarithmic',
  toBase: (dbm) => 10 ** (dbm / 10) / 1000,
  fromBase: (w) => (w > 0 ? 10 * Math.log10(w * 1000) : -Infinity)
};

export default unitTool({
  units,
  defaults: ['kW', 'hp'],
  quick: [
    { label: 'kW → hp', from: 'kW', to: 'hp', value: 100 },
    { label: 'hp → kW', from: 'hp', to: 'kW', value: 150 },
    { label: 'W → dBm', from: 'W', to: 'dbm', value: 1 },
    { label: 'BTU/h → kW', from: 'btuh', to: 'kW', value: 12000 }
  ],
  how: `${factorHow('power', 'watts', [
    '1 mechanical horsepower = 550 ft·lb/s = 745.6999 W',
    '1 metric horsepower (PS) = 735.49875 W — car brochures often mix the two',
    '1 BTU/h = 0.293071 W; an air conditioner rated 12,000 BTU/h draws about 3.5 kW of cooling',
    '1 ton of refrigeration = 12,000 BTU/h = 3.517 kW'
  ])}
  <h4>dBm is logarithmic, not linear</h4>
  <p>Radio and audio work in decibels relative to one milliwatt, so it needs its own conversion
  closures rather than a factor:</p>
  <code class="formula">dBm = 10 × log₁₀(P in mW)
P   = 10^(dBm / 10) mW</code>
  <p>Useful anchors: 0 dBm = 1 mW, 30 dBm = 1 W, and every +3 dBm roughly doubles the power.</p>`
});
