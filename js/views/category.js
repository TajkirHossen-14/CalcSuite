/**
 * category.js — the "/calculators" and "/converters" index views.
 */
import { getCategories, TOOLS, countTools } from '../tools.js';
import { createEl, qs, qsa, on, debounce } from '../utils/dom.js';
import { categorySectionHTML, emptyStateHTML, wireFavStars } from './shared.js';

const COPY = {
  calculators: {
    title: 'Calculators',
    lead: 'Math, money, health, dates, grades and electronics — each one live, validated and explained.'
  },
  converters: {
    title: 'Converters',
    lead: 'Unified, bidirectional converters. Pick any two units on one screen — no separate page per direction.'
  }
};

export function renderCategoryIndex(group) {
  const cats = getCategories(group);
  const copy = COPY[group];

  const view = createEl('div', { class: 'route-view' });
  view.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span aria-hidden="true">›</span><span>${copy.title}</span></nav>
    <header class="tool-head">
      <div class="tool-head-main">
        <h1>${copy.title}</h1>
        <p class="tool-desc">${copy.lead}</p>
      </div>
      <span class="badge badge-primary">${countTools(group)} tools</span>
    </header>

    <div class="home-search" role="search">
      <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
      <input type="search" id="cat-search" placeholder="Filter ${copy.title.toLowerCase()}…" aria-label="Filter ${copy.title}" autocomplete="off">
    </div>

    <div id="tool-sections">
      ${cats.map((c) => categorySectionHTML(c, TOOLS.filter((t) => t.categoryId === c.id))).join('')}
    </div>
    <div id="no-results" hidden>${emptyStateHTML('Nothing matched', 'Try a different keyword.')}</div>
  `;

  const input = qs('#cat-search', view);
  const noResults = qs('#no-results', view);
  const filter = () => {
    const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let total = 0;
    qsa('.cat-section', view).forEach((section) => {
      let visible = 0;
      qsa('.tool-card', section).forEach((card) => {
        const match = terms.every((t) => card.dataset.search.includes(t));
        card.hidden = !match;
        if (match) visible += 1;
      });
      section.hidden = visible === 0;
      total += visible;
    });
    noResults.hidden = total !== 0;
  };
  on(input, 'input', debounce(filter, 130));

  wireFavStars(view);
  document.title = `${copy.title} — CalcSuite`;
  return view;
}
