/**
 * Live Currency Converter — fetch + async/await, with a localStorage rate cache
 * so the tool still works offline (clearly labelled as stale).
 */
import { on, qs, escapeHTML } from '../../utils/dom.js';
import { fmt, fmtFixed, fmtRelative } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';
import * as storage from '../../utils/storage.js';

const CACHE_KEY = 'rates:USD';
const MAX_AGE = 1000 * 60 * 60 * 6; // 6 hours

const SOURCES = [
  { name: 'open.er-api.com', url: 'https://open.er-api.com/v6/latest/USD', parse: (d) => (d && d.rates ? d.rates : null) },
  { name: 'exchangerate-api', url: 'https://api.exchangerate-api.com/v4/latest/USD', parse: (d) => (d && d.rates ? d.rates : null) },
  { name: 'frankfurter.app', url: 'https://api.frankfurter.app/latest?from=USD', parse: (d) => (d && d.rates ? { USD: 1, ...d.rates } : null) }
];

const NAMES = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen', AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar', CHF: 'Swiss Franc', CNY: 'Chinese Yuan', INR: 'Indian Rupee', SGD: 'Singapore Dollar',
  NZD: 'New Zealand Dollar', HKD: 'Hong Kong Dollar', SEK: 'Swedish Krona', NOK: 'Norwegian Krone',
  DKK: 'Danish Krone', PLN: 'Polish Zloty', ZAR: 'South African Rand', BRL: 'Brazilian Real',
  MXN: 'Mexican Peso', AED: 'UAE Dirham', SAR: 'Saudi Riyal', TRY: 'Turkish Lira', KRW: 'South Korean Won',
  THB: 'Thai Baht', IDR: 'Indonesian Rupiah', MYR: 'Malaysian Ringgit', PHP: 'Philippine Peso',
  VND: 'Vietnamese Dong', NGN: 'Nigerian Naira', EGP: 'Egyptian Pound', KES: 'Kenyan Shilling',
  PKR: 'Pakistani Rupee', BDT: 'Bangladeshi Taka', LKR: 'Sri Lankan Rupee', RUB: 'Russian Ruble',
  UAH: 'Ukrainian Hryvnia', CZK: 'Czech Koruna', HUF: 'Hungarian Forint', RON: 'Romanian Leu',
  ILS: 'Israeli Shekel', CLP: 'Chilean Peso', COP: 'Colombian Peso', ARS: 'Argentine Peso', PEN: 'Peruvian Sol'
};

/** Offline seed so the page is never empty on a first visit without network. */
const FALLBACK = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 151.4, AUD: 1.52, CAD: 1.36, CHF: 0.9, CNY: 7.23, INR: 83.3,
  SGD: 1.35, NZD: 1.64, HKD: 7.82, SEK: 10.5, NOK: 10.7, DKK: 6.87, PLN: 3.97, ZAR: 18.8,
  BRL: 5.05, MXN: 16.7, AED: 3.6725, SAR: 3.75, TRY: 32.2, KRW: 1345, THB: 36.5
};

class CurrencyService {
  constructor() { this.rates = null; this.updatedAt = null; this.source = null; this.stale = false; }

