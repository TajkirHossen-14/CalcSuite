/**
 * tools.js — the single source of truth for the whole site map.
 *
 * Every category lists its tools; each tool declares a lazy `load()` that
 * dynamic-imports its module only when the route is visited. The home page,
 * the header search, the category pages, favorites, history and the router
 * are all generated from this one structure.
 */

export const CATEGORIES = [
  {
    id: 'math',
    group: 'calculators',
    name: 'Math',
    icon: 'fa-solid fa-square-root-variable',
    blurb: 'Arithmetic, statistics, algebra and number crunching.',
    tools: [
      { id: 'simple-calculator', name: 'Simple Calculator', icon: 'fa-solid fa-calculator', desc: 'Keypad + keyboard basic arithmetic with a running expression.', keywords: 'basic add subtract multiply divide keypad', load: () => import('./calculators/math/simpleCalculator.js') },
      { id: 'scientific-calculator', name: 'Scientific Calculator', icon: 'fa-solid fa-flask', desc: 'Trig, logs, powers, roots, constants and a deg/rad toggle.', keywords: 'sin cos tan log ln power root pi exponent', load: () => import('./calculators/math/scientificCalculator.js') },
      { id: 'percentage', name: 'Percentage Calculator', icon: 'fa-solid fa-percent', desc: 'Percent of, is-what-percent, change, increase and decrease.', keywords: 'percent change increase decrease of', load: () => import('./calculators/math/percentage.js') },
      { id: 'average', name: 'Average Calculator', icon: 'fa-solid fa-chart-simple', desc: 'Mean, median, mode, range and sum from any list of numbers.', keywords: 'mean median mode average range sum', load: () => import('./calculators/math/average.js') },
      { id: 'standard-deviation', name: 'Standard Deviation', icon: 'fa-solid fa-wave-square', desc: 'Population or sample σ, variance and full working steps.', keywords: 'variance sigma statistics spread deviation', load: () => import('./calculators/math/standardDeviation.js') },
      { id: 'fraction', name: 'Fraction Calculator', icon: 'fa-solid fa-divide', desc: 'Add, subtract, multiply, divide and simplify fractions.', keywords: 'fractions numerator denominator simplify mixed', load: () => import('./calculators/math/fraction.js') },
      { id: 'ratio', name: 'Ratio Calculator', icon: 'fa-solid fa-scale-balanced', desc: 'Simplify ratios, solve proportions and scale to a value.', keywords: 'proportion simplify scale aspect', load: () => import('./calculators/math/ratio.js') },
      { id: 'lcm-gcf', name: 'LCM & GCF Calculator', icon: 'fa-solid fa-network-wired', desc: 'Least common multiple and greatest common factor, Euclid-style.', keywords: 'lcm gcd gcf hcf multiple factor euclidean', load: () => import('./calculators/math/lcmGcf.js') },
      { id: 'quadratic', name: 'Quadratic Solver', icon: 'fa-solid fa-superscript', desc: 'Roots, discriminant, vertex — including complex roots.', keywords: 'equation roots discriminant parabola vertex ax2', load: () => import('./calculators/math/quadratic.js') },
      { id: 'base-calculator', name: 'Base Calculator', icon: 'fa-solid fa-1', desc: 'Arithmetic directly in binary, octal, decimal or hex.', keywords: 'binary hex octal radix arithmetic bitwise', load: () => import('./calculators/math/baseCalculator.js') },
      { id: 'random-number', name: 'Random Number Generator', icon: 'fa-solid fa-dice', desc: 'Integers or decimals, ranges, batches and no-repeat mode.', keywords: 'rng dice lottery pick random shuffle', load: () => import('./calculators/math/randomNumber.js') }
    ]
  },
  {
    id: 'financial',
    group: 'calculators',
    name: 'Financial',
    icon: 'fa-solid fa-sack-dollar',
    blurb: 'Interest, loans, pricing and margins.',
    tools: [
      { id: 'interest', name: 'Interest Calculator', icon: 'fa-solid fa-chart-line', desc: 'Simple vs compound interest with any compounding frequency.', keywords: 'simple compound apy savings growth', load: () => import('./calculators/financial/interest.js') },
      { id: 'loan-emi', name: 'Loan / EMI Calculator', icon: 'fa-solid fa-building-columns', desc: 'Monthly payment, total interest and a full amortization table.', keywords: 'mortgage emi amortization repayment installment', load: () => import('./calculators/financial/loan.js') },
      { id: 'discount', name: 'Discount Calculator', icon: 'fa-solid fa-tags', desc: 'Sale price from a discount — or the discount from a sale price.', keywords: 'sale off price saving coupon', load: () => import('./calculators/financial/discount.js') },
      { id: 'vat-tax', name: 'VAT / Sales Tax', icon: 'fa-solid fa-receipt', desc: 'Add tax to a net price or strip tax out of a gross price.', keywords: 'vat gst sales tax net gross', load: () => import('./calculators/financial/vat.js') },
      { id: 'profit-margin', name: 'Profit Margin Calculator', icon: 'fa-solid fa-arrow-trend-up', desc: 'Cost, revenue, profit, margin and markup — solve for any.', keywords: 'markup margin profit revenue cost gross', load: () => import('./calculators/financial/profitMargin.js') }
    ]
  },
  {
    id: 'health',
    group: 'calculators',
    name: 'Health & Fitness',
    icon: 'fa-solid fa-heart-pulse',
    blurb: 'Body metrics and daily energy needs.',
    tools: [
      { id: 'bmi', name: 'BMI Calculator', icon: 'fa-solid fa-weight-scale', desc: 'Body mass index with colour-coded category, metric or imperial.', keywords: 'body mass index obese overweight healthy', load: () => import('./calculators/health/bmi.js') },
      { id: 'bmr', name: 'BMR & Calorie Needs', icon: 'fa-solid fa-fire', desc: 'Mifflin–St Jeor BMR plus TDEE for five activity levels.', keywords: 'metabolic rate tdee calories maintenance deficit', load: () => import('./calculators/health/bmr.js') },
      { id: 'ideal-weight', name: 'Ideal Body Weight', icon: 'fa-solid fa-person', desc: 'Devine, Robinson, Miller and Hamwi formulas side by side.', keywords: 'ibw devine robinson hamwi healthy weight range', load: () => import('./calculators/health/idealWeight.js') }
    ]
  },
  {
    id: 'datetime',
    group: 'calculators',
    name: 'Date & Time',
    icon: 'fa-regular fa-clock',
    blurb: 'Ages, spans, countdowns and durations.',
    tools: [
      { id: 'age', name: 'Age Calculator', icon: 'fa-solid fa-cake-candles', desc: 'Exact age in years, months and days — leap-year safe.', keywords: 'birthday dob how old years months', load: () => import('./calculators/datetime/age.js') },
      { id: 'date-difference', name: 'Date Difference', icon: 'fa-regular fa-calendar', desc: 'Days, weeks, months and business days between two dates.', keywords: 'between dates days apart workdays span', load: () => import('./calculators/datetime/dateDifference.js') },
      { id: 'countdown', name: 'Countdown Timer', icon: 'fa-solid fa-hourglass-half', desc: 'Live ticking countdown to any birthday, launch or deadline.', keywords: 'timer event deadline new year birthday live', load: () => import('./calculators/datetime/countdown.js') },
      { id: 'time-duration', name: 'Time Duration', icon: 'fa-solid fa-stopwatch', desc: 'Add or subtract hh:mm:ss durations and time-of-day spans.', keywords: 'hours minutes seconds add subtract timesheet', load: () => import('./calculators/datetime/timeDuration.js') }
    ]
  },
  {
    id: 'grade',
    group: 'calculators',
    name: 'Grades & Education',
    icon: 'fa-solid fa-graduation-cap',
    blurb: 'GPA, marks and exam targets.',
    tools: [
      { id: 'gpa', name: 'GPA Calculator', icon: 'fa-solid fa-award', desc: 'Weighted GPA with add/remove course rows and live totals.', keywords: 'grade point average credits semester courses', load: () => import('./calculators/grade/gpa.js') },
      { id: 'grade-percentage', name: 'Grade Calculator', icon: 'fa-solid fa-pen-ruler', desc: 'Marks to percentage plus the matching letter grade.', keywords: 'marks score percent letter grade test', load: () => import('./calculators/grade/gradePercentage.js') },
      { id: 'final-grade', name: 'Final Grade Needed', icon: 'fa-solid fa-bullseye', desc: 'The exam score you need to hit your target grade.', keywords: 'final exam needed target weight required', load: () => import('./calculators/grade/finalGrade.js') }
    ]
  },
  {
    id: 'electrical',
    group: 'calculators',
    name: 'Electrical & Physics',
    icon: 'fa-solid fa-bolt',
    blurb: 'Ohm’s law, power triangle and electrical work.',
    tools: [
      { id: 'ohms-law', name: "Ohm's Law Calculator", icon: 'fa-solid fa-plug-circle-bolt', desc: 'Give any two of V, I, R — get the third instantly.', keywords: 'voltage current resistance v=ir circuit', load: () => import('./calculators/electrical/ohmsLaw.js') },
      { id: 'watt-volt-amp-ohm', name: 'Watt–Volt–Amp–Ohm', icon: 'fa-solid fa-diagram-project', desc: 'The full power wheel: any two knowns solve the other two.', keywords: 'power wheel watts amps volts ohms triangle', load: () => import('./calculators/electrical/wattVoltAmpOhm.js') },
      { id: 'power-calculator', name: 'Power & Energy Cost', icon: 'fa-solid fa-battery-three-quarters', desc: 'P=VI, P=I²R, P=V²/R plus running-cost estimates.', keywords: 'watts kwh electricity bill consumption cost', load: () => import('./calculators/electrical/power.js') }
    ]
  },
  {
    id: 'everyday',
    group: 'calculators',
    name: 'Everyday Utility',
    icon: 'fa-solid fa-wand-magic-sparkles',
    blurb: 'Quick day-to-day answers.',
    tools: [
      { id: 'tip', name: 'Tip Calculator', icon: 'fa-solid fa-utensils', desc: 'Tip, total and per-person split with rounding options.', keywords: 'gratuity restaurant bill split service', load: () => import('./calculators/everyday/tip.js') },
      { id: 'age-in-units', name: 'Age in Days & Hours', icon: 'fa-solid fa-infinity', desc: 'Your life measured in months, weeks, days, hours, heartbeats.', keywords: 'days alive weeks hours minutes seconds lived', load: () => import('./calculators/everyday/ageInUnits.js') }
    ]
  },

  /* ------------------------------ CONVERTERS ------------------------------ */
  {
    id: 'units',
    group: 'converters',
    name: 'Everyday Units',
    icon: 'fa-solid fa-ruler-combined',
    blurb: 'One page per quantity — every direction handled.',
    tools: [
      { id: 'length', name: 'Length Converter', icon: 'fa-solid fa-ruler-horizontal', desc: 'mm, cm, m, km, inch, foot, yard, mile, nautical mile.', keywords: 'distance metre feet inches miles cm km', load: () => import('./converters/units/length.js') },
      { id: 'weight', name: 'Weight & Mass', icon: 'fa-solid fa-weight-hanging', desc: 'mg, g, kg, tonne, ounce, pound, stone, US ton.', keywords: 'mass kilogram pound ounce stone gram tonne', load: () => import('./converters/units/weight.js') },
      { id: 'temperature', name: 'Temperature Converter', icon: 'fa-solid fa-temperature-half', desc: 'Celsius, Fahrenheit, Kelvin, Rankine, Réaumur.', keywords: 'celsius fahrenheit kelvin rankine degrees', load: () => import('./converters/units/temperature.js') },
      { id: 'volume', name: 'Volume Converter', icon: 'fa-solid fa-flask-vial', desc: 'ml, litre, m³, cup, pint, quart, US & imperial gallon.', keywords: 'litre gallon cup pint fluid ounce capacity', load: () => import('./converters/units/volume.js') },
      { id: 'area', name: 'Area Converter', icon: 'fa-solid fa-vector-square', desc: 'mm², cm², m², km², hectare, acre, sq ft, sq mile.', keywords: 'square metre acre hectare footage land', load: () => import('./converters/units/area.js') },
      { id: 'speed', name: 'Speed Converter', icon: 'fa-solid fa-gauge-high', desc: 'km/h, mph, m/s, ft/s, knot, mach.', keywords: 'velocity kmh mph knots mach pace', load: () => import('./converters/units/speed.js') },
      { id: 'data-storage', name: 'Data Storage', icon: 'fa-solid fa-hard-drive', desc: 'bit, byte, KB/MB/GB/TB plus binary KiB/MiB/GiB.', keywords: 'bytes megabyte gigabyte kibibyte file size', load: () => import('./converters/units/dataStorage.js') },
      { id: 'custom-unit', name: 'Custom Unit Converter', icon: 'fa-solid fa-sliders', desc: 'Define your own factor and convert anything you like.', keywords: 'custom factor own unit ratio bespoke', load: () => import('./converters/units/custom.js') }
    ]
  },
  {
    id: 'number-system',
    group: 'converters',
    name: 'Number Systems',
    icon: 'fa-solid fa-code',
    blurb: 'Bases, text encodings and notation.',
    tools: [
      { id: 'base', name: 'Base Converter', icon: 'fa-solid fa-code', desc: 'Binary ⟷ decimal ⟷ octal ⟷ hex, all four shown at once.', keywords: 'binary decimal octal hexadecimal radix bits', load: () => import('./converters/numberSystem/base.js') },
      { id: 'ascii-text', name: 'Text ⟷ ASCII ⟷ Binary ⟷ Hex', icon: 'fa-solid fa-font', desc: 'Encode or decode text as ASCII codes, binary, hex or Base64.', keywords: 'ascii binary hex base64 encode decode charcode', load: () => import('./converters/numberSystem/asciiText.js') },
      { id: 'roman', name: 'Roman Numeral Converter', icon: 'fa-solid fa-monument', desc: 'Numbers to Roman numerals and back, 1–3,999,999.', keywords: 'roman numerals mcmxciv latin numbers', load: () => import('./converters/numberSystem/roman.js') },
      { id: 'fraction-decimal', name: 'Fraction ⟷ Decimal ⟷ %', icon: 'fa-solid fa-percent', desc: 'Any of the three updates the other two, live.', keywords: 'fraction decimal percentage repeating convert', load: () => import('./converters/numberSystem/fractionDecimal.js') },
      { id: 'scientific-notation', name: 'Scientific Notation', icon: 'fa-solid fa-atom', desc: 'Standard form, E-notation, engineering notation and back.', keywords: 'exponential e notation engineering mantissa', load: () => import('./converters/numberSystem/scientificNotation.js') }
    ]
  },
  {
    id: 'color',
    group: 'converters',
    name: 'Color',
    icon: 'fa-solid fa-palette',
    blurb: 'Every colour model, kept in sync.',
    tools: [
      { id: 'color', name: 'Color Converter', icon: 'fa-solid fa-eye-dropper', desc: 'RGB ⟷ HEX ⟷ HSL ⟷ HSV ⟷ CMYK with a live swatch.', keywords: 'hex rgb hsl hsv cmyk picker palette contrast', load: () => import('./converters/color/color.js') }
    ]
  },
  {
    id: 'electrical-conv',
    group: 'converters',
    name: 'Electrical & Energy',
    icon: 'fa-solid fa-charging-station',
    blurb: 'Electrical magnitudes across every scale.',
    tools: [
      { id: 'power', name: 'Power Converter', icon: 'fa-solid fa-plug', desc: 'W, kW, MW, hp, BTU/h, dBm, kcal/h.', keywords: 'watt kilowatt horsepower btu dbm', load: () => import('./converters/electrical/power.js') },
      { id: 'voltage', name: 'Voltage Converter', icon: 'fa-solid fa-bolt-lightning', desc: 'µV, mV, V, kV, MV — SI prefixes in one place.', keywords: 'volt millivolt kilovolt potential', load: () => import('./converters/electrical/voltage.js') },
      { id: 'frequency', name: 'Frequency Converter', icon: 'fa-solid fa-tower-broadcast', desc: 'Hz, kHz, MHz, GHz, THz, RPM and period.', keywords: 'hertz megahertz gigahertz rpm period', load: () => import('./converters/electrical/frequency.js') },
      { id: 'energy', name: 'Energy Converter', icon: 'fa-solid fa-fire-flame-curved', desc: 'J, kJ, cal, kcal, Wh, kWh, BTU, eV.', keywords: 'joule calorie kilowatt hour btu electronvolt', load: () => import('./converters/electrical/energy.js') }
    ]
  },
  {
    id: 'currency',
    group: 'converters',
    name: 'Currency',
    icon: 'fa-solid fa-money-bill-transfer',
    blurb: 'Live rates, cached for offline use.',
    tools: [
      { id: 'currency', name: 'Currency Converter', icon: 'fa-solid fa-coins', desc: 'Live exchange rates for 150+ currencies, cached locally.', keywords: 'exchange rate usd eur gbp forex money live', load: () => import('./converters/currency/currency.js') }
    ]
  }
];

