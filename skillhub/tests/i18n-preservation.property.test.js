/**
 * Preservation property tests for the SkillHub language-switch / layout fix.
 *
 * Spec: language-switch-and-layout-fix (bugfix)
 * Property 2: Preservation - All non-toggle, non-index runtime behavior is
 *             unchanged.
 *
 * Methodology: observation-first. These properties were authored by running the
 * UNFIXED runtime for inputs where the bug condition does NOT hold (direct i18n
 * calls, lesson-page bootstrap, sidebar rendering, DOMs without a
 * `.locale-switcher`), recording the actual outputs, and asserting those
 * observed outputs here. They are EXPECTED TO PASS on the unfixed code — that
 * pass is the baseline the fix must preserve. After the fix (wiring
 * `initLocaleSwitcher` into `initApp()` and loading `app.js` on the index
 * pages), these same tests must continue to pass, proving no regression.
 *
 * Scope note: the inputs exercised here are deliberately the ones for which
 * `isBugCondition` returns false:
 *   - Direct programmatic `switchLocale(target)` calls (never a wired click).
 *   - Lesson-page bootstrap on a DOM that models a lesson page.
 *   - A DOM with no `.locale-switcher` (e.g. the plain test DOM).
 *   - `detectLocale` / `getStoredLocalePreference` / `setLocalePreference` /
 *     `normalizeLocale`, including graceful degradation.
 *   - `renderSidebar` grouping / localized titles / completed+active marking.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  normalizeLocale,
  switchLocale,
  detectLocale,
  getStoredLocalePreference,
  setLocalePreference,
  LOCALE_KEY,
} from '../js/i18n.js';
import { renderSidebar } from '../js/navigation.js';
import { initApp } from '../js/main.js';
import { lessons } from '../js/lessons.js';
import { disableLocalStorage } from './setup.js';

/**
 * Install a mock `window.location` with the given pathname that captures writes
 * to `href`, mirroring the pattern used by the existing i18n/navigation suites.
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
 * Set navigator.language / navigator.languages for a test run.
 * @param {string} language - The primary browser language tag.
 */
