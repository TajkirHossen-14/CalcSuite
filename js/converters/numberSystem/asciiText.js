/**
 * Text ⟷ ASCII ⟷ Binary ⟷ Hex ⟷ Base64 — every field edits the same string.
 */
import { on, qs, qsa, debounce } from '../../utils/dom.js';

const enc = new TextEncoder();
const dec = new TextDecoder();

export const codec = {
  toDecimal: (text) => [...text].map((c) => c.codePointAt(0)).join(' '),
  fromDecimal: (str) => splitNums(str).map((n) => String.fromCodePoint(n)).join(''),

  toBinary: (text) => [...enc.encode(text)].map((b) => b.toString(2).padStart(8, '0')).join(' '),
  fromBinary: (str) => dec.decode(new Uint8Array(str.trim().split(/\s+/).filter(Boolean).map((b) => parseInt(b, 2) & 0xff))),

  toHex: (text) => [...enc.encode(text)].map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' '),
  fromHex: (str) => dec.decode(new Uint8Array((str.replace(/0x/gi, '').match(/[0-9a-f]{1,2}/gi) || []).map((h) => parseInt(h, 16)))),

  toBase64: (text) => btoa(String.fromCharCode(...enc.encode(text))),
  fromBase64: (str) => {
    try { return dec.decode(Uint8Array.from(atob(str.trim()), (c) => c.charCodeAt(0))); } catch (_) { return null; }
  }
};

const splitNums = (str) => str.trim().split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 0x10ffff);

export default {
  resultLabel: 'Decoded text',
  how: `
    <p>Computers only ever store numbers; "text" is a convention about which number means which
    character. This tool exposes that convention from five angles at once — edit any box and the
    other four re-encode the same underlying string.</p>
    <code class="formula">'A' → codePointAt(0) → 65 → 0x41 → 0100 0001</code>
    <h4>ASCII, Unicode and UTF-8</h4>
    <p>The decimal column shows Unicode <em>code points</em> (so an emoji is one big number), while
    the binary and hex columns show UTF-8 <em>bytes</em>. For plain English text below code point
    128 the two are identical — that's the original 7-bit ASCII range. Above it, UTF-8 spends 2–4
    bytes per character, which is why "é" becomes <code>C3 A9</code> rather than a single byte.</p>
    <h4>Base64</h4>
    <p>Base64 re-packs every 3 bytes into 4 printable characters so binary data can travel through
    text-only channels (email, JSON, data URLs). It is an encoding, not encryption — anyone can
    decode it, as this page demonstrates.</p>`,

  body: () => `
    <div class="field">
      <label for="txt">Text</label>
      <textarea id="txt" data-mode="text" spellcheck="false" placeholder="Type anything…">Hello CalcSuite!</textarea>
    </div>
    <div class="grid grid-2">
      <div class="field">
        <label for="dec">ASCII / Unicode decimal</label>
        <textarea id="dec" data-mode="decimal" spellcheck="false"></textarea>
      </div>
      <div class="field">
        <label for="bin">Binary (UTF-8 bytes)</label>
        <textarea id="bin" data-mode="binary" spellcheck="false"></textarea>
      </div>
      <div class="field">
        <label for="hex">Hexadecimal (UTF-8 bytes)</label>
        <textarea id="hex" data-mode="hex" spellcheck="false"></textarea>
      </div>
      <div class="field">
        <label for="b64">Base64</label>
        <textarea id="b64" data-mode="base64" spellcheck="false"></textarea>
      </div>
    </div>
    <div class="row mt-3">
      <button class="btn btn-sm" id="clear-all" type="button"><i class="fa-regular fa-trash-can"></i> Clear</button>
      <span class="badge" id="counts">0 chars · 0 bytes</span>
    </div>`,

  init(root, ctx) {
    const fields = qsa('[data-mode]', root);
    const el = (id) => qs(`#${id}`, root);
    let silent = false;

    const paintFrom = (text, sourceId) => {
      silent = true;
      const map = {
        text, decimal: codec.toDecimal(text), binary: codec.toBinary(text),
        hex: codec.toHex(text), base64: codec.toBase64(text)
      };
      fields.forEach((f) => { if (f.id !== sourceId) f.value = map[f.dataset.mode]; });
      qs('#counts', root).textContent = `${[...text].length} chars · ${enc.encode(text).length} bytes`;
      ctx.setResult(text || '—', `<span class="mono">${map.hex.slice(0, 90)}${map.hex.length > 90 ? '…' : ''}</span>`, { copy: text });
      silent = false;
    };

    const handle = debounce((event) => {
      if (silent) return;
      const field = event.target;
      const mode = field.dataset.mode;
      let text = '';
      if (mode === 'text') text = field.value;
      else if (mode === 'decimal') text = codec.fromDecimal(field.value);
      else if (mode === 'binary') text = codec.fromBinary(field.value);
      else if (mode === 'hex') text = codec.fromHex(field.value);
      else if (mode === 'base64') {
        const out = codec.fromBase64(field.value);
        if (out === null) { field.classList.add('is-invalid'); ctx.setError('That is not valid Base64'); return; }
        field.classList.remove('is-invalid');
        text = out;
      }
      paintFrom(text, field.id);
    }, 160);

    on(root, 'input', handle);
    on(el('clear-all'), 'click', () => { fields.forEach((f) => { f.value = ''; }); paintFrom('', null); });

    paintFrom(el('txt').value, 'txt');
  }
};
