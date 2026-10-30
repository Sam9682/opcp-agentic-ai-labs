/**
 * Bold-markup property tests for the fundamentals quiz pages.
 *
 * Feature: bold-quiz-questions (feature)
 *
 * This suite verifies the five correctness properties from the design document
 * over the two static quiz pages:
 *
 *   - skillhub/en/quiz-fundamentals.html (EN_Quiz_Page)
 *   - skillhub/fr/quiz-fundamentals.html (FR_Quiz_Page)
 *
 * The "input space" is the fixed set of 15 `<li class="quiz-question">` blocks
 * per page, so each property is expressed as a universally quantified assertion
 * over every legend / label parsed from the shipped documents.
 *
 * Methodology: the real HTML is read from disk and parsed with the suite's DOM
 * parser (jsdom's `DOMParser`, available under the `jsdom` test environment set
 * in vitest.config.js). Assertions are coupled to the shipped pages rather than
 * a re-render, matching the DOM-parse convention used by
 * index-page-runtime.integration.test.js.
 *
 * Task 4.1 (this file): scaffolding — imports, DOM parsing of both pages, and
 * collection of every quiz-question legend and label. Tasks 4.2-4.6 add the
 * property assertions (Properties 1-5) on top of the collected structures.
 *
 * Validates: Requirements 1.1, 2.1
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLHUB_ROOT = path.resolve(__dirname, '..');

/** The two quiz pages under test, keyed by locale. */
const QUIZ_PAGES = {
  en: path.resolve(SKILLHUB_ROOT, 'en', 'quiz-fundamentals.html'),
  fr: path.resolve(SKILLHUB_ROOT, 'fr', 'quiz-fundamentals.html'),
};

/**
 * Read a quiz page's raw HTML source from disk.
 *
 * @param {'en'|'fr'} locale
 * @returns {string} the full HTML source
 */
function readQuizPage(locale) {
  return fs.readFileSync(QUIZ_PAGES[locale], 'utf8');
}

/**
 * Parse a quiz page into a DOM `Document` using the suite's DOM parser.
 *
 * jsdom supplies a global `DOMParser` under the `jsdom` test environment, so
 * the authored markup — including each legend's nested `<strong>` / `<code>`
 * elements — is parsed exactly as a browser would, giving the property tests a
 * real element tree to walk.
 *
 * @param {'en'|'fr'} locale
 * @returns {Document} the parsed document
 */
function parseQuizPage(locale) {
  return new DOMParser().parseFromString(readQuizPage(locale), 'text/html');
}

/**
 * Collect every `<li class="quiz-question">` legend and the fieldset's answer
 * labels from a parsed page, in document order.
 *
 * Each returned entry pairs a question's `<legend>` element with the list of
 * `<label>` elements inside the same `<fieldset>`, so the property tests can
 * reason about the question sentence and its answer options together.
 *
 * @param {'en'|'fr'} locale
 * @returns {{
 *   locale: 'en'|'fr',
 *   doc: Document,
 *   questions: Array<{ index: number, legend: Element, labels: Element[] }>,
 *   legends: Element[],
 *   labels: Element[],
 * }}
 */
function collectQuiz(locale) {
  const doc = parseQuizPage(locale);
  const items = Array.from(doc.querySelectorAll('li.quiz-question'));

  const questions = items.map((li, index) => {
    const legend = li.querySelector('fieldset > legend');
    const labels = Array.from(li.querySelectorAll('fieldset label'));
    return { index, legend, labels };
  });

  const legends = questions.map((q) => q.legend);
  const labels = questions.flatMap((q) => q.labels);

  return { locale, doc, questions, legends, labels };
}

/**
 * Parsed structures for both pages, built once and shared by the property
 * suites that tasks 4.2-4.6 add. Each page is expected to ship 15 quiz
 * questions.
 */
const QUIZZES = {
  en: collectQuiz('en'),
  fr: collectQuiz('fr'),
};

