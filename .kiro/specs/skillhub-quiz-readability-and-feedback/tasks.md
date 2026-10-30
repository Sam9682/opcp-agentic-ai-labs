# Implementation Plan: SkillHub Quiz Readability and Feedback

## Overview

Two scoped changes to the Section I fundamentals quiz, keeping the pure-helper plus thin-adapter architecture already in `skillhub/js/quiz.js`:

1. CSS block layout so each `.quiz-option` sits on its own line, plus green/red state visuals (with non-color-only cues) for `.quiz-question--correct` / `.quiz-question--incorrect`.
2. A new pure helper `evaluateQuestions(questions, answers)` that reuses the `scoreQuiz` index predicate, and an `initQuiz` extension that maps its per-question booleans onto the question blocks on submit.

The work is incremental and test-driven: the pure helper and its property tests come first, then the adapter wiring and integration tests, with CSS and cross-locale verification as static/structural checks. No build step; ESM modules loaded directly; Jest-style tests.

## Tasks

- [x] 1. Add quiz readability and feedback CSS
  - [x] 1.1 Add one-option-per-line layout for `.quiz-option`
    - In `skillhub/assets/css/style.css`, append a block-level rule giving `.quiz-option` `display: block` with vertical spacing, so each option occupies its own line on both locale pages without any HTML edit
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Add green/red question state visuals with non-color cues
    - In `skillhub/assets/css/style.css`, append rules for `.quiz-question--correct` (green treatment) and `.quiz-question--incorrect` (red treatment), each combining color with a border/background and a `::before` text marker on the legend so correctness is conveyed beyond color alone; reuse existing `--ovh-green` / `--ovh-red` custom properties
    - _Requirements: 2.5, 2.6, 4.1_

- [x] 2. Implement the `evaluateQuestions` pure helper
  - [x] 2.1 Add `evaluateQuestions(questions, answers)` to `skillhub/js/quiz.js`
    - Export a pure function returning a boolean array positionally aligned with `questions`; a position is `true` only when its answer is an integer strictly equal to the question's `correctIndex`, reusing the same predicate `scoreQuiz` applies; result length equals `questions.length` regardless of `answers.length`; `null`/`undefined`/non-integer/out-of-range answers yield `false`
    - _Requirements: 2.1, 2.4, 2.7_

  - [ ]* 2.2 Write property test — per-question correctness matches index comparison and score
    - **Feature: skillhub-quiz-readability-and-feedback, Property 1: Per-question correctness matches the index comparison and the score**
    - New file `skillhub/tests/evaluate-questions.property.test.js`; generate random banks and answer vectors (≥100 iterations); assert each verdict equals `answer === correctIndex` and `result.filter(Boolean).length === scoreQuiz(bank, answers).score`
    - **Validates: Requirements 2.1, 2.7**

  - [ ]* 2.3 Write property test — output alignment with the bank
    - **Feature: skillhub-quiz-readability-and-feedback, Property 2: Output alignment with the bank**
    - Assert `result.length === bank.length` for short, exact, and padded answer vectors (≥100 iterations)
    - **Validates: Requirements 2.7**

  - [ ]* 2.4 Write property test — unanswered/invalid/out-of-range answers are incorrect
    - **Feature: skillhub-quiz-readability-and-feedback, Property 3: Unanswered, invalid, and out-of-range answers are incorrect**
    - Assert all-`null` answers yield all-`false`, and non-integer / out-of-range selections yield `false` at those positions (≥100 iterations)
    - **Validates: Requirements 2.4**

  - [ ]* 2.5 Write property test — locale and answer-text independence
    - **Feature: skillhub-quiz-readability-and-feedback, Property 4: Locale and answer-text independence**
    - Assert the boolean array is unchanged when option text is permuted/replaced and any locale parameter varies, for the same indices (≥100 iterations)
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 2.6 Write unit tests for `evaluateQuestions` edge cases
    - In `skillhub/tests/evaluate-questions.property.test.js` (or a sibling unit file), cover a fully-correct bank, a fully-incorrect bank, a single-question bank, and the empty bank (`evaluateQuestions([], ...)` returns `[]`)
    - _Requirements: 2.1, 2.4, 2.7_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Extend `initQuiz` to apply per-question feedback
  - [x] 4.1 Add `applyQuestionFeedback` and wire it into the submit handler
    - In `skillhub/js/quiz.js`, add private `applyQuestionFeedback(form, correctness)` that selects `li.quiz-question` in document order, removes both state classes from every block first (resubmission freshness), then adds exactly one class per block it can pair with the correctness array (defensive on count mismatch via `Math.min`); guard on `querySelectorAll` and each block's `classList`
    - Call `applyQuestionFeedback(form, evaluateQuestions(bank, answers))` inside the existing submit handler after the result message and `data-quiz-passed` are written and before the completion-on-pass return, preserving existing behavior
    - _Requirements: 2.2, 2.3, 2.4, 2.7, 3.1, 3.2, 4.1, 4.4_

  - [ ]* 4.2 Write integration tests for correct/incorrect/unanswered coloring and exactly-one-class
    - Extend `skillhub/tests/*.integration.test.js` (or add `skillhub/tests/quiz-feedback.integration.test.js`); build a jsdom form mirroring `ol.quiz-questions > li.quiz-question > fieldset` with radios named by question id and valued by option index; dispatch `submit` and assert correct answers add `quiz-question--correct`, wrong/unanswered add `quiz-question--incorrect`, and every block ends with exactly one state class
    - _Requirements: 2.2, 2.3, 2.4, 2.7_

  - [ ]* 4.3 Write integration test for resubmission freshness
    - Submit, change selections, submit again; assert no stale class survives and the coloring reflects only the second submission
    - _Requirements: 3.1, 3.2_

  - [ ]* 4.4 Write integration test for regression of existing behavior and accessibility path
    - Assert the result message, `data-quiz-passed`, and completion-on-pass behavior are unchanged by the feedback step, and that correctness is conveyed via class names rather than inline text color
    - _Requirements: 4.1, 4.4_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Verify cross-locale rendering with static/structural checks
  - [ ]* 6.1 Verify stylesheet declarations via static checks
    - Add a static test (e.g. `skillhub/tests/quiz-style.test.js`) asserting `style.css` declares block layout for `.quiz-option` and defines a green treatment for `.quiz-question--correct` and a red treatment for `.quiz-question--incorrect`, each with a non-color cue
    - _Requirements: 1.1, 1.2, 1.3, 2.5, 2.6, 4.1_

  - [ ]* 6.2 Verify both EN and FR quiz pages keep the required structure and load the shared stylesheet
    - Add a structural test asserting `skillhub/en/quiz-fundamentals.html` and `skillhub/fr/quiz-fundamentals.html` retain `li.quiz-question` / `label.quiz-option` structure, link `skillhub/assets/css/style.css`, and have no per-option HTML edits
    - _Requirements: 1.4_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements (and, for property tests, a design property) for traceability.
- Checkpoints ensure incremental validation.
- Property tests validate the universal behavior of `evaluateQuestions`; integration tests validate the adapter's DOM wiring; CSS and markup are verified by static/structural checks because they are declarative and do not vary with input.
- No build step is introduced; the code remains ESM modules loaded directly by the browser, and tests are Jest-style.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "4.1", "6.1", "6.2"] },
    { "id": 2, "tasks": ["4.2", "4.3", "4.4"] }
  ]
}
```
