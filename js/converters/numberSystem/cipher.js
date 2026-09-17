/**
 * Text ⟷ Cipher — one unified bidirectional tool for the classical ciphers.
 *
 * A single pair of boxes edits the same message: type on the left and the
 * enciphered text appears on the right, or paste a cipher and the plain text
 * appears. The cipher is chosen from a dropdown and its key (a Caesar shift or
 * a Vigenère keyword) appears only when that cipher actually needs one.
 *
 * For the shift ciphers there is also a solver: every one of the 26 shifts is
 * scored against English letter frequencies, so a message can be cracked
 * without knowing the key.
 */
import { qs, qsa, on, toast, escapeHTML } from '../../utils/dom.js';

/* ------------------------------------------------------------------ */
/* Cipher primitives                                                   */
/* ------------------------------------------------------------------ */

const UPPER_A = 65;
const LOWER_A = 97;

/** Rotates one letter by `amount`, preserving case and passing anything else through. */
function shiftChar(ch, amount) {
  const code = ch.charCodeAt(0);
  const base = (code >= UPPER_A && code <= 90) ? UPPER_A
    : (code >= LOWER_A && code <= 122) ? LOWER_A
      : null;
  if (base === null) return ch;
  // Double modulo so negative shifts (decoding) stay in range.
  return String.fromCharCode(((code - base + amount) % 26 + 26) % 26 + base);
}

/** Caesar shift. Spacing, punctuation, digits and case are all preserved. */
export function caesar(text, shift) {
  return [...String(text)].map((ch) => shiftChar(ch, shift)).join('');
}

/** Atbash: A↔Z, B↔Y … its own inverse. */
export function atbash(text) {
  return [...String(text)].map((ch) => {
    const code = ch.charCodeAt(0);
    if (code >= UPPER_A && code <= 90) return String.fromCharCode(90 - (code - UPPER_A));
    if (code >= LOWER_A && code <= 122) return String.fromCharCode(122 - (code - LOWER_A));
    return ch;
  }).join('');
}

/**
 * Vigenère. `dir` is +1 to encipher and -1 to decipher. The key advances only
 * on letters, so punctuation never consumes a key character — that is what
 * keeps encode and decode exact inverses.
 */
export function vigenere(text, key, dir = 1) {
  const letters = String(key).replace(/[^a-z]/gi, '').toUpperCase();
  if (!letters) return { out: String(text), error: 'Vigenère needs a keyword of at least one letter.' };

  let index = 0;
  const out = [...String(text)].map((ch) => {
    if (!/[a-z]/i.test(ch)) return ch;
    const amount = (letters.charCodeAt(index % letters.length) - UPPER_A) * dir;
    index += 1;
    return shiftChar(ch, amount);
  }).join('');
  return { out, error: null };
}

/** A1Z26: letters become their position in the alphabet. Letters only. */
export function toA1Z26(text) {
  const unknown = new Set();
  const code = String(text).toUpperCase().trim().split(/\s+/)
    .map((word) => [...word]
      .map((ch) => {
        const n = ch.charCodeAt(0) - UPPER_A + 1;
        if (n >= 1 && n <= 26) return String(n);
        unknown.add(ch);
        return '';
      })
      .filter(Boolean)
      .join('-'))
    .filter(Boolean)
    .join(' ');
  return { code, unknown: [...unknown] };
}

/** Accepts dashes, commas or spaces between numbers; whitespace splits words. */
export function fromA1Z26(code) {
  const bad = new Set();
  const trimmed = String(code).trim();
  if (!trimmed) return { text: '', bad: [] };

  const text = trimmed.split(/\s+/)
    .map((word) => word.split(/[-,._]+/).filter(Boolean)
      .map((token) => {
        const n = Number(token);
        if (Number.isInteger(n) && n >= 1 && n <= 26) return String.fromCharCode(UPPER_A + n - 1);
        bad.add(token);
        return '';
      })
      .join(''))
    .filter(Boolean)
    .join(' ');
  return { text, bad: [...bad] };
}

/* ------------------------------------------------------------------ */
/* Frequency analysis (the shift solver)                               */
/* ------------------------------------------------------------------ */

