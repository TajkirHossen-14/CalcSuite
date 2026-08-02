/**
 * unitTool.js — turns a unit map into a complete, bidirectional tool module.
 *
 * This is the "unified tool" answer to RapidTables' one-page-per-direction
 * sprawl: a single interface with two dropdowns, a ⇄ swap button, live typing
 * in *either* field, and an all-units readout.
 *
 * Each converter module is therefore just data:
 *   export default unitTool({ units, defaults: ['m', 'ft'], how: '…' });
 */
import { UnitConverter } from './UnitConverter.js';
import { toSignificant, fmt } from '../utils/format.js';
import { isNumber } from '../utils/validators.js';
import { on, qs, qsa, escapeHTML } from '../utils/dom.js';

export function unitTool({
  units,
  defaults = [],
  precision = 10,
  how = '',
  showAll = true,
  quick = [],
  note = ''
}) {
  const conv = new UnitConverter(units);
  const [defFrom, defTo] = [defaults[0] || conv.ids[0], defaults[1] || conv.ids[1] || conv.ids[0]];

  return {
    how,
    resultLabel: 'Converted value',
    body: () => `
      <div class="conv-row">
        <div class="field">
          <label for="from-value">From</label>
          <input type="number" id="from-value" class="conv-value" value="1" step="any" inputmode="decimal" autocomplete="off">
          <select id="from-unit" aria-label="Convert from unit">${conv.groupedOptionsHTML(defFrom)}</select>
        </div>

        <button class="swap-btn" id="swap-btn" type="button" title="Swap units" aria-label="Swap units">
          <i class="fa-solid fa-right-left" aria-hidden="true"></i>
        </button>

        <div class="field">
          <label for="to-value">To</label>
          <input type="number" id="to-value" class="conv-value" step="any" inputmode="decimal" autocomplete="off">
          <select id="to-unit" aria-label="Convert to unit">${conv.groupedOptionsHTML(defTo)}</select>
        </div>
      </div>
      <p class="field-error" id="conv-error"></p>
      ${quick.length ? `<div class="chip-row" style="margin:0.75rem 0 0">
        ${quick.map((q) => `<button class="chip js-quick" type="button" data-from="${q.from}" data-to="${q.to}" data-value="${q.value ?? 1}">${escapeHTML(q.label)}</button>`).join('')}
      </div>` : ''}
      ${note ? `<p class="field-hint mt-3">${note}</p>` : ''}
      ${showAll ? `
      <div class="all-units">
        <p class="panel-title" style="margin:1.25rem 0 .6rem">All units <span class="text-faint" style="text-transform:none;letter-spacing:0">— click any row to make it the target</span></p>
        <div class="unit-list" id="unit-list"></div>
      </div>` : ''}
    `,

    init(root, ctx) {
      const fromValue = qs('#from-value', root);
      const toValue = qs('#to-value', root);
      const fromUnit = qs('#from-unit', root);
      const toUnit = qs('#to-unit', root);
      const errorEl = qs('#conv-error', root);
      const list = qs('#unit-list', root);
      let lastEdited = 'from';

      const render = () => {
        const source = lastEdited === 'from' ? fromValue : toValue;
        const srcUnit = lastEdited === 'from' ? fromUnit.value : toUnit.value;
        const dstUnit = lastEdited === 'from' ? toUnit.value : fromUnit.value;
        const target = lastEdited === 'from' ? toValue : fromValue;

        if (source.value.trim() === '') {
          target.value = '';
          errorEl.textContent = '';
          ctx.clearResult();
          if (list) list.innerHTML = '';
          return;
        }
        if (!isNumber(source.value)) {
          errorEl.textContent = 'Enter a valid number';
          ctx.setError('That is not a number');
          return;
        }
        errorEl.textContent = '';

        const input = Number(source.value);
        const output = conv.convert(input, srcUnit, dstUnit);
        target.value = Number.isFinite(output) ? toSignificant(output, precision) : '';

        const a = lastEdited === 'from' ? input : output;
        const b = lastEdited === 'from' ? output : input;
        ctx.setResult(
          `${toSignificant(b, precision)} ${conv.symbol(toUnit.value)}`,
          `<span class="mono">${fmt(a, 8)} ${escapeHTML(conv.symbol(fromUnit.value))}</span> = <span class="mono">${toSignificant(b, precision)} ${escapeHTML(conv.symbol(toUnit.value))}</span>`,
          { copy: toSignificant(b, precision) }
        );

        if (list) {
          const baseUnit = lastEdited === 'from' ? fromUnit.value : toUnit.value;
          list.innerHTML = conv.toAll(input, baseUnit).map((u) => `
            <button class="unit-item js-pick" type="button" data-unit="${u.id}">
              <span class="u-name">${escapeHTML(u.symbol)}</span>
              <span class="u-val">${toSignificant(u.value, 8)}</span>
            </button>`).join('');
        }
      };

      on(fromValue, 'input', () => { lastEdited = 'from'; render(); });
      on(toValue, 'input', () => { lastEdited = 'to'; render(); });
      on(fromUnit, 'change', render);
      on(toUnit, 'change', render);

      on(qs('#swap-btn', root), 'click', (e) => {
        const btn = e.currentTarget;
        [fromUnit.value, toUnit.value] = [toUnit.value, fromUnit.value];
        [fromValue.value, toValue.value] = [toValue.value, fromValue.value];
        btn.classList.toggle('is-spinning');
        lastEdited = 'from';
        render();
      });

      on(root, 'click', '.js-pick', (e, btn) => {
        toUnit.value = btn.dataset.unit;
        lastEdited = 'from';
        render();
      });

      on(root, 'click', '.js-quick', (e, btn) => {
        fromUnit.value = btn.dataset.from;
        toUnit.value = btn.dataset.to;
        fromValue.value = btn.dataset.value;
        lastEdited = 'from';
        render();
      });

      render();
      fromValue.focus({ preventScroll: true });
    }
  };
}

/** Shared explanation block reused by the linear converters. */
export function factorHow(categoryName, baseName, examples = []) {
  return `
    <p>Every ${categoryName} unit on this page is stored as a single number: how many
    <strong>${baseName}</strong> it represents. Converting is then always the same two-step move,
    no matter which of the ${'{'}n{'}'} directions you pick:</p>
    <code class="formula">value_in_base = input × factor(from)
result       = value_in_base ÷ factor(to)</code>
    <p>That is why CalcSuite needs <em>one</em> ${categoryName} page instead of one page per pair —
    the dropdowns simply choose which two factors get plugged into the same formula.
    Results are rounded to 10 significant digits and shown in scientific notation when
    they get extreme.</p>
    ${examples.length ? `<h4>Reference factors</h4><ul>${examples.map((e) => `<li>${e}</li>`).join('')}</ul>` : ''}
  `;
}
