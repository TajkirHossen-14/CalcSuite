/**
 * Temperature Converter — the deliberate exception to the factor-table rule.
 *
 * Temperature scales have different zero points, so a single multiplier can't
 * express them. Each unit therefore supplies explicit toBase/fromBase closures
 * (base unit: Kelvin) — the same UnitConverter class handles it unchanged.
 */
import { unitTool } from '../../core/unitTool.js';

const units = {
  c: { name: 'Celsius', symbol: '°C', toBase: (c) => c + 273.15, fromBase: (k) => k - 273.15 },
  f: { name: 'Fahrenheit', symbol: '°F', toBase: (f) => (f - 32) * (5 / 9) + 273.15, fromBase: (k) => (k - 273.15) * (9 / 5) + 32 },
  k: { name: 'Kelvin', symbol: 'K', toBase: (k) => k, fromBase: (k) => k },
  r: { name: 'Rankine', symbol: '°R', toBase: (r) => r * (5 / 9), fromBase: (k) => k * (9 / 5) },
  re: { name: 'Réaumur', symbol: '°Ré', toBase: (re) => re * 1.25 + 273.15, fromBase: (k) => (k - 273.15) * 0.8 },
  de: { name: 'Delisle', symbol: '°De', toBase: (de) => 373.15 - de * (2 / 3), fromBase: (k) => (373.15 - k) * 1.5 }
};

export default unitTool({
  units,
  defaults: ['c', 'f'],
  precision: 8,
  note: 'Tip: −40 is the one temperature where Celsius and Fahrenheit agree.',
  quick: [
    { label: 'Body temp 37 °C', from: 'c', to: 'f', value: 37 },
    { label: 'Fever 100 °F', from: 'f', to: 'c', value: 100 },
    { label: 'Oven 180 °C', from: 'c', to: 'f', value: 180 },
    { label: 'Absolute zero', from: 'k', to: 'c', value: 0 }
  ],
  how: `
    <p>Length, weight and volume all share a zero point, so one multiplier converts them.
    Temperature does not: 0 °C is 32 °F, not 0 °F. Each scale needs an offset <em>and</em> a slope,
    which is why this tool overrides the generic factor engine with real formulas.</p>
    <code class="formula">K  = °C + 273.15
°F = °C × 9/5 + 32
°C = (°F − 32) × 5/9
°R = K × 9/5                (Rankine: Fahrenheit-sized degrees from absolute zero)
°Ré = °C × 0.8              (Réaumur: water boils at 80°)
°De = (100 − °C) × 3/2      (Delisle: runs backwards)</code>
    <h4>How the override works</h4>
    <p>Every unit here supplies a pair of closures, <code>toBase</code> and <code>fromBase</code>,
    that translate to and from Kelvin. <code>UnitConverter.convert()</code> checks for those
    functions before falling back to multiplication, so the same class, UI and swap button power
    both the linear converters and this non-linear one.</p>
    <h4>Sanity checks</h4>
    <ul>
      <li>Absolute zero: 0 K = −273.15 °C = −459.67 °F</li>
      <li>Water freezes: 273.15 K = 0 °C = 32 °F</li>
      <li>Water boils: 373.15 K = 100 °C = 212 °F</li>
      <li>The scales cross at −40: −40 °C = −40 °F</li>
    </ul>`
});
