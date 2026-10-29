/**
 * Navigation-consistency property test for the New_Lesson
 * `configuring-shai-mcp-opcp-explorer`.
 *
 * Feature: shai-mcp-opcp-explorer
 *
 * This suite drives Property 9 from the design document over every page in
 * both locales that carries an afternoon sidebar navigation list.
 *
 *  - Property 9 (The new lesson link appears last in every afternoon
 *    navigation list): for any lesson page or index page in either locale, the
 *    afternoon sidebar navigation (`#nav-afternoon`) contains a locale-local
 *    link to `configuring-shai-mcp-opcp-explorer.html`, placed last and
 *    immediately after the `agent-design-capstone.html` link.
 *    **Validates: Requirements 5.1, 5.2, 5.5**
 *
 * The "input space" is the set of shipped `skillhub/{en,fr}/*.html` pages. Not
 * every page carries a `#nav-afternoon` section — the sandbox-track pages use a
 * different sidebar structure and legitimately lack it — so the property is
 * asserted FOR EACH page that contains a `#nav-afternoon` list, and pages
 * without one are skipped. A guard asserts the set of pages-with-afternoon-nav
 * is non-empty so the suite cannot silently pass against zero pages.
 *
 * The assertions are coupled to the shipped pages (the nav list is extracted
 * from each page's HTML), matching the regex-based parsing convention already
 * used by the repo's other property tests.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLHUB_ROOT = resolve(__dirname, '..');

const LOCALES = ['en', 'fr'];

/** The New_Lesson's locale-local link target (identical in both locales). */
const NEW_LESSON_HREF = 'configuring-shai-mcp-opcp-explorer.html';

/** The entry the New_Lesson link must come immediately after. */
const CAPSTONE_HREF = 'agent-design-capstone.html';

/** Resolve the absolute path to a page file in a given locale. */
function pagePath(locale, page) {
  return resolve(SKILLHUB_ROOT, locale, page);
}

/** Read the full HTML source of a page. */
function readPage(locale, page) {
  return readFileSync(pagePath(locale, page), 'utf8');
}

/** List every `*.html` page in a locale directory. */
function listPages(locale) {
  return readdirSync(resolve(SKILLHUB_ROOT, locale))
    .filter((name) => name.endsWith('.html'))
    .sort();
}

/**
 * Extract the inner HTML of the `<ul ... id="nav-afternoon">…</ul>` block from a
 * page's HTML. The afternoon list is uniquely addressable by its id and the
 * `<ul>` lists are not nested, so matching up to the next `</ul>` is
 * unambiguous.
 *
 * @param {string} html - full page source
 * @returns {string|null} the list's inner HTML, or null if the page has none
 */
function extractAfternoonNav(html) {
  const m = html.match(
    /<ul[^>]*id="nav-afternoon"[^>]*>([\s\S]*?)<\/ul>/i,
  );
  return m ? m[1] : null;
}

/**
 * Parse the ordered list of anchor hrefs from a nav list's inner HTML, in
 * document order.
 *
 * @param {string} navHtml - inner HTML of a `#nav-afternoon` list
 * @returns {string[]} hrefs in order of appearance
 */
function anchorHrefs(navHtml) {
  const hrefs = [];
  const re = /<a[^>]*\bhref="([^"]*)"[^>]*>/gi;
  let m;
  while ((m = re.exec(navHtml)) !== null) {
    hrefs.push(m[1]);
  }
  return hrefs;
}

/**
 * The full enumeration of (locale, page) tuples that carry a `#nav-afternoon`
 * section. Pages without one (sandbox-track pages) contribute nothing.
 */
const PAGES_WITH_AFTERNOON_NAV = [];
for (const locale of LOCALES) {
  for (const page of listPages(locale)) {
    const nav = extractAfternoonNav(readPage(locale, page));
    if (nav !== null) {
      PAGES_WITH_AFTERNOON_NAV.push({ locale, page });
    }
  }
}

describe('shai-mcp-opcp-explorer — Property 9: new lesson link appears last in every afternoon navigation list', () => {
  // Feature: shai-mcp-opcp-explorer, Property 9: For any lesson/index page in
  // either locale that carries a `#nav-afternoon` list, that list contains a
  // locale-local link to `configuring-shai-mcp-opcp-explorer.html`, placed last
  // and immediately after the `agent-design-capstone.html` link.
  // **Validates: Requirements 5.1, 5.2, 5.5**

  it('enumerates at least one page carrying a #nav-afternoon section', () => {
    expect(PAGES_WITH_AFTERNOON_NAV.length).toBeGreaterThan(0);
  });

  it.each(PAGES_WITH_AFTERNOON_NAV)(
    'has the new lesson link last and right after the capstone in #nav-afternoon on $locale/$page (Req 5.1, 5.2, 5.5)',
    ({ locale, page }) => {
      const nav = extractAfternoonNav(readPage(locale, page));
      expect(nav, `missing #nav-afternoon on ${locale}/${page}`).not.toBeNull();

      const hrefs = anchorHrefs(nav);

      // Req 5.1 / 5.5: a locale-local link to the new lesson exists in the
      // afternoon list. The href is the bare locale-local filename (no path),
      // identical across both locales.
      expect(
        hrefs,
        `#nav-afternoon on ${locale}/${page} must link to ${NEW_LESSON_HREF}`,
      ).toContain(NEW_LESSON_HREF);

      // Req 5.2: placed last in the list.
      expect(
        hrefs[hrefs.length - 1],
        `${NEW_LESSON_HREF} must be the last link in #nav-afternoon on ${locale}/${page}`,
      ).toBe(NEW_LESSON_HREF);

      // Req 5.2: immediately after the agent-design-capstone link.
      const capstoneIndex = hrefs.indexOf(CAPSTONE_HREF);
      expect(
        capstoneIndex,
        `#nav-afternoon on ${locale}/${page} must link to ${CAPSTONE_HREF}`,
      ).toBeGreaterThanOrEqual(0);

      const newLessonIndex = hrefs.indexOf(NEW_LESSON_HREF);
      expect(
        newLessonIndex,
        `${NEW_LESSON_HREF} must come immediately after ${CAPSTONE_HREF} in #nav-afternoon on ${locale}/${page}`,
      ).toBe(capstoneIndex + 1);
    },
  );
});