/** Relative frequency of each letter in English text, as percentages. */
const ENGLISH = [
  8.167, 1.492, 2.782, 4.253, 12.702, 2.228, 2.015, 6.094, 6.966, 0.153,
  0.772, 4.025, 2.406, 6.749, 7.507, 1.929, 0.095, 5.987, 6.327, 9.056,
  2.758, 0.978, 2.360, 0.150, 1.974, 0.074
];

/**
 * Chi-squared distance from English. Lower is a better fit, so the shift with
 * the smallest score is the most likely decryption.
 */
export function englishScore(text) {
  const counts = new Array(26).fill(0);
  let total = 0;
  for (const ch of String(text).toUpperCase()) {
    const i = ch.charCodeAt(0) - UPPER_A;
    if (i >= 0 && i < 26) { counts[i] += 1; total += 1; }
  }
  if (!total) return Infinity;
  return counts.reduce((sum, observed, i) => {
    const expected = (ENGLISH[i] / 100) * total;
    return sum + ((observed - expected) ** 2) / expected;
  }, 0);
}

/** Every shift of a cipher text, best English fit first. */
export function crackCaesar(cipherText) {
  return Array.from({ length: 26 }, (unused, shift) => {
    const text = caesar(cipherText, -shift);
    return { shift, text, score: englishScore(text) };
  }).sort((a, b) => a.score - b.score);
}

/* ------------------------------------------------------------------ */
/* Cipher registry                                                     */
/* ------------------------------------------------------------------ */

/**
 * One entry per cipher. `key` says which key control to reveal, `monoalphabetic`
 * says whether a fixed A→? alphabet table is meaningful, and `shiftable` marks
 * the ciphers the solver can attack.
 */
export const CIPHERS = {
  caesar: {
    name: 'Caesar shift',
    key: 'shift',
    monoalphabetic: true,
    shiftable: true,
    encode: (text, { shift }) => ({ out: caesar(text, shift) }),
    decode: (text, { shift }) => ({ out: caesar(text, -shift) })
  },
  rot13: {
    name: 'ROT13',
    key: null,
    monoalphabetic: true,
    shiftable: true,
    encode: (text) => ({ out: caesar(text, 13) }),
    decode: (text) => ({ out: caesar(text, 13) })
  },
  atbash: {
    name: 'Atbash (A↔Z)',
    key: null,
    monoalphabetic: true,
    shiftable: false,
    encode: (text) => ({ out: atbash(text) }),
    decode: (text) => ({ out: atbash(text) })
  },
  vigenere: {
    name: 'Vigenère keyword',
    key: 'keyword',
    monoalphabetic: false,
    shiftable: false,
    encode: (text, { keyword }) => {
      const { out, error } = vigenere(text, keyword, 1);
      return { out, error };
    },
    decode: (text, { keyword }) => {
      const { out, error } = vigenere(text, keyword, -1);
      return { out, error };
    }
  },
  a1z26: {
    name: 'A1Z26 (letter numbers)',
    key: null,
    monoalphabetic: false,
    shiftable: false,
    encode: (text) => {
      const { code, unknown } = toA1Z26(text);
      return {
        out: code,
        warn: unknown.length
          ? `A1Z26 only covers letters, so ${unknown.map((c) => `<span class="mono">${escapeHTML(c)}</span>`).join(' ')} ${unknown.length === 1 ? 'was' : 'were'} skipped.`
          : null
      };
    },
    decode: (text) => {
      const { text: plain, bad } = fromA1Z26(text);
      return {
        out: plain,
        warn: bad.length
          ? `Not a number from 1–26: ${bad.slice(0, 6).map((t) => `<span class="mono">${escapeHTML(t)}</span>`).join(' ')}.`
          : null
      };
    }
  }
};

const SAMPLES = [
  ['Hello World', 'Hello World'],
  ['Attack at dawn', 'Attack at dawn'],
  ['CalcSuite', 'CalcSuite'],
  ['The quick brown fox', 'The quick brown fox']
];

/** A→? table for the monoalphabetic ciphers. */
function alphabetTable(cipherId, keys) {
  const cipher = CIPHERS[cipherId];
  if (!cipher || !cipher.monoalphabetic) return '';
  const letters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  const mapped = letters.map((ch) => cipher.encode(ch, keys).out);
  return `
    <div class="table-wrap">
      <table class="data-table cipher-alphabet">
        <tbody>
          <tr><th scope="row">Plain</th>${letters.map((c) => `<td class="mono">${c}</td>`).join('')}</tr>
          <tr><th scope="row">Cipher</th>${mapped.map((c) => `<td class="mono">${escapeHTML(c)}</td>`).join('')}</tr>
        </tbody>
      </table>
    </div>`;
}

