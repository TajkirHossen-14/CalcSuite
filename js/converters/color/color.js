/**
 * Color Converter — RGB ⟷ HEX ⟷ HSL ⟷ HSV ⟷ CMYK, all live-synced.
 * A single Color class owns the state; every field is a view of it.
 */
import { on, qs, qsa } from '../../utils/dom.js';

export class Color {
  /** Canonical state is RGB in 0–255. Everything else is derived. */
  constructor(r = 124, g = 108, b = 255) { this.set(r, g, b); }

  set(r, g, b) {
    this.r = clamp(Math.round(r), 0, 255);
    this.g = clamp(Math.round(g), 0, 255);
    this.b = clamp(Math.round(b), 0, 255);
    return this;
  }

  get hex() {
    return `#${[this.r, this.g, this.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  }

  static fromHex(hex) {
    let h = String(hex).trim().replace(/^#/, '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return new Color(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
  }

  /** HSL: hue 0–360, saturation & lightness 0–100. */
  get hsl() {
    const [r, g, b] = [this.r / 255, this.g / 255, this.b / 255];
    const max = Math.max(r, g, b); const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    let h = 0; let s = 0;
    if (d !== 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: round(h), s: round(s * 100), l: round(l * 100) };
  }

  static fromHsl(h, s, l) {
    const H = ((h % 360) + 360) % 360; const S = clamp(s, 0, 100) / 100; const L = clamp(l, 0, 100) / 100;
    const c = (1 - Math.abs(2 * L - 1)) * S;
    const x = c * (1 - Math.abs(((H / 60) % 2) - 1));
    const m = L - c / 2;
    const [r, g, b] = sector(H, c, x);
    return new Color((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }

  /** HSV / HSB: hue 0–360, saturation & value 0–100. */
  get hsv() {
    const [r, g, b] = [this.r / 255, this.g / 255, this.b / 255];
    const max = Math.max(r, g, b); const d = max - Math.min(r, g, b);
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: round(h), s: round(max === 0 ? 0 : (d / max) * 100), v: round(max * 100) };
  }

  static fromHsv(h, s, v) {
    const H = ((h % 360) + 360) % 360; const S = clamp(s, 0, 100) / 100; const V = clamp(v, 0, 100) / 100;
    const c = V * S;
    const x = c * (1 - Math.abs(((H / 60) % 2) - 1));
    const m = V - c;
    const [r, g, b] = sector(H, c, x);
    return new Color((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }

  /** CMYK 0–100, using the simple (non-ICC) conversion. */
  get cmyk() {
    const [r, g, b] = [this.r / 255, this.g / 255, this.b / 255];
    const k = 1 - Math.max(r, g, b);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    return {
      c: round(((1 - r - k) / (1 - k)) * 100),
      m: round(((1 - g - k) / (1 - k)) * 100),
      y: round(((1 - b - k) / (1 - k)) * 100),
      k: round(k * 100)
    };
  }

  static fromCmyk(c, m, y, k) {
    const [C, M, Y, K] = [c, m, y, k].map((v) => clamp(v, 0, 100) / 100);
    return new Color(255 * (1 - C) * (1 - K), 255 * (1 - M) * (1 - K), 255 * (1 - Y) * (1 - K));
  }

  /** Relative luminance (WCAG) — used to pick readable swatch text. */
  get luminance() {
    const [r, g, b] = [this.r, this.g, this.b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  contrastWith(other) {
    const [a, b] = [this.luminance, other.luminance].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  }
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number.isFinite(+v) ? +v : 0));
const round = (v) => Math.round(v * 10) / 10;
function sector(H, c, x) {
  if (H < 60) return [c, x, 0];
  if (H < 120) return [x, c, 0];
  if (H < 180) return [0, c, x];
  if (H < 240) return [0, x, c];
  if (H < 300) return [x, 0, c];
  return [c, 0, x];
}

const PRESETS = ['#7C6CFF', '#2EE6C5', '#FF6B6B', '#FFB84D', '#35D07F', '#58B6FF', '#131826', '#F5F6FB'];

export default {
  resultLabel: 'HEX value',
  how: `
    <p>All five models describe the same physical colour, so the converter keeps <strong>one</strong>
    source of truth — 8-bit RGB — and derives every other field from it. Edit any input and it is
    parsed back into RGB, after which all remaining fields repaint.</p>
    <code class="formula">HEX  ↔ RGB : each pair of hex digits is one 0–255 channel
HSL  : lightness = (max + min) / 2, saturation scales with distance from 0.5
HSV  : value = max channel, saturation = (max − min) / max
CMYK : K = 1 − max(r,g,b), then C = (1 − r − K) / (1 − K)</code>
    <h4>HSL vs HSV</h4>
    <p>Both start from the same hue angle. HSL treats 50% lightness as the pure hue and pushes to
    white at 100%; HSV treats 100% value as the pure hue and never reaches white unless saturation
    drops. Designers usually think in HSL, image editors in HSV.</p>
    <h4>About CMYK</h4>
    <p>The formula used here is the standard device-independent approximation. Real print output
    depends on an ICC profile and ink behaviour, so treat the CMYK numbers as a starting point.</p>
    <h4>Contrast</h4>
    <p>The panel also reports WCAG contrast ratios against black and white using relative
    luminance, so you can tell instantly whether text will be readable on the colour.</p>`,

  body: () => `
    <div class="grid" style="grid-template-columns:minmax(0,220px) 1fr;gap:1.5rem" id="color-layout">
      <div>
        <div class="swatch" id="swatch">#7C6CFF</div>
        <div class="field mt-3">
          <label for="picker">Native picker</label>
          <input type="color" id="picker" value="#7c6cff">
        </div>
        <div class="chip-row" id="presets" style="margin-top:.75rem">
          ${PRESETS.map((p) => `<button class="chip js-preset" type="button" data-hex="${p}" style="border-color:${p}">${p}</button>`).join('')}
        </div>
        <button class="btn btn-sm btn-block" id="random-color" type="button"><i class="fa-solid fa-shuffle"></i> Random colour</button>
      </div>

      <div class="color-grid">
        <div class="field">
          <label for="hex">HEX</label>
          <div class="input-group">
            <input type="text" id="hex" value="#7C6CFF" spellcheck="false" maxlength="7">
            <button class="btn" data-copy-field="hex" type="button" title="Copy"><i class="fa-regular fa-copy"></i></button>
          </div>
        </div>

        <div class="field">
          <label>RGB</label>
          <div class="input-group">
            <input type="number" id="rgb-r" min="0" max="255" value="124" aria-label="Red">
            <input type="number" id="rgb-g" min="0" max="255" value="108" aria-label="Green">
            <input type="number" id="rgb-b" min="0" max="255" value="255" aria-label="Blue">
          </div>
          <span class="field-hint mono" id="rgb-css">rgb(124, 108, 255)</span>
        </div>

        <div class="field">
          <label>HSL</label>
          <div class="input-group">
            <input type="number" id="hsl-h" min="0" max="360" step="0.1" aria-label="Hue">
            <input type="number" id="hsl-s" min="0" max="100" step="0.1" aria-label="Saturation">
            <input type="number" id="hsl-l" min="0" max="100" step="0.1" aria-label="Lightness">
          </div>
          <span class="field-hint mono" id="hsl-css"></span>
        </div>

        <div class="field">
          <label>HSV / HSB</label>
          <div class="input-group">
            <input type="number" id="hsv-h" min="0" max="360" step="0.1" aria-label="Hue">
            <input type="number" id="hsv-s" min="0" max="100" step="0.1" aria-label="Saturation">
            <input type="number" id="hsv-v" min="0" max="100" step="0.1" aria-label="Value">
          </div>
        </div>

        <div class="field">
          <label>CMYK</label>
          <div class="input-group">
            <input type="number" id="cmyk-c" min="0" max="100" step="0.1" aria-label="Cyan">
            <input type="number" id="cmyk-m" min="0" max="100" step="0.1" aria-label="Magenta">
            <input type="number" id="cmyk-y" min="0" max="100" step="0.1" aria-label="Yellow">
            <input type="number" id="cmyk-k" min="0" max="100" step="0.1" aria-label="Key / black">
          </div>
        </div>

        <div class="field">
          <label>Contrast (WCAG)</label>
          <div class="stat-grid">
            <div class="stat"><div class="stat-label">On white</div><div class="stat-value" id="c-white">—</div></div>
            <div class="stat"><div class="stat-label">On black</div><div class="stat-value" id="c-black">—</div></div>
          </div>
        </div>
      </div>
    </div>`,

  init(root, ctx) {
    let color = new Color(124, 108, 255);
    let silent = false;
    const el = (id) => qs(`#${id}`, root);

    const paint = () => {
      silent = true;
      const { hex } = color;
      const hsl = color.hsl; const hsv = color.hsv; const cmyk = color.cmyk;

      el('hex').value = hex;
      el('picker').value = hex.toLowerCase();
      el('rgb-r').value = color.r; el('rgb-g').value = color.g; el('rgb-b').value = color.b;
      el('hsl-h').value = hsl.h; el('hsl-s').value = hsl.s; el('hsl-l').value = hsl.l;
      el('hsv-h').value = hsv.h; el('hsv-s').value = hsv.s; el('hsv-v').value = hsv.v;
      el('cmyk-c').value = cmyk.c; el('cmyk-m').value = cmyk.m; el('cmyk-y').value = cmyk.y; el('cmyk-k').value = cmyk.k;

      const rgbCss = `rgb(${color.r}, ${color.g}, ${color.b})`;
      el('rgb-css').textContent = rgbCss;
      el('hsl-css').textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

      const swatch = el('swatch');
      swatch.style.background = hex;
      swatch.style.color = color.luminance > 0.4 ? '#0b0d13' : '#ffffff';
      swatch.textContent = hex;

      const white = new Color(255, 255, 255); const black = new Color(0, 0, 0);
      const cw = color.contrastWith(white); const cb = color.contrastWith(black);
      el('c-white').innerHTML = `${cw.toFixed(2)}:1 ${badge(cw)}`;
      el('c-black').innerHTML = `${cb.toFixed(2)}:1 ${badge(cb)}`;

      ctx.setResult(hex, `${rgbCss} · hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%) · cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, { copy: hex });
      qsa('[data-copy-field]', root).forEach((b) => { b.dataset.copy = el(b.dataset.copyField).value; });
      silent = false;
    };

    const badge = (ratio) => {
      const level = ratio >= 7 ? ['AAA', 'success'] : ratio >= 4.5 ? ['AA', 'success'] : ratio >= 3 ? ['AA Large', 'warning'] : ['Fail', 'danger'];
      return `<span class="badge badge-${level[1]}" style="margin-left:.35rem">${level[0]}</span>`;
    };

    const numOf = (id) => Number(el(id).value) || 0;

    on(root, 'input', (event) => {
      if (silent) return;
      const id = event.target.id;
      if (id === 'hex') {
        const parsed = Color.fromHex(el('hex').value);
        if (!parsed) { el('hex').classList.add('is-invalid'); return; }
        el('hex').classList.remove('is-invalid');
        color = parsed;
      } else if (id === 'picker') color = Color.fromHex(el('picker').value) || color;
      else if (id.startsWith('rgb')) color = new Color(numOf('rgb-r'), numOf('rgb-g'), numOf('rgb-b'));
      else if (id.startsWith('hsl')) color = Color.fromHsl(numOf('hsl-h'), numOf('hsl-s'), numOf('hsl-l'));
      else if (id.startsWith('hsv')) color = Color.fromHsv(numOf('hsv-h'), numOf('hsv-s'), numOf('hsv-v'));
      else if (id.startsWith('cmyk')) color = Color.fromCmyk(numOf('cmyk-c'), numOf('cmyk-m'), numOf('cmyk-y'), numOf('cmyk-k'));
      else return;
      paint();
    });

    on(root, 'click', '.js-preset', (e, btn) => { color = Color.fromHex(btn.dataset.hex); paint(); });
    on(el('random-color'), 'click', () => {
      color = new Color(Math.random() * 256, Math.random() * 256, Math.random() * 256);
      paint();
    });

    paint();
  }
};