function setBrowserLanguage(language) {
  Object.defineProperty(navigator, 'language', {
    value: language,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(navigator, 'languages', {
    value: language ? [language] : [],
    configurable: true,
    writable: true,
  });
}

/**
 * Reference model of the observed, unchanged `switchLocale` contract.
 *
 * Mirrors the implementation: normalize the target (lowercased `startsWith('fr')`
 * -> "fr", else "en"), persist that normalized locale, and rewrite the path by
 * swapping a leading `/en/` or `/fr/` segment, else navigate to `/<locale>/`.
 *
 * @param {*} target - Raw target passed to switchLocale.
 * @param {string} pathname - Current pathname.
 * @returns {{ stored: 'en'|'fr', href: string }}
 */
function expectedSwitch(target, pathname) {
  const locale =
    typeof target === 'string' && target.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  const href = /^\/(en|fr)\//.test(pathname)
    ? pathname.replace(/^\/(en|fr)\//, `/${locale}/`)
    : `/${locale}/`;
  return { stored: locale, href };
}

describe('Preservation - Property 2: switchLocale contract is unchanged (Req 3.1)', () => {
  let restoreLocation = null;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    if (restoreLocation) {
      restoreLocation();
      restoreLocation = null;
    }
  });

  it('direct switchLocale(target) normalizes, persists, and navigates for arbitrary target/path', () => {
    // Generators span the full non-buggy input space for a DIRECT call:
    //  - target: canonical locales, fr-* / mixed-case variants, non-French
    //    tags, and arbitrary strings (all normalize to "en" or "fr").
    //  - pathname: locale-prefixed lesson paths, locale roots, and paths with
    //    no locale segment (which fall back to /<locale>/).
    const targetArb = fc.oneof(
      fc.constantFrom('en', 'fr'),
      fc.constantFrom('fr-FR', 'fr-CA', 'FR-BE', 'Fr', 'de', 'es', 'EN', ''),
      fc.string(),
    );

    const pathnameArb = fc.constantFrom(
      '/en/lesson.html',
      '/fr/lesson.html',
      '/en/assistant-vs-agent.html',
      '/fr/guardrails-5-layers.html',
      '/en/',
      '/fr/',
      '/some/other/path',
      '/index.html',
      '',
    );

    fc.assert(
      fc.property(targetArb, pathnameArb, (target, pathname) => {
        localStorage.clear();
        const restore = mockLocation(pathname);
        try {
          switchLocale(target);

          const expected = expectedSwitch(target, pathname);
          // Persistence: the normalized locale is stored under LOCALE_KEY.
          expect(localStorage.getItem(LOCALE_KEY)).toBe(expected.stored);
          // Navigation: href is the locale-rewritten path (or /<locale>/).
          expect(window.location.href).toBe(expected.href);
        } finally {
          restore();
        }
      }),
      { numRuns: 200 },
    );
  });

  it('switchLocale swallows storage errors and still navigates (graceful degradation, Req 3.1/3.4)', () => {
    restoreLocation = mockLocation('/en/lesson.html');
    const restoreStorage = disableLocalStorage();
    try {
      expect(() => switchLocale('fr')).not.toThrow();
      // Navigation still happens even though persistence could not be written.
      expect(window.location.href).toBe('/fr/lesson.html');
    } finally {
      restoreStorage();
    }
  });
});

describe('Preservation - Property 2: lesson-page bootstrap is unchanged (Req 3.2)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('initApp() on a lesson DOM wires highlighting, progress, navigation, and the guardrail checklist', () => {
    // A faithful lesson DOM: a highlightable code block, the lesson progress
    // bar family, a sidebar (navigation target), and the guardrail checklist.
    document.body.innerHTML = `
      <div class="progress-bar-fill" style="width: 0%"></div>
      <span class="progress-percent">0%</span>
      <aside class="sidebar"></aside>
      <button class="hamburger-btn"><span></span><span></span><span></span></button>
      <pre><code class="language-javascript">const x = 1;</code></pre>
      <div class="guardrail-checklist" data-lesson-slug="demo-lesson">
        <input class="guardrail-check" type="checkbox" data-layer="permissions" />
        <input class="guardrail-check" type="checkbox" data-layer="operational-limits" />
        <input class="guardrail-check" type="checkbox" data-layer="human-approval" />
        <input class="guardrail-check" type="checkbox" data-layer="observability" />
        <input class="guardrail-check" type="checkbox" data-layer="kill-switch" />
      </div>
      <div class="guardrail-result"></div>
      <button class="mark-complete-btn">Mark complete</button>
    `;

    expect(() => initApp()).not.toThrow();

    // Highlighting wired: the recognized code block is marked highlighted.
    const code = document.querySelector('code');
    expect(code.dataset.highlighted).toBe('true');
    expect(code.innerHTML).toContain('<span class="hljs-keyword">const</span>');

    // Progress bar wired: painted from the live catalog (0 complete -> 0%).
    const fill = document.querySelector('.progress-bar-fill');
    const percent = document.querySelector('.progress-percent');
    expect(fill.style.width).toBe('0%');
    expect(percent.textContent).toBe('0%');

    // Navigation wired: the sidebar is rendered with the three track sections,
    // and the hamburger button receives its accessible attributes.
    const sidebar = document.querySelector('.sidebar');
    expect(sidebar.querySelectorAll('.sidebar-section').length).toBe(3);
    expect(document.querySelector('.hamburger-btn').getAttribute('aria-label')).toBe(
      'Toggle navigation menu',
    );

    // Guardrail wired: the complete button starts disabled, and checking all
    // five layers enables it (a change listener is attached).
    const completeBtn = document.querySelector('.mark-complete-btn');
    expect(completeBtn.disabled).toBe(true);
    document.querySelectorAll('input.guardrail-check').forEach((input) => {
      input.checked = true;
      input.dispatchEvent(new window.Event('change', { bubbles: true }));
    });
    expect(completeBtn.disabled).toBe(false);
  });

  it('initApp() paints the lesson progress bar from the live catalog for arbitrary completion sets (Req 3.2)', () => {
    // Property: for any subset of lesson slugs marked complete, the lesson
    // progress bar reflects round(complete / catalog) %, unchanged by the fix.
    const slugs = lessons.map((l) => l.slug);
    const subsetArb = fc.subarray(slugs, { minLength: 0, maxLength: slugs.length });

    fc.assert(
      fc.property(subsetArb, (completed) => {
        localStorage.clear();
        for (const slug of completed) {
          localStorage.setItem(`skillhub_lesson_complete_${slug}`, 'true');
        }
        document.body.innerHTML = `
          <div class="progress-bar-fill" style="width: 0%"></div>
          <span class="progress-percent">0%</span>
        `;

        initApp();

        const expected = Math.round((completed.length / lessons.length) * 100) + '%';
        expect(document.querySelector('.progress-bar-fill').style.width).toBe(expected);
        expect(document.querySelector('.progress-percent').textContent).toBe(expected);
      }),
      { numRuns: 60 },
    );
  });
});

