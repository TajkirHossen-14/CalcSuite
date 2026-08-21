/**
 * toolPage.js — the shared tool page template.
 *
 * Every one of the 51 tool modules exports:
 *   {
 *     body:  string | (meta) => string     // markup for the input panel
 *     init:  (root, ctx) => void|cleanup   // wire up behaviour
 *     how:   string                        // "how it works" explanation
 *     resultLabel?: string
 *     noResult?: boolean
 *   }
 *
 * This function renders the surrounding chrome (breadcrumb, title, favorite
 * toggle, result panel with copy button, explanation, related tools) so no
 * tool module ever repeats layout code.
 */
import { createEl, qs, qsa, on, escapeHTML, debounce } from '../utils/dom.js';
import { isFavorite, toggleFavorite, pushHistory, pushRecent } from '../utils/storage.js';
import { TOOLS } from '../tools.js';

export function renderToolPage(mod, meta) 
{
  pushRecent(`${meta.group}/${meta.id}`);

  const bodyHTML = typeof mod.body === 'function' ? mod.body(meta) : (mod.body || '');
  const fav = isFavorite(`${meta.group}/${meta.id}`);
  const groupLabel = meta.group === 'calculators' ? 'Calculators' : 'Converters';

  const view = createEl('article', { class: 'route-view tool-page' });
  view.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="#/">Home</a><span aria-hidden="true">›</span>
      <a href="#/${meta.group}">${groupLabel}</a><span aria-hidden="true">›</span>
      <span>${escapeHTML(meta.categoryName)}</span>
    </nav>

    <header class="tool-head">
      <div class="tool-head-main">
        <h1><i class="${meta.icon} tool-title-icon" aria-hidden="true" style="color:var(--primary);font-size:.8em;margin-right:.4rem"></i>${escapeHTML(meta.name)}</h1>
        <p class="tool-desc">${escapeHTML(meta.desc)}</p>
      </div>
      <div class="tool-head-actions">
        <button class="icon-btn js-fav" type="button" aria-pressed="${fav}" title="${fav ? 'Remove from favorites' : 'Save to favorites'}">
          <i class="${fav ? 'fa-solid' : 'fa-regular'} fa-star" style="${fav ? 'color:var(--warning)' : ''}"></i>
        </button>
        <button class="icon-btn js-share" type="button" title="Copy link to this tool">
          <i class="fa-solid fa-link"></i>
        </button>
      </div>
    </header>

    <section class="panel tool-body" id="tool-body">${bodyHTML}</section>

    ${mod.noResult ? '' : `
    <section class="result-panel" id="tool-result" aria-live="polite">
      <div class="result-main">
        <span class="result-label">${escapeHTML(mod.resultLabel || 'Result')}</span>
        <output class="result-value" id="result-value">—</output>
        <p class="result-sub" id="result-sub"></p>
      </div>
      <button class="btn btn-primary js-copy-result" type="button">
        <i class="fa-regular fa-copy" aria-hidden="true"></i> Copy result
      </button>
    </section>`}

    <details class="how-it-works">
      <summary><i class="fa-solid fa-lightbulb" aria-hidden="true" style="color:var(--accent)"></i> How this tool works</summary>
      <div class="how-body">${mod.how || '<p>Documentation coming soon.</p>'}</div>
    </details>

    <section class="related" id="related-tools"></section>
  `;

  /* ---------- favorite + share ---------- */
  const key = `${meta.group}/${meta.id}`;
  on(qs('.js-fav', view), 'click', (e) => {
    const nowFav = toggleFavorite(key);
    const btn = e.currentTarget;
    btn.setAttribute('aria-pressed', String(nowFav));
    btn.title = nowFav ? 'Remove from favorites' : 'Save to favorites';
    qs('i', btn).className = `${nowFav ? 'fa-solid' : 'fa-regular'} fa-star`;
    qs('i', btn).style.color = nowFav ? 'var(--warning)' : '';
    import('../utils/dom.js').then(({ toast }) => toast(nowFav ? 'Added to favorites' : 'Removed from favorites', 'fa-solid fa-star'));
  });

  qs('.js-share', view).dataset.copy = `${location.origin}${location.pathname}${meta.path}`;
  qs('.js-share', view).dataset.copyMessage = 'Link copied';

  /* ---------- related tools ---------- */
  const related = TOOLS.filter((t) => t.categoryId === meta.categoryId && t.id !== meta.id).slice(0, 4);
  if (related.length) {
    qs('#related-tools', view).innerHTML = `
      <div class="section-head"><h2>Related ${escapeHTML(meta.categoryName.toLowerCase())} tools</h2></div>
      <div class="tool-grid">
        ${related.map((t) => `
          <a class="tool-card" href="${t.path}">
            <span class="tool-card-icon"><i class="${t.icon}" aria-hidden="true"></i></span>
            <span class="tool-card-body">
              <h3>${escapeHTML(t.name)}</h3>
              <p>${escapeHTML(t.desc)}</p>
            </span>
          </a>`).join('')}
      </div>`;
  }

  /* ---------- context handed to the tool module ---------- */
  const root = qs('#tool-body', view);
  const resultValue = qs('#result-value', view);
  const resultSub = qs('#result-sub', view);
  const copyBtn = qs('.js-copy-result', view);

  const recordHistory = debounce((expression, result) => {
    if (!result || result === '—') return;
    pushHistory({ toolId: meta.id, group: meta.group, tool: meta.name, path: meta.path, expression, result });
  }, 1400);

  const ctx = {
    meta,
    view,
    root,
    /** Set the headline result (+ optional sub-line). Handles animation, copy target and history. */
    setResult(value, sub = '', { copy = null, record = true } = {}) {
      if (!resultValue) return;
      const text = value === null || value === undefined || value === '' ? '—' : String(value);
      resultValue.textContent = text;
      resultValue.classList.remove('is-updated');
      void resultValue.offsetWidth; // restart the animation
      resultValue.classList.add('is-updated');
      if (resultSub) resultSub.innerHTML = sub || '';
      if (copyBtn) copyBtn.dataset.copy = copy !== null ? copy : text;
      if (record) recordHistory(typeof sub === 'string' ? sub.replace(/<[^>]+>/g, '') : '', text);
    },
    /** Show an inline error in the result slot without recording history. */
    setError(message) {
      if (!resultValue) return;
      resultValue.textContent = '—';
      if (resultSub) resultSub.innerHTML = `<span style="color:var(--danger)"><i class="fa-solid fa-circle-exclamation"></i> ${escapeHTML(message)}</span>`;
    },
    clearResult() {
      if (resultValue) resultValue.textContent = '—';
      if (resultSub) resultSub.innerHTML = '';
    },
    qs: (sel) => qs(sel, root),
    qsa: (sel) => qsa(sel, root),
    /** Bind a live recompute to every input/select/textarea inside the panel. */
    live(handler, { events = ['input', 'change'], debounceMs = 0 } = {}) {
      const run = debounceMs ? debounce(handler, debounceMs) : handler;
      events.forEach((evt) => on(root, evt, () => run()));
      handler();
    },
    /** Simple tab controller for tools with sub-modes. */
    tabs(onChange) {
      const buttons = qsa('.tab', root);
      on(root, 'click', '.tab', (e, btn) => {
        buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
        qsa('.tab-panel', root).forEach((p) => { p.hidden = p.dataset.panel !== btn.dataset.tab; });
        if (onChange) onChange(btn.dataset.tab);
      });
      const active = qs('.tab.is-active', root) || buttons[0];
      if (active) {
        active.classList.add('is-active');
        qsa('.tab-panel', root).forEach((p) => { p.hidden = p.dataset.panel !== active.dataset.tab; });
        if (onChange) onChange(active.dataset.tab);
      }
    }
  };

  const cleanup = mod.init ? mod.init(root, ctx) : null;
  if (typeof cleanup === 'function') view.__cleanup = cleanup;

  document.title = `${meta.name} — CalcSuite`;
  return view;
}
