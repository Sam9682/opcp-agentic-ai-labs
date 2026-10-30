# Design Document

## Overview

This feature makes two scoped changes to the Section I fundamentals quiz, keeping the established pure-helper plus thin-adapter architecture already present in `skillhub/js/quiz.js`:

1. **Readability.** Each answer option is placed on its own line through a block-level layout rule on `.quiz-option` in the shared stylesheet `skillhub/assets/css/style.css`. No HTML changes are made, so the layout applies identically to `skillhub/en/quiz-fundamentals.html` and `skillhub/fr/quiz-fundamentals.html`.

2. **Submit-time feedback.** On submission, each `<li class="quiz-question">` block is marked correct (green) or incorrect/unanswered (red). Correctness is computed by a new pure helper `evaluateQuestions(questions, answers)` that reuses the exact index comparison already used by `scoreQuiz` (`answer === correctIndex`). The `initQuiz` adapter maps the resulting per-question booleans onto the question blocks via state CSS classes, clearing any prior classes first so resubmission always reflects the latest answers.

The split keeps everything that varies with input in pure, locale-independent, easily tested functions, and confines DOM mutation to the thin adapter. No build step is introduced; the code remains ESM modules loaded directly by the browser.

## Architecture

```
Browser (quiz page, en or fr)
        |
        v
  main.js  initQuizForm()
        |  querySelector('.quiz-form'), '.quiz-result'; reads <html lang>
        v
  quiz.js  initQuiz({ form, questions, resultEl, locale })   <-- thin adapter (DOM)
        |
        |  on 'submit':
        |    readSelectedAnswers(form, bank)  -> answers[]        (pure)
        |    scoreQuiz(bank, answers)         -> {score,total,passed} (pure)
        |    evaluateQuestions(bank, answers) -> boolean[]        (pure, NEW)
        |    write result message, set data-quiz-passed, record completion-on-pass
        |    map boolean[] onto <li.quiz-question> blocks via state classes (DOM, NEW)
        v
  style.css  .quiz-option (block layout, NEW)
             .quiz-question--correct / --incorrect (state visuals, NEW)
```

Boundaries:

- **Pure layer** (`scoreQuiz`, `readSelectedAnswers`, `evaluateQuestions`): index-only logic, no DOM, no locale dependence. Unit- and property-tested.
- **Adapter layer** (`initQuiz`): reads the form, calls the pure helpers, mutates the DOM. Integration-tested.
- **Presentation layer** (`style.css`): declarative layout and state visuals. Verified by static/integration checks.

## Components and Interfaces

### 1. Stylesheet: option layout (`skillhub/assets/css/style.css`)

A block-level rule gives each option its own line. This honors the "line break after each option" intent without editing any HTML, and because `.quiz-option` is a shared class it applies to all 15 questions on both locale pages (Requirements 1.1–1.4).

```css
/* Quiz — one answer option per line */
.quiz-option {
    display: block;
    margin-bottom: var(--spacing-xs);
}
```

### 2. Stylesheet: question state visuals (`skillhub/assets/css/style.css`)

State classes carry the correct/incorrect meaning. To satisfy accessible, non-color-only feedback (Requirement 4.1), each state combines color with a left border and a tinted background, and a text marker is added via `::before` on the legend so the cue survives for users who do not perceive color. Colors reuse the existing custom properties (`--ovh-green`, `--ovh-red`) and tint conventions already used by `.alert-success` / `.alert-danger`.

```css
/* Quiz — submit-time per-question feedback */
.quiz-question--correct > fieldset {
    border-left: 4px solid var(--ovh-green);
    background-color: rgba(70, 185, 84, 0.08);
}

.quiz-question--incorrect > fieldset {
    border-left: 4px solid var(--ovh-red);
    background-color: rgba(228, 66, 88, 0.08);
}

/* Non-color-only cue: a textual marker before the question text. */
.quiz-question--correct > fieldset > legend::before {
    content: "\2713\00a0"; /* check mark + nbsp */
    color: #2d7a37;
}

.quiz-question--incorrect > fieldset > legend::before {
    content: "\2717\00a0"; /* ballot X + nbsp */
    color: #9b2d3d;
}
```

The exact color values and the `> fieldset` targeting are implementation detail; the contract is: the correct class produces a green treatment, the incorrect class produces a red treatment, and both add a non-color cue.

### 3. Pure helper: `evaluateQuestions(questions, answers)` (`skillhub/js/quiz.js`)

