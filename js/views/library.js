/**
 * library.js — favorites, history and about views (localStorage-backed).
 */
import { createEl, qs, on, escapeHTML } from '../utils/dom.js';
import { getFavorites, getHistory, clearHistory } from '../utils/storage.js';
import { getToolByKey, TOOLS, CATEGORIES } from '../tools.js';
import { toolGridHTML, emptyStateHTML, wireFavStars } from './shared.js';
import { fmtRelative } from '../utils/format.js';

export function renderFavorites() {
  const favorites = getFavorites().map(getToolByKey).filter(Boolean);
  const view = createEl('div', { class: 'route-view' });
  view.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span aria-hidden="true">›</span><span>Favorites</span></nav>
    <header class="tool-head">
      <div class="tool-head-main">
        <h1>Favorites</h1>
        <p class="tool-desc">Pinned tools are stored in this browser via <code>localStorage</code> — no account needed.</p>
      </div>
    </header>
    ${favorites.length
      ? toolGridHTML(favorites)
      : emptyStateHTML('No favorites yet', 'Hit the ☆ on any tool card or tool page to pin it here.', 'fa-regular fa-star')}
  `;
  wireFavStars(view);
  document.title = 'Favorites — CalcSuite';
  return view;
}

export function renderHistory() {
  const view = createEl('div', { class: 'route-view' });

  const paint = () => {
    const history = getHistory();
    view.innerHTML = `
      <nav class="breadcrumb"><a href="#/">Home</a><span aria-hidden="true">›</span><span>History</span></nav>
      <header class="tool-head">
        <div class="tool-head-main">
          <h1>Calculation history</h1>
          <p class="tool-desc">The last ${history.length} results you produced, newest first. Stored locally and never uploaded.</p>
        </div>
        ${history.length ? '<button class="btn btn-danger js-clear" type="button"><i class="fa-regular fa-trash-can"></i> Clear</button>' : ''}
      </header>
      ${history.length ? history.map((h) => `
        <article class="list-item">
          <span class="tool-card-icon"><i class="fa-solid fa-clock-rotate-left"></i></span>
          <div class="list-item-main">
            <strong><a href="${h.path}">${escapeHTML(h.tool)}</a></strong>
            <span>${escapeHTML(h.expression || '')}${h.expression ? ' → ' : ''}<b>${escapeHTML(h.result)}</b></span>
          </div>
          <time datetime="${new Date(h.at).toISOString()}">${fmtRelative(h.at)}</time>
          <button class="icon-btn" data-copy="${escapeHTML(h.result)}" title="Copy result"><i class="fa-regular fa-copy"></i></button>
        </article>`).join('')
        : emptyStateHTML('No history yet', 'Use any calculator and its results will appear here automatically.', 'fa-solid fa-clock-rotate-left')}
    `;
    const clear = qs('.js-clear', view);
    if (clear) on(clear, 'click', () => { clearHistory(); paint(); });
  };

  paint();
  document.title = 'History — CalcSuite';
  return view;
}

export function renderAbout() {
  const view = createEl('div', { class: 'route-view' });
  view.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span aria-hidden="true">›</span><span>About</span></nav>
    <header class="tool-head">
      <div class="tool-head-main">
        <h1>About CalcSuite</h1>
        <p class="tool-desc">A framework-free single-page app: ${TOOLS.length} tools across ${CATEGORIES.length} categories, built with semantic HTML, CSS custom properties and ES modules.</p>
      </div>
    </header>

    <section class="panel">
      <p class="panel-title">Why it exists</p>
      <p>Classic reference sites split every conversion into its own page: one for cm→inches, another
      for inches→cm, a third for cm→feet. CalcSuite collapses each family into a single interactive
      tool with two dropdowns and a swap button, so you never navigate to change direction.</p>
      <p class="mb-0">Everything runs in your browser. The only network request in the entire app is the
      currency converter's exchange-rate fetch, and even that is cached locally so it keeps working offline.</p>
    </section>

    <section class="panel">
      <p class="panel-title">Under the hood</p>
      <div class="stat-grid">
        <div class="stat"><div class="stat-label">Routing</div><div class="stat-value">Hash router</div></div>
        <div class="stat"><div class="stat-label">Modules</div><div class="stat-value">Lazy import()</div></div>
        <div class="stat"><div class="stat-label">State</div><div class="stat-value">ES6 classes</div></div>
        <div class="stat"><div class="stat-label">Storage</div><div class="stat-value">localStorage</div></div>
        <div class="stat"><div class="stat-label">Theming</div><div class="stat-value">CSS variables</div></div>
        <div class="stat"><div class="stat-label">Offline</div><div class="stat-value">Service worker</div></div>
      </div>
      <hr class="divider">
      <p class="mb-0 text-muted">Keyboard shortcuts: <kbd>/</kbd> focus search · <kbd>Esc</kbd> close search / clear ·
      <kbd>g</kbd> then <kbd>h</kbd> go home · <kbd>Shift + D</kbd> toggle theme.</p>
    </section>
  `;
  document.title = 'About — CalcSuite';
  return view;
}

export function renderNotFound(path) {
  const view = createEl('div', { class: 'route-view' });
  view.innerHTML = `
    ${emptyStateHTML('Tool not found', `Nothing is mapped to <code>${escapeHTML(path)}</code> yet.`, 'fa-solid fa-compass')}
    <div class="text-center mt-4"><a class="btn btn-primary" href="#/">Back to all tools</a></div>
  `;
  document.title = 'Not found — CalcSuite';
  return view;
}