describe('bold-quiz-questions — Task 4.1 scaffolding: DOM-parse both quiz pages', () => {
  // Feature: bold-quiz-questions. This scaffolding confirms both pages parse and
  // that every quiz-question legend and label is collected, establishing the
  // fixed 15-legends-per-page input space the property tests (4.2-4.6) quantify
  // over. **Validates: Requirements 1.1, 2.1**

  it.each(['en', 'fr'])(
    'parses the %s quiz page and collects a legend + labels for all 15 questions',
    (locale) => {
      const { questions, legends, labels } = QUIZZES[locale];

      // The fixed input space: 15 quiz questions per page.
      expect(questions.length).toBe(15);

      // Every question yields a non-null legend and at least one answer label,
      // so the 4.2-4.6 properties always have real elements to assert over.
      for (const { index, legend, labels: optionLabels } of questions) {
        expect(legend, `missing <legend> for ${locale} question #${index + 1}`).not.toBeNull();
        expect(
          optionLabels.length,
          `${locale} question #${index + 1} has no answer labels`,
        ).toBeGreaterThan(0);
      }

      // The flattened collections are non-empty and consistent with the
      // per-question grouping.
      expect(legends.length).toBe(15);
      expect(legends.every((l) => l !== null)).toBe(true);
      expect(labels.length).toBeGreaterThanOrEqual(15);
    },
  );
});

