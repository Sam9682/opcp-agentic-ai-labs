/**
 * Radio-name and scoring-invariance property tests for the fundamentals quiz.
 *
 * Spec: quiz-distractor-refinement (feature) — Task 6.3.
 *
 * This suite verifies two correctness properties from the implementation plan
 * over the two shipped quiz pages and the shared scoring helpers:
 *
 *   - skillhub/en/quiz-fundamentals.html (EN_Quiz_Page)
 *   - skillhub/fr/quiz-fundamentals.html (FR_Quiz_Page)
 *   - skillhub/js/quiz.js  (scoreQuiz, evaluateQuestions)
 *   - skillhub/js/quiz-questions.js  (QUIZ_QUESTIONS)
 *
 * Property 6 (Radio name equals the question id): on BOTH pages, every radio
 * input's `name` attribute equals its question's `id`. Fieldsets are matched to
 * bank questions by document order; within each fieldset the three radios all
 * carry the same `name`, and that name equals `QUIZ_QUESTIONS[i].id`.
 *
 * Property 7 (Scoring is index-based and locale-independent): for any answer
 * vector, a question scores correct exactly when the selected index equals the
 * question's `correctIndex`. Because `quiz.js` compares option indices only and
 * never reads option text, the score and per-question verdicts are identical
 * regardless of which locale's option text is rendered — scoring EN vs FR over
 * the same bank and answer vector yields the same result.
 *
 * Methodology: the real HTML is read from disk and parsed with jsdom's
 * `DOMParser` (available under the `jsdom` test environment set in
 * vitest.config.js), matching the DOM-parse convention used by
 * `bold-quiz-questions.property.test.js`. Scoring is exercised directly against
 * the live `scoreQuiz` / `evaluateQuestions` helpers over fast-check-generated
 * answer vectors (minimum 100 iterations).
 *
 * This file is additive (Task 6.3): it does not modify any existing test file
 * or assertion, and uses a distinct filename from the Task 6.1/6.2 tests.
 *
 * Validates: Requirements 4.1, 4.2, 4.4, 5.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { scoreQuiz, evaluateQuestions, QUIZ_PASS_THRESHOLD } from '../js/quiz.js';
import { QUIZ_QUESTIONS } from '../js/quiz-questions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLHUB_ROOT = path.resolve(__dirname, '..');

/** The two quiz pages under test, keyed by locale. */
const QUIZ_PAGES = {
  en: path.resolve(SKILLHUB_ROOT, 'en', 'quiz-fundamentals.html'),
  fr: path.resolve(SKILLHUB_ROOT, 'fr', 'quiz-fundamentals.html'),
};

/** The fixed number of questions in the Section I bank. */
const QUIZ_TOTAL = 15;

/**
 * Parse a quiz page into a DOM `Document` using jsdom's `DOMParser`.
 *
 * @param {'en'|'fr'} locale
 * @returns {Document}
 */
