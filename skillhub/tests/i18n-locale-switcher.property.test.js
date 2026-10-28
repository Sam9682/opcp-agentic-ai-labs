/**
 * Bug condition exploration test for the SkillHub language switch / layout fix.
 *
 * Spec: language-switch-and-layout-fix (bugfix)
 * Property 1: Bug Condition - Locale toggle switches language and index pages
 *             run the runtime.
 *
 * This test is written BEFORE the fix and is EXPECTED TO FAIL on the UNFIXED
 * code. A failing test confirms the bug exists:
 *
 *  - Form A: nothing in the runtime attaches a `click` handler to the
 *    `.locale-switcher button[data-locale]` elements, so clicking EN/FR after
 *    `initApp()` never invokes `switchLocale(button.dataset.locale)` — no
 *    locale is persisted and no navigation happens.
 *  - Form B: neither `skillhub/en/index.html` nor `skillhub/fr/index.html`
 *    loads the shared bootstrap (`<script type="module" src="../js/app.js">`),
 *    so `initApp()` never runs on the landing pages and the header progress bar
 *    is never recomputed from the live catalog (stays at the static `0%`).
 *
 * Once the fix is applied (wire `initLocaleSwitcher` into `initApp()`, and load
 * `app.js` on both index pages), this same test encodes the expected behavior
 * and will PASS, validating the fix.
 *
 * The property is scoped to the deterministic failing cases described in the
 * design's Bug Condition (`isBugCondition`): EN->FR and FR->EN clicks on both
 * lesson and index DOMs, plus an index page-load whose runtime should paint the
 * progress bar.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initApp } from '../js/main.js';
import { lessons } from '../js/lessons.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EN_INDEX = path.resolve(__dirname, '../en/index.html');
const FR_INDEX = path.resolve(__dirname, '../fr/index.html');

/** The storage key `switchLocale` persists the chosen locale under. */
const LOCALE_KEY = 'skillhub-locale';

/**
 * The header markup authored on both index pages: the progress bar family used
 * by the live runtime (`.progress-bar-fill` / `.progress-percent`) and the
 * EN/FR `.locale-switcher`. Mirrors skillhub/en/index.html and
 * skillhub/fr/index.html so the DOM the runtime wires is faithful to the real
 * landing pages.
 */
const INDEX_HEADER_MARKUP = `
  <header class="site-header">
    <div class="header-actions">
      <div class="progress-bar-container" aria-label="Overall progress">
        <span class="progress-label">Progress:</span>
        <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-bar-fill" style="width: 0%"></div>
        </div>
        <span class="progress-percent">0%</span>
      </div>
      <div class="locale-switcher" role="navigation" aria-label="Language selector">
        <button class="active" data-locale="en" aria-label="English">EN</button>
        <button data-locale="fr" aria-label="Français">FR</button>
      </div>
    </div>
  </header>
`;

/**
 * Build the header markup for a lesson page: the same progress bar + locale
 * switcher, used to exercise the Form A click on a lesson DOM.
 */
const LESSON_HEADER_MARKUP = INDEX_HEADER_MARKUP;

/**
 * Install a mock `window.location` with the given pathname that captures writes
 * to `href` (exactly the pattern used by the existing i18n/navigation suites).
 * Returns a restore function.
 *
 * @param {string} pathname - The simulated current pathname.
 * @returns {() => void} restore
 */
function mockLocation(pathname) {
  const original = window.location;
  delete window.location;
  window.location = { pathname, href: '' };
  return () => {
    delete window.location;
    window.location = original;
  };
}

/**
 * Click the `.locale-switcher` button carrying the given `data-locale`.
 *
 * @param {string} locale - "en" or "fr".
 */
function clickLocaleButton(locale) {
  const button = document.querySelector(
    `.locale-switcher button[data-locale="${locale}"]`,
  );
  if (!button) {
    throw new Error(`No .locale-switcher button[data-locale="${locale}"] found`);
  }
  button.dispatchEvent(new window.Event('click', { bubbles: true }));
}