/**
 * Collapse runs of whitespace and trim, so comparisons ignore incidental
 * formatting (newlines / indentation) that the parser preserves in text nodes.
 *
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

describe('bold-quiz-questions — Property 1: every EN question sentence is fully bold', () => {
  // Feature: bold-quiz-questions. Universally quantified over every one of the
  // 15 EN_Quiz_Page legends: the full Question_Sentence must live inside a
  // single <strong> (Bold_Markup), leaving no question text at normal weight
  // outside it. The input space is the fixed set of legends parsed from the
  // shipped EN page. **Validates: Requirements 1.1, 3.1**

  const { legends } = QUIZZES.en;

  it('collects all 15 EN legends to quantify over', () => {
    expect(legends.length).toBe(15);
  });

  it.each(legends.map((legend, index) => [index + 1, legend]))(
    'EN question #%d wraps its entire sentence in exactly one <strong> with no text outside it',
    (_questionNumber, legend) => {
      // Exactly one Bold_Markup element carries the Question_Sentence.
      const strongs = Array.from(legend.querySelectorAll('strong'));
      expect(strongs.length).toBe(1);

      const [strong] = strongs;

      // The <strong> actually carries the question text.
      const boldText = normalizeText(strong.textContent);
      expect(boldText.length).toBeGreaterThan(0);

      // No question text remains outside the <strong>: once the single
      // Bold_Markup element is removed, the legend has no leftover text.
      const whole = normalizeText(legend.textContent);
      const outside = normalizeText(whole.replace(boldText, ''));
      expect(outside).toBe('');

      // Equivalently, the legend's full text equals the bolded text, so the
      // entire Question_Sentence is bold.
      expect(whole).toBe(boldText);
    },
  );
});

describe('bold-quiz-questions — Property 2: every FR question sentence is bold with its number prefix at normal weight', () => {
  // Feature: bold-quiz-questions. Universally quantified over every one of the
  // 15 FR_Quiz_Page legends: the Question_Sentence that follows the
  // Number_Prefix (e.g. "1. ") must live inside a single <strong> (Bold_Markup),
  // while the Number_Prefix itself sits OUTSIDE the <strong> at normal weight.
  // The input space is the fixed set of legends parsed from the shipped FR page.
  // **Validates: Requirements 2.1, 2.2, 3.1**

  const { legends } = QUIZZES.fr;

  // Matches the leading ordinal label, e.g. "1. " / "15. ", at the start of a
  // legend's text — the Number_Prefix that must stay at normal weight.
  const NUMBER_PREFIX = /^\d+\.\s/;

  it('collects all 15 FR legends to quantify over', () => {
    expect(legends.length).toBe(15);
  });

  it.each(legends.map((legend, index) => [index + 1, legend]))(
    'FR question #%d bolds only the sentence after its number prefix, leaving the prefix outside <strong>',
    (_questionNumber, legend) => {
      // Exactly one Bold_Markup element carries the Question_Sentence.
      const strongs = Array.from(legend.querySelectorAll('strong'));
      expect(strongs.length).toBe(1);

      const [strong] = strongs;

      // The <strong> carries the question sentence.
      const boldText = normalizeText(strong.textContent);
      expect(boldText.length).toBeGreaterThan(0);

      // The legend as a whole begins with a Number_Prefix (e.g. "1. ").
      const whole = normalizeText(legend.textContent);
      expect(whole).toMatch(NUMBER_PREFIX);

      // The Number_Prefix sits OUTSIDE the <strong>: the bolded text must not
      // itself start with the ordinal label.
      expect(boldText).not.toMatch(NUMBER_PREFIX);

      // Everything outside the single <strong> is exactly the Number_Prefix —
      // once the bolded sentence is removed, only the prefix text remains, and
      // it matches the ordinal-label shape.
      const outside = normalizeText(whole.replace(boldText, ''));
      expect(outside.length).toBeGreaterThan(0);
      expect(`${outside} `).toMatch(NUMBER_PREFIX);

      // The legend is exactly the Number_Prefix followed by the bolded
      // Question_Sentence, so no question text leaks outside the Bold_Markup.
      expect(whole).toBe(normalizeText(`${outside} ${boldText}`));
    },
  );
});

describe('bold-quiz-questions — Property 3: answer option labels are never bold', () => {
  // Feature: bold-quiz-questions. Universally quantified over every <label>
  // answer option on BOTH the EN_Quiz_Page and FR_Quiz_Page: no Bold_Markup
  // (<strong>) may wrap a label's text. Only the Question_Sentence legends are
  // bolded; the answer options must stay at normal weight. The input space is
  // the fixed set of labels parsed from the two shipped pages.
  // **Validates: Requirements 1.3, 2.4**

  const labelCases = ['en', 'fr'].flatMap((locale) =>
    QUIZZES[locale].labels.map((label, index) => [locale, index + 1, label]),
  );

  it('collects answer labels from both pages to quantify over', () => {
    expect(QUIZZES.en.labels.length).toBeGreaterThanOrEqual(15);
    expect(QUIZZES.fr.labels.length).toBeGreaterThanOrEqual(15);
    expect(labelCases.length).toBe(
      QUIZZES.en.labels.length + QUIZZES.fr.labels.length,
    );
  });

  it.each(labelCases)(
    '%s answer label #%d contains no <strong> and has no bolded text',
    (_locale, _labelNumber, label) => {
      // No Bold_Markup element appears anywhere inside the answer option.
      const strongs = Array.from(label.querySelectorAll('strong'));
      expect(strongs.length).toBe(0);

      // The label still carries real option text at normal weight, confirming
      // we are asserting over a genuine answer option rather than an empty node.
      expect(normalizeText(label.textContent).length).toBeGreaterThan(0);
    },
  );
});

/**
 * Extract the raw HTML source of every `<li class="quiz-question">` legend from
 * a page's on-disk source, in document order.
 *
 * This walks the raw string (not the parsed, auto-corrected DOM) so Property 4
 * can judge the markup actually shipped: a browser-leniently repaired tree
 * would hide an unbalanced or mis-nested tag that the raw bytes contain.
 *
 * @param {'en'|'fr'} locale
 * @returns {string[]} one raw `<legend>…</legend>` substring per quiz question
 */
function rawLegends(locale) {
  const html = readQuizPage(locale);
  return Array.from(html.matchAll(/<legend\b[^>]*>[\s\S]*?<\/legend>/gi)).map(
    (m) => m[0],
  );
}

/**
 * Walk a raw HTML fragment and return its tag stack history, so a property can
 * assert that every tag is explicitly opened and closed in last-in-first-out
 * order (well-formed, properly nested markup — no overlap, no stray close).
 *
 * Self-closing / void tags (e.g. `<input>`) are ignored for balance purposes;
 * the quiz legends under test contain only `<strong>` and `<code>` container
 * tags, which must nest cleanly.
 *
 * @param {string} fragment raw HTML
 * @returns {{ balanced: boolean, maxDepthOk: boolean, leftOpen: string[] }}
 */
