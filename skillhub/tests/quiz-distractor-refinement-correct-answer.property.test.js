/**
 * Correct-answer preservation property tests for the quiz-distractor-refinement
 * feature.
 *
 * Feature: quiz-distractor-refinement
 *
 * The refinement rewrites only the two distractor options of each Section I
 * quiz question; the correct option — its index, ordering, and EN/FR text —
 * must stay frozen at the pre-refinement baseline. This suite proves that
 * invariant over the three synchronized sources:
 *
 *   - the bilingual bank  : skillhub/js/quiz-questions.js (QUIZ_QUESTIONS)
 *   - the English page     : skillhub/en/quiz-fundamentals.html
 *   - the French page      : skillhub/fr/quiz-fundamentals.html
 *
 * The "input space" is the fixed 15-question × 3-option grid, checked
 * exhaustively. The shipped pages are read from disk and parsed with the
 * suite's DOM parser (jsdom's `DOMParser`, available under the `jsdom` test
 * environment set in vitest.config.js), matching the convention used by
 * bold-quiz-questions.property.test.js. The frozen baseline comes from the
 * Task 1 fixture at skillhub/tests/fixtures/quiz-correct-baseline.json.
 *
 * Task 6.1 (this file):
 *   - Property 2 — Correct answer position and ordering invariant: the bank's
 *     `correctIndex` equals the baseline, and on BOTH pages the radio `value`
 *     attributes, read in document order, are exactly `0, 1, 2`.
 *   - Property 3 — Correct answer text invariant: the bank option at
 *     `correctIndex` has `text.en` / `text.fr` identical to the baseline
 *     correct text per locale.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { QUIZ_QUESTIONS } from '../js/quiz-questions.js';
import baseline from './fixtures/quiz-correct-baseline.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLHUB_ROOT = path.resolve(__dirname, '..');

/** The two quiz pages under test, keyed by locale. */
const QUIZ_PAGES = {
  en: path.resolve(SKILLHUB_ROOT, 'en', 'quiz-fundamentals.html'),
  fr: path.resolve(SKILLHUB_ROOT, 'fr', 'quiz-fundamentals.html'),
};

/** The fixed grid dimensions for the Section I quiz. */
const QUESTION_COUNT = 15;
const OPTION_COUNT = 3;

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
 * the authored markup — including each question's radio inputs — is parsed
 * exactly as a browser would.
 *
 * @param {'en'|'fr'} locale
 * @returns {Document} the parsed document
 */
function parseQuizPage(locale) {
  return new DOMParser().parseFromString(readQuizPage(locale), 'text/html');
}

/**
 * Collect every `<li class="quiz-question">` fieldset from a parsed page, in
 * document order, pairing each question's radio `name` (the question id) with
 * the ordered list of radio `value` attributes inside its fieldset.
 *
 * @param {'en'|'fr'} locale
 * @returns {Array<{ index: number, name: string, values: string[] }>}
 */
function collectPageQuestions(locale) {
  const doc = parseQuizPage(locale);
  const items = Array.from(doc.querySelectorAll('li.quiz-question'));

  return items.map((li, index) => {
    const radios = Array.from(
      li.querySelectorAll('fieldset input[type="radio"]'),
    );
    const names = radios.map((r) => r.getAttribute('name'));
    // All radios in a fieldset share one name (the question id).
    const name = names[0];
    const values = radios.map((r) => r.getAttribute('value'));
    return { index, name, values };
  });
}

/** Parsed page structures, built once and shared across the property suites. */
const PAGES = {
  en: collectPageQuestions('en'),
  fr: collectPageQuestions('fr'),
};

