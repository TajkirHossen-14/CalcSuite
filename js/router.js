/**
 * router.js — a ~120 line hash router.
 *
 * Routes are registered as patterns ('/calculators/:id'); handlers may be
 * async and return a DOM node. Tool modules are dynamic-imported by their
 * handler, so nothing but the shell is downloaded up front.
 */
import { qs, qsa } from './utils/dom.js';

export class Router {
  #routes = [];
  #outlet;
  #onBefore;
  #onAfter;
  #current = null;

  constructor({ outlet, onBefore, onAfter }) {
    this.#outlet = outlet;
    this.#onBefore = onBefore || (() => {});
    this.#onAfter = onAfter || (() => {});
  }

  /** Register a route. Pattern segments beginning with ':' become params. */
  add(pattern, handler) {
    const segments = pattern.split('/').filter(Boolean);
    this.#routes.push({ pattern, segments, handler });
    return this;
  }

  /** Fallback handler when nothing matches. */
  notFound(handler) {
    this.fallback = handler;
    return this;
  }

  static path() {
    const raw = location.hash.replace(/^#/, '');
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  static go(path) {
    const target = path.startsWith('#') ? path : `#${path}`;
    if (location.hash === target) window.dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = target;
  }

  #match(path) {
    const parts = path.split('?')[0].split('/').filter(Boolean);
    for (const route of this.#routes) {
      if (route.segments.length !== parts.length) continue;
      const params = {};
      const ok = route.segments.every((seg, i) => {
        if (seg.startsWith(':')) { params[seg.slice(1)] = decodeURIComponent(parts[i]); return true; }
        return seg === parts[i];
      });
      if (ok) return { route, params };
    }
    return null;
  }

  start() {
    window.addEventListener('hashchange', () => this.#resolve());
    if (!location.hash) location.replace('#/');
    this.#resolve();
  }

  async #resolve() {
    const path = Router.path();
    const token = Symbol('nav');
    this.#current = token;

    this.#onBefore(path);

    // Let the previous view run its teardown (timers, intervals, listeners).
    if (this.#outlet.__cleanup) {
      try { this.#outlet.__cleanup(); } catch (_) { /* noop */ }
      this.#outlet.__cleanup = null;
    }

    const matched = this.#match(path);
    let node;
    try {
      node = matched
        ? await matched.route.handler(matched.params, path)
        : await this.fallback({ path });
    } catch (err) {
      console.error('[router] failed to render', path, err);
      node = errorView(path, err);
    }

    if (this.#current !== token) return; // a newer navigation won

    this.#outlet.replaceChildren(node);
    if (node && typeof node.__cleanup === 'function') this.#outlet.__cleanup = node.__cleanup;

    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    this.#onAfter(path, node);
  }
}

function errorView(path, err) {
  const section = document.createElement('section');
  section.className = 'route-view';
  section.innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <h2>This tool failed to load</h2>
      <p class="text-muted">Route <code>${path}</code> threw an error: ${err && err.message ? err.message : 'unknown'}</p>
      <p><a class="btn btn-primary" href="#/">Back to all tools</a></p>
    </div>`;
  return section;
}

/** Highlight the active item in the primary nav. */
export function syncNav(path) {
  const best = qsa('[data-nav]').reduce((acc, link) => {
    const target = link.dataset.nav.replace('#', '');
    const active = target === '/' ? path === '/' : path.startsWith(target);
    if (active && (!acc || target.length > acc.dataset.nav.length)) return link;
    return acc;
  }, null);
  qsa('[data-nav]').forEach((l) => l.classList.toggle('is-active', l === best));
  const bar = qs('#route-progress');
  if (bar) { bar.classList.remove('is-loading'); bar.classList.add('is-done'); }
}

export function startProgress() {
  const bar = qs('#route-progress');
  if (!bar) return;
  bar.classList.remove('is-done');
  bar.classList.add('is-loading');
}