function analyzeNesting(fragment) {
  const VOID = new Set([
    'input', 'br', 'img', 'hr', 'meta', 'link', 'area', 'base', 'col',
    'embed', 'param', 'source', 'track', 'wbr',
  ]);
  const stack = [];
  let balanced = true;
  const tagRe = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)\s*>/g;
  let match;
  while ((match = tagRe.exec(fragment)) !== null) {
    const isClose = match[1] === '/';
    const name = match[2].toLowerCase();
    const selfClosed = match[3] === '/';
    if (VOID.has(name) || selfClosed) continue;
    if (isClose) {
      if (stack.length === 0 || stack[stack.length - 1] !== name) {
        balanced = false; // stray or mis-nested closing tag
        break;
      }
      stack.pop();
    } else {
      stack.push(name);
    }
  }
  return { balanced: balanced && stack.length === 0, leftOpen: stack };
}

describe('bold-quiz-questions — Property 4: bold markup preserves valid, well-formed HTML', () => {
  // Feature: bold-quiz-questions. Universally quantified over every one of the
  // 15 legends on BOTH the EN_Quiz_Page and FR_Quiz_Page: after Bold_Markup is
  // applied, each legend's raw markup must parse with balanced, properly nested
  // tags, and every <strong> / <code> element must be well-formed and closed.
  // The input space is the fixed set of legends read from the two shipped
  // documents' raw source. **Validates: Requirements 3.2**

  const rawLegendCases = ['en', 'fr'].flatMap((locale) =>
    rawLegends(locale).map((raw, index) => [locale, index + 1, raw]),
  );

  it('reads 15 raw legends from each shipped page to quantify over', () => {
    expect(rawLegends('en').length).toBe(15);
    expect(rawLegends('fr').length).toBe(15);
    expect(rawLegendCases.length).toBe(30);
  });

  it.each(rawLegendCases)(
    '%s legend #%d is balanced and properly nested with closed <strong>/<code>',
    (_locale, _n, raw) => {
      // Tags open and close in LIFO order with nothing left dangling, so the
      // Bold_Markup (and any nested Inline_Code_Fragment) is well-formed.
      const { balanced, leftOpen } = analyzeNesting(raw);
      expect(leftOpen).toEqual([]);
      expect(balanced).toBe(true);

      // Explicit tag-count balance: every <strong> and <code> has a matching
      // closing tag in the raw source (no self-repair by the parser masking a
      // missing close).
      const opens = (re) => (raw.match(re) || []).length;
      expect(opens(/<strong\b[^>]*>/gi)).toBe(opens(/<\/strong>/gi));
      expect(opens(/<code\b[^>]*>/gi)).toBe(opens(/<\/code>/gi));

      // The legend carries exactly one Bold_Markup element.
      expect(opens(/<strong\b[^>]*>/gi)).toBe(1);
    },
  );

  it.each(['en', 'fr'])(
    '%s page: parsing is lossless — each legend round-trips to balanced DOM-serialized markup',
    (locale) => {
      const { legends } = QUIZZES[locale];
      expect(legends.length).toBe(15);

      for (const [index, legend] of legends.entries()) {
        // jsdom serializes a well-formed, auto-closed tree. Re-analyzing the
        // serialized innerHTML confirms the parsed tree itself is balanced and
        // properly nested (no implicitly dropped or re-ordered tags).
        const { balanced, leftOpen } = analyzeNesting(legend.innerHTML);
        expect(
          leftOpen,
          `${locale} legend #${index + 1} left tags open after serialization`,
        ).toEqual([]);
        expect(balanced).toBe(true);

        // Every <code> fragment sits inside the legend's single <strong>, so
        // the well-formed tree also nests Inline_Code_Fragment within
        // Bold_Markup rather than beside it.
        const strong = legend.querySelector('strong');
        expect(strong).not.toBeNull();
        for (const code of legend.querySelectorAll('code')) {
          expect(strong.contains(code)).toBe(true);
        }
      }
    },
  );
});

