/** Volume Converter — base unit: litre. */
import { unitTool, factorHow } from '../../core/unitTool.js';
import { linearUnits } from '../../core/UnitConverter.js';

const units = linearUnits([
  ['ml', 'Millilitre', 'ml', 0.001, 'Metric'],
  ['cl', 'Centilitre', 'cl', 0.01, 'Metric'],
  ['l', 'Litre', 'L', 1, 'Metric'],
  ['m3', 'Cubic metre', 'm³', 1000, 'Metric'],
  ['cm3', 'Cubic centimetre', 'cm³', 0.001, 'Metric'],
  ['tsp', 'Teaspoon (US)', 'tsp', 0.00492892159375, 'US kitchen'],
  ['tbsp', 'Tablespoon (US)', 'tbsp', 0.01478676478125, 'US kitchen'],
  ['floz', 'Fluid ounce (US)', 'fl oz', 0.0295735295625, 'US kitchen'],
  ['cup', 'Cup (US legal)', 'cup', 0.24, 'US kitchen'],
  ['pt', 'Pint (US)', 'pt', 0.473176473, 'US liquid'],
  ['qt', 'Quart (US)', 'qt', 0.946352946, 'US liquid'],
  ['gal', 'Gallon (US)', 'gal', 3.785411784, 'US liquid'],
  ['floz_uk', 'Fluid ounce (imperial)', 'fl oz (UK)', 0.0284130625, 'Imperial'],
  ['pt_uk', 'Pint (imperial)', 'pt (UK)', 0.56826125, 'Imperial'],
  ['gal_uk', 'Gallon (imperial)', 'gal (UK)', 4.54609, 'Imperial'],
  ['in3', 'Cubic inch', 'in³', 0.016387064, 'Other'],
  ['ft3', 'Cubic foot', 'ft³', 28.316846592, 'Other'],
  ['bbl', 'Oil barrel', 'bbl', 158.987294928, 'Other']
]);

export default unitTool({
  units,
  defaults: ['l', 'gal'],
  quick: [
    { label: 'L → US gal', from: 'l', to: 'gal', value: 10 },
    { label: 'cup → ml', from: 'cup', to: 'ml', value: 1 },
    { label: 'ml → fl oz', from: 'ml', to: 'floz', value: 250 },
    { label: 'UK vs US pint', from: 'pt_uk', to: 'pt', value: 1 }
  ],
  how: `${factorHow('volume', 'litres', [
    '1 litre = 1,000 cm³ = 1 dm³ exactly',
    '1 US gallon = 231 in³ = 3.785411784 L',
    '1 imperial gallon = 4.54609 L — about 20% larger than the US gallon',
    '1 US cup (legal) = 240 ml; the customary cup is 236.588 ml',
    '1 oil barrel = 42 US gallons = 158.987 L'
  ])}
  <h4>Watch the US / imperial trap</h4>
  <p>A pint in London is 568 ml; a pint in Boston is 473 ml. Fluid ounces differ too (28.41 ml UK
  vs 29.57 ml US), and confusingly the imperial ounce is the <em>larger</em> one even though the
  imperial gallon holds more. Both families are listed separately so you never mix them by accident.</p>`
});
