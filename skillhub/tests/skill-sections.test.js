import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  PAGE_SKILL_MAP,
  LOCALES,
  skillSourcePath,
} from './helpers/page-skill-map.js';
import { escapeHtml } from './helpers/skill-embed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLHUB_ROOT = resolve(__dirname, '..');

/** Absolute path to a Sandbox page for a given locale + basename. */
function pagePath(locale, page) {
  return resolve(SKILLHUB_ROOT, locale, page);
}

/** Read a Sandbox page's HTML string. */
function readPage(locale, page) {
  return readFileSync(pagePath(locale, page), 'utf-8');
}

/** Read a skill's canonical SKILL.md source text. */
function readSkillSource(skillId) {
  return readFileSync(skillSourcePath(skillId), 'utf-8');
}

/** Parse an HTML string into a Document using jsdom's DOMParser. */
function parse(html) {
  return new DOMParser().parseFromString(html, 'text/html');
}

/** All `<section class="skill-section">` elements on a parsed page, in order. */
function skillSections(doc) {
  return Array.from(doc.querySelectorAll('section.skill-section'));
}

/**
 * Extract the escaped embedded prompt for each skill-section directly from the
 * raw HTML (not via the DOM) so we can compare byte-for-byte against
 * `escapeHtml(source)` without the parser normalising entities or whitespace.
 *
 * Returns an ordered array of { skillId, embedded } for every section on the
 * page, where `embedded` is the exact text between `<pre><code>` and
 * `</code></pre>` inside that section.
 */
function extractEmbeds(html) {
  const results = [];
  const sectionRe =
    /<section class="skill-section" data-skill="([^"]+)">([\s\S]*?)<\/section>/g;
  let m;
  while ((m = sectionRe.exec(html)) !== null) {
    const skillId = m[1];
    const body = m[2];
    const pre = /<pre><code>([\s\S]*?)<\/code><\/pre>/.exec(body);
    results.push({ skillId, embedded: pre ? pre[1] : null });
  }
  return results;
}

/** Count heading tags (h1..h6) in an HTML string. */
function countHeadings(html) {
  const matches = html.match(/<h[1-6][\s>]/gi);
  return matches ? matches.length : 0;
}

/** Does a skill's source contain at least one {{...}} runtime placeholder? */
function sourceHasPlaceholder(skillId) {
  return /\{\{[^}]+\}\}/.test(readSkillSource(skillId));
}

const PAGES = Object.keys(PAGE_SKILL_MAP);
const MAPPED_PAGES = PAGES.filter((p) => PAGE_SKILL_MAP[p].length > 0);

const FEATURE = 'Feature: skillhub-sandbox-skill-info';

