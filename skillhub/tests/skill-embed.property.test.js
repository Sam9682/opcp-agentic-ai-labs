/**
 * Embed-fidelity and escaping property tests for the Sandbox Skill_Sections.
 *
 * Feature: skillhub-sandbox-skill-info
 *
 * This suite drives three correctness properties from the design document over
 * every mapped (page, locale, skill) tuple, plus randomized synthetic strings
 * for the escaping round-trip:
 *
 *  - Property 2 (Complete and faithful embed): for any mapped (page, locale,
 *    skill), the page contains `escapeHtml(sourceOf(skill))` verbatim and
 *    contiguously — the entire escaped source SKILL.md, nothing added, removed,
 *    or reordered. (Req 2.1, 2.2)
 *  - Property 3 (Escaping round-trip): for any real source and for >=100
 *    randomized synthetic strings containing arbitrary combinations of `&`,
 *    `<`, `>`, `unescapeHtml(escapeHtml(s)) === s` byte-for-byte, and the
 *    escaped output has no raw `<`/`>`/unintended `&` and no double-escaped
 *    entity (`&amp;lt;`). (Req 3.1, 3.2, 3.3, 3.5)
 *  - Property 7 (Placeholder preservation): for any mapped (page, locale,
 *    skill), every `{{…}}` placeholder in the source appears verbatim in the
 *    embedded block and the token counts are equal. (Req 5.1, 5.3)
 *
 * Fidelity and placeholder checks enumerate the full Page_Skill_Map × LOCALES.
 * The embed is located by extracting the `<section data-skill="…">` block for
 * each skill and reading the `<pre><code>…</code></pre>` payload within it, so
 * the assertions are coupled to the shipped pages rather than a re-render.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PAGE_SKILL_MAP,
  LOCALES,
  skillSourcePath,
} from './helpers/page-skill-map.js';
import { escapeHtml, unescapeHtml } from './helpers/skill-embed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLHUB_ROOT = path.resolve(__dirname, '..');

/** Resolve the absolute path to a page file in a given locale. */
function pagePath(locale, page) {
  return path.resolve(SKILLHUB_ROOT, locale, page);
}

/** Read the full HTML source of a mapped page. */
function readPage(locale, page) {
  return fs.readFileSync(pagePath(locale, page), 'utf8');
}

/** Read the raw SKILL.md source for a skill id. */
function sourceOf(skillId) {
  return fs.readFileSync(skillSourcePath(skillId), 'utf8');
}

/**
 * Extract the raw inner HTML of the `<section class="skill-section"
 * data-skill="SKILL">…</section>` block for a given skill from a page's HTML.
 *
 * The `data-skill` attribute makes each section uniquely addressable, and the
 * sections are siblings (no nesting), so matching up to the next
 * `</section>` is sufficient and unambiguous.
 *
 * @param {string} html - full page source
 * @param {string} skillId - e.g. 'START_APP'
 * @returns {string|null} the section's inner HTML, or null if not present
 */
function extractSection(html, skillId) {
  const re = new RegExp(
    `<section[^>]*data-skill="${skillId}"[^>]*>([\\s\\S]*?)</section>`,
  );
  const m = html.match(re);
  return m ? m[1] : null;
}

/**
 * Extract the escaped prompt payload from a skill section's inner HTML: the
 * text between `<pre><code>` and `</code></pre>`.
 *
 * @param {string} sectionHtml - the inner HTML of a skill section
 * @returns {string|null} the embedded (still-escaped) prompt text, or null
 */
function extractEmbed(sectionHtml) {
  const m = sectionHtml.match(/<pre><code>([\s\S]*?)<\/code><\/pre>/);
  return m ? m[1] : null;
}

/** Count `{{…}}` runtime-placeholder tokens in a string. */
function placeholderTokens(text) {
  return text.match(/\{\{[^}]*\}\}/g) ?? [];
}

/**
 * The full enumeration of mapped (page, locale, skill) tuples. Pages mapped to
 * an empty skill list (e.g. install-bare-metal.html) contribute nothing.
 */
const TUPLES = [];
for (const locale of LOCALES) {
  for (const [page, skills] of Object.entries(PAGE_SKILL_MAP)) {
    for (const skill of skills) {
      TUPLES.push({ locale, page, skill });
    }
  }
}

