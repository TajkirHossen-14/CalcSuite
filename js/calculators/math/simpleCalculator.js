/**
 * Simple Calculator — state-machine arithmetic (no eval), keypad + keyboard.
 */
import { on, qs, qsa } from '../../utils/dom.js';
import { fmt } from '../../utils/format.js';

/** Encapsulates the whole calculator state; the UI is a pure projection of it. */
export class Calculator {
  constructor() { this.clear(); }

  clear() {
    this.current = '0';
    this.previous = null;
    this.operator = null;
    this.overwrite = true;
    this.lastOperand = null;
    this.error = null;
    return this;
  }

  get expression() {
    if (this.previous === null) return '';
    return `${fmt(Number(this.previous), 10)} ${symbolOf(this.operator)}`;
  }

  digit(d) {
    if (this.error) this.clear();
    if (this.overwrite) { this.current = d === '.' ? '0.' : d; this.overwrite = false; return this; }
    if (d === '.' && this.current.includes('.')) return this;
    if (this.current === '0' && d !== '.') this.current = d;
    else this.current += d;
    return this;
  }

  backspace() {
    if (this.overwrite || this.error) return this;
    this.current = this.current.length > 1 ? this.current.slice(0, -1) : '0';
    if (this.current === '-') this.current = '0';
    return this;
  }

  negate() {
    if (this.current === '0') return this;
    this.current = this.current.startsWith('-') ? this.current.slice(1) : `-${this.current}`;
    return this;
  }

  /** "%" behaves like a pocket calculator: 200 + 10% → 200 + 20. */
  percent() {
    const value = Number(this.current);
    const base = this.previous !== null ? Number(this.previous) : 1;
    const scaled = this.previous !== null && (this.operator === '+' || this.operator === '-')
      ? (base * value) / 100
      : value / 100;
    this.current = String(scaled);
    this.overwrite = true;
    return this;
  }

  operate(op) {
    if (this.error) this.clear();
    if (this.operator && !this.overwrite) this.equals(true);
    this.previous = this.current;
    this.operator = op;
    this.overwrite = true;
    return this;
  }

  equals(chained = false) {
    if (this.operator === null) return this;
    const a = Number(this.previous);
    const b = this.overwrite && this.lastOperand !== null && !chained
      ? Number(this.lastOperand)
      : Number(this.current);
    const result = Calculator.compute(a, b, this.operator);
    if (result === null) { this.error = 'Cannot divide by zero'; this.current = 'Error'; this.previous = null; this.operator = null; return this; }
    this.lastOperand = b;
    this.current = String(roundFloat(result));
    if (!chained) { this.previous = null; this.operator = null; }
    else this.previous = this.current;
    this.overwrite = true;
    return this;
  }

  /** Pure static computation — easy to unit test, no state involved. */
  static compute(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? null : a / b;
      case '%': return b === 0 ? null : a % b;
      default: return b;
    }
  }
}

const roundFloat = (n) => Math.abs(n) < 1e15 ? Number(n.toPrecision(14)) : n;
const symbolOf = (op) => ({ '+': '+', '-': '−', '*': '×', '/': '÷', '%': 'mod' }[op] || '');

const KEYS = [
  ['AC', 'action', 'clear', 'key-danger'], ['⌫', 'action', 'back', 'key-fn'], ['%', 'action', 'percent', 'key-fn'], ['÷', 'op', '/', 'key-op'],
  ['7', 'digit', '7'], ['8', 'digit', '8'], ['9', 'digit', '9'], ['×', 'op', '*', 'key-op'],
  ['4', 'digit', '4'], ['5', 'digit', '5'], ['6', 'digit', '6'], ['−', 'op', '-', 'key-op'],
  ['1', 'digit', '1'], ['2', 'digit', '2'], ['3', 'digit', '3'], ['+', 'op', '+', 'key-op'],
  ['±', 'action', 'negate'], ['0', 'digit', '0'], ['.', 'digit', '.'], ['=', 'action', 'equals', 'key-eq']
];

