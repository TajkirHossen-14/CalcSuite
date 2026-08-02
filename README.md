# CalcSuite

> **Every calculator and converter you need, in one modern place.**

CalcSuite is a 50-tool calculator and converter suite built as a single-page application with
**zero frameworks, zero dependencies and zero build step** — just semantic HTML5, CSS custom
properties and vanilla ES modules.

It is a deliberate answer to the two things that make sites like RapidTables painful to use:

| Problem | CalcSuite's fix |
| --- | --- |
| **Fragmentation** — a separate page for "cm to inches", another for "inches to cm", another for "cm to feet"… | **One unified bidirectional tool per category.** Two dropdowns and a ⇄ swap button replace dozens of one-way pages. The Length converter alone covers 15 units — 210 directional pairs — on one screen. |
| **Dated UI, ad clutter, "Calculate" buttons** | A modern dark/light interface, **live results as you type**, no ads, no page reloads, keyboard shortcuts and a mobile-first responsive layout. |

---

## Table of contents

- [Quick start](#quick-start)
- [Feature overview](#feature-overview)
- [Complete tool list](#complete-tool-list)
- [URI map](#uri-map)
- [Architecture](#architecture)
- [Data model & storage](#data-model--storage)
- [Folder structure](#folder-structure)
- [JavaScript techniques on show](#javascript-techniques-on-show)
- [Accessibility](#accessibility)
- [Browser support](#browser-support)
- [Not yet implemented](#not-yet-implemented)
- [Recommended next steps](#recommended-next-steps)

---

## Quick start

There is nothing to install and nothing to compile.

```bash
# 1. Get the files
git clone https://github.com/TajkirHossen-14/calcsuite.git
cd calcsuite

# 2. Serve them over HTTP (ES modules are blocked on file://)
python3 -m http.server 8080
#   or: npx serve .
#   or: php -S localhost:8080

# 3. Open
open http://localhost:8080
```

> **Why a server is required:** the app uses native ES modules and dynamic `import()`. Browsers
> enforce CORS on module scripts, which the `file://` protocol cannot satisfy. Any static file
> server works — including GitHub Pages, Netlify, Vercel or Cloudflare Pages with no configuration.

### Deployment

The project is 100% static, so deploying is a file copy. To publish this project from the editor,
open the **Publish tab** and deploy in one click.

---

## Feature overview

### Core
- **50 tools** across **12 categories** — 31 calculators and 19 converters.
- **Live calculation.** Results update as you type; simple tools have no "Calculate" button at all.
- **Unified bidirectional converters.** Pick any two units, swap them with ⇄, and see every other
  unit at once in the "all units" list.
- **Dark & light themes.** Persisted in `localStorage` and applied by an inline script *before first
  paint*, so there is never a flash of the wrong theme.
- **SPA routing without a framework.** A hash router with dynamic `import()` means the browser
  downloads only the one module the current route needs.
- **Fully responsive.** A single collapsible drawer holds the navigation, search, theme toggle and
  GitHub link on small screens; the brand wordmark stays visible at every width.

### Productivity
- **Global search** (`/` to focus) with scored, ranked, debounced live results.
- **Favorites** — star any tool; pinned tools surface on the home page and at `#/favorites`.
- **Calculation history** — the last 60 results, deduplicated, at `#/history`.
- **Recently used** tools on the home page.
- **Copy result** button on every tool, plus a share button that copies a deep link.
- **Keyboard shortcuts** — `/` focus search, `Esc` close, `Shift+D` toggle theme, and `g` followed
  by `h`/`c`/`v`/`f`/`y` to jump to Home / Calculators / Converters / Favorites / History.
- **PWA** — installable, with a cache-first service worker for offline use.

---

## Complete tool list

### Calculators (31)

| Category | Tools |
| --- | --- |
| **Math (11)** | Simple Calculator · Scientific Calculator · Percentage · Average & Mean · Standard Deviation · Fraction · Ratio & Proportion · LCM & GCF · Quadratic Equation · Base Calculator · Random Number |
| **Financial (5)** | Interest (simple & compound) · Loan / EMI with amortization · Discount · VAT / Sales Tax · Profit Margin |
| **Health (3)** | BMI · BMR & TDEE · Ideal Weight |
| **Date & Time (4)** | Age · Date Difference · Countdown Timer · Time Duration |
| **Grade (3)** | GPA · Grade Calculator · Final Grade Needed |
| **Electrical & Physics (3)** | Ohm's Law · Watt–Volt–Amp–Ohm power wheel · Power & Energy Cost |
| **Everyday (2)** | Tip Calculator · Age in Days & Hours |

### Converters (19)

| Category | Tools |
| --- | --- |
| **Units (8)** | Length · Weight & Mass · Temperature · Volume · Area · Speed · Data Storage · **Custom Unit Converter** |
| **Number Systems (5)** | Base Converter (bin/oct/dec/hex + custom radix) · ASCII & Text · Roman Numerals · Fraction ⟷ Decimal ⟷ Percent · Scientific Notation |
| **Color (1)** | Color Converter — RGB / HEX / HSL / HSV / CMYK + WCAG contrast |
| **Electrical (4)** | Power · Voltage · Frequency · Energy |
| **Currency (1)** | Live Currency Converter |

---

## URI map

All routes are hash-based, so every tool is directly linkable and shareable.

### Top-level

| Path | View |
| --- | --- |
| `#/` | Home — hero, recents, favorites, searchable tool grid grouped by category |
| `#/calculators` | Index of all 31 calculators |
| `#/converters` | Index of all 19 converters |
| `#/favorites` | Your starred tools |
| `#/history` | Your last 60 calculations |
| `#/about` | About, tech notes and keyboard shortcuts |
| *anything else* | 404 view with search and suggestions |

### Tool routes

Pattern: **`#/calculators/:id`** and **`#/converters/:id`**

<details>
<summary><strong>All 50 tool routes</strong></summary>

```
#/calculators/simple-calculator        #/converters/length
#/calculators/scientific-calculator    #/converters/weight
#/calculators/percentage               #/converters/temperature
#/calculators/average                  #/converters/volume
#/calculators/standard-deviation       #/converters/area
#/calculators/fraction                 #/converters/speed
#/calculators/ratio                    #/converters/data-storage
#/calculators/lcm-gcf                  #/converters/custom
#/calculators/quadratic
#/calculators/base-calculator          #/converters/base
#/calculators/random-number            #/converters/ascii-text
                                       #/converters/roman
#/calculators/interest                 #/converters/fraction-decimal
#/calculators/loan                     #/converters/scientific-notation
#/calculators/discount
#/calculators/vat                      #/converters/color
#/calculators/profit-margin
                                       #/converters/power
#/calculators/bmi                      #/converters/voltage
#/calculators/bmr                      #/converters/frequency
#/calculators/ideal-weight             #/converters/energy

#/calculators/age                      #/converters/currency
#/calculators/date-difference
#/calculators/countdown
#/calculators/time-duration

#/calculators/gpa
#/calculators/grade-percentage
#/calculators/final-grade

#/calculators/ohms-law
#/calculators/watt-volt-amp-ohm
#/calculators/power-calculator

#/calculators/tip
#/calculators/age-in-units
```
</details>

### External

| Link | Target |
| --- | --- |
| GitHub (navbar + footer) | <https://github.com/TajkirHossen-14> |

---

## Architecture

```
index.html  ──▶  js/main.js
                      │
                      ├── ThemeManager      (dark/light + persistence)
                      ├── HeaderSearch      (debounced scored search)
                      ├── mobile drawer     (nav + search + theme + GitHub)
                      ├── keyboard shortcuts
                      └── Router
                            │  matches '#/calculators/:id'
                            ▼
                       tools.js registry  ──▶  load: () => import('./calculators/…')
                            │
                            ▼
                    core/toolPage.js  (shared page template)
                            │  passes `ctx`
                            ▼
                     the tool module   { body, init, how }
```

### The tool-module contract

Every one of the 50 tools is a module with the same tiny shape. It never writes layout chrome,
copy buttons, breadcrumbs or favorite stars — the template does all of that.

```js
export default {
  resultLabel: 'Result',        // optional heading above the big number
  noResult: false,              // optional: suppress the result panel entirely
  how: `<p>…</p>`,              // originally-written explanation
  body: (meta) => `<html…>`,    // markup for the input panel
  init(root, ctx) {
    ctx.live(() => {            // recompute on every input/change
      ctx.setResult(value, subLine, { copy });
    });
    return cleanup;             // optional — called on navigation away
  }
};
```

The `ctx` object handed to each module:

| Member | Purpose |
| --- | --- |
| `setResult(value, sub, opts)` | Set the headline result, animate it, set the copy target, record history |
| `setError(message)` | Inline error in the result slot, without recording history |
| `clearResult()` | Reset the result panel |
| `qs` / `qsa` | Scoped query helpers |
| `live(handler, opts)` | Bind live recomputation, with optional debounce |
| `tabs(onChange)` | Wire up a tab strip for multi-mode tools |
| `meta`, `view`, `root` | Route metadata and DOM references |

### The converter engine

Phase 5's payoff: most converters contain **no conversion logic at all**. They declare a unit map
and the shared `UnitConverter` class does the rest.

```js
// js/converters/units/area.js — an entire tool
import { unitTool } from '../../core/unitTool.js';
import { linearUnits } from '../../core/UnitConverter.js';

export default unitTool({
  units: linearUnits([
    // [id, name, symbol, factor-to-base, group]
    ['sqm',     'Square metre', 'm²',  1,          'Metric'],
    ['sqft',    'Square foot',  'ft²', 0.09290304, 'Imperial'],
    ['acre',    'Acre',         'ac',  4046.8564,  'Imperial'],
    // …
  ]),
  defaults: ['sqm', 'sqft']
});
```

Non-linear units drop in as closures instead of a factor — this is how Temperature, min/km pace,
dBm and frequency-to-period work through the very same class:

```js
['celsius', 'Celsius', '°C', {
  toBase:   (c) => c + 273.15,
  fromBase: (k) => k - 273.15
}]
```

---

## Data model & storage

**There is no server and no database.** All persistence is `localStorage`, namespaced under
`calcsuite:` and wrapped in `js/utils/storage.js`, which falls back to an in-memory map when
storage is unavailable (private browsing, disabled cookies).

| Key | Type | Contents |
| --- | --- | --- |
| `calcsuite:theme` | `"dark" \| "light"` | Active theme; read by the pre-paint inline script |
| `calcsuite:favorites` | `string[]` | Tool keys, e.g. `["converters/length", "calculators/bmi"]` |
| `calcsuite:history` | `HistoryEntry[]` | Last 60 results, newest first, deduplicated |
| `calcsuite:recents` | `string[]` | Last 8 visited tool keys |
| `calcsuite:countdown` | `{ target, title }` | Saved countdown target |
| `calcsuite:gpa:rows` | `Course[]` | Saved GPA course rows |
| `calcsuite:custom-units` | `CustomConverter[]` | User-defined converters |
| `calcsuite:cache:rates` | `{ value, savedAt }` | Exchange rates, 6-hour TTL |

```ts
type HistoryEntry = {
  toolId: string;      // 'percentage'
  group: string;       // 'calculators'
  tool: string;        // 'Percentage Calculator'
  path: string;        // '#/calculators/percentage'
  expression: string;  // '15% of 200'
  result: string;      // '30'
  at: number;          // epoch ms
};
```

### The one network call

The Currency Converter is the only tool that touches the network. `CurrencyService` tries three
free, key-less, CORS-enabled providers in order, caches the result for six hours, and falls back to
a bundled offline rate table with a clear "rates may be stale" notice if all three fail.

---

## Folder structure

```
calcsuite/
├── index.html                  # the single app shell
├── manifest.json               # PWA manifest
├── sw.js                       # cache-first service worker
├── README.md
│
├── Assets/                     # static media
│   ├── Banner/                 # banner / hero images (add your own here)
│   └── Favicon/
│       └── favicon.svg
│
├── css/
│   ├── variables.css           # design tokens + dark/light palettes
│   ├── base.css                # reset, layout shell, header/footer, responsive
│   ├── components.css          # buttons, panels, fields, tabs, cards, tables…
│   └── themes.css              # theme-toggle animation, per-theme refinements
│
└── js/
    ├── main.js                 # boot, ThemeManager, search, shortcuts, routes
    ├── router.js               # Router class, nav sync, progress bar
    ├── tools.js                # registry of 12 categories / 50 tools
    ├── utils/
    │   ├── dom.js              # qs, on (delegation), debounce, clipboard, toast
    │   ├── storage.js          # namespaced localStorage, favorites, history
    │   ├── validators.js       # numeric/date/base validation + inline errors
    │   └── format.js           # number, currency, date and relative formatting
    ├── core/
    │   ├── toolPage.js         # the shared tool page template + ctx API
    │   ├── UnitConverter.js    # conversion engine + linearUnits helper
    │   ├── unitTool.js         # unit map → complete bidirectional tool
    │   └── Fraction.js         # exact rational arithmetic
    ├── views/
    │   ├── home.js             # hero + live-filtered tool grid
    │   ├── category.js         # calculators / converters index
    │   ├── library.js          # favorites, history, about, 404
    │   └── shared.js           # card & grid markup, favorite-star wiring
    ├── calculators/
    │   ├── math/               # 11 modules
    │   ├── financial/          # 5
    │   ├── health/             # 3
    │   ├── datetime/           # 4
    │   ├── grade/              # 3
    │   ├── electrical/         # 3
    │   └── everyday/           # 2
    └── converters/
        ├── units/              # 8
        ├── numberSystem/       # 5
        ├── color/              # 1
        ├── electrical/         # 4
        └── currency/           # 1
```

---

## JavaScript techniques on show

| Technique | Where to look |
| --- | --- |
| **ES6 classes & inheritance** | `Calculator` → `ScientificCalculator extends Calculator`; also `Color`, `Fraction`, `UnitConverter`, `CurrencyService`, `Router`, `ThemeManager` |
| **ES modules + dynamic `import()`** | `tools.js` registry; the router imports only the active route's module |
| **Closures & higher-order functions** | `unitTool()` factory, `grader(scale)` in the grade calculator, `toBase`/`fromBase` unit overrides, `debounce` |
| **Destructuring, template literals, spread/rest** | Throughout — e.g. `const { years, months, days } = calendarAge(a, b)` |
| **Event delegation** | `on(root, 'click', '.js-remove', handler)` — one listener serves rows added later |
| **async/await + Fetch** | `CurrencyService.fetchRates()` with sequential provider fallback |
| **localStorage** | `utils/storage.js` with in-memory fallback and TTL cache |
| **Debounce & rAF throttle** | Search input, history recording, expensive recomputes |
| **Clipboard API** | `copyToClipboard()` with an `execCommand` fallback |
| **BigInt** | Base Converter and Base Calculator — arbitrary-precision radix arithmetic |
| **`crypto.getRandomValues`** | Random Number generator's cryptographic mode |
| **Timer lifecycle management** | Countdown Timer and Age in Days return a cleanup function the router calls on navigation away — no leaked intervals |
| **Service Worker** | `sw.js` — cache-first shell, network passthrough for rate APIs |

### Algorithms worth a look

- **Stern–Brocot / continued fractions** — `Fraction.fromDecimal()` recovers `22/7` from `3.142857…`
- **Euclidean GCD** — fraction reduction and the LCM/GCF tool
- **Calendar borrowing** — leap-year-safe age arithmetic in `datetime/age.js`
- **Fisher–Yates shuffle** — unique random number sets
- **WCAG relative luminance** — contrast-ratio grading in the Color converter

---

## Accessibility

- Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`)
- Skip-to-content link
- `aria-live="polite"` result panels announce updates without stealing focus
- `aria-expanded` / `aria-controls` on the drawer and search, `aria-pressed` on the favorite star
- Every input has an associated `<label>`; icon-only buttons have `aria-label`
- Visible focus rings; full keyboard operation
- `prefers-reduced-motion` disables all animation
- Colour is never the sole carrier of meaning — badges pair colour with text

---

## Browser support

Requires native ES modules, dynamic `import()`, CSS custom properties and `BigInt`:
**Chrome/Edge 79+, Firefox 68+, Safari 14+**. No transpilation, no polyfills.

---

## Not yet implemented

Deliberately out of scope, or left for a future pass:

- **No test suite.** Pure functions are exported specifically so they can be unit-tested
  (`requiredScore`, `calendarAge`, `businessDays`, `parseDuration`, `solveWheel`, `engineering`,
  `Fraction`, `UnitConverter`), but no runner is wired up.
- **No server-side anything** — no accounts, no cross-device sync, no saved worksheets. History and
  favorites are per-browser.
- **Public holidays** are not modelled in the business-day count (weekends only).
- **Currency rates are indicative**, not dealing rates, and the offline fallback table is a seed
  snapshot.
- **No graphing.** The quadratic solver reports roots and vertex but does not plot the parabola, and
  loan amortization is a table rather than a chart.
- **No i18n.** UI copy is English-only; numbers and dates do follow the visitor's locale via
  `Intl`.
- **Scientific Calculator** has no expression history tape or user-defined variables.
- **Service worker** caches tool modules lazily on first visit, so the very first offline load only
  guarantees the shell plus previously visited tools.

## Recommended next steps

1. **Add a test runner.** Vitest or a plain browser test page against the exported pure functions
   would cover most of the risk surface with very little setup.
2. **Chart the numeric tools** — a small SVG plotter (no library needed) for the quadratic parabola,
   loan balance curve and BMI/BMR trends.
3. **Precache tool modules on install** so the whole suite works offline after one visit.
4. **Batch/CSV mode** for converters — paste a column of values, convert them all, copy back.
5. **URL-encoded state**, e.g. `#/converters/length?from=cm&to=in&v=180`, to make results shareable
   with their inputs intact.
6. **Expand the Custom Unit Converter** into user-defined *formulas*, not just factor + offset.
7. **Localisation** of UI strings, starting with the tool names and descriptions in `tools.js`,
   which is already the single source of truth for the site map.
8. **Holiday calendars** for business-day arithmetic, region-selectable.

---

## Credits

Built by [TajkirHossen-14](https://github.com/TajkirHossen-14).

Fonts: Space Grotesk, Inter and JetBrains Mono (Google Fonts). Icons: Font Awesome 6 Free.
Everything else — layout, theming, routing, state and all 50 tools — is hand-written vanilla
HTML, CSS and JavaScript.
