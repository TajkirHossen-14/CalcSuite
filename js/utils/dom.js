/**
 * dom.js — tiny DOM helper layer used by every module.
 * Deliberately minimal: no virtual DOM, no framework, just ergonomics.
 */

/** Query a single element. */
export const qs = (selector, scope = document) => scope.querySelector(selector);

/** Query all elements as a real Array (so map/filter/reduce work). */
export const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/**
 * Create an element with props and children in one expression.
 * createEl('button', { class: 'btn', onclick: fn }, ['Click me'])
 */
export function createEl(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class' || key === 'className') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  const list = Array.isArray(children) ? children : [children];
  list.forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return node;
}

/** Build a DocumentFragment from an HTML string. */
export function fromHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content;
}

/** addEventListener with optional delegation + an unsubscribe closure returned. */
export function on(target, type, selectorOrHandler, maybeHandler, options) {
  const delegated = typeof selectorOrHandler === 'string';
  const selector = delegated ? selectorOrHandler : null;
  const handler = delegated ? maybeHandler : selectorOrHandler;

  const listener = (event) => {
    if (!delegated) return handler(event, target);
    const match = event.target.closest(selector);
    if (match && target.contains(match)) handler(event, match);
  };
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
}

/** Escape user-supplied text before injecting into innerHTML. */
export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Higher-order: trailing debounce. Returns a function with .cancel(). */
export function debounce(fn, wait = 200) {
  let timer = null;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

/** Higher-order: leading-edge throttle via rAF (used by live inputs). */
export function rafThrottle(fn) {
  let queued = false;
  let lastArgs = null;
  return (...args) => {
    lastArgs = args;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn(...lastArgs);
    });
  };
}

/** Copy text via the async Clipboard API with a legacy fallback. */
export async function copyToClipboard(text) {
  const value = String(text ?? '');
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    throw new Error('Clipboard API unavailable');
  } catch (err) {
    try {
      const ta = createEl('textarea', {
        value,
        style: { position: 'fixed', top: '-1000px', opacity: '0' }
      });
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (_) {
      return false;
    }
  }
}

/** Global toast notification. */
let toastTimer = null;
export function toast(message, icon = 'fa-solid fa-circle-check') {
  const el = qs('#toast');
  if (!el) return;
  el.innerHTML = `<i class="${icon}" aria-hidden="true"></i><span></span>`;
  qs('span', el).textContent = message;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-visible'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('is-visible');
    setTimeout(() => { el.hidden = true; }, 250);
  }, 2000);
}
