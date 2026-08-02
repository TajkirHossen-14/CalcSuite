/**
 * home.js — hero + live-filterable grid of every tool, grouped by category.
 */
import { CATEGORIES, TOOLS, countTools, getToolByKey } from '../tools.js';
import { createEl, qs, qsa, on, debounce, escapeHTML } from '../utils/dom.js';
import { getFavorites, getRecents } from '../utils/storage.js';
import { categorySectionHTML, toolGridHTML, emptyStateHTML, wireFavStars } from './shared.js';

export function renderHome() {
  const favorites = getFavorites().map(getToolByKey).filter(Boolean);
  const recents = getRecents().map(getToolByKey).filter(Boolean).slice(0, 4);

  const view = createEl('div', { class: 'route-view' });
  view.innerHTML = `
    <section class="hero" id="hero-section">
      <span class="hero-eyebrow"><i class="fa-solid fa-bolt" aria-hidden="true"></i> ${TOOLS.length} unified tools</span>
      <h1>Every calculator and converter, <em>in one modern place</em>.</h1>
      <p class="hero-lead">
        CalcSuite replaces hundreds of single-direction pages with a handful of unified,
        bidirectional tools. Results update as you type, every conversion direction lives on
        one screen, and the whole thing runs offline in your browser.
      </p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#/calculators"><i class="fa-solid fa-calculator"></i> Browse Calculators</a>
        <a class="btn" href="#/converters"><i class="fa-solid fa-right-left"></i> Browse Converters</a>
        <a class="btn btn-ghost" href="#/converters/currency"><i class="fa-solid fa-coins"></i> Live Currency Rates</a>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><strong>${countTools('calculators')}</strong><span>Calculators</span></div>
        <div class="hero-stat"><strong>${countTools('converters')}</strong><span>Converters</span></div>
        <div class="hero-stat"><strong>${CATEGORIES.length}</strong><span>Categories</span></div>
        <div class="hero-stat"><strong>0 kb</strong><span>Framework code</span></div>
      </div>
    </section>

    ${recents.length ? `
    <section class="recents">
      <div class="section-head"><i class="fa-solid fa-clock-rotate-left cat-icon"></i><h2>Jump Back In</h2></div>
      ${toolGridHTML(recents)}
    </section>` : ''}

    ${favorites.length ? `
    <section class="favorites-section">
      <div class="section-head"><i class="fa-solid fa-star cat-icon" style="color:var(--warning)"></i><h2>Your Favorites</h2><span class="count">${favorites.length}</span></div>
      ${toolGridHTML(favorites)}
    </section>` : ''}

    <div class="home-search" role="search">
      <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
      <input type="search" id="home-search" placeholder="Search ${TOOLS.length} tools — try “percentage”, “hex”, “bmi”…"
             aria-label="Filter tools" autocomplete="off">
    </div>

    <div class="chip-row" id="filter-chips">
      <button class="chip is-active" data-filter="all" type="button">All</button>
      <button class="chip" data-filter="calculators" type="button">Calculators</button>
      <button class="chip" data-filter="converters" type="button">Converters</button>
      ${CATEGORIES.map((c) => `<button class="chip" data-filter="cat:${c.id}" type="button">${escapeHTML(c.name)}</button>`).join('')}
    </div>

    <div id="tool-sections">
      ${CATEGORIES.map((c) => categorySectionHTML(c, TOOLS.filter((t) => t.categoryId === c.id))).join('')}
    </div>
    <div id="no-results" hidden>${emptyStateHTML('No tools match that search', 'Try a shorter term, or browse the categories above.')}</div>
  `;

  /* ---------- live filtering (debounced; pure DOM, no re-render) ---------- */
  const searchInput = qs('#home-search', view);
  const sections = qsa('.cat-section', view);
  const noResults = qs('#no-results', view);
  let activeFilter = 'all';

  const applyFilter = () => {
    const q = searchInput.value.trim().toLowerCase();
    const terms = q ? q.split(/\s+/) : [];
    let visibleTotal = 0;

    sections.forEach((section) => {
      const catId = section.dataset.category;
      const catAllowed = activeFilter === 'all'
        || (activeFilter.startsWith('cat:') ? activeFilter.slice(4) === catId
          : CATEGORIES.find((c) => c.id === catId).group === activeFilter);

      let visible = 0;
      qsa('.tool-card', section).forEach((card) => {
        const haystack = card.dataset.search;
        const match = catAllowed && terms.every((t) => haystack.includes(t));
        card.hidden = !match;
        if (match) visible += 1;
      });
      section.hidden = visible === 0;
      const count = qs('.count', section);
      if (count) count.textContent = `${visible} tool${visible === 1 ? '' : 's'}`;
      visibleTotal += visible;
    });

    noResults.hidden = visibleTotal !== 0;
  };

  on(searchInput, 'input', debounce(applyFilter, 130));
  on(qs('#filter-chips', view), 'click', '.chip', (e, chip) => {
    qsa('.chip', view).forEach((c) => c.classList.toggle('is-active', c === chip));
    activeFilter = chip.dataset.filter;
    applyFilter();
  });

  wireFavStars(view);
  document.title = 'CalcSuite — Every calculator and converter you need';
  return view;
}
