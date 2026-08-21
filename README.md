<div align="center">

<p align="center">
  <img src="Assets\Banner\CalcSuite_Banner_4.png" alt="CalcSuite Banner" width="100%">
</p>

# 🧮 [CalcSuite](https://calc-suite-cyan.vercel.app)

### Every calculator and converter you need, in one modern place.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-2ea44f?style=flat-square)

**51 tools. Zero frameworks. One clean interface.**

</div>

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=6591ee&height=2&section=header"/>

## 📌 Table of Contents

- [📑 Overview](#-overview)
- [💡 Why CalcSuite?](#-why-calcsuite)
- [✨ Key Features](#-key-features)
- [🛠️ Built With](#️-built-with)
- [🧰 Full Tool List](#-full-tool-list)
- [🌗 Theming](#-theming)
- [🚀 Getting Started](#-getting-started)
- [📁 Project Structure](#-project-structure)
- [🧠 Advanced JS Concepts Showcased](#-advanced-js-concepts-showcased)
- [🤝🏼 Contributing](#-contributing)
- [📜 License](#-license) 
- [⭐ Support](#-support)

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=6591ee&height=2&section=header"/>

## 📑 Overview

**CalcSuite** is a static, framework-free web app that brings together **~50 calculators and converters** – everything from a Simple Calculator to a live Currency Converter – inside **one modern, unified interface**.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=6591ee&height=2&section=header"/>

## 💡 Why CalcSuite?

| | 😐 Typical Calculator Sites | ✅ CalcSuite |
|---|---|---|
| **Directions** | Separate page per direction (cm→ft *and* ft→cm) | 🔄 One tool, both directions, swap with a click |
| **Feel** | Static, click "Calculate" to see anything | ⚡ Live results as you type |
| **Design** | Ad-heavy, dated layouts | 🎨 Clean, modern, distinctive UI |
| **Theme** | Fixed light theme | 🌗 Dark / Light mode, remembered on reload |
| **Devices** | Desktop-first, cramped on mobile | 📱 Mobile-first, fully responsive |
| **Stack** | Often bloated with dependencies | 🧩 Pure vanilla JS – no frameworks at all |

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=6591ee&height=2&section=header"/>

## ✨ Key Features

- ⚡ **Live Calculations** — Results update instantly as you type, no "Calculate" button needed
- 🔄 **Unified Bidirectional Tools** — Dropdown selectors + a swap (⇄) button handle every conversion direction
- 🌗 **Dark / Light Mode** — Toggle with your preference saved via `localStorage`
- 📱 **Fully Responsive** — Mobile-first design that scales cleanly to desktop
- 🔍 **Live Search** — Instantly filter all 49 tools from the home page as you type
- 📋 **Copy-to-clipboard** — One-click copy on every result, powered by the Clipboard API
- 🧭 **Client-side Routing** — Smooth SPA feel via a lightweight hash-based router, with zero page reloads
- 💾 **Persistent History & Favorites** — Pin your go-to tools and revisit past calculations
- 🌍 **Live Currency Rates** — Real exchange-rate data via `fetch` + `async/await`
- 🧠 **Originally-written Explanations** — Every tool includes a short breakdown of the formula/logic behind it

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=6591ee&height=2&section=header"/>

## 🛠️ Built With

| Layer | Technology |
|---|---|
| **Structure** | Semantic HTML5 |
| **Styling** | CSS3 — custom properties for theming, Flexbox & Grid for layout |
| **Logic** | Vanilla JavaScript (ES6+) — Classes, Modules, Closures |
| **Persistence** | `localStorage` (theme, history, favorites) |
| **Live Data** | `fetch` + `async/await` for currency exchange rates |

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=6591ee&height=2&section=header"/>

## 🧰 Full Tool List

### 🧮 Calculators (31 Tools)

#### ➗ Math
- Simple Calculator
- Scientific Calculator
- Percentage Calculator
- Average Calculator (Mean / Median / Mode)
- Standard Deviation & Variance Calculator
- Fraction Calculator
- Ratio Calculator
- LCM & GCF Calculator
- Quadratic Equation Solver
- Base Calculator (Binary / Hex / Octal Arithmetic)
- Random Number Generator

#### 💰 Financial
- Simple & Compound Interest Calculator
- Loan / EMI Calculator
- Discount Calculator
- VAT / Tax Calculator
- Profit Margin Calculator

#### 🏋️ Health & Fitness
- BMI Calculator
- BMR / Daily Calorie Needs Calculator
- Ideal Body Weight Calculator

#### 📅 Date & Time
- Age Calculator
- Date Difference Calculator
- Countdown Calculator
- Time Duration Calculator

#### 🎓 Grade / Education
- GPA Calculator
- Grade / Percentage Calculator
- Final Grade Needed Calculator

#### 🔌 Electrical & Physics
- Ohm's Law Calculator
- Watt–Volt–Amp–Ohm Calculator
- Power Calculator

#### 🧾 Everyday Utility
- Tip Calculator
- Age in Days/Weeks/Hours Calculator


### 🔄 Converters (19 Tools)

#### 📏 Everyday Units
- Length Converter
- Weight/Mass Converter
- Temperature Converter
- Volume Converter
- Area Converter
- Speed Converter
- Data Storage Converter
- Custom Unit Converter

#### 🔢 Number Systems & Encoding
- Base Converter (Binary ⟷ Decimal ⟷ Octal ⟷ Hex)
- ASCII ⟷ Text ⟷ Binary ⟷ Hex Converter
- Roman Numeral Converter
- Fraction ⟷ Decimal ⟷ Percentage Converter
- Scientific Notation Converter
- Text ⟷ Morse Code

#### 🎨 Color
- RGB ⟷ HEX ⟷ HSL ⟷ HSV ⟷ CMYK (with live swatch preview)

#### ⚡ Electrical / Electronics
- Power Converter
- Voltage Converter
- Frequency Converter
- Energy Converter

#### 💱 Currency
- Live Currency Converter (real-time exchange rates)

</details>

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=6591ee&height=2&section=header"/>

## 🌗 Theming

CalcSuite ships with a full **dark and light theme system** built on CSS custom properties. The active theme is:

1. Read from `localStorage` **before first paint** – no flash of the wrong theme
2. Toggleable from the header at any time
3. Persisted automatically for your next visit

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=6591ee&height=2&section=header"/>

## 🚀 Getting Started

CalcSuite is 100% static – no build step required. Because it uses ES Modules and `fetch`, it needs to be served over `http(s)`, not opened directly as a `file://`.

### Prerequisites
- A modern browser (Chrome, Opera, Brave, Firefox, Edge)
- Any lightweight local server (Node's `serve`, VS Code's Live Server, or Python's built-in server)

### Installation

```bash
# Clone the repository
git clone https://github.com/TajkirHossen-14/CalcSuite.git

# Move into the project folder
cd CalcSuite
```

### Running Locally

```bash
# Option 1: using npx serve
npx serve .

# Option 2: using Python
python3 -m http.server 8000
```

Then open `http://localhost:PORT` in your browser. 🎉

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=6591ee&height=2&section=header"/>

## 📁 Project Structure

```
CalcSuite/
│
├── index.html
│       
├── css/
│   ├── base.css
│   ├── components.css
│   ├── themes.css
│   └── variables.css
│
├── js/
│   ├── calculators/
│   │   ├── datetime/
│   │   │   ├── age.js
│   │   │   ├── countdown.js
│   │   │   ├── dateDifference.js
│   │   │   └── timeDuration.js
│   │   ├── electrical/
│   │   │   ├── ohmsLaw.js
│   │   │   ├── power.js
│   │   │   └── wattVoltAmpOhm.js
│   │   ├── everyday/
│   │   │   ├── ageInUnits.js
│   │   │   └── tip.js
│   │   ├── financial/
│   │   │   ├── discount.js
│   │   │   ├── interest.js
│   │   │   ├── loan.js
│   │   │   ├── profitMargin.js
│   │   │   └── vat.js
│   │   ├── grade/
│   │   │   ├── finalGrade.js
│   │   │   ├── gpa.js
│   │   │   └── gradePercentage.js
│   │   ├── health/
│   │   │   ├── bmi.js
│   │   │   ├── bmr.js
│   │   │   └── idealWeight.js
│   │   └── math/
│   │       ├── average.js
│   │       ├── baseCalculator.js
│   │       ├── fraction.js
│   │       ├── lcmGcf.js
│   │       ├── percentage.js
│   │       ├── quadratic.js
│   │       ├── randomNumber.js
│   │       ├── ratio.js
│   │       ├── scientificCalculator.js
│   │       ├── simpleCalculator.js
│   │       └── standardDeviation.js
│   ├── converters/
│   │   ├── color/
│   │   │   └── color.js
│   │   ├── currency/
│   │   │   └── currency.js
│   │   ├── electrical/
│   │   │   ├── energy.js
│   │   │   ├── frequency.js
│   │   │   ├── power.js
│   │   │   └── voltage.js
│   │   ├── numberSystem/
│   │   │   ├── asciiText.js
│   │   │   ├── base.js
│   │   │   ├── fractionDecimal.js
│   │   │   ├── roman.js
│   │   │   └── scientificNotation.js
│   │   └── units/
│   │       ├── area.js
│   │       ├── custom.js
│   │       ├── dataStorage.js
│   │       ├── length.js
│   │       ├── speed.js
│   │       ├── temperature.js
│   │       ├── volume.js
│   │       └── weight.js
│   ├── core/
│   │   ├── Fraction.js
│   │   ├── toolPage.js
│   │   ├── UnitConverter.js
│   │   └── unitTool.js
│   ├── utils/
│   │   ├── dom.js
│   │   ├── format.js
│   │   ├── storage.js
│   │   └── validators.js
│   ├── views/
│   │   ├── category.js
│   │   ├── home.js
│   │   ├── library.js
│   │   └── shared.js
│   ├── main.js
│   ├── router.js
│   └── tools.js
│
├── sw.js
├── manifest.json
│
├── LICENSE
│
├── Assets/
│   ├── Banner/
│   └── Favicon/
│
└── README.md
```

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=6591ee&height=2&section=header"/>

## 🧠 Advanced JS Concepts Showcased

- 🧱 **ES6+ Classes** — Each tool encapsulates its own state and logic
- 📦 **ES Modules** — One `import`/`export` module per tool, dynamically loaded per route
- 🔁 **Closures & higher-order functions** — Reusable calculation logic (e.g. the generic `UnitConverter` class powers 6+ different converters)
- 🎯 **Event delegation** — Powers the router and dynamic tool switching
- ⏳ **Debouncing** — Smooth, efficient live-input calculations
- 🌐 **Async/Await + Fetch API** — Real-time currency exchange rates
- 💾 **LocalStorage** — Theme, history, and favorites persistence
- 📋 **Clipboard API** — One-click "copy result" on every tool
- ✅ **Inline form validation** — Clear, immediate feedback on invalid input

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=6591ee&height=2&section=header"/>


## 🤝🏼 Contributing

Contributions are always welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/Amazing-Tool`)
3. Commit your changes
4. Push and open a Pull Request

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=6591ee&height=2&section=header"/>

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=6591ee&height=2&section=header"/>

## 📜 License

This project is licensed under the [MIT License](LICENSE).

## ⭐ Support

If you find CalcSuite useful, consider giving it a star ⭐
