/**
 * Integration tests for the SkillHub index-page runtime (Task 4).
 *
 * Spec: language-switch-and-layout-fix (bugfix)
 *
 * These load the ACTUAL landing pages from disk (skillhub/en/index.html and
 * skillhub/fr/index.html), inject their real markup into the jsdom document,
 * and run the shared bootstrap `initApp()` exactly as `app.js` would in the
 * browser. jsdom does not execute the `<script type="module">` tag itself, so
 * the tests drive `initApp()` directly against the page's own DOM — this
 * exercises the full header flow against the authored HTML rather than a
 * hand-built fixture.
 *
 * Coverage (design "Integration Tests"):
 *  - Full index-page flow: for both locales, running initApp() paints the
 *    header progress bar and wires the EN/FR toggle, confirming identical
 *    header behavior across locales.
 *  - Toggle navigation flow: from each index page, clicking the other locale
 *    navigates to the matching /en/ or /fr/ route and persists the preference.
 *  - Both index pages ship `<script type="module" src="../js/app.js">` so the
 *    runtime loads in the browser as it does on lesson pages.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initApp } from '../js/main.js';
import { lessons } from '../js/lessons.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATHS = {
  en: path.resolve(__dirname, '../en/index.html'),
  fr: path.resolve(__dirname, '../fr/index.html'),
};

const LOCALE_KEY = 'skillhub-locale';

/**
 * Load a real index page's HTML and replace the current jsdom document's
 * `<html>` content with it, so `initApp()` runs against the authored markup.
 *
 * @param {'en'|'fr'} locale
 * @returns {string} The raw HTML source (for script-tag assertions).
 */
function loadIndexDocument(locale) {
  const html = fs.readFileSync(INDEX_PATHS[locale], 'utf8');
  // Parse the full document, then transplant its <head> + <body> into the live
  // jsdom document. Writing innerHTML of documentElement preserves the authored
  // header, progress bar, locale switcher, and lang attribute.
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.documentElement.setAttribute(
    'lang',
    parsed.documentElement.getAttribute('lang') || locale,
  );
  document.head.innerHTML = parsed.head.innerHTML;
  document.body.innerHTML = parsed.body.innerHTML;
  return html;
}

/**
 * Install a mock `window.location` with the given pathname that captures writes
 * to `href`. Returns a restore function.
 *
 * @param {string} pathname
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

describe('Index-page runtime integration - header is painted and wired on both locales', () => {
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
    document.documentElement.removeAttribute('lang');
    document.head.innerHTML = '';
  });

  for (const locale of ['en', 'fr']) {
    it(`runs initApp() on the ${locale} index: paints the progress bar and wires the toggle`, () => {
      // Two completed lessons so the live-catalog percentage is non-zero and
      // distinguishable from the authored static "0%".
      localStorage.setItem('skillhub_lesson_complete_running-applications-lab', 'true');
      localStorage.setItem('skillhub_lesson_complete_shai-orchestrator-lab', 'true');

      loadIndexDocument(locale);
      restoreLocation = mockLocation(`/${locale}/`);

      initApp();

      // Progress bar painted from the catalog, not left at the static 0%.
      const expected = Math.round((2 / lessons.length) * 100) + '%';
      expect(expected).not.toBe('0%');
      expect(document.querySelector('.progress-bar-fill').style.width).toBe(expected);
      expect(document.querySelector('.progress-percent').textContent).toBe(expected);

      // The EN/FR toggle exists and is wired: both buttons are present.
      const buttons = document.querySelectorAll(
        '.locale-switcher button[data-locale]',
      );
      const locales = Array.from(buttons).map((b) => b.getAttribute('data-locale'));
      expect(locales.sort()).toEqual(['en', 'fr']);
    });
  }

  it('paints an identical header percentage on the EN and FR index pages (same catalog)', () => {
    // Identical completion state must yield an identical header percentage on
    // both locales, confirming the headers behave the same across locales.
    localStorage.setItem('skillhub_lesson_complete_running-applications-lab', 'true');

    const read = (locale) => {
      document.body.innerHTML = '';
      document.head.innerHTML = '';
      loadIndexDocument(locale);
      const restore = mockLocation(`/${locale}/`);
      try {
        initApp();
        return document.querySelector('.progress-percent').textContent;
      } finally {
        restore();
      }
    };

    expect(read('en')).toBe(read('fr'));
  });
});

describe('Index-page runtime integration - toggle navigation flow', () => {
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
    document.documentElement.removeAttribute('lang');
    document.head.innerHTML = '';
  });

  it('from the EN index, clicking FR persists "fr" and navigates to /fr/', () => {
    loadIndexDocument('en');
    restoreLocation = mockLocation('/en/');

    initApp();
    document
      .querySelector('.locale-switcher button[data-locale="fr"]')
      .dispatchEvent(new window.Event('click', { bubbles: true }));

    expect(localStorage.getItem(LOCALE_KEY)).toBe('fr');
    expect(window.location.href).toBe('/fr/');
  });

  it('from the FR index, clicking EN persists "en" and navigates to /en/', () => {
    loadIndexDocument('fr');
    restoreLocation = mockLocation('/fr/');

    initApp();
    document
      .querySelector('.locale-switcher button[data-locale="en"]')
      .dispatchEvent(new window.Event('click', { bubbles: true }));

    expect(localStorage.getItem(LOCALE_KEY)).toBe('en');
    expect(window.location.href).toBe('/en/');
  });
});

describe('Index-page runtime integration - both index pages load the shared runtime', () => {
  it('en/index.html and fr/index.html include <script type="module" src="../js/app.js">', () => {
    const enHtml = fs.readFileSync(INDEX_PATHS.en, 'utf8');
    const frHtml = fs.readFileSync(INDEX_PATHS.fr, 'utf8');

    expect(enHtml).toContain('<script type="module" src="../js/app.js">');
    expect(frHtml).toContain('<script type="module" src="../js/app.js">');
  });
});
