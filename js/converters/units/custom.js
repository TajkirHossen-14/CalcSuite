/**
 * Custom Unit Converter — the user supplies the relationship, we do the algebra.
 */
import { on, qs } from '../../utils/dom.js';
import { fmt, toSignificant } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';
import * as storage from '../../utils/storage.js';

export default {
  resultLabel: 'Converted value',
  how: `
    <p>Every linear converter in CalcSuite is the same three-line function with a different
    constant. This page exposes that constant so you can define units we have never heard of —
    price per kilo, pages per hour, coffee beans per cup.</p>
    <code class="formula">1 unitA = factor × unitB
B = A × factor        (forward)
A = B ÷ factor        (reverse)</code>
    <h4>Optional offset</h4>
    <p>Ticking “apply an offset” switches to the affine form <code>B = A × factor + offset</code>,
    which covers scales that don't share a zero point — the same shape as the Celsius/Fahrenheit
    relationship (<code>factor 1.8, offset 32</code>).</p>
    <p>Your definitions are saved to <code>localStorage</code>, so a converter you build today is
    still here tomorrow.</p>`,

  body: () => `
    <div class="grid grid-2">
      <div class="field"><label for="name-a">Unit A name</label><input type="text" id="name-a" value="Widget" maxlength="20"></div>
      <div class="field"><label for="name-b">Unit B name</label><input type="text" id="name-b" value="Gadget" maxlength="20"></div>
    </div>
    <div class="grid grid-2">
      <div class="field">
        <label for="factor">1 Unit A equals … Unit B</label>
        <input type="number" id="factor" value="2.5" step="any">
        <span class="field-hint">The conversion factor from A to B.</span>
      </div>
      <div class="field">
        <label for="offset">Offset (added after multiplying)</label>
        <input type="number" id="offset" value="0" step="any">
        <span class="field-hint">Leave at 0 for ordinary ratio units.</span>
      </div>
    </div>
    <hr class="divider">
    <div class="conv-row">
      <div class="field"><label for="val-a" id="lab-a">Value in A</label><input type="number" id="val-a" value="1" step="any" class="conv-value"></div>
      <button class="swap-btn" id="swap" type="button" title="Swap direction"><i class="fa-solid fa-right-left"></i></button>
      <div class="field"><label for="val-b" id="lab-b">Value in B</label><input type="number" id="val-b" step="any" class="conv-value"></div>
    </div>
    <div class="row mt-4">
      <button class="btn btn-sm" id="save" type="button"><i class="fa-regular fa-bookmark"></i> Save this converter</button>
      <span class="field-hint" id="saved-hint"></span>
    </div>
    <div class="unit-list mt-3" id="saved-list"></div>`,

  init(root, ctx) {
    const el = (id) => qs(`#${id}`, root);
    let last = 'a';

    const compute = () => {
      const factor = Number(el('factor').value);
      const offset = Number(el('offset').value) || 0;
      const nameA = el('name-a').value || 'A';
      const nameB = el('name-b').value || 'B';
      el('lab-a').textContent = `Value in ${nameA}`;
      el('lab-b').textContent = `Value in ${nameB}`;

      if (!isNumber(factor) || factor === 0) return ctx.setError('The factor must be a non-zero number');

      if (last === 'a') {
        const a = Number(el('val-a').value);
        if (!isNumber(el('val-a').value)) return ctx.setError('Enter a number');
        const b = a * factor + offset;
        el('val-b').value = toSignificant(b, 10);
        ctx.setResult(`${toSignificant(b, 10)} ${nameB}`, `<span class="mono">${fmt(a)} ${nameA} × ${fmt(factor)}${offset ? ` + ${fmt(offset)}` : ''}</span>`, { copy: toSignificant(b, 10) });
      } else {
        const b = Number(el('val-b').value);
        if (!isNumber(el('val-b').value)) return ctx.setError('Enter a number');
        const a = (b - offset) / factor;
        el('val-a').value = toSignificant(a, 10);
        ctx.setResult(`${toSignificant(a, 10)} ${nameA}`, `<span class="mono">(${fmt(b)} ${nameB}${offset ? ` − ${fmt(offset)}` : ''}) ÷ ${fmt(factor)}</span>`, { copy: toSignificant(a, 10) });
      }
    };

    const paintSaved = () => {
      const saved = storage.get('customUnits', []);
      el('saved-list').innerHTML = saved.map((s, i) => `
        <button class="unit-item js-load" type="button" data-index="${i}">
          <span class="u-name">${s.a} → ${s.b}</span>
          <span class="u-val">×${s.factor}${s.offset ? ` +${s.offset}` : ''}</span>
        </button>`).join('');
    };

    on(root, 'input', (e) => {
      if (e.target.id === 'val-a') last = 'a';
      if (e.target.id === 'val-b') last = 'b';
      compute();
    });

    on(el('swap'), 'click', () => {
      const factor = Number(el('factor').value) || 1;
      const offset = Number(el('offset').value) || 0;
      [el('name-a').value, el('name-b').value] = [el('name-b').value, el('name-a').value];
      el('factor').value = toSignificant(1 / factor, 10);
      el('offset').value = offset ? toSignificant(-offset / factor, 10) : 0;
      [el('val-a').value, el('val-b').value] = [el('val-b').value, el('val-a').value];
      last = 'a';
      compute();
    });

    on(el('save'), 'click', () => {
      const saved = storage.get('customUnits', []);
      saved.unshift({
        a: el('name-a').value || 'A',
        b: el('name-b').value || 'B',
        factor: Number(el('factor').value),
        offset: Number(el('offset').value) || 0
      });
      storage.set('customUnits', saved.slice(0, 12));
      el('saved-hint').textContent = 'Saved to this browser.';
      paintSaved();
    });

    on(root, 'click', '.js-load', (e, btn) => {
      const saved = storage.get('customUnits', [])[Number(btn.dataset.index)];
      if (!saved) return;
      el('name-a').value = saved.a; el('name-b').value = saved.b;
      el('factor').value = saved.factor; el('offset').value = saved.offset;
      last = 'a';
      compute();
    });

    paintSaved();
    compute();
  }
};
