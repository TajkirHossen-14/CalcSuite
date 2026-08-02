/**
 * storage.js — typed, JSON-aware wrappers around localStorage.
 * Every key is namespaced so CalcSuite never collides with other apps
 * hosted on the same origin.
 */

const NS = 'calcsuite:';
const MAX_HISTORY = 60;

const available = (() => {
  try {
    const probe = `${NS}__probe`;
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch (_) {
    return false;
  }
})();

/** In-memory fallback when localStorage is blocked (private mode, etc.). */
const memory = new Map();

export function get(key, fallback = null) {
  const full = NS + key;
  try {
    const raw = available ? localStorage.getItem(full) : memory.get(full);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

export function set(key, value) {
  const full = NS + key;
  try {
    const raw = JSON.stringify(value);
    if (available) localStorage.setItem(full, raw);
    else memory.set(full, raw);
    return true;
  } catch (_) {
    return false;
  }
}

export function remove(key) {
  const full = NS + key;
  if (available) localStorage.removeItem(full);
  else memory.delete(full);
}

/* ---------------- Favorites ---------------- */
export const getFavorites = () => get('favorites', []);
export const isFavorite = (id) => getFavorites().includes(id);

export function toggleFavorite(id) {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx === -1) favs.push(id);
  else favs.splice(idx, 1);
  set('favorites', favs);
  return idx === -1;
}

/* ---------------- Calculation history ---------------- */
export const getHistory = () => get('history', []);

export function pushHistory(entry) {
  const history = getHistory();
  const last = history[0];
  // Skip consecutive duplicates from live-typing tools.
  if (last && last.toolId === entry.toolId && last.result === entry.result) return history;
  history.unshift({ ...entry, at: Date.now() });
  const trimmed = history.slice(0, MAX_HISTORY);
  set('history', trimmed);
  window.dispatchEvent(new CustomEvent('calcsuite:history'));
  return trimmed;
}

export const clearHistory = () => { set('history', []); window.dispatchEvent(new CustomEvent('calcsuite:history')); };

/* ---------------- Recents ---------------- */
export function pushRecent(id) {
  const recents = get('recents', []).filter((r) => r !== id);
  recents.unshift(id);
  set('recents', recents.slice(0, 8));
}
export const getRecents = () => get('recents', []);

/* ---------------- Cached fetches (currency rates) ---------------- */
export function getCached(key, maxAgeMs) {
  const record = get(`cache:${key}`);
  if (!record || typeof record.at !== 'number') return null;
  if (Date.now() - record.at > maxAgeMs) return { ...record, stale: true };
  return record;
}
export const setCached = (key, payload) => set(`cache:${key}`, { at: Date.now(), payload });
