/** Weight & Mass Converter — base unit: kilogram. */
import { unitTool, factorHow } from '../../core/unitTool.js';
import { linearUnits } from '../../core/UnitConverter.js';

const units = linearUnits([
  ['mcg', 'Microgram', 'µg', 1e-9, 'Metric'],
  ['mg', 'Milligram', 'mg', 1e-6, 'Metric'],
  ['g', 'Gram', 'g', 0.001, 'Metric'],
  ['kg', 'Kilogram', 'kg', 1, 'Metric'],
  ['t', 'Tonne (metric ton)', 't', 1000, 'Metric'],
  ['ct', 'Carat', 'ct', 0.0002, 'Metric'],
  ['gr', 'Grain', 'gr', 6.479891e-5, 'Imperial / US'],
  ['oz', 'Ounce', 'oz', 0.028349523125, 'Imperial / US'],
  ['lb', 'Pound', 'lb', 0.45359237, 'Imperial / US'],
  ['st', 'Stone', 'st', 6.35029318, 'Imperial / US'],
  ['ton_us', 'US ton (short)', 'ton', 907.18474, 'Imperial / US'],
  ['ton_uk', 'UK ton (long)', 'long ton', 1016.0469088, 'Imperial / US'],
  ['ozt', 'Troy ounce', 'oz t', 0.0311034768, 'Precious metal']
]);

export default unitTool({
  units,
  defaults: ['kg', 'lb'],
  quick: [
    { label: 'kg → lb', from: 'kg', to: 'lb', value: 70 },
    { label: 'lb → kg', from: 'lb', to: 'kg', value: 150 },
    { label: 'g → oz', from: 'g', to: 'oz', value: 500 },
    { label: 'st → kg', from: 'st', to: 'kg', value: 11 }
  ],
  how: `${factorHow('mass', 'kilograms', [
    '1 pound = 0.45359237 kg — the exact international definition',
    '1 ounce = 1/16 lb = 28.349523125 g',
    '1 stone = 14 lb = 6.35029318 kg (still used for body weight in the UK)',
    '1 US short ton = 2,000 lb; 1 UK long ton = 2,240 lb; 1 tonne = 1,000 kg',
    '1 troy ounce = 31.1034768 g — used for gold and silver, not the same as a regular ounce'
  ])}
  <h4>Mass or weight?</h4>
  <p>Strictly, kilograms measure mass and newtons measure weight (the force gravity exerts on that
  mass). Everyday usage conflates the two, and since every unit here scales identically, the
  distinction doesn't change any number on this page.</p>`
});