describe('skillhub-sandbox-skill-info — Property 2: Complete and faithful embed', () => {
  // Feature: skillhub-sandbox-skill-info, Property 2: For any mapped (page,
  // locale, skill) tuple, the page contains, verbatim and contiguously,
  // escapeHtml(sourceOf(skill)) — the entire escaped source SKILL.md.
  // **Validates: Requirements 2.1, 2.2**

  it('enumerates at least one mapped (page, locale, skill) tuple', () => {
    expect(TUPLES.length).toBeGreaterThan(0);
  });

  it.each(TUPLES)(
    'embeds escapeHtml(source) verbatim and contiguously for $skill on $locale/$page (Req 2.1, 2.2)',
    ({ locale, page, skill }) => {
      const html = readPage(locale, page);
      const section = extractSection(html, skill);
      expect(
        section,
        `missing <section data-skill="${skill}"> on ${locale}/${page}`,
      ).not.toBeNull();

      const embed = extractEmbed(section);
      expect(
        embed,
        `missing <pre><code> embed for ${skill} on ${locale}/${page}`,
      ).not.toBeNull();

      const escapedSource = escapeHtml(sourceOf(skill));

      // Verbatim + contiguous containment of the ENTIRE escaped source: the
      // embed must contain the whole escaped SKILL.md as one unbroken run, with
      // no lines added, removed, or reordered (Req 2.2).
      expect(embed).toContain(escapedSource);

      // Unescaping the embedded payload must recover the exact source bytes,
      // confirming completeness (Req 2.1) in addition to containment.
      const start = embed.indexOf(escapedSource);
      expect(unescapeHtml(embed.slice(start, start + escapedSource.length))).toBe(
        sourceOf(skill),
      );
    },
  );
});

describe('skillhub-sandbox-skill-info — Property 3: Escaping round-trip', () => {
  // Feature: skillhub-sandbox-skill-info, Property 3: For any source prompt and
  // for any synthetic string of arbitrary `&`/`<`/`>` combinations, unescaping
  // the escaped block recovers the original byte-for-byte, with no raw
  // `<`/`>`/unintended `&` and no double-escaped entity (`&amp;lt;`).
  // **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

  /**
   * Assert the escaping round-trip and no-raw-special invariants for an
   * arbitrary input string:
   *  - round-trip recovers the source byte-for-byte
   *  - the escaped output contains no raw `<` or `>` and no bare/unintended `&`
   *    (every `&` begins one of the three known entities `&amp;`/`&lt;`/`&gt;`)
   *
   * These hold for ANY input, including strings that literally contain entity
   * text such as `&lt;` (which correctly escapes to `&amp;lt;` — faithful
   * escaping of the literal source, verified by the round-trip). The
   * double-escaping regression guard (`&amp;lt;` arising from a SOURCE `<`) is
   * asserted separately against inputs free of pre-existing `&`, where it is
   * well-defined.
   */
  function assertRoundTripInvariants(s) {
    const escaped = escapeHtml(s);

    // Byte-for-byte round-trip (Req 3.1, 3.2, 3.3 reversed).
    expect(unescapeHtml(escaped)).toBe(s);

    // Every `&` in the escaped output must introduce one of the three known
    // entities; stripping those entities must leave no raw `<`, `>`, or `&`.
    const stripped = escaped
      .replace(/&amp;/g, '')
      .replace(/&lt;/g, '')
      .replace(/&gt;/g, '');
    expect(stripped).not.toContain('&');
    expect(stripped).not.toContain('<');
    expect(stripped).not.toContain('>');
  }

  /**
   * Assert the no-double-escape guarantee for a source whose `<`/`>`/`&` are all
   * meant literally (no pre-existing HTML entities intended as entities): each
   * source `<`/`>` is emitted as exactly `&lt;`/`&gt;`, never `&amp;lt;`/`&amp;gt;`
   * (Req 3.3 ordering — `&` escaped first so entity prefixes are not re-escaped).
   */
  function assertNoDoubleEscape(s) {
    const escaped = escapeHtml(s);
    const rawLt = (s.match(/</g) || []).length;
    const rawGt = (s.match(/>/g) || []).length;
    expect((escaped.match(/&lt;/g) || []).length).toBe(rawLt);
    expect((escaped.match(/&gt;/g) || []).length).toBe(rawGt);
    expect(escaped).not.toContain('&amp;lt;');
    expect(escaped).not.toContain('&amp;gt;');
  }

  it('round-trips every real SKILL.md source with no double-escaping (Req 3.1, 3.2, 3.3, 3.5)', () => {
    const skills = [
      ...new Set(Object.values(PAGE_SKILL_MAP).flat()),
    ];
    expect(skills.length).toBeGreaterThan(0);
    for (const skill of skills) {
      const source = sourceOf(skill);
      assertRoundTripInvariants(source);
      assertNoDoubleEscape(source);
    }
  });

  it('round-trips >=100 randomized synthetic strings of &/</> combinations (Req 3.1, 3.2, 3.3)', () => {
    // A generator biased toward the three HTML-sensitive characters and common
    // entity-looking fragments, interleaved with arbitrary text, so the inputs
    // exercise raw specials, adjacent specials, and strings that already look
    // like entities (e.g. "amp;", "&lt").
    const fragmentArb = fc.oneof(
      fc.constantFrom('<', '>', '&', '<<', '>>', '&&', '<>', '><'),
      fc.constantFrom('&amp;', '&lt;', '&gt;', 'amp;', 'lt;', 'gt;', '&#x27;'),
      fc.string(),
      fc.string({ unit: fc.constantFrom('<', '>', '&', 'a', ' ', '\n', '\t') }),
    );
    const syntheticArb = fc
      .array(fragmentArb, { minLength: 0, maxLength: 20 })
      .map((parts) => parts.join(''));

    // Round-trip holds for ALL synthetic inputs (including literal entity text).
    fc.assert(
      fc.property(syntheticArb, (s) => {
        assertRoundTripInvariants(s);
      }),
      { numRuns: 200 },
    );

    // No-double-escape is asserted on inputs whose specials are unambiguously
    // literal `<`/`>` with no pre-existing `&`, so `&lt;`/`&gt;` in the output
    // can only originate from the escape step (never from literal entity text).
    const noAmpArb = fc
      .array(
        fc.oneof(
          fc.constantFrom('<', '>', '<<', '>>', '<>', '><'),
          fc.string({ unit: fc.constantFrom('<', '>', 'a', ' ', '\n', '\t') }),
        ),
        { minLength: 0, maxLength: 20 },
      )
      .map((parts) => parts.join(''))
      .filter((s) => !s.includes('&'));

    fc.assert(
      fc.property(noAmpArb, (s) => {
        assertNoDoubleEscape(s);
      }),
      { numRuns: 100 },
    );
  });

  it('escaped real sources appear exactly as escaped in the shipped embeds (Req 3.5)', () => {
    // Browser-render fidelity (Req 3.5): the shipped embed is precisely the
    // escaped source, so unescaping the embed yields the literal source
    // characters a Reader sees. Checked across every mapped tuple.
    for (const { locale, page, skill } of TUPLES) {
      const html = readPage(locale, page);
      const section = extractSection(html, skill);
      expect(section).not.toBeNull();
      const embed = extractEmbed(section);
      expect(embed).not.toBeNull();

      const source = sourceOf(skill);
      const escapedSource = escapeHtml(source);
      const start = embed.indexOf(escapedSource);
      expect(start, `escaped source not found in ${locale}/${page} ${skill}`).toBeGreaterThanOrEqual(0);

      const slice = embed.slice(start, start + escapedSource.length);
      // No double-escaping and faithful decode within the embedded region.
      expect(slice).not.toContain('&amp;lt;');
      expect(unescapeHtml(slice)).toBe(source);
    }
  });
});

