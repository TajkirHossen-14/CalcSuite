/**
 * shared.js — markup helpers reused by the home, category, favorites views.
 */
import { escapeHTML } from '../utils/dom.js';
import { isFavorite } from '../utils/storage.js';

export function toolCardHTML(tool) {
  const key = `${tool.group}/${tool.id}`;
  const fav = isFavorite(key);
  return `
    <a class="tool-card" href="${tool.path}" data-tool="${key}" data-search="${escapeHTML(tool.searchText)}">
      <span class="tool-card-icon"><i class="${tool.icon}" aria-hidden="true"></i></span>
      <span class="tool-card-body">
        <h3>${escapeHTML(tool.name)}</h3>
        <p>${escapeHTML(tool.desc)}</p>
      </span>
      <button class="fav-star js-fav-star ${fav ? 'is-fav' : ''}" type="button" data-key="${key}"
              title="${fav ? 'Remove from favorites' : 'Add to favorites'}" aria-label="Toggle favorite">
        <i class="${fav ? 'fa-solid' : 'fa-regular'} fa-star" aria-hidden="true"></i>
      </button>
    </a>`;
}

export const toolGridHTML = (tools) => `<div class="tool-grid">${tools.map(toolCardHTML).join('')}</div>`;

export function categorySectionHTML(category, tools) {
  return `
    <section class="cat-section" data-category="${category.id}">
      <div class="section-head">
        <i class="${category.icon} cat-icon" aria-hidden="true"></i>
        <h2>${escapeHTML(category.name)}</h2>
        <span class="count">${tools.length} tool${tools.length === 1 ? '' : 's'}</span>
      </div>
      ${toolGridHTML(tools)}
    </section>`;
}

export const emptyStateHTML = (title, message, icon = 'fa-solid fa-magnifying-glass') => `
  <div class="empty-state">
    <i class="${icon}" aria-hidden="true"></i>
    <h3>${escapeHTML(title)}</h3>
    <p>${message}</p>
  </div>`;

/** Delegated favorite-star handling for any grid. */
export function wireFavStars(scope) {
  scope.addEventListener('click', async (event) => {
    const star = event.target.closest('.js-fav-star');
    if (!star) return;
    event.preventDefault();
    event.stopPropagation();
    const { toggleFavorite } = await import('../utils/storage.js');
    const { toast } = await import('../utils/dom.js');
    const nowFav = toggleFavorite(star.dataset.key);
    star.classList.toggle('is-fav', nowFav);
    star.querySelector('i').className = `${nowFav ? 'fa-solid' : 'fa-regular'} fa-star`;
    toast(nowFav ? 'Pinned to favorites' : 'Removed from favorites', 'fa-solid fa-star');
  });
}
