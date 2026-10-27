/**
 * SkillHub navigation module.
 *
 * Renders the lesson sidebar grouped by session track, wires lesson links to
 * locale-aware URLs, reflects completion/active state, and drives the
 * responsive hamburger menu. Completion is slug-keyed and locale-independent:
 * a lesson is treated as complete when its id appears in the supplied
 * `completedIds` or when its `skillhub_lesson_complete_<slug>` key in
 * localStorage is the string `'true'`.
 */

import { lessons as catalogLessons } from './lessons.js';
import { detectLocale, getStoredLocalePreference } from './i18n.js';

/** Fixed track ordering used to group and emit sidebar sections. */
const TRACK_ORDER = ['morning', 'afternoon', 'sandbox'];

/** Prefix for per-lesson completion flags persisted in localStorage. */
const COMPLETE_PREFIX = 'skillhub_lesson_complete_';

/** The locales the runtime supports. */
const SUPPORTED_LOCALES = ['en', 'fr'];

/**
 * Localized, exact section titles per track (asserted verbatim by the tests).
 * @type {Record<string, { en: string, fr: string }>}
 */
const TRACK_TITLES = {
  morning: {
    en: 'Introduction & Fundamentals',
    fr: 'Matin — Introduction et fondamentaux',
  },
  afternoon: {
    en: 'Design & Governance',
    fr: 'Conception et gouvernance',
  },
  sandbox: {
    en: 'Sandbox — opcp-explorer Platform',
    fr: 'Bac à sable — plateforme opcp-explorer',
  },
};

/**
 * Resolve the active locale for rendering.
 *
 * A valid stored preference wins; otherwise fall back to {@link detectLocale}
 * and ultimately to `'en'`. Never throws.
 *
 * @returns {'en'|'fr'} The active locale.
 */
function resolveActiveLocale() {
  const stored = getStoredLocalePreference();
  if (stored === 'en' || stored === 'fr') {
    return stored;
  }
  try {
    const detected = detectLocale();
    return detected === 'fr' ? 'fr' : 'en';
  } catch (_err) {
    return 'en';
  }
}

/**
 * Report whether a lesson slug is complete.
 *
 * True when the slug is in `completedIds` or when its completion key in
 * localStorage is the string `'true'`. Storage errors degrade to the
 * `completedIds` check only.
 *
 * @param {string} slug
 * @param {Set<string>} completedSet
 * @returns {boolean}
 */
function isComplete(slug, completedSet) {
  if (completedSet.has(slug)) return true;
  try {
    return localStorage.getItem(COMPLETE_PREFIX + slug) === 'true';
  } catch (_err) {
    return false;
  }
}

/**
 * Render the lesson sidebar into `container`.
 *
 * Lessons are grouped by track in the fixed order `['morning', 'afternoon',
 * 'sandbox']`; one `.sidebar-section` is emitted per non-empty group. Each
 * section has an `<h2 class="sidebar-section-title">` with the locale-
 * appropriate title and a `<ul class="sidebar-nav">` of `<li>` lesson links.
 * An empty lesson list yields zero sections and does not throw.
 *
 * Each lesson link (`<a>`): text is the localized title, `href` is
 * `/<locale>/<slug>.html`, with `data-slug` and `data-lesson-id` set. Completed
 * lessons get a `completed` class plus a completion `aria-label`; the lesson
 * matching the current pathname gets an `active` class plus
 * `aria-current="page"`.
 *
 * @param {HTMLElement} container - Element to render the sidebar into.
 * @param {object[]} lessonList - Lessons to render.
 * @param {string[]} [completedIds] - Lesson ids known to be complete.
 * @returns {void}
 */
export function renderSidebar(container, lessonList, completedIds = []) {
  if (!container) return;

  const locale = resolveActiveLocale();
  const completedSet = new Set(Array.isArray(completedIds) ? completedIds : []);
  const pathname =
    (typeof window !== 'undefined' && window.location && window.location.pathname) || '';

  container.innerHTML = '';

  const list = Array.isArray(lessonList) ? lessonList : [];

  for (const track of TRACK_ORDER) {
    const trackLessons = list.filter((lesson) => lesson.track === track);
    if (trackLessons.length === 0) continue;

    const section = document.createElement('div');
    section.className = 'sidebar-section';

    const heading = document.createElement('h2');
    heading.className = 'sidebar-section-title';
    const titles = TRACK_TITLES[track] || { en: track, fr: track };
    heading.textContent = titles[locale] || titles.en;
    section.appendChild(heading);

    const ul = document.createElement('ul');
    ul.className = 'sidebar-nav';

    for (const lesson of trackLessons) {
      const li = document.createElement('li');
      const link = document.createElement('a');

      link.textContent = (lesson.title && lesson.title[locale]) || (lesson.title && lesson.title.en) || '';
      link.setAttribute('href', `/${locale}/${lesson.slug}.html`);
      link.setAttribute('data-slug', lesson.slug);
      link.setAttribute('data-lesson-id', lesson.id);

      if (isComplete(lesson.slug, completedSet)) {
        link.classList.add('completed');
        link.setAttribute('aria-label', `${link.textContent} (completed)`);
      }

      if (pathname.endsWith(`/${lesson.slug}.html`)) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }

      li.appendChild(link);
      ul.appendChild(li);
    }

    section.appendChild(ul);
    container.appendChild(section);
  }
}

/**
 * Navigate to a lesson page for the given locale.
 *
 * When `locale` is a supported locale (`'en'` or `'fr'`) it is used directly;
 * otherwise the active locale is detected via {@link detectLocale}. Navigation
 * is performed by assigning `window.location.href`.
 *
 * @param {string} slug - Lesson slug (filename without `.html`).
 * @param {string} locale - Requested locale.
 * @returns {void}
 */
export function navigateToLesson(slug, locale) {
  const target = SUPPORTED_LOCALES.includes(locale) ? locale : detectLocale();
  if (typeof window !== 'undefined' && window.location) {
    window.location.href = `/${target}/${slug}.html`;
  }
}

/**
 * Initialize the responsive hamburger menu.
 *
 * Locates `.hamburger-btn` and `.sidebar`; returns early (no throw) if either
 * is absent. Sets accessible attributes on the button, toggles the sidebar
 * `open` class on click (syncing `aria-expanded`), and closes the sidebar on
 * an outside click or an Escape keydown while it is open.
 *
 * @returns {void}
 */
export function initHamburgerMenu() {
  const btn = document.querySelector('.hamburger-btn');
  const sidebar = document.querySelector('.sidebar');
  if (!btn || !sidebar) return;

  btn.setAttribute('aria-label', 'Toggle navigation menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'sidebar-nav');

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = sidebar.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.addEventListener('click', (event) => {
    if (!sidebar.classList.contains('open')) return;
    const target = event.target;
    if (btn.contains(target) || sidebar.contains(target)) return;
    sidebar.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!sidebar.classList.contains('open')) return;
    sidebar.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Initialize navigation for the current page.
 *
 * Renders the sidebar into `.sidebar` when present, then sets up the hamburger
 * menu. Does not throw when `.sidebar` is absent.
 *
 * @param {object[]} [lessonList] - Lessons to render (defaults to the catalog).
 * @param {string[]} [completedIds] - Lesson ids known to be complete.
 * @returns {void}
 */
export function initNavigation(lessonList = catalogLessons, completedIds = []) {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    renderSidebar(sidebar, lessonList, completedIds);
  }
  initHamburgerMenu();
}
