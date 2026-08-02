/** Energy Converter — base unit: joule. */
import { unitTool, factorHow } from '../../core/unitTool.js';
import { linearUnits } from '../../core/UnitConverter.js';

const units = linearUnits([
  ['mJ', 'Millijoule', 'mJ', 1e-3, 'SI'],
  ['J', 'Joule', 'J', 1, 'SI'],
  ['kJ', 'Kilojoule', 'kJ', 1e3, 'SI'],
  ['MJ', 'Megajoule', 'MJ', 1e6, 'SI'],
  ['GJ', 'Gigajoule', 'GJ', 1e9, 'SI'],
  ['cal', 'Calorie (thermochemical)', 'cal', 4.184, 'Food & heat'],
  ['kcal', 'Kilocalorie (food Calorie)', 'kcal', 4184, 'Food & heat'],
  ['btu', 'British thermal unit', 'BTU', 1055.05585262, 'Food & heat'],
  ['therm', 'Therm', 'thm', 105505585.262, 'Food & heat'],
  ['Wh', 'Watt-hour', 'Wh', 3600, 'Electrical'],
  ['kWh', 'Kilowatt-hour', 'kWh', 3.6e6, 'Electrical'],
  ['MWh', 'Megawatt-hour', 'MWh', 3.6e9, 'Electrical'],
  ['eV', 'Electronvolt', 'eV', 1.602176634e-19, 'Atomic'],
  ['ftlb', 'Foot-pound', 'ft·lb', 1.3558179483314004, 'Mechanical'],
  ['toe', 'Tonne of oil equivalent', 'toe', 4.1868e10, 'Fuel']
]);

export default unitTool({
  units,
  defaults: ['kWh', 'MJ'],
  quick: [
    { label: 'kWh → MJ', from: 'kWh', to: 'MJ', value: 1 },
    { label: 'kcal → kJ', from: 'kcal', to: 'kJ', value: 2000 },
    { label: 'BTU → kWh', from: 'btu', to: 'kWh', value: 100000 },
    { label: 'J → eV', from: 'J', to: 'eV', value: 1 }
  ],
  how: `${factorHow('energy', 'joules', [
    '1 watt-hour = 1 W × 3,600 s = 3,600 J, so 1 kWh = 3.6 MJ',
    '1 food Calorie (capital C) = 1 kcal = 4,184 J',
    '1 BTU = 1,055.06 J — the heat that raises one pound of water by 1 °F',
    '1 electronvolt = 1.602176634 × 10⁻¹⁹ J (an exact SI definition since 2019)'
  ])}
  <h4>Energy vs power</h4>
  <p>Power is a rate, energy is an amount: energy = power × time. A 2 kW heater running for
  90 minutes uses 2 × 1.5 = 3 kWh. Confusing the two is the single most common mistake on
  electricity bills — the tariff is per kWh (energy), not per kW (power).</p>
  <h4>Calories, twice over</h4>
  <p>The "calorie" on a nutrition label is actually a kilocalorie: 4,184 J. The scientific
  lowercase calorie is a thousand times smaller. Both are listed so you can pick deliberately.</p>`
});
