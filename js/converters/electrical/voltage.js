/** Voltage Converter — base unit: volt. */
import { unitTool, factorHow } from '../../core/unitTool.js';
import { linearUnits } from '../../core/UnitConverter.js';

const units = linearUnits([
  ['nV', 'Nanovolt', 'nV', 1e-9],
  ['uV', 'Microvolt', 'µV', 1e-6],
  ['mV', 'Millivolt', 'mV', 1e-3],
  ['V', 'Volt', 'V', 1],
  ['kV', 'Kilovolt', 'kV', 1e3],
  ['MV', 'Megavolt', 'MV', 1e6],
  ['GV', 'Gigavolt', 'GV', 1e9],
  ['abV', 'Abvolt (CGS)', 'abV', 1e-8],
  ['statV', 'Statvolt (CGS)', 'statV', 299.792458]
]);

export default unitTool({
  units,
  defaults: ['V', 'mV'],
  quick: [
    { label: 'V → mV', from: 'V', to: 'mV', value: 3.3 },
    { label: 'kV → V', from: 'kV', to: 'V', value: 11 },
    { label: 'µV → mV', from: 'uV', to: 'mV', value: 500 }
  ],
  how: `${factorHow('voltage', 'volts', [
    'SI prefixes step by 1,000: 1 kV = 1,000 V, 1 mV = 0.001 V',
    '1 statvolt = 299.792458 V (it carries the speed of light because of how CGS units are defined)',
    '1 abvolt = 10⁻⁸ V'
  ])}
  <h4>What voltage actually is</h4>
  <p>Voltage is electrical potential difference: the work done per unit charge moving between two
  points, so 1 V = 1 joule per coulomb. It is always measured <em>between</em> two points, which
  is why "the voltage at this wire" is only meaningful once you name a reference (usually ground).</p>
  <h4>RMS vs peak</h4>
  <p>Mains AC quoted as 230 V is the RMS value; the peak is 230 × √2 ≈ 325 V. This converter scales
  whichever figure you type — it doesn't convert between RMS and peak, so decide which one you mean
  before converting.</p>`
});
