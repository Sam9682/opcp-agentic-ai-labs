/**
 * SkillHub Section I quiz module.
 *
 * Pure scoring helpers plus (in a later task) the DOM wiring for the
 * fundamentals quiz. Mirrors the shape of `self-assessment.js`: small pure
 * functions that are easy to test, a localized result formatter, and a thin
 * `initQuiz` adapter (added in task 5.2) that binds them to the page.
 *
 * Scoring compares option indices only, so it is locale-independent by
 * construction: the same answer selection yields the same score in `en` and
 * `fr` (Requirement 4.6).
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

/**
 * The shared cross-locale slug for the quiz. Must equal the catalog entry slug
 * so a pass recorded in one locale is recognized in the other.
 *
 * @type {'quiz-fundamentals'}
 */
export const QUIZ_SLUG = 'quiz-fundamentals';

/**
 * Pass threshold: at least 12 correct answers (75% of 15).
 *
 * @type {number}
 */
export const QUIZ_PASS_THRESHOLD = 12;

/**
 * The number of questions in the fundamentals quiz.
 *
 * @type {number}
 */
export const QUIZ_TOTAL = 15;

/**
 * State class applied to a question block the learner answered correctly.
 *
 * @type {'quiz-question--correct'}
 */
const CORRECT_CLASS = 'quiz-question--correct';

/**
 * State class applied to a question block the learner answered incorrectly or
 * left unanswered.
 *
 * @type {'quiz-question--incorrect'}
 */
const INCORRECT_CLASS = 'quiz-question--incorrect';

/**
 * Score an answer vector against the question bank.
 *
 * Pure and locale-independent: an answer counts as correct only when its value
 * is strictly equal to the question's `correctIndex` (an index comparison, not
 * a text comparison). Any `null`, `undefined`, non-integer, or out-of-range
 * value is treated as incorrect, so unanswered questions never score. The
 * denominator is the number of questions, not the number of answers supplied,
 * so a short or padded answer vector still scores over every question.
 *
 * @param {import('./quiz-questions.js').QuizQuestion[]} questions - The question
 *   bank; each entry supplies the authoritative `correctIndex`.
 * @param {Array<number|null|undefined>} answers - Selected option index per
 *   question, positionally aligned with `questions`.
 * @returns {{ score: number, total: number, passed: boolean }}
 *   `score` is the count of positions whose answer equals the question's
 *   `correctIndex`; `total` is `questions.length`; `passed` is true iff
 *   `score >= QUIZ_PASS_THRESHOLD`.
 */
export function scoreQuiz(questions, answers) {
  const bank = Array.isArray(questions) ? questions : [];
  const picks = Array.isArray(answers) ? answers : [];
  const total = bank.length;

  let score = 0;
  for (let i = 0; i < total; i++) {
    const question = bank[i];
    if (!question) continue;

    const correctIndex = question.correctIndex;
    const answer = picks[i];

    if (
      typeof answer === 'number' &&
      Number.isInteger(answer) &&
      answer === correctIndex
    ) {
      score += 1;
    }
  }

  return {
    score,
    total,
    passed: score >= QUIZ_PASS_THRESHOLD,
  };
}

/**
 * Evaluate per-question correctness for an answer vector against the bank.
 *
 * Pure companion to {@link scoreQuiz} that reports the verdict for each
 * question instead of a count. A position is `true` only when its answer is a
 * number strictly equal to the question's `correctIndex` — the exact same
 * index predicate {@link scoreQuiz} applies — so it is locale-independent by
 * construction. Any `null`, `undefined`, non-integer, or out-of-range value is
 * `false`. The result is positionally aligned with `questions` and its length
 * always equals `questions.length`, regardless of how many answers are
 * supplied. By reusing the same predicate, the invariant
 * `evaluateQuestions(bank, answers).filter(Boolean).length === scoreQuiz(bank, answers).score`
 * holds.
 *
 * @param {import('./quiz-questions.js').QuizQuestion[]} questions - The question
 *   bank; each entry supplies the authoritative `correctIndex`.
 * @param {Array<number|null|undefined>} answers - Selected option index per
 *   question, positionally aligned with `questions`.
 * @returns {boolean[]} One verdict per question, in order; `true` where the
 *   answer equals the question's `correctIndex`, `false` otherwise.
 */
export function evaluateQuestions(questions, answers) {
  const bank = Array.isArray(questions) ? questions : [];
  const picks = Array.isArray(answers) ? answers : [];

  return bank.map((question, i) => {
    if (!question) return false;
    const answer = picks[i];
    return (
      typeof answer === 'number' &&
      Number.isInteger(answer) &&
      answer === question.correctIndex
    );
  });
}

