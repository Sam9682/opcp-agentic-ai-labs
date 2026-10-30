/**
 * Bank↔page synchronization property tests for the fundamentals quiz.
 *
 * Feature: quiz-distractor-refinement (feature) — Task 6.2.
 *
 * This suite verifies three of the design's correctness properties over the
 * three synchronized sources:
 *
 *   - Quiz_Bank     — QUIZ_QUESTIONS in skillhub/js/quiz-questions.js
 *   - EN_Quiz_Page  — skillhub/en/quiz-fundamentals.html
 *   - FR_Quiz_Page  — skillhub/fr/quiz-fundamentals.html
 *
 * The `(question id, option index)` pair is the join key binding all three
 * sources. Every artifact exposes the question id via each radio input's `name`
 * attribute and the option index via each radio input's `value` attribute, so
 * the pages are joined to the bank by reading `name`/`value` directly — exactly
 * how quiz.js reads answers. This works uniformly on both pages: the EN page
 * labels carry class `quiz-option` and the FR page labels carry no class, but
 * the radio `name`/`value` keys are identical on both.
 *
 * The input space is the fixed 15-question × 3-option grid (45 cells per page),
 * so each property is checked exhaustively over that finite grid rather than
 * with a randomized generator.
 *
 * Methodology mirrors bold-quiz-questions.property.test.js: the real HTML is
 * read from disk and parsed with jsdom's `DOMParser` (available under the
 * `jsdom` test environment set in vitest.config.js), QUIZ_QUESTIONS is imported
 * directly, and a `normalizeText` helper collapses `\s+` and trims before every
 * comparison.
 *
 * Properties covered:
 *   - Property 4: Bank and EN page option text are identical.
 *   - Property 5: Bank and FR page option text are identical.
 *   - Property 1: Three-option shape preserved.
 *
 * Validates: Requirements 1.1, 1.4, 3.1, 3.3, 3.4
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { QUIZ_QUESTIONS } from '../js/quiz-questions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLHUB_ROOT = path.resolve(__dirname, '..');

/** The two shipped quiz pages under test, keyed by locale. */
const QUIZ_PAGES = {
  en: path.resolve(SKILLHUB_ROOT, 'en', 'quiz-fundamentals.html'),
  fr: path.resolve(SKILLHUB_ROOT, 'fr', 'quiz-fundamentals.html'),
};

/**
 * Collapse runs of whitespace and trim, so comparisons ignore incidental
 * formatting (newlines / indentation and the leading space before a label's
 * option text) that the parser preserves in text nodes.
 *
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

/**
 * Parse a shipped quiz page from disk into a DOM `Document`.
 *
 * @param {'en'|'fr'} locale
 * @returns {Document}
 */
function parseQuizPage(locale) {
  const html = fs.readFileSync(QUIZ_PAGES[locale], 'utf8');
  return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * Build a `(id, index) -> option text` map for a parsed page by joining on each
 * answer label's radio input `name` (question id) and `value` (option index).
 *
 * The option text is the label's text content with the leading radio `<input>`
 * excluded. The `<input>` is a void element and contributes no text, so the
 * label's `textContent` is exactly the trailing option text (plus the leading
 * space the authored markup keeps before it), which `normalizeText` cleans up.
 * This keying is identical on both pages — the EN labels' `quiz-option` class
 * and the FR `<li>`'s `data-question-id` are never relied upon.
 *
 * @param {'en'|'fr'} locale
 * @returns {{
 *   labelTextByKey: Map<string, string>,
 *   optionCountById: Map<string, number>,
 *   fieldsets: Array<{ id: string, radioCount: number, labelCount: number }>,
 * }}
 */
function indexPageOptions(locale) {
  const doc = parseQuizPage(locale);
  const items = Array.from(doc.querySelectorAll('li.quiz-question'));

  const labelTextByKey = new Map();
  const optionCountById = new Map();
  const fieldsets = [];

  for (const li of items) {
    const labels = Array.from(li.querySelectorAll('fieldset label'));
    const radios = Array.from(
      li.querySelectorAll('fieldset input[type="radio"]'),
    );

    // Every radio in a fieldset shares the same question id via `name`.
    const names = new Set(radios.map((r) => r.getAttribute('name')));
    const id = radios.length > 0 ? radios[0].getAttribute('name') : null;

    fieldsets.push({
      id,
      radioCount: radios.length,
      labelCount: labels.length,
      // Exposed so a property can assert all radios in a fieldset agree on id.
      uniqueNameCount: names.size,
    });

    if (id !== null) {
      optionCountById.set(id, labels.length);
    }

    for (const label of labels) {
      const input = label.querySelector('input[type="radio"]');
      if (!input) continue;
      const name = input.getAttribute('name');
      const value = input.getAttribute('value');
      const key = `${name}::${value}`;
      labelTextByKey.set(key, normalizeText(label.textContent));
    }
  }

  return { labelTextByKey, optionCountById, fieldsets };
}

