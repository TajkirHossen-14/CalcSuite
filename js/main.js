/**
 * main.js — application entry point.
 * Boots the theme manager, header search, keyboard shortcuts, the global
 * clipboard delegate and the hash router.
 */
import { Router, syncNav, startProgress } from './router.js';
import { getTool, searchTools, TOOLS } from './tools.js';
import { qs, qsa, on, debounce, copyToClipboard, toast, escapeHTML } from './utils/dom.js';
import * as storage from './utils/storage.js';
import { renderHome } from './views/home.js';
import { renderCategoryIndex } from './views/category.js';
import { renderFavorites, renderHistory, renderAbout, renderNotFound } from './views/library.js';
import { renderFAQ } from './views/faq.js';
import { renderToolPage } from './core/toolPage.js';

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */
class ThemeManager {
  #key = 'theme';

  constructor(button) {
    this.button = button;
    this.apply(this.current, false);
    if (button) on(button, 'click', () => this.toggle());
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!storage.get(this.#key)) this.apply(e.matches ? 'dark' : 'light');
    });
  }

  get current() {
    const stored = storage.get(this.#key);
    if (stored === 'light' || stored === 'dark') return stored;
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  apply(theme, animate = true) {
    const root = document.documentElement;
    if (animate) {
      root.classList.add('theme-transition');
      setTimeout(() => root.classList.remove('theme-transition'), 320);
    }
    root.setAttribute('data-theme', theme);
    const meta = qs('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b0d13' : '#f5f6fb');
    if (this.button) this.button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  }

  toggle() {
    const next = this.current === 'dark' ? 'light' : 'dark';
    storage.set(this.#key, next);
    this.apply(next);
  }
}

/* ------------------------------------------------------------------ */
/* Header search (live, debounced, keyboard navigable)                 */
/* ------------------------------------------------------------------ */
class HeaderSearch {
  #activeIndex = -1;
  #matches = [];

  constructor(input, dropdown) {
    this.input = input;
    this.dropdown = dropdown;
    on(input, 'input', debounce(() => this.update(), 120));
    on(input, 'focus', () => this.update());
    on(input, 'keydown', (e) => this.onKey(e));
    on(dropdown, 'mousedown', (e) => e.preventDefault());
    on(document, 'click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) this.close();
    });
  }

  update() {
    const query = this.input.value.trim();
    this.#matches = query ? searchTools(query, 8) : [];
    this.#activeIndex = -1;

    if (!query) return this.close();
    this.dropdown.innerHTML = this.#matches.length
      ? this.#matches.map((t, i) => `
        <a class="search-result" href="${t.path}" role="option" data-index="${i}">
          <i class="${t.icon}" aria-hidden="true"></i>
          <span>${escapeHTML(t.name)}</span>
          <small>${escapeHTML(t.categoryName)}</small>
        </a>`).join('')
      : `<p class="search-empty">No tool matches “${escapeHTML(query)}”</p>`;
    this.dropdown.hidden = false;
    this.input.setAttribute('aria-expanded', 'true');
  }

  close() {
    this.dropdown.hidden = true;
    this.dropdown.innerHTML = '';
    this.input.setAttribute('aria-expanded', 'false');
  }

  onKey(event) {
    const items = qsa('.search-result', this.dropdown);
    if (event.key === 'Escape') { this.input.value = ''; this.close(); this.input.blur(); return; }
    if (!items.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const dir = event.key === 'ArrowDown' ? 1 : -1;
      this.#activeIndex = (this.#activeIndex + dir + items.length) % items.length;
      items.forEach((el, i) => el.classList.toggle('is-active', i === this.#activeIndex));
      items[this.#activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = items[Math.max(0, this.#activeIndex)];
      if (target) {
        location.hash = target.getAttribute('href');
        this.input.value = '';
        this.input.blur();
        this.close();
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */
const outlet = qs('#main-content');
new ThemeManager(qs('#theme-toggle'));
const headerSearch = new HeaderSearch(qs('#global-search'), qs('#search-results'));

/* Mobile drawer — holds the nav links, search, theme toggle and GitHub link. */
const navPanel = qs('#nav-panel');
const navToggle = qs('#nav-toggle');

const setDrawer = (open) => {
  navPanel.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  qs('i', navToggle).className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
};
const closeDrawer = () => setDrawer(false);

on(navToggle, 'click', () => setDrawer(!navPanel.classList.contains('is-open')));

/* Any link inside the drawer dismisses it — including the GitHub link. */
on(navPanel, 'click', 'a', closeDrawer);

/* Tapping outside the open drawer closes it. */
on(document, 'click', (event) => {
  if (!navPanel.classList.contains('is-open')) return;
  if (navPanel.contains(event.target) || navToggle.contains(event.target)) return;
  closeDrawer();
});

/* Escape closes it, and so does growing past the mobile breakpoint. */
on(document, 'keydown', (event) => {
  if (event.key === 'Escape' && navPanel.classList.contains('is-open')) closeDrawer();
});
const wideQuery = window.matchMedia('(min-width: 861px)');
const onWide = (e) => { if (e.matches) closeDrawer(); };
if (wideQuery.addEventListener) wideQuery.addEventListener('change', onWide);
else wideQuery.addListener(onWide);

/* Global clipboard delegate: any [data-copy] element copies its value. */
on(document, 'click', '[data-copy]', async (event, el) => {
  event.preventDefault();
  const text = el.dataset.copy;
  if (!text || text === '—') { toast('Nothing to copy yet', 'fa-solid fa-circle-info'); return; }
  const ok = await copyToClipboard(text);
  toast(ok ? (el.dataset.copyMessage || 'Copied to clipboard') : 'Copy failed',
    ok ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation');
});

/* Keyboard shortcuts */
let gPressed = false;
on(document, 'keydown', (event) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable;
  if (event.key === '/' && !typing) { event.preventDefault(); qs('#global-search').focus(); return; }
  if (event.key === 'Escape' && !typing) headerSearch.close();
  if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === 'D' && event.shiftKey) { qs('#theme-toggle').click(); return; }
  if (event.key.toLowerCase() === 'g') { gPressed = true; setTimeout(() => { gPressed = false; }, 900); return; }
  if (gPressed) {
    const map = { h: '#/', c: '#/calculators', v: '#/converters', f: '#/favorites', y: '#/history' };
    if (map[event.key.toLowerCase()]) { location.hash = map[event.key.toLowerCase()]; gPressed = false; }
  }
});

/* Routes */
async function toolRoute(group, id) {
  const meta = getTool(group, id);
  if (!meta) return renderNotFound(`#/${group}/${id}`);
  try {
    const module = await meta.load();
    return renderToolPage(module.default, meta);
  } catch (error) {
    console.error(`[CalcSuite] module failed for ${group}/${id}`, error);
    const fallback = document.createElement('div');
    fallback.className = 'route-view';
    fallback.innerHTML = `<div class="empty-state"><i class="fa-solid fa-screwdriver-wrench"></i>
      <h2>${escapeHTML(meta.name)}</h2><p>This tool could not be loaded: ${escapeHTML(error.message)}</p>
      <p><a class="btn" href="#/">Back to all tools</a></p></div>`;
    return fallback;
  }
}

const router = new Router({
  outlet,
  onBefore: () => startProgress(),
  onAfter: (path) => syncNav(path)
});

router
  .add('/', () => renderHome())
  .add('/calculators', () => renderCategoryIndex('calculators'))
  .add('/converters', () => renderCategoryIndex('converters'))
  .add('/favorites', () => renderFavorites())
  .add('/history', () => renderHistory())
  .add('/about', () => renderAbout())
  .add('/faq', () => renderFAQ())
  .add('/calculators/:id', ({ id }) => toolRoute('calculators', id))
  .add('/converters/:id', ({ id }) => toolRoute('converters', id))
  .notFound(({ path }) => renderNotFound(path));

router.start();

/* Progressive enhancement: offline support when served over http(s). */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
  });
}

console.info(`%cCalcSuite%c ${TOOLS.length} tools ready — vanilla JS, no frameworks.`,
  'background:linear-gradient(90deg,#7c6cff,#2ee6c5);color:#0b0d13;font-weight:700;padding:2px 6px;border-radius:4px',
  'color:#98a3b8');