A new pure function returning per-question correctness as a boolean array, positionally aligned with `questions`. It applies the identical acceptance rule already used inside `scoreQuiz`, so the two never disagree.

```js
/**
 * Evaluate each question's correctness against an answer vector.
 *
 * Pure and locale-independent: a position is `true` only when its answer is a
 * strictly-equal integer match to the question's `correctIndex` — the same
 * index comparison `scoreQuiz` uses. Any `null`, `undefined`, non-integer, or
 * out-of-range value is `false`, so unanswered questions are incorrect. The
 * result length equals `questions.length`, independent of `answers.length`.
 *
 * @param {import('./quiz-questions.js').QuizQuestion[]} questions
 * @param {Array<number|null|undefined>} answers
 * @returns {boolean[]} per-question correctness, aligned with `questions`
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
```

Invariant tying it to `scoreQuiz`: for any `bank` and `answers`, `evaluateQuestions(bank, answers).filter(Boolean).length === scoreQuiz(bank, answers).score`. The feedback helper and the score can never drift because they share the same predicate.

### 4. Adapter extension: `initQuiz` applies state classes (`skillhub/js/quiz.js`)

Inside the existing `submit` handler, after the result message and `data-quiz-passed` are written and before the completion-recording return, the adapter maps per-question correctness onto the question blocks. Existing behavior (result message, `data-quiz-passed`, completion-on-pass) is unchanged and runs first, satisfying Requirement 4.4.

```js
const CORRECT_CLASS = 'quiz-question--correct';
const INCORRECT_CLASS = 'quiz-question--incorrect';

// Inside the submit handler, after writing result/data-quiz-passed:
applyQuestionFeedback(form, evaluateQuestions(bank, answers));

/**
 * Apply exactly one state class per question block, in document order.
 *
 * Clears any prior state classes first so a resubmission never leaves stale
 * feedback (Requirement 3.1). Defensive against a block/bank count mismatch:
 * iterates over whichever is shorter and only touches blocks it can pair.
 *
 * @param {ParentNode} form
 * @param {boolean[]} correctness
 */
function applyQuestionFeedback(form, correctness) {
  if (!form || typeof form.querySelectorAll !== 'function') return;

  const blocks = form.querySelectorAll('li.quiz-question');
  const n = Math.min(blocks.length, correctness.length);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block || !block.classList) continue;
    block.classList.remove(CORRECT_CLASS, INCORRECT_CLASS); // clear stale first
    if (i < n) {
      block.classList.add(correctness[i] ? CORRECT_CLASS : INCORRECT_CLASS);
    }
  }
}
```

Behavior notes:

- **Exactly one class** per paired block: the `remove(...)` of both classes followed by a single `add(...)` guarantees exactly one state class on every block that has a matching correctness entry (Requirement 2.7).
- **Resubmission freshness**: because both classes are removed at the start of every submission for every block, stale classes from a prior submission never survive (Requirement 3.1), and the classes always reflect the answers read at submit time (Requirement 3.2).
- **Order alignment**: `querySelectorAll('li.quiz-question')` returns blocks in document order, which matches the question-bank order that `readSelectedAnswers`/`evaluateQuestions` operate on. The radio `name` attributes equal question ids, and `value` is the option index, so index-position pairing is correct.
- **Defensive mismatch handling**: if the DOM has more blocks than the bank (or vice versa), only paired indices receive a class; unpaired extra blocks are still cleared of any stale class but left unmarked, avoiding incorrect feedback.

## Data Models

No persistent data model changes. The transient in-memory shapes are:

- `answers: Array<number|null>` — selected option index per question, from `readSelectedAnswers`.
- `correctness: boolean[]` — per-question correctness from `evaluateQuestions`, aligned with `answers` and the bank.
- DOM state is expressed purely as the presence of exactly one of `quiz-question--correct` / `quiz-question--incorrect` on each `<li class="quiz-question">`.

Completion recording continues to flow through `progress.js` `markLessonComplete` under the cross-locale slug `quiz-fundamentals`, unchanged.

## Error Handling

- **Absent or malformed form**: `initQuiz` already returns early when the form lacks `addEventListener`. `applyQuestionFeedback` additionally guards on `querySelectorAll` and on each block's `classList`, so a non-standard container degrades to a no-op rather than throwing.
- **Block/bank count mismatch**: handled by pairing only the overlapping prefix (`Math.min`) while still clearing stale classes on every block.
- **Invalid/unanswered selections**: normalized to `false` by `evaluateQuestions` (mirroring `scoreQuiz`), so they render as incorrect rather than erroring.
- **Progress recording**: unchanged best-effort dynamic import inside `try/catch`; a throwing or unavailable `localStorage` never surfaces to the learner, and feedback classes are applied before the completion step so they land regardless of progress outcome.
- **CSS**: purely additive rules appended to `style.css`; they reuse existing custom properties and introduce no selector that overrides prior rules.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Per-question correctness matches the index comparison and the score