describe('bold-quiz-questions — Property 5: inline code fragments remain inside the bold markup', () => {
  // Feature: bold-quiz-questions. Universally quantified over every legend on
  // BOTH the EN_Quiz_Page and FR_Quiz_Page that contains an Inline_Code_Fragment
  // (<code>): each such <code> must be nested within that legend's single
  // <strong> (Bold_Markup), never beside it at normal weight. The input space is
  // the fixed set of legends parsed from the two shipped pages; only the single
  // <code>-bearing legend per page exercises the property, so two concrete
  // example assertions additionally pin that legend (question 15 on each page).
  // **Validates: Requirements 1.2, 2.3**

  const codeLegendCases = ['en', 'fr'].flatMap((locale) =>
    QUIZZES[locale].legends
      .map((legend, index) => ({ locale, questionNumber: index + 1, legend }))
      .filter(({ legend }) => legend.querySelectorAll('code').length > 0)
      .map(({ locale: loc, questionNumber, legend }) => [loc, questionNumber, legend]),
  );

  it('finds exactly one <code>-bearing legend on each page to quantify over', () => {
    // The feature's Inline_Code_Fragment lives in a single legend per page
    // (question 15 referencing enabled_tools / ["*"]), so the property's input
    // space is one legend on EN and one on FR.
    const byLocale = (loc) => codeLegendCases.filter(([l]) => l === loc);
    expect(byLocale('en').length).toBe(1);
    expect(byLocale('fr').length).toBe(1);
    expect(codeLegendCases.length).toBe(2);
  });

  it.each(codeLegendCases)(
    '%s question #%d keeps every <code> fragment nested inside its <strong>',
    (_locale, _questionNumber, legend) => {
      // The legend carries exactly one Bold_Markup element.
      const strongs = Array.from(legend.querySelectorAll('strong'));
      expect(strongs.length).toBe(1);
      const [strong] = strongs;

      // There is at least one Inline_Code_Fragment to assert over.
      const codes = Array.from(legend.querySelectorAll('code'));
      expect(codes.length).toBeGreaterThan(0);

      // Every <code> fragment is nested within the legend's <strong>, so the
      // inline code renders bold alongside the surrounding Question_Sentence
      // rather than sitting outside the Bold_Markup.
      for (const code of codes) {
        expect(strong.contains(code)).toBe(true);
      }

      // Equivalently, the <strong> subtree contains the full set of the
      // legend's <code> fragments — none leaked outside the Bold_Markup.
      const codesInStrong = Array.from(strong.querySelectorAll('code'));
      expect(codesInStrong.length).toBe(codes.length);
    },
  );

  it('EN question 15 nests its enabled_tools / ["*"] <code> fragments inside the <strong>', () => {
    // Concrete example pinning the single <code>-bearing EN legend.
    const legend = QUIZZES.en.legends[14];
    expect(legend).not.toBeNull();

    const strong = legend.querySelector('strong');
    expect(strong).not.toBeNull();

    const codes = Array.from(legend.querySelectorAll('code'));
    // The two expected Inline_Code_Fragments: `enabled_tools` and `["*"]`.
    expect(codes.length).toBe(2);
    expect(codes.map((c) => normalizeText(c.textContent))).toEqual([
      'enabled_tools',
      '["*"]',
    ]);

    // Both fragments sit inside the Bold_Markup.
    for (const code of codes) {
      expect(strong.contains(code)).toBe(true);
    }
  });

  it('FR question 15 nests its enabled_tools / ["*"] <code> fragments inside the <strong>', () => {
    // Concrete example pinning the single <code>-bearing FR legend. The leading
    // Number_Prefix ("15. ") stays outside the <strong>, but both <code>
    // fragments of the Question_Sentence remain inside it.
    const legend = QUIZZES.fr.legends[14];
    expect(legend).not.toBeNull();

    const strong = legend.querySelector('strong');
    expect(strong).not.toBeNull();

    const codes = Array.from(legend.querySelectorAll('code'));
    // The two expected Inline_Code_Fragments: `enabled_tools` and `["*"]`.
    expect(codes.length).toBe(2);
    expect(codes.map((c) => normalizeText(c.textContent))).toEqual([
      'enabled_tools',
      '["*"]',
    ]);

    // Both fragments sit inside the Bold_Markup.
    for (const code of codes) {
      expect(strong.contains(code)).toBe(true);
    }
  });
});

// Shared helpers and parsed structures for the property suites added by tasks
// 4.2-4.6.
export { QUIZ_PAGES, QUIZZES, readQuizPage, parseQuizPage, collectQuiz, normalizeText };