/** Parsed page option indexes, built once and shared across the suites. */
const PAGES = {
  en: indexPageOptions('en'),
  fr: indexPageOptions('fr'),
};

/**
 * The exhaustive `(question id, option index, locale-text)` grid derived from
 * the bank: one row per bank option, carrying the id, the index, and the bank's
 * normalized EN/FR text. This is the fixed 15 × 3 input space the bank↔page
 * equality properties quantify over.
 */
const BANK_CELLS = QUIZ_QUESTIONS.flatMap((q) =>
  q.options.map((opt, index) => ({
    id: q.id,
    index,
    en: normalizeText(opt.text.en),
    fr: normalizeText(opt.text.fr),
  })),
);

describe('quiz-distractor-refinement — Property 1: three-option shape preserved', () => {
  // Feature: quiz-distractor-refinement. Universally quantified over every bank
  // question and every fieldset on BOTH pages: the number of options is exactly
  // three — bank `options.length === 3`, and each page fieldset has exactly
  // three radio inputs and three answer labels. The input space is the fixed
  // set of 15 questions in the bank and the 15 fieldsets on each shipped page.
  // **Validates: Requirements 1.1, 1.4**

  it('the bank ships exactly 15 questions to quantify over', () => {
    expect(QUIZ_QUESTIONS.length).toBe(15);
  });

  it.each(QUIZ_QUESTIONS.map((q, i) => [i + 1, q.id, q]))(
    'bank question #%d (%s) has exactly three options',
    (_n, _id, question) => {
      expect(question.options.length).toBe(3);
    },
  );

  it.each(['en', 'fr'])(
    '%s page ships 15 fieldsets, each with exactly three radio inputs and three labels',
    (locale) => {
      const { fieldsets } = PAGES[locale];

      // The fixed input space: 15 question fieldsets per page.
      expect(fieldsets.length).toBe(15);

      for (const fs_ of fieldsets) {
        expect(
          fs_.radioCount,
          `${locale} fieldset "${fs_.id}" should have 3 radio inputs`,
        ).toBe(3);
        expect(
          fs_.labelCount,
          `${locale} fieldset "${fs_.id}" should have 3 answer labels`,
        ).toBe(3);
        // All three radios in a fieldset expose the same question id via `name`.
        expect(
          fs_.uniqueNameCount,
          `${locale} fieldset "${fs_.id}" radios disagree on name`,
        ).toBe(1);
      }
    },
  );
});

describe('quiz-distractor-refinement — Property 4: bank and EN page option text are identical', () => {
  // Feature: quiz-distractor-refinement. Universally quantified over all 15
  // questions and all option indices 0..2: the normalized English text of the
  // bank option at (id, i) equals the normalized text of the EN_Quiz_Page answer
  // label joined at the same (radio name = id, radio value = i). The join reads
  // the radio `name`/`value` directly, so it is independent of the EN labels'
  // `quiz-option` class. The input space is the exhaustive 15 × 3 bank grid.
  // **Validates: Requirements 3.1, 3.3**

  it('the EN page exposes an option label for every one of the 45 bank cells', () => {
    const { labelTextByKey } = PAGES.en;
    for (const { id, index } of BANK_CELLS) {
      expect(
        labelTextByKey.has(`${id}::${index}`),
        `EN page missing label for (${id}, ${index})`,
      ).toBe(true);
    }
  });

  it.each(BANK_CELLS.map((c) => [c.id, c.index, c]))(
    'EN (%s, option %d): bank text equals the EN page label text',
    (id, index, cell) => {
      const pageText = PAGES.en.labelTextByKey.get(`${id}::${index}`);
      expect(pageText).toBe(cell.en);
    },
  );
});

describe('quiz-distractor-refinement — Property 5: bank and FR page option text are identical', () => {
  // Feature: quiz-distractor-refinement. Universally quantified over all 15
  // questions and all option indices 0..2: the normalized French text of the
  // bank option at (id, i) equals the normalized text of the FR_Quiz_Page answer
  // label joined at the same (radio name = id, radio value = i). The join reads
  // the radio `name`/`value` directly, so it works uniformly even though the FR
  // labels carry no class (and ignores the FR `<li>`'s data-question-id). The
  // input space is the exhaustive 15 × 3 bank grid.
  // **Validates: Requirements 3.1, 3.4**

  it('the FR page exposes an option label for every one of the 45 bank cells', () => {
    const { labelTextByKey } = PAGES.fr;
    for (const { id, index } of BANK_CELLS) {
      expect(
        labelTextByKey.has(`${id}::${index}`),
        `FR page missing label for (${id}, ${index})`,
      ).toBe(true);
    }
  });

  it.each(BANK_CELLS.map((c) => [c.id, c.index, c]))(
    'FR (%s, option %d): bank text equals the FR page label text',
    (id, index, cell) => {
      const pageText = PAGES.fr.labelTextByKey.get(`${id}::${index}`);
      expect(pageText).toBe(cell.fr);
    },
  );
});