/**
 * Read the selected option index for each question from a quiz form, in
 * question order.
 *
 * Form-reading contract (the quiz HTML pages in tasks 6.1/6.2 follow this):
 * - Each question is represented by a group of radio inputs sharing the
 *   question's `id` as their `name` attribute — i.e. `name="<question.id>"`.
 *   Grouping by `name` lets the browser enforce a single selection per
 *   question.
 * - Each radio input's `value` is the zero-based option index as a decimal
 *   string (`value="0"`, `value="1"`, ...), matching the position in the
 *   question's `options` array.
 * - A question with no checked radio is reported as `null` (unanswered).
 * - Only values that parse to an integer within the question's option range
 *   are accepted; any malformed or out-of-range selection is treated as
 *   unanswered (`null`) so it scores as incorrect downstream.
 *
 * @param {ParentNode|null|undefined} form - The quiz form (or any container
 *   exposing `querySelector`). Absent or malformed containers yield all-null.
 * @param {import('./quiz-questions.js').QuizQuestion[]} questions - The question
 *   bank, used for order, ids, and option counts.
 * @returns {Array<number|null>} The selected option index per question, in
 *   order; `null` where the question is unanswered or the selection is invalid.
 */
export function readSelectedAnswers(form, questions) {
  const bank = Array.isArray(questions) ? questions : [];

  if (!form || typeof form.querySelector !== 'function') {
    return bank.map(() => null);
  }

  return bank.map((question) => {
    if (!question || typeof question.id !== 'string' || question.id === '') {
      return null;
    }

    const optionCount = Array.isArray(question.options)
      ? question.options.length
      : 0;

    const selector =
      `input[type="radio"][name="${cssEscape(question.id)}"]:checked`;

    let checked = null;
    try {
      checked = form.querySelector(selector);
    } catch (_err) {
      return null;
    }
    if (!checked) return null;

    const raw =
      typeof checked.value === 'string'
        ? checked.value
        : checked.getAttribute && checked.getAttribute('value');
    const index = Number.parseInt(raw, 10);

    if (
      Number.isInteger(index) &&
      index >= 0 &&
      index < optionCount
    ) {
      return index;
    }
    return null;
  });
}

/**
 * Build the localized result message shown after scoring.
 *
 * Draws its wording from the active locale's message set (`en`/`fr`), falling
 * back to `en` for any unknown or missing locale. The message states the score
 * out of the total and whether the learner passed.
 *
 * @param {number} score - Number of correct answers.
 * @param {number} total - Total number of questions.
 * @param {boolean} passed - Whether the score met the pass threshold.
 * @param {string} [locale] - Active locale code (`'en'` or `'fr'`); anything
 *   else falls back to `en`.
 * @returns {string} A short, human-readable result message in the active
 *   locale.
 */
export function formatQuizResult(score, total, passed, locale) {
  const messages = resolveMessages(locale);
  return passed
    ? messages.passed(score, total)
    : messages.failed(score, total);
}

/**
 * Locale-keyed result message builders. Unknown locales fall back to `en`.
 *
 * @type {Record<'en'|'fr', { passed: (s: number, t: number) => string, failed: (s: number, t: number) => string }>}
 */
const QUIZ_MESSAGES = {
  en: {
    passed: (score, total) =>
      `You passed with ${score} out of ${total} correct.`,
    failed: (score, total) =>
      `You did not pass: ${score} out of ${total} correct. At least ${QUIZ_PASS_THRESHOLD} are required.`,
  },
  fr: {
    passed: (score, total) =>
      `Réussi avec ${score} bonne(s) réponse(s) sur ${total}.`,
    failed: (score, total) =>
      `Non réussi : ${score} bonne(s) réponse(s) sur ${total}. Au moins ${QUIZ_PASS_THRESHOLD} sont requises.`,
  },
};

/**
 * Resolve the message set for a locale, falling back to `en`.
 *
 * @param {string} [locale]
 * @returns {{ passed: (s: number, t: number) => string, failed: (s: number, t: number) => string }}
 */
function resolveMessages(locale) {
  if (typeof locale === 'string' && locale.toLowerCase().startsWith('fr')) {
    return QUIZ_MESSAGES.fr;
  }
  return QUIZ_MESSAGES.en;
}

/**
 * Escape a string for safe use inside a CSS attribute-selector value.
 *
 * Prefers the platform `CSS.escape` when available; otherwise backslash-escapes
 * characters that are not safe in an unquoted identifier context. Question ids
 * in the bank are plain kebab-case, so this is defensive hardening.
 *
 * @param {string} value
 * @returns {string}
 */