// ---------------------------------------------------------------------------
// Property 1: Per-page section count matches the map (Req 1.7, 1.8)
// ---------------------------------------------------------------------------
describe(`${FEATURE}, Property 1: per-page section count matches the map`, () => {
  for (const page of PAGES) {
    for (const locale of LOCALES) {
      const expected = PAGE_SKILL_MAP[page].length;
      it(`${locale}/${page} renders ${expected} skill-section block(s)`, () => {
        const doc = parse(readPage(locale, page));
        expect(skillSections(doc).length).toBe(expected);
      });
    }
  }

  it('install-bare-metal.html has zero skill-sections in both locales', () => {
    for (const locale of LOCALES) {
      const doc = parse(readPage(locale, 'install-bare-metal.html'));
      expect(skillSections(doc).length).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Example-level mapping: the ordered skill ids per page match the map
// (Req 1.1-1.6, 1.8)
// ---------------------------------------------------------------------------
describe(`${FEATURE}: per-page ordered skill mapping (Req 1.1-1.6, 1.8)`, () => {
  for (const page of MAPPED_PAGES) {
    for (const locale of LOCALES) {
      it(`${locale}/${page} exposes the mapped skills in map order`, () => {
        const doc = parse(readPage(locale, page));
        const ids = skillSections(doc).map((s) => s.getAttribute('data-skill'));
        expect(ids).toEqual(PAGE_SKILL_MAP[page]);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Property 4: Section structure (Req 2.3, 3.4, 4.1, 7.1)
// One intro <p> before a single <details>; the <details> contains a <summary>
// followed by a <pre><code>.
// ---------------------------------------------------------------------------
describe(`${FEATURE}, Property 4: section structure`, () => {
  for (const page of MAPPED_PAGES) {
    for (const locale of LOCALES) {
      for (const skillId of PAGE_SKILL_MAP[page]) {
        it(`${locale}/${page} #${skillId} has one intro <p> then a <details> with <summary> + <pre><code>`, () => {
          const doc = parse(readPage(locale, page));
          const section = doc.querySelector(
            `section.skill-section[data-skill="${skillId}"]`,
          );
          expect(section, 'section present').not.toBeNull();

          // Exactly one <details> in the section.
          const detailsList = section.querySelectorAll('details');
          expect(detailsList.length).toBe(1);
          const details = detailsList[0];

          // Exactly one intro <p> and it precedes the <details>.
          const paragraphs = Array.from(section.querySelectorAll(':scope > p'));
          expect(paragraphs.length).toBe(1);
          const introP = paragraphs[0];
          expect(
            introP.compareDocumentPosition(details) &
              Node.DOCUMENT_POSITION_FOLLOWING,
            'intro <p> precedes <details>',
          ).toBeTruthy();

          // The <details> contains a <summary> followed by a <pre><code>.
          const summary = details.querySelector(':scope > summary');
          expect(summary, '<summary> present').not.toBeNull();
          const pre = details.querySelector(':scope > pre');
          expect(pre, '<pre> present').not.toBeNull();
          const code = pre.querySelector(':scope > code');
          expect(code, '<pre><code> present').not.toBeNull();
          expect(
            summary.compareDocumentPosition(pre) &
              Node.DOCUMENT_POSITION_FOLLOWING,
            '<summary> precedes <pre>',
          ).toBeTruthy();
        });
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Property 5: Collapsed by default (Req 4.2)
// The <details> element must NOT carry the `open` attribute.
// ---------------------------------------------------------------------------
describe(`${FEATURE}, Property 5: collapsed by default`, () => {
  for (const page of MAPPED_PAGES) {
    for (const locale of LOCALES) {
      it(`${locale}/${page} has no <details open>`, () => {
        const doc = parse(readPage(locale, page));
        for (const section of skillSections(doc)) {
          const details = section.querySelector('details');
          expect(details.hasAttribute('open')).toBe(false);
        }
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Property 6: Summary identifies the skill (Req 4.4, 7.3)
// ---------------------------------------------------------------------------
describe(`${FEATURE}, Property 6: summary identifies the skill`, () => {
  for (const page of MAPPED_PAGES) {
    for (const locale of LOCALES) {
      for (const skillId of PAGE_SKILL_MAP[page]) {
        it(`${locale}/${page} summary for ${skillId} contains the skill id`, () => {
          const doc = parse(readPage(locale, page));
          const section = doc.querySelector(
            `section.skill-section[data-skill="${skillId}"]`,
          );
          const summary = section.querySelector('details > summary');
          expect(summary.textContent).toContain(skillId);
        });
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Property 8: Runtime note when placeholders exist (Req 5.2)
// The alert-info runtime note is present iff the source has >=1 {{...}}.
// ---------------------------------------------------------------------------
describe(`${FEATURE}, Property 8: runtime note present when placeholders exist`, () => {
  for (const page of MAPPED_PAGES) {
    for (const locale of LOCALES) {
      for (const skillId of PAGE_SKILL_MAP[page]) {
        const hasPlaceholder = sourceHasPlaceholder(skillId);
        const label = hasPlaceholder
          ? 'includes a runtime note'
          : 'omits the runtime note (no placeholders)';
        it(`${locale}/${page} #${skillId} ${label}`, () => {
          const doc = parse(readPage(locale, page));
          const section = doc.querySelector(
            `section.skill-section[data-skill="${skillId}"]`,
          );
          const note = section.querySelector('.alert.alert-info');
          if (hasPlaceholder) {
            expect(note, 'runtime note present').not.toBeNull();
          } else {
            expect(note, 'no runtime note').toBeNull();
          }
        });
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Property 9: EN/FR section-set parity (Req 6.1)
// ---------------------------------------------------------------------------
describe(`${FEATURE}, Property 9: EN/FR section-set parity`, () => {
  for (const page of PAGES) {
    it(`${page} exposes identical ordered skill ids in en/ and fr/`, () => {
      const enIds = skillSections(parse(readPage('en', page))).map((s) =>
        s.getAttribute('data-skill'),
      );
      const frIds = skillSections(parse(readPage('fr', page))).map((s) =>
        s.getAttribute('data-skill'),
      );
      expect(frIds).toEqual(enIds);
      expect(enIds).toEqual(PAGE_SKILL_MAP[page]);
    });
  }
});

// ---------------------------------------------------------------------------
// Property 10: Embedded prompt is the English source in both locales (Req 6.4)
// The FR embed equals escapeHtml(sourceOf(skill)) — i.e. not translated.
// ---------------------------------------------------------------------------
describe(`${FEATURE}, Property 10: embedded prompt is the English source in both locales`, () => {
  for (const page of MAPPED_PAGES) {
    for (const { skillId, embedded } of extractEmbeds(readPage('fr', page))) {
      it(`fr/${page} #${skillId} embeds the English escaped source`, () => {
        expect(embedded, 'embed extracted').not.toBeNull();
        expect(embedded).toBe(escapeHtml(readSkillSource(skillId)));
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Property 11: Per-skill byte-identical embed across pages and locales (Req 6.5)
// ---------------------------------------------------------------------------
describe(`${FEATURE}, Property 11: per-skill byte-identical embed across pages and locales`, () => {
  // Collect every (skillId -> embedded string) occurrence across all pages/locales.
  const bySkill = new Map();
  for (const page of MAPPED_PAGES) {
    for (const locale of LOCALES) {
      for (const { skillId, embedded } of extractEmbeds(readPage(locale, page))) {
        if (!bySkill.has(skillId)) bySkill.set(skillId, []);
        bySkill.get(skillId).push({ page, locale, embedded });
      }
    }
  }

  for (const [skillId, occurrences] of bySkill) {
    it(`${skillId} has a byte-identical embed in all ${occurrences.length} appearance(s)`, () => {
      const canonical = escapeHtml(readSkillSource(skillId));
      for (const { page, locale, embedded } of occurrences) {
        expect(embedded, `${locale}/${page} embed extracted`).not.toBeNull();
        expect(embedded, `${locale}/${page} matches canonical escaped source`).toBe(
          canonical,
        );
      }
    });
  }

  it('MODIFY_CODE appears on two pages and is identical everywhere', () => {
    const occ = bySkill.get('MODIFY_CODE') ?? [];
    // 2 pages x 2 locales = 4 appearances.
    expect(occ.length).toBe(4);
    const first = occ[0].embedded;
    for (const { embedded } of occ) {
      expect(embedded).toBe(first);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 12: Heading structure and outline preservation (Req 7.4)
// EN and FR copies have the same heading count, and each added section
// contributes a heading reachable in the document outline.
// ---------------------------------------------------------------------------
describe(`${FEATURE}, Property 12: heading structure and outline preservation`, () => {
  // EN/FR heading parity is asserted on the pages this feature edits (the
  // mapped pages). `install-bare-metal.html` is explicitly out of scope — it
  // receives zero sections (covered by Property 1) and is not edited here, so
  // its pre-existing EN/FR heading differences are not this feature's concern.
  for (const page of MAPPED_PAGES) {
    it(`${page} has equal heading counts in en/ and fr/`, () => {
      const enCount = countHeadings(readPage('en', page));
      const frCount = countHeadings(readPage('fr', page));
      expect(enCount).toBeGreaterThan(0);
      expect(frCount).toBe(enCount);
    });
  }

  for (const page of MAPPED_PAGES) {
    for (const locale of LOCALES) {
      for (const skillId of PAGE_SKILL_MAP[page]) {
        it(`${locale}/${page} #${skillId} contributes a heading to the outline`, () => {
          const doc = parse(readPage(locale, page));
          const section = doc.querySelector(
            `section.skill-section[data-skill="${skillId}"]`,
          );
          const heading = section.querySelector('h1,h2,h3,h4,h5,h6');
          expect(heading, 'section has a heading').not.toBeNull();
          expect(heading.textContent).toContain(skillId);
        });
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Concrete EN/FR wrapper strings (Req 6.2, 6.3)
// Pin the authored heading, summary, intro, and runtime-note phrasing per
// locale for a representative single-skill page.
// ---------------------------------------------------------------------------
describe(`${FEATURE}: concrete EN/FR wrapper strings (Req 6.2, 6.3)`, () => {
  it('EN starting-applications uses English wrapper text for START_APP', () => {
    const doc = parse(readPage('en', 'starting-applications.html'));
    const section = doc.querySelector(
      'section.skill-section[data-skill="START_APP"]',
    );
    const heading = section.querySelector('h2');
    const summary = section.querySelector('details > summary');
    const note = section.querySelector('.alert.alert-info');

    expect(heading.textContent).toBe('Skill configuration: START_APP');
    expect(summary.textContent).toBe(
      'View the START_APP skill prompt (SKILL.md)',
    );
    expect(note.textContent).toContain('Runtime placeholders:');
    expect(note.textContent).toContain(
      'substituted with concrete values at runtime',
    );
  });

  it('FR starting-applications uses French wrapper text for START_APP', () => {
    const doc = parse(readPage('fr', 'starting-applications.html'));
    const section = doc.querySelector(
      'section.skill-section[data-skill="START_APP"]',
    );
    const heading = section.querySelector('h2');
    const summary = section.querySelector('details > summary');
    const note = section.querySelector('.alert.alert-info');

    expect(heading.textContent).toBe('Configuration du skill : START_APP');
    expect(summary.textContent).toBe(
      'Afficher le prompt du skill START_APP (SKILL.md)',
    );
    expect(note.textContent).toContain("Variables d'exécution :");
    expect(note.textContent).toContain(
      "remplacés par des valeurs concrètes au moment de l'exécution",
    );
  });
});