describe('Preservation - Property 2: no-.locale-switcher DOM degrades unchanged (Req 3.3)', () => {
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

  it('initApp() on a DOM without .locale-switcher does not throw and attaches no toggle handler', () => {
    // A stray data-locale button OUTSIDE any .locale-switcher must never be
    // wired: clicking it causes no persistence and no navigation. On unfixed
    // code nothing wires it at all; after the fix the wiring is scoped to
    // `.locale-switcher button[data-locale]`, so this stays true.
    document.body.innerHTML = `
      <div>No locale switcher here</div>
      <button id="stray" data-locale="fr">FR</button>
    `;
    restoreLocation = mockLocation('/en/lesson.html');

    expect(() => initApp()).not.toThrow();

    document
      .querySelector('#stray')
      .dispatchEvent(new window.Event('click', { bubbles: true }));

    expect(localStorage.getItem(LOCALE_KEY)).toBe(null);
    expect(window.location.href).toBe('');
  });

  it('initApp() on arbitrary minimal DOMs without a switcher never throws (Req 3.3)', () => {
    const fragmentArb = fc.constantFrom(
      '',
      '<div>No progress bar here</div>',
      '<main><p>content</p></main>',
      '<div class="progress-bar" style="width:0%"></div><span class="progress-text">0%</span>',
      '<pre><code class="language-javascript">const y = 2;</code></pre>',
    );

    fc.assert(
      fc.property(fragmentArb, (html) => {
        document.body.innerHTML = html;
        expect(() => initApp()).not.toThrow();
        // No .locale-switcher present -> no buttons to wire.
        expect(document.querySelectorAll('.locale-switcher button[data-locale]').length).toBe(0);
      }),
      { numRuns: 30 },
    );
  });
});

describe('Preservation - Property 2: detection / persistence / normalization unchanged (Req 3.4)', () => {
  beforeEach(() => {
    localStorage.clear();
    setBrowserLanguage('en-US');
  });

  it('normalizeLocale maps fr-* / mixed case to "fr" and everything else to "en" for arbitrary input', () => {
    const inputArb = fc.oneof(
      fc.constantFrom('fr', 'fr-FR', 'fr-CA', 'FR-BE', 'Fr', 'frisian'),
      fc.constantFrom('en', 'en-US', 'de', 'es', 'ja', '', 'xx'),
      fc.string(),
      fc.anything(),
    );

    fc.assert(
      fc.property(inputArb, (value) => {
        const result = normalizeLocale(value);
        const expected =
          typeof value === 'string' && value.toLowerCase().startsWith('fr') ? 'fr' : 'en';
        expect(result).toBe(expected);
      }),
      { numRuns: 200 },
    );
  });

  it('setLocalePreference persists the normalized locale and getStoredLocalePreference reads it back (Req 3.4)', () => {
    const inputArb = fc.oneof(
      fc.constantFrom('en', 'fr', 'fr-CA', 'FR-FR', 'de', 'es', ''),
      fc.string(),
    );

    fc.assert(
      fc.property(inputArb, (value) => {
        localStorage.clear();
        setLocalePreference(value);

        const normalized =
          typeof value === 'string' && value.toLowerCase().startsWith('fr') ? 'fr' : 'en';
        // Raw stored value is the normalized locale.
        expect(localStorage.getItem(LOCALE_KEY)).toBe(normalized);
        // getStoredLocalePreference returns it only because it is "en"/"fr".
        expect(getStoredLocalePreference()).toBe(normalized);
      }),
      { numRuns: 200 },
    );
  });

  it('detectLocale resolves stored-preference > French-browser > "en" for arbitrary inputs (Req 3.4)', () => {
    const storedArb = fc.oneof(
      fc.constant(null),
      fc.constantFrom('en', 'fr'),
      fc.constantFrom('de', 'es', 'EN', 'FR', '', 'fr-CA'),
      fc.string(),
    );
    const browserArb = fc.constantFrom(
      'fr',
      'fr-FR',
      'FR-CA',
      'en',
      'en-GB',
      'de-DE',
      'ja-JP',
      '',
    );

    fc.assert(
      fc.property(storedArb, browserArb, (stored, browser) => {
        localStorage.clear();
        if (stored !== null) {
          localStorage.setItem(LOCALE_KEY, stored);
        }
        setBrowserLanguage(browser);

        const expected =
          stored === 'en' || stored === 'fr'
            ? stored
            : browser.toLowerCase().startsWith('fr')
              ? 'fr'
              : 'en';

        const result = detectLocale();
        expect(result === 'en' || result === 'fr').toBe(true);
        expect(result).toBe(expected);
      }),
      { numRuns: 200 },
    );
  });

  it('getStoredLocalePreference and setLocalePreference degrade gracefully when localStorage is unavailable (Req 3.4)', () => {
    const restore = disableLocalStorage();
    try {
      // Reading throws internally -> treated as "no preference".
      expect(getStoredLocalePreference()).toBe(null);
      // Writing throws internally -> swallowed, never propagates.
      expect(() => setLocalePreference('fr')).not.toThrow();
      // Detection falls through to browser language when storage throws.
      setBrowserLanguage('fr-FR');
      expect(detectLocale()).toBe('fr');
      setBrowserLanguage('en-US');
      expect(detectLocale()).toBe('en');
    } finally {
      restore();
    }
  });
});