describe('Bug Condition - Property 1: locale toggle invokes switchLocale (Form A)', () => {
  let restoreLocation = null;

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  afterEach(() => {
    if (restoreLocation) {
      restoreLocation();
      restoreLocation = null;
    }
  });

  it('clicking FR on a lesson page persists "fr" and navigates to /fr/<slug>.html (Req 1.1)', () => {
    document.body.innerHTML = LESSON_HEADER_MARKUP;
    restoreLocation = mockLocation('/en/lesson.html');

    initApp();
    clickLocaleButton('fr');

    // switchLocale(button.dataset.locale) must have run: persist + navigate.
    expect(localStorage.getItem(LOCALE_KEY)).toBe('fr');
    expect(window.location.href).toBe('/fr/lesson.html');
  });

  it('clicking FR on the English index persists "fr" and navigates to /fr/ (Req 1.2)', () => {
    document.body.innerHTML = INDEX_HEADER_MARKUP;
    restoreLocation = mockLocation('/en/');

    initApp();
    clickLocaleButton('fr');

    expect(localStorage.getItem(LOCALE_KEY)).toBe('fr');
    expect(window.location.href).toBe('/fr/');
  });

  it('clicking EN on the French index persists "en" and navigates to /en/ (Req 1.3)', () => {
    document.body.innerHTML = INDEX_HEADER_MARKUP;
    restoreLocation = mockLocation('/fr/');

    initApp();
    clickLocaleButton('en');

    expect(localStorage.getItem(LOCALE_KEY)).toBe('en');
    expect(window.location.href).toBe('/en/');
  });

  it('a wired click matches a direct switchLocale call across scoped locale/path cases (Req 1.1, 1.2, 1.3)', () => {
    // Scoped PBT: the deterministic failing cases — EN->FR and FR->EN clicks on
    // both lesson and index DOMs. For each, a click must produce exactly the
    // persistence + navigation switchLocale would.
    const caseArb = fc.constantFrom(
      { pathname: '/en/lesson.html', click: 'fr', expectHref: '/fr/lesson.html', expectStored: 'fr' },
      { pathname: '/fr/lesson.html', click: 'en', expectHref: '/en/lesson.html', expectStored: 'en' },
      { pathname: '/en/', click: 'fr', expectHref: '/fr/', expectStored: 'fr' },
      { pathname: '/fr/', click: 'en', expectHref: '/en/', expectStored: 'en' },
    );

    fc.assert(
      fc.property(caseArb, (c) => {
        document.body.innerHTML = INDEX_HEADER_MARKUP;
        localStorage.clear();
        const restore = mockLocation(c.pathname);
        try {
          initApp();
          clickLocaleButton(c.click);
          expect(localStorage.getItem(LOCALE_KEY)).toBe(c.expectStored);
          expect(window.location.href).toBe(c.expectHref);
        } finally {
          restore();
        }
      }),
      { numRuns: 40 },
    );
  });
});

describe('Bug Condition - Property 1: index runtime paints the progress bar (Form B)', () => {
  let restoreLocation = null;

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  afterEach(() => {
    if (restoreLocation) {
      restoreLocation();
      restoreLocation = null;
    }
  });

  it('both index pages load the shared runtime (../js/app.js) (Req 1.4, 1.5)', () => {
    // On unfixed code the index pages end with a placeholder comment instead of
    // the bootstrap script, so initApp() never runs on the landing pages.
    const enHtml = fs.readFileSync(EN_INDEX, 'utf8');
    const frHtml = fs.readFileSync(FR_INDEX, 'utf8');

    expect(enHtml).toContain('<script type="module" src="../js/app.js">');
    expect(frHtml).toContain('<script type="module" src="../js/app.js">');
  });

  it('running the index runtime recomputes the progress bar from the live catalog (Req 1.4)', () => {
    // Record two completed lessons so the live catalog percentage is non-zero
    // and distinguishable from the static "0%" authored markup.
    localStorage.setItem('skillhub_lesson_complete_install-bare-metal', 'true');
    localStorage.setItem('skillhub_lesson_complete_adding-applications', 'true');

    document.body.innerHTML = INDEX_HEADER_MARKUP;
    restoreLocation = mockLocation('/en/');

    initApp();

    const expected = Math.round((2 / lessons.length) * 100) + '%';
    const fill = document.querySelector('.progress-bar-fill');
    const percent = document.querySelector('.progress-percent');

    // The bar must be recomputed from the catalog, NOT left at the static 0%.
    expect(expected).not.toBe('0%');
    expect(fill.style.width).toBe(expected);
    expect(percent.textContent).toBe(expected);
  });
});
