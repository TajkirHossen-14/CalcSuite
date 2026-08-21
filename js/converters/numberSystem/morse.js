/**
 * Text ⟷ Morse Code — one unified bidirectional tool.
 *
 * Both boxes edit the same underlying message: type letters on the left and
 * Morse appears on the right, or paste dots and dashes and the plain text
 * appears. The ⇄ button swaps the two, and the whole message can be played
 * back as real audio through the Web Audio API.
 */
import { qs, qsa, on, toast, escapeHTML } from '../../utils/dom.js';

/** International Morse Code (ITU-R M.1677-1) — letters, digits, punctuation. */
export const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', $: '...-..-', '@': '.--.-.'
};

/** Reverse lookup, built once from MORSE so the two can never disagree. */
export const FROM_MORSE = Object.entries(MORSE)
  .reduce((map, [char, code]) => { map[code] = char; return map; }, {});

/** Letters are separated by a space, words by a forward slash. */
export function textToMorse(text) 
{
  const unknown = new Set();
  const code = String(text).toUpperCase().trim().split(/\s+/)
    .map((word) => [...word]
      .map((char) => {
        if (MORSE[char]) return MORSE[char];
        unknown.add(char);
        return '';
      })
      .filter(Boolean)
      .join(' '))
    .filter(Boolean)
    .join(' / ');
  return { code, unknown: [...unknown] };
}

/** Accepts · • − — as well as . and -, and either / or | as a word break. */
export function morseToText(code) 
{
  const bad = new Set();
  const normalised = String(code)
    .replace(/[·•]/g, '.')
    .replace(/[−–—]/g, '-')
    .replace(/[|]/g, '/')
    .trim();
  if (!normalised) return { text: '', bad: [] };

  const text = normalised.split(/\s*\/\s*/)
    .map((word) => word.split(/\s+/).filter(Boolean)
      .map((token) => {
        if (FROM_MORSE[token]) return FROM_MORSE[token];
        bad.add(token);
        return '';
      })
      .join(''))
    .filter(Boolean)
    .join(' ');
  return { text, bad: [...bad] };
}

/* ------------------------------------------------------------------ */
/* Audio playback                                                      */
/* ------------------------------------------------------------------ */

/**
 * Plays a Morse string as tones. Encapsulates its own AudioContext so the
 * tool can stop and dispose of it cleanly on navigation away.
 */
class MorsePlayer {
  #ctx = null;
  #timers = [];
  #onEnd = null;

