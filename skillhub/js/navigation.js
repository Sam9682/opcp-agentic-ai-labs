/**
 * SkillHub navigation module.
 *
 * Renders the lesson sidebar grouped by top-level section and, within a
 * section, by optional labeled subsection; wires lesson links to locale-aware
 * URLs, reflects completion/active state, and drives the responsive hamburger
 * menu. Completion is slug-keyed and locale-independent: a lesson is treated as
 * complete when its id appears in the supplied `completedIds` or when its
 * `skillhub_lesson_complete_<slug>` key in localStorage is the string `'true'`.
 */

import { lessons as catalogLessons } from './lessons.js';
import { detectLocale, getStoredLocalePreference } from './i18n.js';

/** Prefix for per-lesson completion flags persisted in localStorage. */
const COMPLETE_PREFIX = 'skillhub_lesson_complete_';

/** The locales the runtime supports. */
const SUPPORTED_LOCALES = ['en', 'fr'];

/** Fixed top-level section ordering used to group and emit sidebar sections. */
const SECTION_ORDER = ['section-1', 'section-2', 'section-3'];

/**
 * Verbatim bilingual section titles, asserted by the tests.
 * @type {Record<string, { en: string, fr: string }>}
 */
const SECTION_TITLES = {
  'section-1': { en: 'Fundamentals & Governance', fr: 'Fondamentaux et gouvernance' },
  'section-2': { en: 'Quiz', fr: 'Quiz' },
  'section-3': { en: 'Sandbox Labs', fr: 'Bac à sable — travaux pratiques' },
};

/**
 * Ordered subsections per section. Sections with a single, unlabeled group use
 * `[null]`; only Section I carries labeled subsections (I.1 intro, I.2 design).
 * @type {Record<string, Array<string|null>>}
 */
const SUBSECTION_ORDER = {
  'section-1': ['intro', 'design'],
  'section-2': [null],
  'section-3': [null],
};

/**
 * Verbatim bilingual subsection titles for labeled subsections.
 * @type {Record<string, { en: string, fr: string }>}
 */
const SUBSECTION_TITLES = {
  intro: { en: 'Introduction & Fundamentals', fr: 'Introduction et fondamentaux' },
  design: { en: 'Design & Governance', fr: 'Conception et gouvernance' },
};

/**
 * Map a (section, subsection) group to the `<ul>` id used for its nav list.
 *
 * The I.2 (`design`) list keeps the legacy id `nav-afternoon` so the
 * navigation-consistency property test continues to resolve it. The I.1
 * (`intro`) list uses `nav-morning`; unlabeled single groups fall back to
 * `nav-<section>`.
 *
 * @param {string} section
 * @param {string|null} subsection
 * @returns {string}
 */
function navListId(section, subsection) {
  if (subsection === 'design') return 'nav-afternoon';
  if (subsection === 'intro') return 'nav-morning';
  return `nav-${section}`;
}

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
 * Render one `<li><a>…</a></li>` lesson link into `ul`.
 *
 * Link text is the localized title; `href` is `/<locale>/<slug>.html`, with
 * `data-slug` and `data-lesson-id` set. Completed lessons get a `completed`
 * class plus a completion `aria-label`; the lesson matching the current
 * pathname gets an `active` class plus `aria-current="page"`.
 *
 * @param {HTMLElement} ul - List element to append the link into.
 * @param {object} lesson - Lesson to render.
 * @param {string} locale - Active locale.
 * @param {Set<string>} completedSet - Slugs known to be complete.
 * @param {string} pathname - Current page pathname.
 * @returns {void}
 */
function appendLessonLink(ul, lesson, locale, completedSet, pathname) {
  const li = document.createElement('li');
  const link = document.createElement('a');

  link.textContent =
    (lesson.title && lesson.title[locale]) || (lesson.title && lesson.title.en) || '';
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

/**
 * Render the lesson sidebar into `container`.
 *
 * Lessons are grouped by top-level section in the fixed order `['section-1',
 * 'section-2', 'section-3']`; one `.sidebar-section` is emitted per non-empty
 * section, each with an `<h2 class="sidebar-section-title">` carrying the
 * locale-appropriate title and a `data-section` attribute. Within a section,
 * lessons are grouped by `SUBSECTION_ORDER[section]`; a labeled subsection
 * (I.1/I.2) emits an `<h3 class="sidebar-subsection-title">`, while an
 * unlabeled single group (Sections II and III) renders its links directly under
 * the section heading with no sub-heading. Each group's links live in a
 * `<ul class="sidebar-nav">` with a group-specific id. An empty lesson list
 * yields zero sections and does not throw.
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

  for (const sectionKey of SECTION_ORDER) {
    const sectionLessons = list.filter((lesson) => lesson.section === sectionKey);
    if (sectionLessons.length === 0) continue;

    const section = document.createElement('div');
    section.className = 'sidebar-section';
    section.setAttribute('data-section', sectionKey);

    const heading = document.createElement('h2');
    heading.className = 'sidebar-section-title';
    const sectionTitles = SECTION_TITLES[sectionKey] || { en: sectionKey, fr: sectionKey };
    heading.textContent = sectionTitles[locale] || sectionTitles.en;
    section.appendChild(heading);

    const subsectionKeys = SUBSECTION_ORDER[sectionKey] || [null];

    for (const subsectionKey of subsectionKeys) {
      const groupLessons =
        subsectionKey === null
          ? sectionLessons
          : sectionLessons.filter((lesson) => lesson.subsection === subsectionKey);
      if (groupLessons.length === 0) continue;

      // Emit a subsection heading only for labeled subsections (I.1/I.2);
      // unlabeled single groups (Sections II and III) render no sub-heading.
      const subsectionTitles = subsectionKey && SUBSECTION_TITLES[subsectionKey];
      if (subsectionTitles) {
        const subheading = document.createElement('h3');
        subheading.className = 'sidebar-subsection-title';
        subheading.textContent = subsectionTitles[locale] || subsectionTitles.en;
        section.appendChild(subheading);
      }

      const ul = document.createElement('ul');
      ul.className = 'sidebar-nav';
      ul.id = navListId(sectionKey, subsectionKey);

      for (const lesson of groupLessons) {
        appendLessonLink(ul, lesson, locale, completedSet, pathname);
      }

      section.appendChild(ul);
    }

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