*For any* question bank and *any* answer vector, `evaluateQuestions(bank, answers)` returns a boolean at each position that is `true` exactly when that position's answer is an integer strictly equal to the question's `correctIndex`, and the count of `true` values equals `scoreQuiz(bank, answers).score`.

**Validates: Requirements 2.1, 2.7**

### Property 2: Output alignment with the bank

*For any* question bank and *any* answer vector — including vectors shorter or longer than the bank — `evaluateQuestions(bank, answers)` returns an array whose length equals `bank.length`, giving exactly one correctness verdict per question.

**Validates: Requirements 2.7**

### Property 3: Unanswered, invalid, and out-of-range answers are incorrect

*For any* question bank, if every answer is `null`/`undefined`, or any answer is a non-integer or an index outside its question's option range, then `evaluateQuestions` marks each such position `false`.

**Validates: Requirements 2.4**

### Property 4: Locale and answer-text independence

*For any* question bank and *any* answer vector, the boolean array from `evaluateQuestions` is identical regardless of locale and regardless of the questions' option text — it depends only on the selected indices and each question's `correctIndex`.

**Validates: Requirements 4.2, 4.3**

## Testing Strategy

A dual approach: property tests for the pure helper's universal behavior, and integration tests (jsdom-style forms) for the adapter's DOM wiring and the stylesheet-backed feedback. CSS layout/visual rules are verified by static/structural checks, not property tests, because they are declarative and do not vary with input.

### Property tests — `evaluateQuestions` (new, e.g. `skillhub/tests/evaluate-questions.property.test.js`)

Generate random question banks (varying length, option counts, and `correctIndex`) and random answer vectors (valid indices, `null`, non-integers, out-of-range, and length mismatches). Minimum 100 iterations per property. Each test references its design property via the tag format below.

- **Property 1** — each verdict equals `answer === correctIndex`; `filter(Boolean).length === scoreQuiz(bank, answers).score`.
- **Property 2** — `result.length === bank.length` for short, exact, and padded answer vectors.
- **Property 3** — all-`null` answers yield all-`false`; non-integer and out-of-range selections yield `false` at those positions.
- **Property 4** — permuting or replacing option text, and varying any locale parameter, leaves the boolean array unchanged for the same indices.

Tag format: **Feature: skillhub-quiz-readability-and-feedback, Property {number}: {property_text}**

### Integration tests — `initQuiz` feedback wiring (extend `skillhub/tests/*.integration.test.js`)

Build a jsdom-like quiz form mirroring the real markup (`ol.quiz-questions > li.quiz-question > fieldset` with radios named by question id and valued by option index), then dispatch `submit`:

- Correct answers add `quiz-question--correct` to the right blocks; wrong/unanswered answers add `quiz-question--incorrect` (Requirements 2.2, 2.3, 2.4).
- Every question block ends with **exactly one** state class (Requirement 2.7).
- **Resubmission**: submit, change selections, submit again; assert no stale class remains and the coloring reflects the second submission only (Requirements 3.1, 3.2).
- **Regression**: the result message, `data-quiz-passed`, and completion-on-pass behavior are unchanged by the feedback step (Requirement 4.4).
- **Accessibility**: correctness is conveyed via class names (not inline text color), confirming the non-color-only path (Requirement 4.1).

### Static / structural checks — stylesheet and markup

- `style.css` declares `display: block` (or equivalent block layout) for `.quiz-option` (Requirements 1.1–1.3).
- `style.css` defines a green treatment for `.quiz-question--correct` and a red treatment for `.quiz-question--incorrect`, each with a non-color cue (Requirements 2.5, 2.6, 4.1).
- Both quiz HTML pages retain `li.quiz-question` / `label.quiz-option` structure and load the shared stylesheet, with no per-option markup edits (Requirement 1.4).

### Unit tests

Keep unit tests focused on concrete examples and edge cases that complement the properties: a fully-correct bank, a fully-incorrect bank, a single-question bank, and an empty bank (`evaluateQuestions([], ...)` returns `[]`). Avoid broad example enumeration where the properties already cover the input space.
