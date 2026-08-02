/**
 * Length Converter — pure configuration on top of the shared UnitConverter.
 * Base unit: metre.
 */
import { unitTool, factorHow } from '../../core/unitTool.js';
import { linearUnits } from '../../core/UnitConverter.js';

const units = linearUnits([
  ['nm', 'Nanometre', 'nm', 1e-9, 'Metric'],
  ['um', 'Micrometre', 'µm', 1e-6, 'Metric'],
  ['mm', 'Millimetre', 'mm', 0.001, 'Metric'],
  ['cm', 'Centimetre', 'cm', 0.01, 'Metric'],
  ['dm', 'Decimetre', 'dm', 0.1, 'Metric'],
  ['m', 'Metre', 'm', 1, 'Metric'],
  ['km', 'Kilometre', 'km', 1000, 'Metric'],
  ['in', 'Inch', 'in', 0.0254, 'Imperial / US'],
  ['ft', 'Foot', 'ft', 0.3048, 'Imperial / US'],
  ['yd', 'Yard', 'yd', 0.9144, 'Imperial / US'],
  ['mi', 'Mile', 'mi', 1609.344, 'Imperial / US'],
  ['nmi', 'Nautical mile', 'nmi', 1852, 'Marine & space'],
  ['fathom', 'Fathom', 'ftm', 1.8288, 'Marine & space'],
  ['ly', 'Light year', 'ly', 9.4607304725808e15, 'Marine & space'],
  ['au', 'Astronomical unit', 'AU', 1.495978707e11, 'Marine & space']
]);

export default unitTool({
  units,
  defaults: ['cm', 'in'],
  quick: [
    { label: 'cm → in', from: 'cm', to: 'in', value: 10 },
    { label: 'ft → m', from: 'ft', to: 'm', value: 6 },
    { label: 'km → mi', from: 'km', to: 'mi', value: 5 },
    { label: 'in → mm', from: 'in', to: 'mm', value: 1 },
    { label: 'mi → km', from: 'mi', to: 'km', value: 26.2 }
  ],
  how: `${factorHow('length', 'metres', [
    '1 inch = 0.0254 m — exact, by international agreement since 1959',
    '1 foot = 12 in = 0.3048 m; 1 yard = 3 ft = 0.9144 m',
    '1 mile = 1,760 yd = 1,609.344 m',
    '1 nautical mile = 1,852 m — one minute of latitude',
    '1 light year = 9.4607304725808 × 10¹⁵ m'
  ])}
  <h4>Why one page instead of thirty</h4>
  <p>With 15 units there are 210 ordered pairs. Reference sites publish a page for each of them;
  CalcSuite stores 15 numbers and lets the two dropdowns pick which pair to use. Type in either
  box — conversion runs in both directions from whichever field you last touched.</p>`
});