  get playing() { return this.#timers.length > 0; }

  /** Standard Morse timing, derived from a single dot duration. */
  play(code, { wpm = 15, frequency = 600, onEnd = null } = {}) {
    this.stop();
    if (!code) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) { toast('Audio is not supported in this browser', 'fa-solid fa-volume-xmark'); return; }

    this.#ctx = new AudioCtx();
    this.#onEnd = onEnd;
    // Safari and iOS hand back a suspended context; the click that got us here
    // is a valid user gesture, so resuming now is allowed.
    if (this.#ctx.state === 'suspended') this.#ctx.resume().catch(() => {});

    // PARIS standard: dot = 1.2 / words-per-minute, in seconds.
    const dot = 1.2 / wpm;
    let at = this.#ctx.currentTime + 0.08;

    for (const symbol of code) {
      if (symbol === '.' || symbol === '-') {
        const length = symbol === '.' ? dot : dot * 3;
        this.#beep(at, length, frequency);
        at += length + dot;            // one dot of silence between symbols
      } else if (symbol === ' ') {
        at += dot * 2;                 // 3 dots total between letters
      } else if (symbol === '/') {
        at += dot * 4;                 // 7 dots total between words
      }
    }

    const totalMs = (at - this.#ctx.currentTime) * 1000;
    this.#timers.push(setTimeout(() => { this.stop(); }, totalMs + 120));
  }

  #beep(at, duration, frequency) {
    const osc = this.#ctx.createOscillator();
    const gain = this.#ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    // Short ramps prevent the clicks a hard gate would produce.
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.28, at + 0.006);
    gain.gain.setValueAtTime(0.28, at + duration - 0.006);
    gain.gain.linearRampToValueAtTime(0, at + duration);
    osc.connect(gain).connect(this.#ctx.destination);
    osc.start(at);
    osc.stop(at + duration + 0.02);
  }

  stop() {
    this.#timers.forEach(clearTimeout);
    this.#timers = [];
    if (this.#ctx) {
      this.#ctx.close().catch(() => {});
      this.#ctx = null;
    }
    if (this.#onEnd) { const fn = this.#onEnd; this.#onEnd = null; fn(); }
  }
}

const SAMPLES = [
  ['SOS', 'SOS'],
  ['Hello World', 'HELLO WORLD'],
  ['CalcSuite', 'CALCSUITE'],
  ['CQ DX', 'CQ DX']
];

export default {
  resultLabel: 'Morse code',
  how: `
    <p>Morse code represents each character as a short sequence of two symbols — a
    <strong>dot</strong> (·) and a <strong>dash</strong> (−). Samuel Morse and Alfred Vail designed
    it in the 1840s so that a single on/off telegraph key could carry language, and the
    International Telecommunication Union still standardises it today.</p>
    <h4>The three gaps matter as much as the symbols</h4>
    <p>Morse is not just dots and dashes; the silences carry the structure. Every duration is a
    multiple of one dot:</p>
    <code class="formula">dot            = 1 unit
dash           = 3 units
gap inside a letter = 1 unit
gap between letters = 3 units
gap between words   = 7 units</code>
    <p>In writing, the letter gap becomes a space and the word gap a forward slash, so
    <span class="mono">HI</span> is <span class="mono">.... ..</span> and
    <span class="mono">HI ALL</span> is <span class="mono">.... .. / .- .-.. .-..</span>.</p>
    <h4>Why decoding is lossy</h4>
    <p>Morse has no notion of upper and lower case, so <span class="mono">Hello</span> and
    <span class="mono">HELLO</span> encode identically and always decode back as capitals. It also
    has no code for most symbols. This is the opposite of the Base64 and hex conversions elsewhere
    in CalcSuite, which are perfectly reversible — anything Morse cannot represent is reported
    rather than silently dropped.</p>
    <h4>The audio</h4>
    <p>Playback is generated live with the Web Audio API — a sine oscillator gated by an envelope,
    with no sound files involved. Speed is set in words per minute using the standard reference word
    "PARIS", which is exactly 50 units long, so <span class="mono">dot = 1.2 ÷ wpm</span> seconds.
    Real operators comfortably read 20–30 wpm.</p>`,

  body: () => `
    <div class="conv-row">
      <div class="field">
        <label for="plain">Text</label>
        <textarea id="plain" data-side="plain" spellcheck="false"
                  placeholder="Type a message…">Hello World</textarea>
      </div>

      <button class="swap-btn" id="swap" type="button" title="Swap the two boxes" aria-label="Swap text and Morse">
        <i class="fa-solid fa-right-left" aria-hidden="true"></i>
      </button>

      <div class="field">
        <label for="morse">Morse code</label>
        <textarea id="morse" data-side="morse" spellcheck="false"
                  placeholder=".... . .-.. .-.. --- / .-- --- .-. .-.. -.."></textarea>
      </div>
    </div>

    <div class="row mt-3">
      <button class="btn btn-primary btn-sm" id="play" type="button">
        <i class="fa-solid fa-play" aria-hidden="true"></i> <span id="play-label">Play</span>
      </button>
      <div class="field" style="margin:0;min-width:11rem">
        <label for="wpm" class="field-hint" style="margin-bottom:.15rem">Speed: <span id="wpm-out" class="mono">15</span> wpm</label>
        <input type="range" id="wpm" min="5" max="35" step="1" value="15">
      </div>
      <button class="btn btn-sm" id="clear" type="button"><i class="fa-regular fa-trash-can"></i> Clear</button>
      <span class="badge" id="morse-counts">0 characters</span>
    </div>

    <div class="chips mt-3" role="group" aria-label="Sample messages">
      ${SAMPLES.map(([label, value]) => `<button class="chip" type="button" data-sample="${escapeHTML(value)}">${escapeHTML(label)}</button>`).join('')}
    </div>

    <div id="morse-note" class="mt-3"></div>

    <details class="how-it-works mt-4">
      <summary><i class="fa-solid fa-table-list" aria-hidden="true" style="color:var(--accent)"></i> Full Morse alphabet</summary>
      <div class="how-body">
        <div class="stat-grid">
          ${Object.entries(MORSE).map(([char, code]) => `
            <div class="stat">
              <div class="stat-label">${escapeHTML(char)}</div>
              <div class="stat-value mono" style="font-size:var(--fs-md)">${code.replace(/\./g, '·').replace(/-/g, '−')}</div>
            </div>`).join('')}
        </div>
      </div>
    </details>`,

  init(root, ctx) {
    const plain = qs('#plain', root);
    const morse = qs('#morse', root);
    const note = qs('#morse-note', root);
    const player = new MorsePlayer();
    let silent = false;

    const setPlayLabel = (playing) => {
      qs('#play-label', root).textContent = playing ? 'Stop' : 'Play';
      qs('#play i', root).className = playing ? 'fa-solid fa-stop' : 'fa-solid fa-play';
    };

    /** Repaint both boxes and the result from a known-good plain-text message. */
    const paint = (text, source) => {
      silent = true;
      const { code, unknown } = textToMorse(text);
      if (source !== 'plain') plain.value = text;
      if (source !== 'morse') morse.value = code;

      const letters = text.replace(/\s+/g, '').length;
      qs('#morse-counts', root).textContent =
        `${letters} character${letters === 1 ? '' : 's'} · ${code ? code.split(' / ').length : 0} word${code && code.split(' / ').length === 1 ? '' : 's'}`;

      ctx.setResult(code || '—',
        text ? `Encoded from <span class="mono">${escapeHTML(text.slice(0, 60))}${text.length > 60 ? '…' : ''}</span>` : '',
        { copy: code });

      note.innerHTML = unknown.length
        ? `<div class="alert alert-warning"><i class="fa-solid fa-triangle-exclamation"></i><span>Morse has no code for ${unknown.map((c) => `<span class="mono">${escapeHTML(c)}</span>`).join(' ')} — ${unknown.length === 1 ? 'it was' : 'they were'} skipped.</span></div>`
        : '';
      silent = false;
    };

    on(root, 'input', 'textarea', (event, field) => {
      if (silent) return;
      if (field.dataset.side === 'plain') {
        paint(field.value, 'plain');
      } else {
        const { text, bad } = morseToText(field.value);
        silent = true;
        plain.value = text;
        ctx.setResult(text || '—',
          text ? `Decoded from <span class="mono">${escapeHTML(field.value.trim().slice(0, 60))}${field.value.trim().length > 60 ? '…' : ''}</span>` : '',
          { copy: text });
        const letters = text.replace(/\s+/g, '').length;
        qs('#morse-counts', root).textContent = `${letters} character${letters === 1 ? '' : 's'} decoded`;
        note.innerHTML = bad.length
          ? `<div class="alert alert-warning"><i class="fa-solid fa-triangle-exclamation"></i><span>Not valid Morse: ${bad.slice(0, 6).map((t) => `<span class="mono">${escapeHTML(t)}</span>`).join(' ')} — check the spacing (one space between letters, <span class="mono">/</span> between words).</span></div>`
          : '';
        silent = false;
      }
    });

    on(qs('#swap', root), 'click', () => {
      // Decode whatever Morse is showing, then treat it as the new plain text.
      const { text } = morseToText(morse.value);
      if (!text) { toast('Nothing to swap yet', 'fa-solid fa-circle-info'); return; }
      paint(text, null);
      toast('Swapped — decoded Morse is now the text', 'fa-solid fa-right-left');
    });

    on(root, 'click', '[data-sample]', (event, chip) => {
      qsa('.chip', root).forEach((c) => c.classList.toggle('is-active', c === chip));
      paint(chip.dataset.sample, null);
    });

    on(qs('#clear', root), 'click', () => {
      player.stop();
      paint('', null);
      plain.focus();
    });

    on(qs('#wpm', root), 'input', (event) => {
      qs('#wpm-out', root).textContent = event.target.value;
    });

    on(qs('#play', root), 'click', () => {
      if (player.playing) { player.stop(); setPlayLabel(false); return; }
      const code = morse.value.trim();
      if (!code) { toast('Nothing to play yet', 'fa-solid fa-circle-info'); return; }
      setPlayLabel(true);
      player.play(code, {
        wpm: Number(qs('#wpm', root).value) || 15,
        onEnd: () => setPlayLabel(false)
      });
    });

    paint(plain.value, 'plain');

    // Handed to the router: kills any playing audio when the user navigates away.
    return () => player.stop();
  }
};