function parseQuizPage(locale) {
  const html = fs.readFileSync(QUIZ_PAGES[locale], 'utf8');
  return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * Collect every `<li class="quiz-question">` fieldset's radio inputs from a
 * parsed page, in document order.
 *
 * @param {'en'|'fr'} locale
 * @returns {{
 *   locale: 'en'|'fr',
 *   fieldsets: Array<{ index: number, radios: HTMLInputElement[] }>,
 * }}
 */
function collectRadios(locale) {
  const doc = parseQuizPage(locale);
  const items = Array.from(doc.querySelectorAll('li.quiz-question'));
  const fieldsets = items.map((li, index) => {
    const radios = Array.from(
      li.querySelectorAll('fieldset input[type="radio"]'),
    );
    return { index, radios };
  });
  return { locale, fieldsets };
}

const RADIOS = {
  en: collectRadios('en'),
  fr: collectRadios('fr'),
};

describe('quiz-distractor-refinement — Property 6: radio name equals the question id', () => {
  // Feature: quiz-distractor-refinement (Task 6.3). Universally quantified over
  // every radio input on BOTH the EN_Quiz_Page and FR_Quiz_Page: matching each
  // fieldset to a bank question by document order, every radio's `name` equals
  // that question's `id`, and all three radios in a fieldset share that name.
  // The input space is the fixed 15 fieldsets × 3 radios per page.
  // **Validates: Requirements 4.1, 4.4, 5.4**

  it.each(['en', 'fr'])(
    'the %s page has 15 fieldsets, each with exactly 3 radios, matching the 15-question bank',
    (locale) => {
      const { fieldsets } = RADIOS[locale];
      expect(QUIZ_QUESTIONS.length).toBe(QUIZ_TOTAL);
      expect(fieldsets.length).toBe(QUIZ_TOTAL);
      for (const { index, radios } of fieldsets) {
        expect(
          radios.length,
          `${locale} question #${index + 1} should have 3 radios`,
        ).toBe(3);
      }
    },
  );

  const radioNameCases = ['en', 'fr'].flatMap((locale) =>
    RADIOS[locale].fieldsets.map((fs) => [locale, fs.index + 1, fs]),
  );

  it.each(radioNameCases)(
    '%s question #%d: every radio name equals the bank question id',
    (locale, questionNumber, fieldset) => {
      const question = QUIZ_QUESTIONS[fieldset.index];
      expect(question, `no bank question at index ${fieldset.index}`).toBeDefined();

      // The three radios share a single name (so the browser enforces one
      // selection per question) and that name is exactly the question's id.
      const names = fieldset.radios.map((r) => r.getAttribute('name'));
      for (const name of names) {
        expect(name).toBe(question.id);
      }

      // All radio names within the fieldset are identical.
      expect(new Set(names).size).toBe(1);
    },
  );

  it('radio names on the EN and FR pages agree, question-by-question, with the bank ids', () => {
    // Document-order join: the i-th fieldset on each page carries the i-th
    // bank question's id, so both locales render the same per-question grouping.
    for (let i = 0; i < QUIZ_TOTAL; i++) {
      const id = QUIZ_QUESTIONS[i].id;
      const enName = RADIOS.en.fieldsets[i].radios[0].getAttribute('name');
      const frName = RADIOS.fr.fieldsets[i].radios[0].getAttribute('name');
      expect(enName).toBe(id);
      expect(frName).toBe(id);
      expect(enName).toBe(frName);
    }
  });
});

describe('quiz-distractor-refinement — Property 7: scoring is index-based and locale-independent', () => {
  // Feature: quiz-distractor-refinement (Task 6.3). For any answer vector, a
  // question scores correct exactly when the selected index equals the bank's
  // `correctIndex`; `scoreQuiz` / `evaluateQuestions` read indices only, so the
  // score and per-question verdicts do not depend on which locale's option text
  // is shown. The input space is all length-15 answer vectors whose entries
  // range over valid indices (0..2) plus out-of-range / null values; the EN vs
  // FR independence is modeled by scoring the same vector against the same bank
  // (the only thing a locale changes is the rendered option text, which scoring
  // never consults). **Validates: Requirements 4.2, 4.4, 5.4**

  // Entries span valid indices 0..2 and representative invalid selections
  // (negative, out-of-range, null) so unanswered / malformed picks are exercised.
  const answerEntryArb = fc.oneof(
    fc.integer({ min: 0, max: 2 }),
    fc.constantFrom(-1, 3, 7, null),
  );
  const answerVectorArb = fc.array(answerEntryArb, {
    minLength: QUIZ_TOTAL,
    maxLength: QUIZ_TOTAL,
  });

  it('per-question correctness equals (answers[i] === correctIndex) across generated vectors', () => {
    fc.assert(
      fc.property(answerVectorArb, (answers) => {
        const verdicts = evaluateQuestions(QUIZ_QUESTIONS, answers);

        expect(verdicts.length).toBe(QUIZ_TOTAL);
        for (let i = 0; i < QUIZ_TOTAL; i++) {
          const expected = answers[i] === QUIZ_QUESTIONS[i].correctIndex;
          expect(verdicts[i]).toBe(expected);
        }

        // The score equals the count of true verdicts, over the full bank.
        const { score, total, passed } = scoreQuiz(QUIZ_QUESTIONS, answers);
        const expectedScore = verdicts.filter(Boolean).length;
        expect(score).toBe(expectedScore);
        expect(total).toBe(QUIZ_TOTAL);
        expect(passed).toBe(expectedScore >= QUIZ_PASS_THRESHOLD);
      }),
      { numRuns: 200 },
    );
  });

  it('scoring is locale-independent: EN and FR yield identical score/verdicts for the same vector', () => {
    // A locale only changes which option TEXT is displayed; the bank, ids,
    // indices, and correctIndex are shared. Scoring reads indices only, so
    // "score for the EN page" and "score for the FR page" are, by construction,
    // the same computation. We model this by scoring the same answer vector
    // against the same bank twice and asserting determinism + equality, and by
    // confirming the predicate never depends on any text field.
    fc.assert(
      fc.property(answerVectorArb, (answers) => {
        const enResult = scoreQuiz(QUIZ_QUESTIONS, answers);
        const frResult = scoreQuiz(QUIZ_QUESTIONS, answers);
        const enVerdicts = evaluateQuestions(QUIZ_QUESTIONS, answers);
        const frVerdicts = evaluateQuestions(QUIZ_QUESTIONS, answers);

        // Deterministic and identical regardless of the locale shown.
        expect(frResult).toEqual(enResult);
        expect(frVerdicts).toEqual(enVerdicts);

        // The verdict for each question matches the index predicate exactly —
        // the same predicate holds whichever locale's text is rendered.
        for (let i = 0; i < QUIZ_TOTAL; i++) {
          expect(enVerdicts[i]).toBe(
            answers[i] === QUIZ_QUESTIONS[i].correctIndex,
          );
        }
      }),
      { numRuns: 200 },
    );
  });

  it('a fully-correct answer vector passes; a fully-wrong one does not (concrete endpoints)', () => {
    const allCorrect = QUIZ_QUESTIONS.map((q) => q.correctIndex);
    const allWrong = QUIZ_QUESTIONS.map((q) => (q.correctIndex === 0 ? 1 : 0));

    const correctResult = scoreQuiz(QUIZ_QUESTIONS, allCorrect);
    expect(correctResult.score).toBe(QUIZ_TOTAL);
    expect(correctResult.passed).toBe(true);

    const wrongResult = scoreQuiz(QUIZ_QUESTIONS, allWrong);
    expect(wrongResult.score).toBe(0);
    expect(wrongResult.passed).toBe(false);

    // Verdicts align with the index predicate at both endpoints.
    expect(evaluateQuestions(QUIZ_QUESTIONS, allCorrect).every(Boolean)).toBe(true);
    expect(evaluateQuestions(QUIZ_QUESTIONS, allWrong).some(Boolean)).toBe(false);
  });

  it('option text is never consulted: scrambling option text leaves scoring unchanged', () => {
    // Build a bank clone whose option TEXT is replaced with locale-free
    // placeholders while ids, option counts, and correctIndex are preserved.
    // If scoring ever read text, this clone would score differently; it must
    // not. This directly demonstrates locale-independence by construction.
    const textFreeBank = QUIZ_QUESTIONS.map((q) => ({
      id: q.id,
      correctIndex: q.correctIndex,
      options: q.options.map(() => ({ text: { en: '', fr: '' } })),
    }));

    fc.assert(
      fc.property(answerVectorArb, (answers) => {
        expect(scoreQuiz(textFreeBank, answers)).toEqual(
          scoreQuiz(QUIZ_QUESTIONS, answers),
        );
        expect(evaluateQuestions(textFreeBank, answers)).toEqual(
          evaluateQuestions(QUIZ_QUESTIONS, answers),
        );
      }),
      { numRuns: 100 },
    );
  });
});
