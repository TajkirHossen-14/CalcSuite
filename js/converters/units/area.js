/** Area Converter — base unit: square metre. */
import { unitTool, factorHow } from '../../core/unitTool.js';
import { linearUnits } from '../../core/UnitConverter.js';

const units = linearUnits([
  ['mm2', 'Square millimetre', 'mm²', 1e-6, 'Metric'],
  ['cm2', 'Square centimetre', 'cm²', 1e-4, 'Metric'],
  ['m2', 'Square metre', 'm²', 1, 'Metric'],
  ['a', 'Are', 'a', 100, 'Metric'],
  ['ha', 'Hectare', 'ha', 10000, 'Metric'],
  ['km2', 'Square kilometre', 'km²', 1e6, 'Metric'],
  ['in2', 'Square inch', 'in²', 0.00064516, 'Imperial / US'],
  ['ft2', 'Square foot', 'ft²', 0.09290304, 'Imperial / US'],
  ['yd2', 'Square yard', 'yd²', 0.83612736, 'Imperial / US'],
  ['ac', 'Acre', 'ac', 4046.8564224, 'Imperial / US'],
  ['mi2', 'Square mile', 'mi²', 2589988.110336, 'Imperial / US'],
  ['sqperch', 'Square rod / perch', 'rd²', 25.29285264, 'Historic']
]);

export default unitTool({
  units,
  defaults: ['m2', 'ft2'],
  quick: [
    { label: 'm² → ft²', from: 'm2', to: 'ft2', value: 100 },
    { label: 'acre → ha', from: 'ac', to: 'ha', value: 1 },
    { label: 'ha → m²', from: 'ha', to: 'm2', value: 1 },
    { label: 'ft² → m²', from: 'ft2', to: 'm2', value: 1500 }
  ],
  how: `${factorHow('area', 'square metres', [
    '1 ft² = 0.3048² = 0.09290304 m² — area factors are the square of the length factors',
    '1 acre = 4,840 yd² = 4,046.856 m² (roughly a football pitch minus the end zones)',
    '1 hectare = 10,000 m² = 2.471 acres',
    '1 square mile = 640 acres = 2.59 km²'
  ])}
  <h4>Squaring catches people out</h4>
  <p>A room twice as long and twice as wide has <em>four</em> times the area, and the same logic
  applies to unit factors: because 1 m = 3.28 ft, 1 m² = 3.28² ≈ 10.76 ft². Each factor in the
  table above is already squared, so you never have to remember to do it yourself.</p>`
});