describe('Preservation - Property 2: renderSidebar is unchanged (Req 3.5)', () => {
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

  it('renderSidebar groups by track and applies localized titles for both locales (Req 3.5)', () => {
    // After the quiz & sandbox restructure, the sidebar renders one top-level
    // `.sidebar-section-title` (h2) per non-empty section in the fixed order
    // section-1, section-2, section-3 (the former per-subsection titles moved
    // to `.sidebar-subsection-title` h3s under Section I).
    const expectedTitles = {
      en: [
        'Fundamentals & Governance',
        'Quiz',
        'Sandbox Labs',
      ],
      fr: [
        'Fondamentaux et gouvernance',
        'Quiz',
        'Bac à sable — travaux pratiques',
      ],
    };

    for (const locale of ['en', 'fr']) {
      localStorage.clear();
      localStorage.setItem(LOCALE_KEY, locale);
      const container = document.createElement('div');

      renderSidebar(container, lessons, []);

      const titles = Array.from(
        container.querySelectorAll('.sidebar-section-title'),
      ).map((el) => el.textContent);
      expect(titles).toEqual(expectedTitles[locale]);

      // Three non-empty section groups in the fixed order.
      expect(container.querySelectorAll('.sidebar-section').length).toBe(3);
    }
  });

  it('renderSidebar marks exactly the completed lessons for arbitrary completion sets (Req 3.5)', () => {
    const slugs = lessons.map((l) => l.slug);
    const subsetArb = fc.subarray(slugs, { minLength: 0, maxLength: slugs.length });

    fc.assert(
      fc.property(subsetArb, (completed) => {
        localStorage.clear();
        localStorage.setItem(LOCALE_KEY, 'en');
        const container = document.createElement('div');

        renderSidebar(container, lessons, completed);

        const completedLinks = container.querySelectorAll('a.completed');
        const uniqueCompleted = new Set(completed);
        expect(completedLinks.length).toBe(uniqueCompleted.size);

        // Every marked link corresponds to a requested slug, and carries a
        // completion aria-label.
        completedLinks.forEach((link) => {
          expect(uniqueCompleted.has(link.getAttribute('data-slug'))).toBe(true);
          expect(link.getAttribute('aria-label')).toContain('completed');
        });
      }),
      { numRuns: 60 },
    );
  });

  it('renderSidebar marks the lesson matching the current pathname as active (Req 3.5)', () => {
    const slugArb = fc.constantFrom(...lessons.map((l) => l.slug));

    fc.assert(
      fc.property(slugArb, (slug) => {
        localStorage.clear();
        localStorage.setItem(LOCALE_KEY, 'en');
        const restore = mockLocation(`/en/${slug}.html`);
        try {
          const container = document.createElement('div');
          renderSidebar(container, lessons, []);

          const active = container.querySelectorAll('a.active');
          expect(active.length).toBe(1);
          expect(active[0].getAttribute('data-slug')).toBe(slug);
          expect(active[0].getAttribute('aria-current')).toBe('page');
        } finally {
          restore();
        }
      }),
      { numRuns: 40 },
    );
  });
});