export default {
  resultLabel: 'Current value',
  how: `
    <p>This calculator never calls <code>eval()</code>. Instead it keeps three pieces of state —
    the number on screen, the number you entered before it, and the pending operator — and folds
    them together the moment a new operator or <kbd>=</kbd> arrives.</p>
    <code class="formula">operate(op) → if an operator is already pending, resolve it first
equals()   → result = compute(previous, current, operator)</code>
    <h4>Details worth knowing</h4>
    <ul>
      <li><strong>Chaining:</strong> typing <code>2 + 3 + 4</code> resolves <code>2 + 3</code> as soon as the second <code>+</code> is pressed, so the display always shows a real running total.</li>
      <li><strong>Repeat equals:</strong> pressing <kbd>=</kbd> again reuses the last operand, so <code>5 + 3 = = =</code> gives 8, 11, 14.</li>
      <li><strong>Percent:</strong> in an addition or subtraction, <code>%</code> is relative to the first number (200 + 10% = 220); elsewhere it simply divides by 100.</li>
      <li><strong>Floating point:</strong> results pass through <code>toPrecision(14)</code>, which quietly removes artefacts like <code>0.1 + 0.2 = 0.30000000000000004</code>.</li>
      <li><strong>Divide by zero</strong> is caught and reported instead of showing <code>Infinity</code>.</li>
    </ul>`,

  body: () => `
    <div class="calc-shell">
      <div class="calc-display">
        <div class="calc-expr" id="calc-expr" aria-hidden="true"></div>
        <output class="calc-current" id="calc-current" aria-live="polite">0</output>
      </div>
      <div class="keypad" id="keypad">
        ${KEYS.map(([label, type, value, cls = '']) => `
          <button class="key ${cls}" type="button" data-type="${type}" data-value="${value}"
                  aria-label="${label === '⌫' ? 'Backspace' : label === 'AC' ? 'Clear all' : label}">${label}</button>`).join('')}
      </div>
      <p class="field-hint text-center mt-3">Your keyboard works too — digits, <kbd>+ − * /</kbd>, <kbd>Enter</kbd>, <kbd>Backspace</kbd>, <kbd>Esc</kbd>.</p>
    </div>`,

  init(root, ctx) {
    const calc = new Calculator();
    const display = qs('#calc-current', root);
    const expr = qs('#calc-expr', root);

    const paint = () => {
      const value = calc.error ? 'Error' : (Number.isFinite(Number(calc.current)) ? fmt(Number(calc.current), 12) : calc.current);
      display.textContent = value;
      expr.textContent = calc.error ? calc.error : calc.expression;
      if (calc.error) ctx.setError(calc.error);
      else ctx.setResult(value, calc.expression ? `Pending: <span class="mono">${calc.expression} …</span>` : '', { copy: calc.current });
    };

    const press = (type, value) => {
      if (type === 'digit') calc.digit(value);
      else if (type === 'op') calc.operate(value);
      else if (value === 'clear') calc.clear();
      else if (value === 'back') calc.backspace();
      else if (value === 'negate') calc.negate();
      else if (value === 'percent') calc.percent();
      else if (value === 'equals') calc.equals();
      paint();
    };

    on(root, 'click', '.key', (e, btn) => press(btn.dataset.type, btn.dataset.value));

    const flash = (selector) => {
      const btn = qs(selector, root);
      if (!btn) return;
      btn.classList.add('is-pressed');
      setTimeout(() => btn.classList.remove('is-pressed'), 110);
    };

    const onKey = (event) => {
      const tag = event.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = event.key;
      let type = null; let value = null;
      if (/^[0-9.]$/.test(k)) { type = 'digit'; value = k; }
      else if (['+', '-', '*', '/'].includes(k)) { type = 'op'; value = k; }
      else if (k === 'Enter' || k === '=') { type = 'action'; value = 'equals'; }
      else if (k === 'Backspace') { type = 'action'; value = 'back'; }
      else if (k === 'Escape') { type = 'action'; value = 'clear'; }
      else if (k === '%') { type = 'action'; value = 'percent'; }
      if (!type) return;
      event.preventDefault();
      flash(`.key[data-value="${value === '.' ? '.' : value}"]`);
      press(type, value);
    };

    document.addEventListener('keydown', onKey);
    paint();
    return () => document.removeEventListener('keydown', onKey);
  }
};