export default {
  resultLabel: 'Cipher text',
  how: `
    <p>A <strong>cipher</strong> scrambles a message so only someone with the key can read it.
    The five here are <em>classical</em> ciphers — the ones used before computers, worked out with
    pencil and paper. They are wonderful for puzzles, escape rooms, geocaching and CTF challenges,
    and they are how cryptography is taught. None of them is secure today; a phone can break any of
    them in milliseconds.</p>

    <h4>Substitution, two ways</h4>
    <p>Every cipher on this page replaces letters rather than rearranging them. The difference is
    whether the replacement alphabet ever changes:</p>
    <ul>
      <li><strong>Caesar shift</strong> — slide the alphabet along by a fixed number. Julius Caesar
      reportedly used a shift of 3, so <span class="mono">A→D</span>. The key is just that number,
      which means there are only 25 useful keys.</li>
      <li><strong>ROT13</strong> — a Caesar shift of exactly 13. Because 13 is half of 26, applying
      it twice returns the original text, so one operation both hides and reveals. Usenet used it
      to cover spoilers and punchlines.</li>
      <li><strong>Atbash</strong> — reverse the alphabet: <span class="mono">A↔Z</span>,
      <span class="mono">B↔Y</span>. It comes from Hebrew scribal tradition and appears in the Book
      of Jeremiah. It has no key at all, and it is also its own inverse.</li>
      <li><strong>Vigenère</strong> — a keyword sets a <em>different</em> shift for each position,
      repeating as it goes. With the key <span class="mono">KEY</span>, the first letter shifts by
      K (10), the second by E (4), the third by Y (24), then it starts over. This is
      <em>polyalphabetic</em>, and for three centuries it was called
      <span class="mono">le chiffre indéchiffrable</span>.</li>
      <li><strong>A1Z26</strong> — not really encryption, just a substitution of numbers for
      letters: <span class="mono">A=1 … Z=26</span>. It is the classic first layer of a puzzle.</li>
    </ul>

    <h4>Why a Caesar shift falls instantly</h4>
    <p>Shifting the alphabet moves the letter frequencies but does not flatten them, so English
    fingerprints survive: E is still the most common letter, just wearing a disguise. Compare the
    letter counts of a candidate against known English frequencies with a chi-squared distance:</p>
    <code class="formula">score = Σ (observed − expected)² ÷ expected
expected = English frequency × total letters</code>
    <p>The lowest score is almost always the right answer. That is exactly what the
    <strong>Solve without the key</strong> panel does — it tries all 26 shifts and ranks them, which
    is why a single-key cipher offers no real protection. Vigenère resists this, because each
    position uses a different alphabet and the frequencies genuinely do flatten out; it needs the
    longer Kasiski or Friedman analysis instead.</p>

    <h4>What is preserved</h4>
    <p>The letter ciphers keep your capitalisation, spaces, digits and punctuation exactly as typed
    and only move A–Z, so word shapes stay visible. Real cryptography deliberately destroys those
    clues — a reminder that these are puzzles, not protection. A1Z26 is the exception: it handles
    letters only and reports anything it had to drop.</p>`,

  body: () => `
    <div class="row" style="align-items:flex-end">
      <div class="field" style="margin:0;min-width:13rem;flex:1 1 14rem">
        <label for="cipher">Cipher</label>
        <select id="cipher">
          ${Object.entries(CIPHERS).map(([id, c], i) => `<option value="${id}"${i === 0 ? ' selected' : ''}>${escapeHTML(c.name)}</option>`).join('')}
        </select>
      </div>

      <div class="field key-field" id="key-shift" style="margin:0;min-width:10rem">
        <label for="shift">Shift <span class="field-hint">(1–25)</span></label>
        <input type="number" id="shift" min="0" max="25" step="1" value="3" inputmode="numeric">
      </div>

      <div class="field key-field" id="key-keyword" style="margin:0;min-width:11rem" hidden>
        <label for="keyword">Keyword</label>
        <input type="text" id="keyword" value="KEY" spellcheck="false" autocapitalize="characters"
               placeholder="e.g. LEMON">
      </div>
    </div>

    <div class="conv-row mt-4">
      <div class="field">
        <label for="plain">Plain text</label>
        <textarea id="plain" data-side="plain" spellcheck="false"
                  placeholder="Type a message…">Hello World</textarea>
      </div>

      <button class="swap-btn" id="swap" type="button" title="Swap the two boxes"
              aria-label="Swap plain text and cipher text">
        <i class="fa-solid fa-right-left" aria-hidden="true"></i>
      </button>

      <div class="field">
        <label for="cipher-text">Cipher text</label>
        <textarea id="cipher-text" data-side="cipher" spellcheck="false"
                  placeholder="…or paste an encoded message"></textarea>
      </div>
    </div>

    <div class="row mt-3">
      <button class="btn btn-sm" id="clear" type="button">
        <i class="fa-regular fa-trash-can" aria-hidden="true"></i> Clear
      </button>
      <span class="badge" id="cipher-counts">0 characters</span>
      <span class="badge" id="cipher-mode"><i class="fa-solid fa-lock" aria-hidden="true"></i> Encoding</span>
    </div>

    <div class="chips mt-3" role="group" aria-label="Sample messages">
      ${SAMPLES.map(([label, value]) => `<button class="chip" type="button" data-sample="${escapeHTML(value)}">${escapeHTML(label)}</button>`).join('')}
    </div>

    <div id="cipher-note" class="mt-3"></div>

    <details class="how-it-works mt-4" id="solver-block">
      <summary><i class="fa-solid fa-unlock-keyhole" aria-hidden="true" style="color:var(--accent)"></i> Solve without the key</summary>
      <div class="how-body" id="solver-body"></div>
    </details>

    <details class="how-it-works mt-3" id="alphabet-block">
      <summary><i class="fa-solid fa-table-list" aria-hidden="true" style="color:var(--accent)"></i> Cipher alphabet</summary>
      <div class="how-body" id="alphabet-body"></div>
    </details>`,

  init(root, ctx) {
    const plain = qs('#plain', root);
    const cipherBox = qs('#cipher-text', root);
    const note = qs('#cipher-note', root);
    const select = qs('#cipher', root);
    const solverBlock = qs('#solver-block', root);
    const alphabetBlock = qs('#alphabet-block', root);
    let silent = false;
    let lastEdited = 'plain';

    const currentKeys = () => ({
      shift: Math.trunc(Number(qs('#shift', root).value)) || 0,
      keyword: qs('#keyword', root).value
    });

    /** Reveal only the key control the chosen cipher uses. */
    const syncKeyFields = () => {
      const needs = CIPHERS[select.value].key;
      qs('#key-shift', root).hidden = needs !== 'shift';
      qs('#key-keyword', root).hidden = needs !== 'keyword';
    };

    const setNote = (html, level = 'warning') => {
      note.innerHTML = html
        ? `<div class="alert alert-${level}"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><span>${html}</span></div>`
        : '';
    };

    const setCounts = (text, decoding) => {
      const letters = (String(text).match(/[a-z]/gi) || []).length;
      const chars = String(text).length;
      qs('#cipher-counts', root).textContent =
        `${chars} character${chars === 1 ? '' : 's'} · ${letters} letter${letters === 1 ? '' : 's'}`;
      qs('#cipher-mode', root).innerHTML = decoding
        ? '<i class="fa-solid fa-lock-open" aria-hidden="true"></i> Decoding'
        : '<i class="fa-solid fa-lock" aria-hidden="true"></i> Encoding';
    };

    /** The all-26-shifts ranking, only offered for the shift ciphers. */
    const paintSolver = () => {
      const cipher = CIPHERS[select.value];
      solverBlock.hidden = !cipher.shiftable;
      if (!cipher.shiftable) return;

      const body = qs('#solver-body', root);
      const source = cipherBox.value.trim();
      if (!source) {
        body.innerHTML = '<p class="field-hint">Paste an enciphered message into the cipher box and every one of the 26 shifts will be ranked here by how much it looks like English.</p>';
        return;
      }

      const ranked = crackCaesar(source);
      body.innerHTML = `
        <p class="field-hint">All 26 shifts, best English fit first. Click one to load it as the plain text.</p>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Shift</th><th>Score</th><th>Candidate</th><th></th></tr></thead>
            <tbody>
              ${ranked.map(({ shift, text, score }, i) => `
                <tr${i === 0 ? ' class="is-best"' : ''}>
                  <td class="mono">${shift}</td>
                  <td class="mono">${Number.isFinite(score) ? score.toFixed(1) : '—'}</td>
                  <td class="mono" style="word-break:break-word">${escapeHTML(text.slice(0, 70))}${text.length > 70 ? '…' : ''}</td>
                  <td><button class="btn btn-sm" type="button" data-use-shift="${shift}">Use</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    };

    const paintAlphabet = () => {
      const cipher = CIPHERS[select.value];
      alphabetBlock.hidden = !cipher.monoalphabetic;
      if (cipher.monoalphabetic) {
        qs('#alphabet-body', root).innerHTML = alphabetTable(select.value, currentKeys());
      }
    };

    /** Re-run the conversion in whichever direction the user was last typing. */
    const run = (source = lastEdited) => {
      const cipher = CIPHERS[select.value];
      const keys = currentKeys();
      const decoding = source === 'cipher';
      const input = decoding ? cipherBox.value : plain.value;
      const { out, error, warn } = decoding ? cipher.decode(input, keys) : cipher.encode(input, keys);

      silent = true;
      if (decoding) plain.value = out; else cipherBox.value = out;
      silent = false;

      setCounts(input, decoding);
      setNote(error || warn || '', error ? 'danger' : 'warning');

      // Relabel the result panel so it always names what is actually shown.
      // Scoped to ctx.view because during init the page is still detached.
      const resultLabel = qs('.result-label', ctx.view);
      if (resultLabel) resultLabel.textContent = decoding ? 'Plain text' : 'Cipher text';

      const trimmed = input.trim();
      ctx.setResult(out || '—',
        trimmed
          ? `${decoding ? 'Deciphered' : 'Enciphered'} with <strong>${escapeHTML(cipher.name)}</strong>${cipher.key === 'shift' ? ` · shift ${keys.shift}` : ''}${cipher.key === 'keyword' && keys.keyword.trim() ? ` · key <span class="mono">${escapeHTML(keys.keyword.trim().toUpperCase())}</span>` : ''}`
          : '',
        { copy: out });

      paintSolver();
      paintAlphabet();
    };

    on(root, 'input', 'textarea', (event, field) => {
      if (silent) return;
      lastEdited = field.dataset.side;
      run(lastEdited);
    });

    on(select, 'change', () => {
      syncKeyFields();
      // Re-encode from the plain text: the old cipher text is meaningless now.
      lastEdited = 'plain';
      run('plain');
    });

    on(root, 'input', '#shift, #keyword', () => run(lastEdited));

    on(qs('#swap', root), 'click', () => {
      const from = plain.value;
      const to = cipherBox.value;
      if (!from.trim() && !to.trim()) { toast('Nothing to swap yet', 'fa-solid fa-circle-info'); return; }
      silent = true;
      plain.value = to;
      cipherBox.value = from;
      silent = false;
      // The box the user was reading becomes the box they are now writing.
      lastEdited = 'plain';
      run('plain');
      qs('#swap', root).classList.toggle('is-spinning');
      toast('Swapped the two boxes', 'fa-solid fa-right-left');
    });

    on(root, 'click', '[data-sample]', (event, chip) => {
      qsa('.chip', root).forEach((c) => c.classList.toggle('is-active', c === chip));
      silent = true;
      plain.value = chip.dataset.sample;
      silent = false;
      lastEdited = 'plain';
      run('plain');
    });

    on(root, 'click', '[data-use-shift]', (event, button) => {
      const shift = Number(button.dataset.useShift);
      select.value = 'caesar';
      syncKeyFields();
      qs('#shift', root).value = shift;
      // The cipher box already holds the message; decoding it with this shift
      // is exactly what the candidate row was previewing.
      lastEdited = 'cipher';
      run('cipher');
      toast(`Loaded shift ${shift}`, 'fa-solid fa-unlock-keyhole');
    });

    on(qs('#clear', root), 'click', () => {
      silent = true;
      plain.value = '';
      cipherBox.value = '';
      silent = false;
      qsa('.chip', root).forEach((c) => c.classList.remove('is-active'));
      lastEdited = 'plain';
      run('plain');
      plain.focus();
    });

    syncKeyFields();
    run('plain');
  }
};
