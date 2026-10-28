/**
 * Property-based tests for the SkillHub locale-switcher wiring (Task 4).
 *
 * Spec: language-switch-and-layout-fix (bugfix)
 *
 * These complement the Task 1 exploration PBT (scoped to the four deterministic
 * EN<->FR cases) and the Task 2 preservation PBT (direct i18n calls, no-switcher
 * degradation). The gaps covered here are the design's "Property-Based Tests":
 *
 *  - For ARBITRARY target locale values and ARBITRARY pathnames, a wired click
 *    produces exactly the same persistence + navigation as a direct
 *    `switchLocale` call. The switcher button carries the generated
 *    `data-locale`, so the click path and the direct-call path must agree
 *    across the full input domain (fix correctness + switchLocale preservation).
 *  - For arbitrary DOMs with and without a `.locale-switcher`, `initApp()` never
 *    throws and wires the toggle only when switcher buttons are present.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 3.1, 3.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { switchLocale } from '../js/i18n.js';
import { initApp } from '../js/main.js';

const LOCALE_KEY = 'skillhub-locale';

/**
 * Install a mock `window.location` with the given pathname that captures writes
 * to `href`, mirroring the existing i18n/navigation suites. Returns a restore
 * function.
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
 * Compute the result of a direct `switchLocale(target)` call on `pathname`:
 * the persisted locale and the navigated href. Serves as the oracle the wired
 * click must match.
 *
 * @param {string} target - Raw value passed through the switcher button.
 * @param {string} pathname - Current pathname.
 * @returns {{ stored: 'en'|'fr', href: string }}
 */
function directSwitchResult(target, pathname) {
  localStorage.clear();
  const restore = mockLocation(pathname);
  try {
    switchLocale(target);
    return {
      stored: localStorage.getItem(LOCALE_KEY),
      href: window.location.href,
    };
  } finally {
    restore();
  }
}

/**
 * Compute the result of a click on a wired `.locale-switcher` button whose
 * `data-locale` is `target`, after `initApp()` ran on `pathname`.
 *
 * @param {string} target - The button's data-locale value.
 * @param {string} pathname - Current pathname.
 * @returns {{ stored: 'en'|'fr', href: string }}
 */
function wiredClickResult(target, pathname) {
  localStorage.clear();
  // Build a switcher whose button carries the generated target as data-locale.
  // Attribute values are escaped minimally; fast-check targets stay printable
  // (see the generator), so we encode quotes defensively.
  const container = document.createElement('div');
  container.className = 'locale-switcher';
  const button = document.createElement('button');
  button.setAttribute('data-locale', target);
  button.textContent = 'switch';
  container.appendChild(button);
  document.body.innerHTML = '';
  document.body.appendChild(container);

  const restore = mockLocation(pathname);
  try {
    initApp();
    button.dispatchEvent(new window.Event('click', { bubbles: true }));
    return {
      stored: localStorage.getItem(LOCALE_KEY),
      href: window.location.href,
    };
  } finally {
    restore();
  }
}

describe('Locale-switcher wiring - Property: wired click equals direct switchLocale', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('a wired click produces the same persistence + navigation as switchLocale for arbitrary target/path', () => {
    // target: canonical + fr-* / mixed-case variants + non-French + arbitrary
    // printable strings (all normalize to "en" or "fr"). We keep generated
    // strings free of embedded quotes so they round-trip cleanly through the
    // data-locale attribute (the behavior under test is locale normalization,
    // not HTML-attribute escaping).
    const targetArb = fc.oneof(
      fc.constantFrom('en', 'fr'),
      fc.constantFrom('fr-FR', 'fr-CA', 'FR-BE', 'Fr', 'frisian', 'de', 'es', 'EN', ''),
      fc.string().filter((s) => !/["'<>]/.test(s)),
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
        const direct = directSwitchResult(target, pathname);
        const wired = wiredClickResult(target, pathname);

        // The wired click must drive switchLocale identically to a direct call.
        expect(wired.stored).toBe(direct.stored);
        expect(wired.href).toBe(direct.href);
        // And the persisted value is always a canonical locale.
        expect(wired.stored === 'en' || wired.stored === 'fr').toBe(true);
      }),
      { numRuns: 200 },
    );
  });
});

describe('Locale-switcher wiring - Property: initApp wires only when a switcher is present', () => {
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

  it('for arbitrary DOMs, initApp never throws and wires the toggle iff switcher buttons exist', () => {
    // Each case declares whether a `.locale-switcher button[data-locale]` is
    // present. The toggle must be wired exactly when it is, and initApp must
    // never throw either way.
    const caseArb = fc.record({
      hasSwitcher: fc.boolean(),
      // Extra, unrelated markup that must never affect switcher wiring,
      // including a stray data-locale button outside any switcher.
      extra: fc.constantFrom(
        '',
        '<div>content</div>',
        '<pre><code class="language-javascript">const y = 2;</code></pre>',
        '<div class="progress-bar" style="width:0%"></div><span class="progress-text">0%</span>',
        '<button id="stray" data-locale="fr">stray</button>',
      ),
      // The locale the switcher button carries, when present.
      buttonLocale: fc.constantFrom('en', 'fr'),
    });

    fc.assert(
      fc.property(caseArb, (c) => {
        localStorage.clear();
        const switcher = c.hasSwitcher
          ? `<div class="locale-switcher"><button data-locale="${c.buttonLocale}">x</button></div>`
          : '';
        document.body.innerHTML = switcher + c.extra;
        const restore = mockLocation('/en/lesson.html');
        try {
          // initApp must never throw regardless of the DOM shape.
          expect(() => initApp()).not.toThrow();

          const switcherButtons = document.querySelectorAll(
            '.locale-switcher button[data-locale]',
          );
          expect(switcherButtons.length).toBe(c.hasSwitcher ? 1 : 0);

          if (c.hasSwitcher) {
            // The in-switcher button is wired: clicking it persists + navigates.
            switcherButtons[0].dispatchEvent(
              new window.Event('click', { bubbles: true }),
            );
            expect(localStorage.getItem(LOCALE_KEY)).toBe(c.buttonLocale);
            expect(window.location.href).not.toBe('');
          } else {
            // No switcher -> no wiring. A stray data-locale button stays inert.
            const stray = document.querySelector('#stray');
            if (stray) {
              stray.dispatchEvent(new window.Event('click', { bubbles: true }));
            }
            expect(localStorage.getItem(LOCALE_KEY)).toBe(null);
            expect(window.location.href).toBe('');
          }
        } finally {
          restore();
        }
      }),
      { numRuns: 100 },
    );
  });
});