describe('skillhub-sandbox-skill-info — Property 7: Placeholder preservation', () => {
  // Feature: skillhub-sandbox-skill-info, Property 7: For any mapped (page,
  // locale, skill) tuple, every `{{…}}` runtime placeholder in the source
  // appears verbatim in the embedded block, and the count of `{{…}}` tokens in
  // the embed equals the count in the source.
  // **Validates: Requirements 5.1, 5.3**

  it.each(TUPLES)(
    'preserves every {{…}} placeholder verbatim with equal token counts for $skill on $locale/$page (Req 5.1, 5.3)',
    ({ locale, page, skill }) => {
      const html = readPage(locale, page);
      const section = extractSection(html, skill);
      expect(section).not.toBeNull();
      const embed = extractEmbed(section);
      expect(embed).not.toBeNull();

      // Placeholders contain only `{`, `}`, letters, digits, `_` — none of the
      // escaped characters — so they appear identically in source and embed.
      const sourceTokens = placeholderTokens(sourceOf(skill));
      const embedTokens = placeholderTokens(embed);

      // Equal token counts: none resolved, removed, or injected (Req 5.3).
      expect(embedTokens.length).toBe(sourceTokens.length);

      // Each placeholder preserved verbatim, including the double braces (Req 5.1).
      for (const token of sourceTokens) {
        expect(embed).toContain(token);
      }

      // Same multiset of tokens (order-independent), so nothing was swapped.
      expect([...embedTokens].sort()).toEqual([...sourceTokens].sort());
    },
  );
});
