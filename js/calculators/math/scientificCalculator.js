/**
 * Scientific Calculator — extends the basic Calculator class with unary
 * functions, memory, constants and a degree/radian mode.
 */
import { Calculator } from './simpleCalculator.js';
import { on, qs } from '../../utils/dom.js';
import { fmt } from '../../utils/format.js';

class ScientificCalculator extends Calculator {
  constructor() {
    super();
    this.angleMode = 'deg';
    this.memory = 0;
    this.inverse = false;
  }

  #toRad(v) { return this.angleMode === 'deg' ? (v * Math.PI) / 180 : v; }
  #fromRad(v) { return this.angleMode === 'deg' ? (v * 180) / Math.PI : v; }

  /** Apply a single-argument function to the displayed value. */
  apply(fn) {
    const x = Number(this.current);
    const inv = this.inverse;
    const table = {
      sin: () => (inv ? this.#fromRad(Math.asin(x)) : Math.sin(this.#toRad(x))),
      cos: () => (inv ? this.#fromRad(Math.acos(x)) : Math.cos(this.#toRad(x))),
      tan: () => (inv ? this.#fromRad(Math.atan(x)) : Math.tan(this.#toRad(x))),
      ln: () => (inv ? Math.exp(x) : Math.log(x)),
      log: () => (inv ? 10 ** x : Math.log10(x)),
      sqrt: () => (inv ? x * x : Math.sqrt(x)),
      sq: () => x * x,
      cube: () => x ** 3,
      inv: () => (x === 0 ? null : 1 / x),
      fact: () => factorial(x),
      abs: () => Math.abs(x),
      exp: () => Math.exp(x),
      sinh: () => (inv ? Math.asinh(x) : Math.sinh(x)),
      cosh: () => (inv ? Math.acosh(x) : Math.cosh(x)),
      tanh: () => (inv ? Math.atanh(x) : Math.tanh(x))
    };
    const out = table[fn] ? table[fn]() : x;
    if (out === null || Number.isNaN(out) || !Number.isFinite(out)) {
      this.error = out === null ? 'Cannot divide by zero' : 'Undefined for this input';
      this.current = 'Error';
      return this;
    }
    this.current = String(Number(out.toPrecision(14)));
    this.overwrite = true;
    this.lastFn = fn;
    return this;
  }

  constant(name) {
    this.current = String(name === 'pi' ? Math.PI : Math.E);
    this.overwrite = true;
    return this;
  }

  memoryOp(op) {
    const x = Number(this.current) || 0;
    if (op === 'M+') this.memory += x;
    else if (op === 'M-') this.memory -= x;
    else if (op === 'MR') { this.current = String(this.memory); this.overwrite = true; }
    else if (op === 'MC') this.memory = 0;
    return this;
  }
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) return NaN;
  let out = 1;
  for (let i = 2; i <= n; i += 1) out *= i;
  return out;
}

const KEYS = [
  ['INV', 'toggle', 'inverse', 'key-fn'], ['DEG', 'toggle', 'angle', 'key-fn'], ['x!', 'fn', 'fact', 'key-fn'], ['(', 'noop', '(', 'key-fn'], [')', 'noop', ')', 'key-fn'],
  ['sin', 'fn', 'sin', 'key-fn'], ['cos', 'fn', 'cos', 'key-fn'], ['tan', 'fn', 'tan', 'key-fn'], ['π', 'const', 'pi', 'key-fn'], ['e', 'const', 'e', 'key-fn'],
  ['ln', 'fn', 'ln', 'key-fn'], ['log', 'fn', 'log', 'key-fn'], ['√', 'fn', 'sqrt', 'key-fn'], ['x²', 'fn', 'sq', 'key-fn'], ['xʸ', 'op', '^', 'key-op'],
  ['AC', 'action', 'clear', 'key-danger'], ['⌫', 'action', 'back', 'key-fn'], ['%', 'action', 'percent', 'key-fn'], ['1/x', 'fn', 'inv', 'key-fn'], ['÷', 'op', '/', 'key-op'],
  ['7', 'digit', '7'], ['8', 'digit', '8'], ['9', 'digit', '9'], ['x³', 'fn', 'cube', 'key-fn'], ['×', 'op', '*', 'key-op'],
  ['4', 'digit', '4'], ['5', 'digit', '5'], ['6', 'digit', '6'], ['|x|', 'fn', 'abs', 'key-fn'], ['−', 'op', '-', 'key-op'],
  ['1', 'digit', '1'], ['2', 'digit', '2'], ['3', 'digit', '3'], ['eˣ', 'fn', 'exp', 'key-fn'], ['+', 'op', '+', 'key-op'],
  ['±', 'action', 'negate'], ['0', 'digit', '0'], ['.', 'digit', '.'], ['mod', 'op', '%', 'key-op'], ['=', 'action', 'equals', 'key-eq']
];

export default {
  resultLabel: 'Current value',
  how: `
    <p>The scientific keypad reuses the exact same <code>Calculator</code> class as the simple
    calculator and extends it — a textbook case for <code>class ScientificCalculator extends Calculator</code>.
    Binary operators (+, −, ×, ÷, mod, xʸ) still flow through the parent state machine; the new
    keys are <em>unary</em> and act immediately on the displayed number.</p>
    <code class="formula">sin/cos/tan  → Math.sin(x·π/180) in DEG, Math.sin(x) in RAD
INV + sin    → asin, returned back in the active angle unit
log / ln     → Math.log10(x) / Math.log(x); INV gives 10ˣ and eˣ
xʸ           → Math.pow via the binary operator queue
x!           → iterative product, capped at 170 (the last value before Infinity)</code>
    <h4>Angle mode</h4>
    <p>JavaScript's trigonometry is radian-only, so degree mode converts on the way in
    (<code>x × π/180</code>) and on the way back out for inverse functions. The DEG/RAD button
    shows the mode that is currently <em>active</em>.</p>
    <h4>Memory</h4>
    <p>M+, M−, MR and MC keep a single accumulator alongside the display value, exactly like a
    desk calculator. Undefined results (√−1, ln 0, 1/0) are trapped and reported rather than
    surfacing as <code>NaN</code>.</p>`,

  body: () => `
    <div class="calc-shell wide">
      <div class="row" style="justify-content:space-between;margin-bottom:.6rem">
        <div class="row" style="gap:.35rem">
          <button class="btn btn-sm" data-mem="MC" type="button">MC</button>
          <button class="btn btn-sm" data-mem="MR" type="button">MR</button>
          <button class="btn btn-sm" data-mem="M+" type="button">M+</button>
          <button class="btn btn-sm" data-mem="M-" type="button">M−</button>
        </div>
        <span class="badge" id="mem-badge">M: 0</span>
      </div>
      <div class="calc-display">
        <div class="calc-expr" id="calc-expr" aria-hidden="true"></div>
        <output class="calc-current" id="calc-current" aria-live="polite">0</output>
      </div>
      <div class="keypad sci" id="keypad">
        ${KEYS.map(([label, type, value, cls = '']) => `
          <button class="key ${cls}" type="button" data-type="${type}" data-value="${value}">${label}</button>`).join('')}
      </div>
      <p class="field-hint text-center mt-3">INV switches sin→asin, log→10ˣ, √→x². DEG/RAD toggles the angle unit.</p>
    </div>`,

  init(root, ctx) {
    const calc = new ScientificCalculator();
    const display = qs('#calc-current', root);
    const expr = qs('#calc-expr', root);
    const memBadge = qs('#mem-badge', root);
    const invKey = root.querySelector('[data-value="inverse"]');
    const angleKey = root.querySelector('[data-value="angle"]');

    const paint = () => {
      const n = Number(calc.current);
      const value = calc.error ? 'Error' : (Number.isFinite(n) ? fmt(n, 12) : calc.current);
      display.textContent = value;
      expr.textContent = calc.error ? calc.error : calc.expression;
      memBadge.textContent = `M: ${fmt(calc.memory, 6)}`;
      invKey.classList.toggle('is-pressed', calc.inverse);
      angleKey.textContent = calc.angleMode.toUpperCase();
      if (calc.error) ctx.setError(calc.error);
      else ctx.setResult(value, calc.expression ? `Pending: <span class="mono">${calc.expression} …</span>` : `Angle mode: ${calc.angleMode.toUpperCase()}`, { copy: calc.current });
    };

    on(root, 'click', '.key', (e, btn) => {
      const { type, value } = btn.dataset;
      if (type === 'digit') calc.digit(value);
      else if (type === 'op') calc.operate(value === '^' ? '^' : value);
      else if (type === 'fn') { calc.apply(value); calc.inverse = false; }
      else if (type === 'const') calc.constant(value);
      else if (type === 'toggle' && value === 'inverse') calc.inverse = !calc.inverse;
      else if (type === 'toggle' && value === 'angle') calc.angleMode = calc.angleMode === 'deg' ? 'rad' : 'deg';
      else if (value === 'clear') calc.clear();
      else if (value === 'back') calc.backspace();
      else if (value === 'negate') calc.negate();
      else if (value === 'percent') calc.percent();
      else if (value === 'equals') calc.equals();
      paint();
    });

    on(root, 'click', '[data-mem]', (e, btn) => { calc.memoryOp(btn.dataset.mem); paint(); });

    const onKey = (event) => {
      const tag = event.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = event.key;
      if (/^[0-9.]$/.test(k)) calc.digit(k);
      else if (['+', '-', '*', '/', '^'].includes(k)) calc.operate(k);
      else if (k === 'Enter' || k === '=') calc.equals();
      else if (k === 'Backspace') calc.backspace();
      else if (k === 'Escape') calc.clear();
      else return;
      event.preventDefault();
      paint();
    };
    document.addEventListener('keydown', onKey);
    paint();
    return () => document.removeEventListener('keydown', onKey);
  }
};

/* Extend the inherited compute table with the power operator. */
const baseCompute = Calculator.compute;
Calculator.compute = (a, b, op) => (op === '^' ? a ** b : baseCompute(a, b, op));
