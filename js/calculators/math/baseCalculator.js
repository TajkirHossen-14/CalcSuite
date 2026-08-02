/** Base Calculator — arithmetic and bitwise operations in any radix 2–36. */
import { qs, on } from '../../utils/dom.js';
import { isValidInBase } from '../../utils/validators.js';
import { fmt } from '../../utils/format.js';

const BASES = [[2, 'Binary'], [8, 'Octal'], [10, 'Decimal'], [16, 'Hexadecimal'], [36, 'Base 36']];

export default {
  resultLabel: 'Result',
  how: `
    <p>Arithmetic doesn't care what base you write numbers in — 0xFF + 0x01 and 255 + 1 are the same
    sum. So this calculator parses both operands into ordinary integers, does the maths, and formats
    the answer back into the base you chose.</p>
    <code class="formula">value  = BigInt parse of the string in the input base
result = value₁ ⊕ value₂            (⊕ = + − × ÷ mod, AND, OR, XOR, shifts)
output = result.toString(outputBase)</code>
    <h4>BigInt, not Number</h4>
    <p>Everything runs on <code>BigInt</code>, so results stay exact far beyond
    <code>Number.MAX_SAFE_INTEGER</code> (2⁵³). A 64-bit hex multiplication gives every digit
    correctly instead of silently rounding. Division is integer division, with the remainder shown
    separately — that's the behaviour you want when working with bases and bit patterns.</p>
    <h4>Bitwise operations</h4>
    <p>AND, OR, XOR and the shift operators work on the binary representation regardless of the
    display base, which makes this a quick scratchpad for masks and flags: <code>0xF0 AND 0x3C</code>
    is <code>0x30</code>, and <code>1 &lt;&lt; 10</code> is 1024.</p>
    <h4>Validation</h4>
    <p>Digits are checked against the selected input base before anything is evaluated, so typing
    <code>2</code> in binary mode is rejected immediately instead of being silently reinterpreted.</p>`,

  body: () => `
    <div class="grid grid-2">
      <div class="field">
        <label for="in-base">Input base</label>
        <select id="in-base">${BASES.map(([b, n]) => `<option value="${b}"${b === 16 ? ' selected' : ''}>${n} (base ${b})</option>`).join('')}</select>
      </div>
      <div class="field">
        <label for="out-base">Output base</label>
        <select id="out-base">${BASES.map(([b, n]) => `<option value="${b}"${b === 10 ? ' selected' : ''}>${n} (base ${b})</option>`).join('')}</select>
      </div>
    </div>

    <div class="row" style="align-items:flex-end;gap:.6rem;flex-wrap:wrap">
      <div class="field" style="flex:1 1 150px;margin:0">
        <label for="x">Value A</label>
        <input type="text" id="x" class="mono" value="FF" spellcheck="false">
      </div>
      <div class="field" style="width:150px;margin:0">
        <label for="op">Operation</label>
        <select id="op">
          <option value="+">+ add</option>
          <option value="-">− subtract</option>
          <option value="*">× multiply</option>
          <option value="/">÷ divide</option>
          <option value="%">mod</option>
          <option value="&amp;">AND</option>
          <option value="|">OR</option>
          <option value="^">XOR</option>
          <option value="<<">&lt;&lt; shift left</option>
          <option value=">>">&gt;&gt; shift right</option>
        </select>
      </div>
      <div class="field" style="flex:1 1 150px;margin:0">
        <label for="y">Value B</label>
        <input type="text" id="y" class="mono" value="0F" spellcheck="false">
      </div>
    </div>
    <p class="field-error mt-3" id="base-error"></p>
    <div class="stat-grid mt-4" id="bc-stats"></div>`,

  init(root, ctx) {
    const el = (id) => qs(`#${id}`, root);
    const err = el('base-error');

    const parse = (str, base) => {
      const clean = str.trim().replace(/\s|_/g, '');
      if (!clean || !isValidInBase(clean, base)) return null;
      const negative = clean.startsWith('-');
      const digits = clean.replace(/^[-+]/, '').toLowerCase();
      const value = [...digits].reduce((acc, ch) => acc * BigInt(base) + BigInt(parseInt(ch, 36)), 0n);
      return negative ? -value : value;
    };

    const calc = () => {
      const inBase = Number(el('in-base').value);
      const outBase = Number(el('out-base').value);
      const a = parse(el('x').value, inBase);
      const b = parse(el('y').value, inBase);
      if (a === null || b === null) {
        err.textContent = `Both values must use digits valid in base ${inBase}.`;
        ctx.setError('Invalid digits for this base');
        qs('#bc-stats', root).innerHTML = '';
        return;
      }
      err.textContent = '';
      const op = el('op').value;
      let result; let remainder = null;
      try {
        switch (op) {
          case '+': result = a + b; break;
          case '-': result = a - b; break;
          case '*': result = a * b; break;
          case '/':
            if (b === 0n) throw new Error('Division by zero');
            result = a / b; remainder = a % b; break;
          case '%':
            if (b === 0n) throw new Error('Division by zero');
            result = a % b; break;
          case '&': result = a & b; break;
          case '|': result = a | b; break;
          case '^': result = a ^ b; break;
          case '<<': result = a << b; break;
          default: result = a >> b;
        }
      } catch (error) { ctx.setError(error.message); return; }

      const out = result.toString(outBase).toUpperCase();
      const label = { '+': '+', '-': '−', '*': '×', '/': '÷', '%': 'mod', '&': 'AND', '|': 'OR', '^': 'XOR', '<<': '<<', '>>': '>>' }[op];
      ctx.setResult(out, `<span class="mono">${el('x').value.toUpperCase()} ${label} ${el('y').value.toUpperCase()}</span> (base ${inBase}) → base ${outBase}${remainder !== null ? ` · remainder <span class="mono">${remainder.toString(outBase).toUpperCase()}</span>` : ''}`, { copy: out });

      qs('#bc-stats', root).innerHTML = [
        ['Binary', result.toString(2)],
        ['Octal', result.toString(8)],
        ['Decimal', result.toString(10)],
        ['Hexadecimal', result.toString(16).toUpperCase()],
        ['A in decimal', a.toString(10)],
        ['B in decimal', b.toString(10)],
        ['Bit length', result < 0n ? '—' : result.toString(2).replace(/^0$/, '').length],
        ['Remainder', remainder === null ? '—' : remainder.toString(10)]
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value" style="word-break:break-all">${v}</div></div>`).join('');
    };

    on(el('in-base'), 'change', () => { el('x').value = ''; el('y').value = ''; ctx.clearResult(); });
    ctx.live(calc);
  }
};