describe('quiz-distractor-refinement — Property 2: correct answer position and ordering invariant', () => {
  // Feature: quiz-distractor-refinement. Universally quantified over the fixed
  // 15-question grid: the bank's `correctIndex` for each question must equal the
  // frozen baseline (the correct option never moved), and on BOTH the EN and FR
  // pages the radio `value` attributes — read in document order — must be
  // exactly `0, 1, 2` (option ordering preserved, three options per question).
  // The input space is the full 15×3 grid read from the bank and the two
  // shipped pages. **Validates: Requirements 2.1, 2.2, 2.4, 2.5**

  it('the bank, baseline, and both pages all carry exactly 15 questions', () => {
    expect(QUIZ_QUESTIONS.length).toBe(QUESTION_COUNT);
    expect(baseline.questions.length).toBe(QUESTION_COUNT);
    expect(PAGES.en.length).toBe(QUESTION_COUNT);
    expect(PAGES.fr.length).toBe(QUESTION_COUNT);
  });

  it.each(QUIZ_QUESTIONS.map((q, index) => [index + 1, q.id, q]))(
    "bank question #%d (%s) keeps its baseline correctIndex",
    (questionNumber, id, question) => {
      const expected = baseline.questions[questionNumber - 1];

      // The bank question lines up with the baseline by id and position, so the
      // index comparison is anchored to the right question.
      expect(question.id).toBe(id);
      expect(expected.id).toBe(id);

      // The correct option never moved: bank correctIndex equals the baseline.
      expect(question.correctIndex).toBe(expected.correctIndex);

      // Equivalently, it matches the design's frozen correctIndex vector.
      expect(question.correctIndex).toBe(
        baseline.correctIndexVector[questionNumber - 1],
      );

      // The correctIndex still addresses one of the three preserved options.
      expect(question.options.length).toBe(OPTION_COUNT);
      expect(question.correctIndex).toBeGreaterThanOrEqual(0);
      expect(question.correctIndex).toBeLessThan(OPTION_COUNT);
    },
  );

  const pageOrderingCases = ['en', 'fr'].flatMap((locale) =>
    PAGES[locale].map((q, index) => [locale, index + 1, q]),
  );

  it.each(pageOrderingCases)(
    "%s page question #%d exposes radio values 0, 1, 2 in document order",
    (locale, questionNumber, pageQuestion) => {
      // The fieldset ships exactly three radio inputs, matching the bank's
      // three preserved options.
      expect(pageQuestion.values.length).toBe(OPTION_COUNT);

      // The option ordering is preserved: values are exactly 0, 1, 2 in
      // document order, so the correct option still sits at its baseline index.
      expect(pageQuestion.values).toEqual(['0', '1', '2']);

      // The radio name (question id) lines up with the bank in the same
      // document position, confirming the grid is joined correctly.
      expect(pageQuestion.name).toBe(QUIZ_QUESTIONS[questionNumber - 1].id);
    },
  );
});

describe('quiz-distractor-refinement — Property 3: correct answer text invariant', () => {
  // Feature: quiz-distractor-refinement. Universally quantified over the fixed
  // 15-question grid: the bank option sitting at each question's `correctIndex`
  // must carry EN/FR text identical to the frozen baseline correct text per
  // locale — the correct answer's wording never changed in either language,
  // only the two distractors were rewritten. The input space is the 15 correct
  // options read from the bank, compared against the Task 1 baseline fixture.
  // **Validates: Requirements 2.1, 2.3**

  it.each(QUIZ_QUESTIONS.map((q, index) => [index + 1, q.id, q]))(
    "bank question #%d (%s) preserves its baseline correct EN/FR text",
    (questionNumber, id, question) => {
      const expected = baseline.questions[questionNumber - 1];

      // Anchor the comparison to the matching baseline question.
      expect(question.id).toBe(id);
      expect(expected.id).toBe(id);

      // Read the option the bank currently marks correct.
      const correctOption = question.options[question.correctIndex];
      expect(correctOption, `missing correct option for ${id}`).toBeTruthy();

      // Its EN text is identical to the frozen baseline correct EN text.
      expect(normalizeText(correctOption.text.en)).toBe(
        normalizeText(expected.correctEn),
      );

      // Its FR text is identical to the frozen baseline correct FR text.
      expect(normalizeText(correctOption.text.fr)).toBe(
        normalizeText(expected.correctFr),
      );
    },
  );
});
