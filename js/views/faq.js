/**
 * faq.js — the Frequently Asked Questions view.
 *
 * Questions are grouped into sections and rendered as native <details>
 * accordions, so keyboard and screen-reader behaviour comes for free. A live
 * filter narrows the list by question and answer text.
 */
import { createEl, qs, qsa, on, debounce } from '../utils/dom.js';
import { TOOLS, CATEGORIES } from '../tools.js';
import { emptyStateHTML } from './shared.js';

const calcCount = TOOLS.filter((t) => t.group === 'calculators').length;
const convCount = TOOLS.filter((t) => t.group === 'converters').length;

/**
 * Answers are authored HTML, not user input, so they are intentionally not
 * escaped — they carry links, <code> and lists on purpose.
 */
const SECTIONS = [
  {
    id: 'basics',
    title: 'Getting started',
    icon: 'fa-solid fa-circle-play',
    items: [
      {
        q: 'What is CalcSuite?',
        a: `<p>A single-page collection of <strong>${TOOLS.length} calculators and converters</strong> —
        ${calcCount} calculators and ${convCount} converters across ${CATEGORIES.length} categories.
        Everything runs in your browser, results update as you type, and there are no ads or
        pop-ups anywhere.</p>`
      },
      {
        q: 'Do I need an account, or to install anything?',
        a: `<p>No. There is no sign-up, no login and no paywall. If you would like an app-style
        icon, most browsers offer <em>Add to Home Screen</em> or <em>Install</em> — CalcSuite ships a
        web-app manifest and a service worker, so it installs and then works offline.</p>`
      },
      {
        q: 'Why is there one tool per topic instead of one page per direction?',
        a: `<p>Older reference sites split every conversion into its own page: one for cm → inches,
        another for inches → cm, a third for cm → feet. CalcSuite collapses each family into a single
        tool with two dropdowns and a <strong>⇄ swap</strong> button, so changing direction never
        means loading a new page.</p>`
      },
      {
        q: 'How do I find a tool quickly?',
        a: `<p>Press <kbd>/</kbd> anywhere to jump into the search box, then type what you need —
        it matches names, descriptions and keywords, so "kmh", "bmi" and "hex" all land somewhere
        sensible. You can also browse
        <a href="#/calculators">all calculators</a> or <a href="#/converters">all converters</a>
        by category.</p>`
      },
      {
        q: 'Are there keyboard shortcuts?',
        a: `<ul>
          <li><kbd>/</kbd> — focus the search box</li>
          <li><kbd>Esc</kbd> — close search, or clear the current field</li>
          <li><kbd>g</kbd> then <kbd>h</kbd> — go home</li>
          <li><kbd>Shift</kbd> + <kbd>D</kbd> — toggle dark / light theme</li>
        </ul>`
      }
    ]
  },
  {
    id: 'features',
    title: 'Favorites, history and themes',
    icon: 'fa-solid fa-star',
    items: [
      {
        q: 'How do favorites work?',
        a: `<p>Click the ☆ on any tool card or tool page to pin it. Pinned tools collect in
        <a href="#/favorites">Favorites</a>. They live in this browser's <code>localStorage</code>,
        so they are private to this device and survive a refresh — but they do not follow you to
        another browser or another computer.</p>`
      },
      {
        q: 'What gets saved to History?',
        a: `<p>The last 60 results you produced, newest first, with a link back to the tool that
        made them. Open <a href="#/history">History</a> to review or copy them, and use
        <em>Clear</em> to wipe the list. Nothing is ever uploaded.</p>`
      },
      {
        q: 'Can I switch between dark and light mode?',
        a: `<p>Yes — use the theme button in the header, or press
        <kbd>Shift</kbd> + <kbd>D</kbd>. Your choice is remembered. On a first visit CalcSuite
        follows your operating system's preference.</p>`
      },
      {
        q: 'Why did my favorites and history disappear?',
        a: `<p>Because they are stored per-browser, anything that clears site data will remove them:
        private / incognito windows, "clear browsing data", or a different browser or device. There
        is no server-side copy to restore from — that is the trade-off for needing no account.</p>`
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy and data',
    icon: 'fa-solid fa-shield-halved',
    items: [
      {
        q: 'Is anything I type sent to a server?',
        a: `<p>No. Every calculation happens in your browser with JavaScript. The one and only
        network request in the whole app is the currency converter fetching exchange rates, and that
        request contains no personal data — just a request for the rate table.</p>`
      },
      {
        q: 'Are there trackers, analytics or ads?',
        a: `<p>None. There is no analytics script, no advertising and no third-party tracking.
        The only external resources are the icon font and web fonts loaded from a public CDN.</p>`
      },
      {
        q: 'Does CalcSuite work offline?',
        a: `<p>Yes, after your first visit. A service worker caches the app shell, and each tool is
        cached the first time you open it. Currency rates are the exception: offline you will see the
        last rates that were fetched, clearly marked as cached.</p>`
      }
    ]
  },
  {
    id: 'accuracy',
    title: 'Accuracy and methods',
    icon: 'fa-solid fa-scale-balanced',
    items: [
      {
        q: 'How accurate are the results?',
        a: `<p>Conversions use exact factors where an exact factor exists — one inch is defined as
        25.4 mm, so that conversion is exact rather than approximate. Displayed values are rounded
        for readability while the full precision is kept internally, so chained conversions do not
        accumulate rounding error.</p>`
      },
      {
        q: 'Where do currency exchange rates come from?',
        a: `<p>From a free public exchange-rate API, cached locally so the tool keeps working
        offline. Rates are reference mid-market rates published daily — they are fine for estimates,
        but your bank or card issuer will apply its own spread and fees, so do not use them for
        settling an actual transaction.</p>`
      },
      {
        q: 'Which grading scale do the grade tools use?',
        a: `<p>The <a href="#/calculators/gpa">GPA Calculator</a> uses the Bangladesh / UGC 4.00
        scale — A+ 4.00, A 3.75, A- 3.50, B+ 3.25, B 3.00, B- 2.75, C+ 2.50, C 2.25, D 2.00, F 0.00.
        It moves in quarter points and has no C− or D+. The
        <a href="#/calculators/grade-percentage">Grade Calculator</a> defaults to the same scale but
        also offers US letter grades (with and without plus/minus), UK honours and the US 4.0
        mapping. Grade boundaries are institutional conventions, so always check your own
        syllabus.</p>`
      },
      {
        q: 'Can I rely on these tools for health or financial decisions?',
        a: `<p>Treat them as well-implemented arithmetic, not professional advice. BMI, BMR and ideal
        weight are population-level estimates that ignore body composition; loan and interest figures
        use standard textbook formulas and will not match a lender's schedule once its own fees,
        day-count conventions and rounding rules apply. For anything consequential, confirm with a
        qualified professional.</p>`
      },
      {
        q: 'Why does a converted value look slightly off?',
        a: `<p>Usually rounding in the display. Values are shown to a sensible number of significant
        digits, so 1 ÷ 3 appears as 0.333… rather than an endless string. Some conversions are also
        genuinely inexact by nature — a "US gallon" and an "imperial gallon" differ, and Morse code
        cannot represent letter case at all, which is why that tool tells you what it dropped.</p>`
      }
    ]
  },
  {
    id: 'technical',
    title: 'Technical',
    icon: 'fa-solid fa-code',
    items: [
      {
        q: 'What is CalcSuite built with?',
        a: `<p>Semantic HTML5, CSS custom properties with Flexbox and Grid, and vanilla ES6+
        JavaScript — no frameworks, no bundler and no build step. Routing is a small hash router, each
        tool is its own ES module loaded on demand with dynamic <code>import()</code>, and state lives
        in <code>localStorage</code>. See <a href="#/about">About</a> for more.</p>`
      },
      {
        q: 'Does it work on phones?',
        a: `<p>Yes — the layout is mobile-first and every tool is usable on a small screen. On narrow
        widths the navigation collapses into a menu with search at the top, and side-by-side
        converter fields stack vertically with the swap button between them.</p>`
      },
      {
        q: 'I found a bug, or want a tool that is missing. What now?',
        a: `<p>Please open an issue on
        <a href="https://github.com/TajkirHossen-14" target="_blank" rel="noopener noreferrer">GitHub</a>.
        Bug reports are most useful with the tool name, the exact numbers you entered and what you
        expected instead.</p>`
      }
    ]
  }
];

const TOTAL = SECTIONS.reduce((n, s) => n + s.items.length, 0);

const itemHTML = (item) => `
  <details class="how-it-works faq-item" data-faq-item>
    <summary><span class="faq-q">${item.q}</span></summary>
    <div class="how-body faq-a">${item.a}</div>
  </details>`;

const sectionHTML = (section) => `
  <section class="faq-section" data-faq-section data-section="${section.id}">
    <div class="section-head">
      <i class="${section.icon} cat-icon" aria-hidden="true"></i>
      <h2>${section.title}</h2>
      <span class="count">${section.items.length} question${section.items.length === 1 ? '' : 's'}</span>
    </div>
    ${section.items.map(itemHTML).join('')}
  </section>`;

export function renderFAQ() {
  const view = createEl('div', { class: 'route-view' });
  view.innerHTML = `
    <nav class="breadcrumb"><a href="#/">Home</a><span aria-hidden="true">›</span><span>FAQ</span></nav>

    <header class="tool-head">
      <div class="tool-head-main">
        <h1>Frequently asked questions</h1>
        <p class="tool-desc">${TOTAL} answers about how CalcSuite works, what it stores and how far
        you should trust its numbers.</p>
      </div>
    </header>

    <div class="faq-toolbar">
      <div class="faq-search">
        <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
        <input type="search" id="faq-filter" placeholder="Search questions…"
               autocomplete="off" aria-label="Search questions" aria-controls="faq-list">
      </div>
      <button class="btn btn-sm" id="faq-toggle-all" type="button" aria-expanded="false">
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i> <span>Expand all</span>
      </button>
    </div>

    <p class="field-hint" id="faq-count" role="status" aria-live="polite"></p>

    <div id="faq-list">
      ${SECTIONS.map(sectionHTML).join('')}
    </div>

    <div id="faq-empty" hidden>
      ${emptyStateHTML('No matching questions', 'Try a different word, or clear the filter to see all questions.', 'fa-regular fa-circle-question')}
    </div>

    <section class="panel mt-5">
      <p class="panel-title">Still stuck?</p>
      <p class="mb-0">Read <a href="#/about">About</a> for how the app is put together, or open an
      issue on <a href="https://github.com/TajkirHossen-14" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
    </section>
  `;

  const items = qsa('[data-faq-item]', view);
  const sections = qsa('[data-faq-section]', view);
  const countEl = qs('#faq-count', view);
  const emptyEl = qs('#faq-empty', view);
  const toggleAll = qs('#faq-toggle-all', view);

  // Cache the searchable text once instead of re-reading the DOM on every keystroke.
  const haystacks = new Map(items.map((el) => [el, el.textContent.toLowerCase()]));

  const setToggleLabel = (expanded) => {
    toggleAll.setAttribute('aria-expanded', String(expanded));
    qs('span', toggleAll).textContent = expanded ? 'Collapse all' : 'Expand all';
    qs('i', toggleAll).className = `fa-solid fa-chevron-${expanded ? 'up' : 'down'}`;
  };

  const filter = (raw) => {
    const query = raw.trim().toLowerCase();
    let shown = 0;

    items.forEach((el) => {
      const hit = !query || haystacks.get(el).includes(query);
      el.hidden = !hit;
      if (hit) shown += 1;
      // Auto-open matches so the answer is visible; collapse again when cleared.
      if (query) el.open = hit;
      else el.open = false;
    });

    // Hide a section heading whose questions are all filtered out.
    sections.forEach((section) => {
      const visible = qsa('[data-faq-item]', section).some((el) => !el.hidden);
      section.hidden = !visible;
    });

    emptyEl.hidden = shown > 0;
    countEl.textContent = query
      ? `${shown} of ${TOTAL} question${TOTAL === 1 ? '' : 's'} match “${raw.trim()}”`
      : '';
    if (query) setToggleLabel(false);
  };

  on(qs('#faq-filter', view), 'input', debounce((event) => filter(event.target.value), 120));

  on(toggleAll, 'click', () => {
    const expanded = toggleAll.getAttribute('aria-expanded') === 'true';
    items.forEach((el) => { if (!el.hidden) el.open = !expanded; });
    setToggleLabel(!expanded);
  });

  document.title = 'FAQ — CalcSuite';
  return view;
}