  /** Cache-first, then network; falls back to the seed table when everything fails. */
  async load({ force = false } = {}) {
    const cached = storage.getCached(CACHE_KEY, MAX_AGE);
    if (cached && !cached.stale && !force) {
      this.#apply(cached.payload.rates, cached.at, cached.payload.source, false);
      return this;
    }
    for (const source of SOURCES) {
      try {
        const response = await fetch(source.url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const rates = source.parse(data);
        if (!rates || !rates.EUR) throw new Error('Unexpected payload');
        storage.setCached(CACHE_KEY, { rates, source: source.name });
        this.#apply(rates, Date.now(), source.name, false);
        return this;
      } catch (error) {
        console.warn(`[currency] ${source.name} failed:`, error.message);
      }
    }
    if (cached) { this.#apply(cached.payload.rates, cached.at, `${cached.payload.source} (cached)`, true); return this; }
    this.#apply(FALLBACK, null, 'built-in fallback table', true);
    return this;
  }

  #apply(rates, at, source, stale) {
    this.rates = rates; this.updatedAt = at; this.source = source; this.stale = stale;
  }

  /** Cross-rate through USD, the base every provider returns. */
  convert(amount, from, to) {
    if (!this.rates || !this.rates[from] || !this.rates[to]) return NaN;
    return (amount / this.rates[from]) * this.rates[to];
  }

  rate(from, to) { return this.convert(1, from, to); }

  get codes() {
    return Object.keys(this.rates || {}).sort((a, b) => {
      const popular = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CHF', 'CNY'];
      const ia = popular.indexOf(a); const ib = popular.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return a.localeCompare(b);
    });
  }
}

const POPULAR = [['USD', 'EUR'], ['EUR', 'USD'], ['GBP', 'USD'], ['USD', 'JPY'], ['USD', 'INR'], ['EUR', 'GBP']];

export default {
  resultLabel: 'Converted amount',
  how: `
    <p>Providers publish one table of rates against a single base currency (US dollars here), so
    converting between any two currencies is a cross-rate:</p>
    <code class="formula">amount_in_USD = amount ÷ rate(from)
result        = amount_in_USD × rate(to)</code>
    <h4>Fetching and caching</h4>
    <p>Rates are pulled with <code>fetch</code> inside an <code>async/await</code> function, and the
    response is written to <code>localStorage</code> together with a timestamp. Subsequent visits
    read the cache for six hours before going back to the network — typing in the amount box never
    triggers a request. If every provider is unreachable (offline, blocked, rate-limited) the tool
    falls back to the last cached table and labels the result as stale rather than failing.</p>
    <h4>Accuracy</h4>
    <p>These are mid-market reference rates updated roughly daily. Banks and card networks add a
    spread of 0.5–3%, so treat the figure as an indication, not a quote.</p>`,

  body: () => `
    <div class="conv-row">
      <div class="field">
        <label for="amount">Amount</label>
        <input type="number" id="amount" value="100" step="any" min="0" class="conv-value">
        <select id="from-cur" aria-label="From currency"><option>USD</option></select>
      </div>
      <button class="swap-btn" id="swap" type="button" title="Swap currencies"><i class="fa-solid fa-right-left"></i></button>
      <div class="field">
        <label for="converted">Converted</label>
        <input type="number" id="converted" step="any" class="conv-value">
        <select id="to-cur" aria-label="To currency"><option>EUR</option></select>
      </div>
    </div>

    <div class="chip-row mt-3" id="pairs">
      ${POPULAR.map(([a, b]) => `<button class="chip js-pair" type="button" data-from="${a}" data-to="${b}">${a} → ${b}</button>`).join('')}
    </div>

    <div class="row" style="justify-content:space-between">
      <span class="badge" id="rate-badge"><i class="fa-solid fa-circle-notch spin"></i> Loading rates…</span>
      <button class="btn btn-sm" id="refresh" type="button"><i class="fa-solid fa-rotate"></i> Refresh rates</button>
    </div>

    <div id="rate-note" class="mt-3"></div>

    <div class="all-units mt-4">
      <p class="panel-title" style="margin-bottom:.6rem">Same amount in major currencies</p>
      <div class="unit-list" id="major-list"><div class="skeleton"></div></div>
    </div>`,

  init(root, ctx) {
    const service = new CurrencyService();
    const el = (id) => qs(`#${id}`, root);
    let lastEdited = 'amount';
    let disposed = false;

    const fillSelects = () => {
      const options = service.codes.map((c) => `<option value="${c}">${c}${NAMES[c] ? ` — ${NAMES[c]}` : ''}</option>`).join('');
      el('from-cur').innerHTML = options;
      el('to-cur').innerHTML = options;
      el('from-cur').value = storage.get('currency:from', 'USD');
      el('to-cur').value = storage.get('currency:to', 'EUR');
      if (!el('from-cur').value) el('from-cur').value = 'USD';
      if (!el('to-cur').value) el('to-cur').value = 'EUR';
    };

    const compute = () => {
      if (!service.rates) return;
      const from = el('from-cur').value;
      const to = el('to-cur').value;
      storage.set('currency:from', from);
      storage.set('currency:to', to);

      const sourceEl = lastEdited === 'amount' ? el('amount') : el('converted');
      if (!isNumber(sourceEl.value)) { ctx.setError('Enter an amount'); return; }
      const value = Number(sourceEl.value);

      if (lastEdited === 'amount') el('converted').value = Number(service.convert(value, from, to).toFixed(4));
      else el('amount').value = Number(service.convert(value, to, from).toFixed(4));

      const amount = Number(el('amount').value);
      const converted = Number(el('converted').value);
      const rate = service.rate(from, to);

      ctx.setResult(
        `${fmtFixed(converted, 2)} ${to}`,
        `<span class="mono">${fmtFixed(amount, 2)} ${from}</span> · 1 ${from} = <span class="mono">${fmt(rate, 6)} ${to}</span> · 1 ${to} = <span class="mono">${fmt(1 / rate, 6)} ${from}</span>`,
        { copy: String(converted) }
      );

      el('major-list').innerHTML = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CHF', 'CNY', 'BRL', 'ZAR', 'SGD']
        .filter((c) => service.rates[c])
        .map((c) => `<button class="unit-item js-target" type="button" data-code="${c}">
            <span class="u-name">${c}</span><span class="u-val">${fmtFixed(service.convert(amount, from, c), 2)}</span>
          </button>`).join('');
    };

    const paintStatus = () => {
      const badge = el('rate-badge');
      badge.className = `badge ${service.stale ? 'badge-warning' : 'badge-success'}`;
      badge.innerHTML = service.stale
        ? `<i class="fa-solid fa-triangle-exclamation"></i> Offline rates${service.updatedAt ? ` from ${fmtRelative(service.updatedAt)}` : ''}`
        : `<i class="fa-solid fa-circle-check"></i> Live rates · updated ${service.updatedAt ? fmtRelative(service.updatedAt) : 'now'}`;
      el('rate-note').innerHTML = service.stale
        ? `<div class="alert alert-warn"><i class="fa-solid fa-wifi"></i><div>Could not reach a rate provider, so cached values are being used.
            Numbers may be out of date — press <strong>Refresh rates</strong> once you are back online.</div></div>`
        : `<p class="field-hint">Source: ${escapeHTML(service.source || '—')}. Mid-market rates, cached locally for 6 hours.</p>`;
    };

    const boot = async (force = false) => {
      await service.load({ force });
      if (disposed) return;
      fillSelects();
      paintStatus();
      compute();
    };

    on(el('amount'), 'input', () => { lastEdited = 'amount'; compute(); });
    on(el('converted'), 'input', () => { lastEdited = 'converted'; compute(); });
    on(root, 'change', 'select', () => { lastEdited = 'amount'; compute(); });
    on(el('swap'), 'click', (e) => {
      [el('from-cur').value, el('to-cur').value] = [el('to-cur').value, el('from-cur').value];
      e.currentTarget.classList.toggle('is-spinning');
      lastEdited = 'amount';
      compute();
    });
    on(root, 'click', '.js-pair', (e, btn) => {
      el('from-cur').value = btn.dataset.from;
      el('to-cur').value = btn.dataset.to;
      lastEdited = 'amount';
      compute();
    });
    on(root, 'click', '.js-target', (e, btn) => { el('to-cur').value = btn.dataset.code; lastEdited = 'amount'; compute(); });
    on(el('refresh'), 'click', async () => {
      el('rate-badge').innerHTML = '<i class="fa-solid fa-circle-notch spin"></i> Refreshing…';
      await boot(true);
    });

    boot();
    return () => { disposed = true; };
  }
};
