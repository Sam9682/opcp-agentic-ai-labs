/**
 * Bug condition exploration / enumeration test for the SkillHub encoding fix.
 *
 * Spec: skillhub-encoding-char-fix (bugfix)
 * Property 1: Bug Condition - Replacement Characters Present in Affected Pages.
 *
 * Methodology (exploratory bugfix workflow):
 *   This test encodes the EXPECTED post-fix behavior - that every HTML page
 *   under skillhub/fr/ and skillhub/en/ decodes as UTF-8 with ZERO U+FFFD
 *   ("\uFFFD", the Unicode replacement character) codepoints.
 *
 *   It is INTENTIONALLY RUN FIRST ON UNFIXED CODE, where it MUST FAIL. The
 *   failure surfaces the counterexamples that prove the bug exists: the 8
 *   affected pages still carry U+FFFD bytes baked in where accented French
 *   letters and typographic punctuation belong. Once the fix replaces every
 *   "\uFFFD" with its intended glyph, this same test passes unchanged and then
 *   validates the fix (see tasks 3.3 / 4).
 *
 *   The bug is deterministic (fixed files, fixed byte positions), so the
 *   property is scoped to the concrete 36-file corpus rather than randomized
 *   input - this keeps it reproducible while still asserting the universal
 *   "zero U+FFFD" property via `isBugCondition`.
 *
 * Bug Condition (from design.md / bugfix.md):
 *   isBugCondition(X) = containsCodepoint(X, U+FFFD)
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPLACEMENT = '\uFFFD'; // U+FFFD "�"

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// skillhub/tests -> skillhub
const SKILLHUB_ROOT = path.resolve(__dirname, '..');
const LOCALES = ['fr', 'en'];

/**
 * The exact set of files the investigation measured as corrupted, relative to
 * the skillhub root. The exploration test asserts the observed corrupted set
 * equals this set exactly (no more, no fewer).
 */
//
// NOTE (quiz & sandbox restructure): the two formerly-affected
// `install-bare-metal.html` pages were deleted when the seven retired sandbox
// lessons were consolidated into `running-applications-lab.html`, so they are
// dropped from this documented set. The remaining six previously-corrupted
// pages all survive the restructure and are still verified clean post-fix.
const EXPECTED_AFFECTED = [
  'fr/agent-anatomy-7-components.html',
  'fr/assistant-vs-agent.html',
  'fr/guardrails-5-layers.html',
  'en/agent-anatomy-7-components.html',
  'en/assistant-vs-agent.html',
  'en/guardrails-5-layers.html',
].sort();

/**
 * Bug Condition predicate from the design: a page triggers the bug when its
 * decoded text contains at least one U+FFFD replacement character.
 *
 * @param {string} text - UTF-8 decoded page text.
 * @returns {boolean}
 */
function isBugCondition(text) {
  return text.includes(REPLACEMENT);
}

/**
 * Enumerate every lesson HTML file under skillhub/fr/ and skillhub/en/,
 * decoding each as UTF-8. Returns a stable, sorted list of
 * { rel, abs, text } descriptors for the whole 36-file corpus.
 *
 * @returns {Array<{ rel: string, abs: string, text: string }>}
 */
function collectCorpus() {
  const files = [];
  for (const loc of LOCALES) {
    const dir = path.join(SKILLHUB_ROOT, loc);
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.html')) continue;
      const abs = path.join(dir, name);
      files.push({ rel: `${loc}/${name}`, abs, text: fs.readFileSync(abs, 'utf8') });
    }
  }
  return files.sort((a, b) => a.rel.localeCompare(b.rel));
}

/**
 * Enumerate every U+FFFD occurrence in a page's decoded text, recording the
 * 1-based line number and a trimmed surrounding context window for each.
 *
 * @param {string} text - UTF-8 decoded page text.
 * @returns {Array<{ line: number, column: number, context: string }>}
 */
function enumerateOccurrences(text) {
  const occurrences = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    let idx = line.indexOf(REPLACEMENT);
    while (idx !== -1) {
      const context = line.slice(Math.max(0, idx - 24), idx + 24).trim();
      occurrences.push({ line: i + 1, column: idx + 1, context });
      idx = line.indexOf(REPLACEMENT, idx + 1);
    }
  });
  return occurrences;
}

const CORPUS = collectCorpus();