/** Flat list of every tool, enriched with its category + hash path. */
export const TOOLS = CATEGORIES.flatMap((cat) =>
  cat.tools.map((tool) => ({
    ...tool,
    group: cat.group,
    categoryId: cat.id,
    categoryName: cat.name,
    categoryIcon: cat.icon,
    path: `#/${cat.group}/${tool.id}`,
    searchText: `${tool.name} ${tool.desc} ${tool.keywords} ${cat.name}`.toLowerCase()
  }))
);

const BY_KEY = new Map(TOOLS.map((t) => [`${t.group}/${t.id}`, t]));

export const getTool = (group, id) => BY_KEY.get(`${group}/${id}`) || null;
export const getToolByKey = (key) => BY_KEY.get(key) || null;
export const getCategories = (group) => CATEGORIES.filter((c) => c.group === group);
export const countTools = (group) => TOOLS.filter((t) => !group || t.group === group).length;

/**
 * Fuzzy-ish search: scores name matches above description/keyword matches.
 * Pure function + closure over the query — used by header search and home grid.
 */
export function searchTools(query, limit = Infinity) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return TOOLS
    .map((tool) => {
      let score = 0;
      for (const term of terms) {
        if (!tool.searchText.includes(term)) return null;
        if (tool.name.toLowerCase().startsWith(term)) score += 6;
        else if (tool.name.toLowerCase().includes(term)) score += 4;
        else if (tool.categoryName.toLowerCase().includes(term)) score += 2;
        else score += 1;
      }
      return { tool, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .slice(0, limit)
    .map((r) => r.tool);
}