function cssEscape(value) {
  const str = String(value);
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(str);
  }
  return str.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

/**
 * Apply exactly one state class per question block, in document order.
 *
 * Selects every `<li class="quiz-question">` in the form (document order, which
 * matches the question-bank order the pure helpers operate on) and, for each
 * block, first removes both state classes so a resubmission never leaves stale
 * feedback (Requirement 3.1), then adds exactly one class for every block it
 * can pair with the `correctness` array. Pairing is limited to the overlapping
 * prefix via `Math.min`, so a block/bank count mismatch is handled defensively:
 * unpaired extra blocks are still cleared but left unmarked rather than
 * receiving a misleading class. Guards on `querySelectorAll` and each block's
 * `classList` so a non-standard container degrades to a no-op instead of
 * throwing.
 *
 * @param {ParentNode} form - The quiz form (or any container exposing
 *   `querySelectorAll`).
 * @param {boolean[]} correctness - Per-question correctness, aligned with the
 *   question bank, as returned by {@link evaluateQuestions}.
 * @returns {void}
 */
function applyQuestionFeedback(form, correctness) {
  if (!form || typeof form.querySelectorAll !== 'function') return;

  const blocks = form.querySelectorAll('li.quiz-question');
  const n = Math.min(blocks.length, correctness.length);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block || !block.classList) continue;
    block.classList.remove(CORRECT_CLASS, INCORRECT_CLASS);
    if (i < n) {
      block.classList.add(correctness[i] ? CORRECT_CLASS : INCORRECT_CLASS);
    }
  }
}

import { QUIZ_QUESTIONS } from './quiz-questions.js';

/**
 * Wire the fundamentals quiz to the DOM.
 *
 * Mirrors `self-assessment.js`'s `initGuardrailChecklist`: resolves the cross-
 * locale slug (defaulting to {@link QUIZ_SLUG}), attaches a single `submit`
 * handler to the form that prevents the default page navigation, scores the
 * current selection once via {@link scoreQuiz}/{@link readSelectedAnswers},
 * and writes the localized {@link formatQuizResult} message to `resultEl`.
 *
 * On a passing submission only, completion is recorded through the progress
 * tracker (`progress.js` `markLessonComplete`) via a dynamic import inside a
 * try/catch, exactly like the self-assessment flow; a failing submission never
 * records completion. Progress tracking is best-effort, so a throwing or
 * unavailable localStorage never surfaces an error to the learner.
 *
 * The function returns early when the form is absent, so callers can invoke it
 * unconditionally on every page.
 *
 * @param {{
 *   form?: (ParentNode & { addEventListener?: Function })|null,
 *   questions?: import('./quiz-questions.js').QuizQuestion[],
 *   resultEl?: Element|null,
 *   completeEl?: Element|null,
 *   locale?: string,
 *   slug?: string,
 * }} [options]
 * @returns {void}
 *
 * Validates: Requirements 4.4, 5.1, 5.2, 5.5, 5.6
 */
export function initQuiz({ form, questions, resultEl, completeEl, locale, slug } = {}) {
  if (!form || typeof form.addEventListener !== 'function') {
    return;
  }

  const bank =
    Array.isArray(questions) && questions.length > 0 ? questions : QUIZ_QUESTIONS;
  const lessonSlug =
    typeof slug === 'string' && slug !== '' ? slug : QUIZ_SLUG;

  form.addEventListener('submit', async (event) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    const answers = readSelectedAnswers(form, bank);
    const { score, total, passed } = scoreQuiz(bank, answers);

    if (resultEl) {
      resultEl.textContent = formatQuizResult(score, total, passed, locale);
    }

    if (completeEl && typeof completeEl.setAttribute === 'function') {
      completeEl.setAttribute('data-quiz-passed', passed ? 'true' : 'false');
    }

    // Mark each question block green/red for the answers just submitted. Runs
    // after the result message and data-quiz-passed are written and before the
    // completion-on-pass return, so existing behavior is preserved and feedback
    // lands regardless of the progress outcome.
    applyQuestionFeedback(form, evaluateQuestions(bank, answers));

    // Record completion on a pass only; never on a fail. Best-effort: a
    // throwing or unavailable localStorage must never surface an error.
    if (!passed) return;
    try {
      const progress = await import('./progress.js');
      if (progress && typeof progress.markLessonComplete === 'function') {
        progress.markLessonComplete(lessonSlug);
      }
    } catch (_err) {
      // Progress tracking is best-effort; never block the UI on it.
    }
  });
}