describe('Property 1: Bug Condition - enumeration of the defect set', () => {
  it('discovers all 30 lesson files across skillhub/fr/ and skillhub/en/', () => {
    // Sanity: after the quiz & sandbox restructure the corpus is 15-per-locale,
    // 30-total. If this drifts, the scoped enumeration below would be checking
    // the wrong inputs.
    expect(CORPUS.length).toBe(30);
    const frCount = CORPUS.filter((f) => f.rel.startsWith('fr/')).length;
    const enCount = CORPUS.filter((f) => f.rel.startsWith('en/')).length;
    expect(frCount).toBe(15);
    expect(enCount).toBe(15);
  });

  it('the set of files with >=1 U+FFFD is empty post-fix (EXPECTED_AFFECTED documents the files corrupted pre-fix)', () => {
    // isBugCondition(X) = containsCodepoint(X, U+FFFD) over all 36 files.
    // Post-fix expectation: NO file in the corpus still contains U+FFFD, so the
    // corrupted set is empty. EXPECTED_AFFECTED is retained as documentation of
    // the 8 files that WERE corrupted before the fix was applied.
    const corrupted = CORPUS.filter((f) => isBugCondition(f.text))
      .map((f) => f.rel)
      .sort();

    // Emit the per-file counts + sample contexts so the enumeration is captured
    // in the test output. Post-fix this report is expected to be empty; if it is
    // non-empty it pinpoints any file that regressed back into corruption.
    const report = corrupted.map((rel) => {
      const file = CORPUS.find((f) => f.rel === rel);
      const occ = enumerateOccurrences(file.text);
      const samples = occ.slice(0, 5).map((o) => `L${o.line}:C${o.column} …${o.context}…`);
      return `  ${rel}: ${occ.length} U+FFFD\n      ${samples.join('\n      ')}`;
    });
    // eslint-disable-next-line no-console
    console.log(
      `\n[Property 1] Files with >=1 U+FFFD (${corrupted.length}) — expected 0 post-fix.` +
        `\nPre-fix affected set (documentation): ${EXPECTED_AFFECTED.join(', ')}\n` +
        `${report.join('\n')}\n`,
    );

    // Post-fix reality: every previously-corrupted file is now clean, so the set
    // of files containing U+FFFD is empty.
    expect(corrupted).toEqual([]);
  });

  it('confirms every previously-affected file now has ZERO U+FFFD occurrences (post-fix verification)', () => {
    // Pre-fix, these files carried the corruption (French ~114-146 each, English
    // ~3-16 each). Post-fix verification: each file in EXPECTED_AFFECTED - the
    // documented set of files that WERE corrupted - must now report zero U+FFFD
    // occurrences, proving the repair cleaned every affected page.
    for (const rel of EXPECTED_AFFECTED) {
      const file = CORPUS.find((f) => f.rel === rel);
      const count = enumerateOccurrences(file.text).length;
      expect(count).toBe(0);
    }
  });
});

describe('Property 1: Bug Condition - zero U+FFFD across the corpus (fails on unfixed code)', () => {
  // Scoped PBT: the property "every page decodes with zero U+FFFD" is asserted
  // over the concrete 30-file corpus. fast-check drives one case per file so a
  // failure reports the offending file as the shrunk counterexample. After the
  // fix (and the later restructure) all 30 surviving pages pass here.
  it('for every HTML file under skillhub/fr/ and skillhub/en/, the decoded page contains zero U+FFFD', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CORPUS.map((f) => f.rel)),
        (rel) => {
          const file = CORPUS.find((f) => f.rel === rel);
          // Property P (post-fix expected behavior): NOT isBugCondition.
          expect(file.text.includes(REPLACEMENT)).toBe(false);
        },
      ),
      { numRuns: CORPUS.length, verbose: true },
    );
  });
});

describe('Property 1: Bug Condition - specific counterexample shapes (fail on unfixed code)', () => {
  /**
   * Read a single affected file's decoded text by its relative path.
   * @param {string} rel
   * @returns {string}
   */
  function read(rel) {
    return CORPUS.find((f) => f.rel === rel).text;
  }

  it('French accent corruption is absent (leçons, Critères, arrêt, Français, Sélecteur)', () => {
    // On unfixed code these appear as le�ons / Crit�res / arr�t / Fran�ais /
    // S�lecteur, i.e. the token contains U+FFFD. The post-fix expectation is
    // that the correctly accented tokens are present with no replacement char.
    const fr = read('fr/assistant-vs-agent.html');
    const anatomy = read('fr/agent-anatomy-7-components.html');

    // No corrupted variant of these French tokens may remain.
    expect(/le\uFFFDons/.test(anatomy)).toBe(false);
    expect(/Crit\uFFFDres/.test(fr)).toBe(false);
    expect(/arr\uFFFDt/.test(fr)).toBe(false);
    expect(/Fran\uFFFDais/.test(fr)).toBe(false);
    expect(/S\uFFFDlecteur/.test(fr)).toBe(false);
  });

  it('English standalone em-dash corruption is absent ("Suggest — the system proposes")', () => {
    // On unfixed code: "<strong>Suggest</strong> � the system proposes".
    const en = read('en/assistant-vs-agent.html');
    expect(en.includes('Suggest')).toBe(true);
    // The standalone replacement char between "Suggest" markup and "the system"
    // must not be present.
    expect(/Suggest<\/strong>\s*\uFFFD\s*the system proposes/.test(en)).toBe(false);
  });

  it('attribute-position corruption is absent inside <title>, aria-label, and alt', () => {
    // Requirement 1.3 covers titles, aria-label, and alt attributes. Assert no
    // U+FFFD survives inside any such attribute/element across affected files.
    const titleRe = /<title>[^<]*\uFFFD[^<]*<\/title>/;
    const ariaRe = /aria-label="[^"]*\uFFFD[^"]*"/;
    const altRe = /alt="[^"]*\uFFFD[^"]*"/;

    for (const rel of EXPECTED_AFFECTED) {
      const text = read(rel);
      expect(titleRe.test(text)).toBe(false);
      expect(ariaRe.test(text)).toBe(false);
      expect(altRe.test(text)).toBe(false);
    }
  });
});
