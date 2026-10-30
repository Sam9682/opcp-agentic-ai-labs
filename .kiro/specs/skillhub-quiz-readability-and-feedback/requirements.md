# Requirements Document

## Introduction

This feature improves the Section I fundamentals quiz (`skillhub/en/quiz-fundamentals.html` and `skillhub/fr/quiz-fundamentals.html`) in two ways: answer-option readability and submit-time visual feedback.

First, the quiz currently renders each question's answer options inline, so multiple options can share a line. The user asked to "insert RETURN LINE FEED after each option" so that each option appears on its own line and is easier to scan. The literal request is a line break after every option; the chosen implementation honors that intent through CSS block layout (giving `.quiz-option` a block display in `skillhub/assets/css/style.css`) rather than editing 15 questions across two locale files. This keeps the HTML untouched and applies identically to English and French.

Second, when the learner submits the quiz, every question block must be visually marked as correct or incorrect so the learner can see, at a glance, which questions they got right. A correctly answered question is colored green; an incorrectly answered or unanswered question is colored red. Unanswered questions are treated as incorrect, consistent with the existing index-based scoring in `skillhub/js/quiz.js`. The feedback is expressed through state CSS classes (not color alone) so the meaning is available beyond color perception, and the scoring remains locale-independent and preserves the pure-helper plus thin-adapter architecture already in place.

## Glossary

- **Quiz_Page**: Either rendered quiz document, `skillhub/en/quiz-fundamentals.html` or `skillhub/fr/quiz-fundamentals.html`, sharing the same structure and `data-lesson-id="quiz-fundamentals"`.
- **Quiz_Option**: A `<label class="quiz-option">` element wrapping a single radio `<input>` and its answer text within a question's `<fieldset>`.
- **Quiz_Question_Block**: A `<li class="quiz-question">` element containing one question's `<fieldset>`, `<legend>`, and its Quiz_Options.
- **Quiz_Stylesheet**: The shared stylesheet at `skillhub/assets/css/style.css` loaded by both Quiz_Pages.
- **Quiz_Adapter**: The `initQuiz` function in `skillhub/js/quiz.js` that binds pure scoring helpers to the quiz form on submit.
- **Scoring_Helper**: The pure functions `scoreQuiz` and `readSelectedAnswers` in `skillhub/js/quiz.js` that determine per-question correctness by comparing the selected option index to the question's `correctIndex`.
- **Correct_State_Class**: The CSS class applied to a Quiz_Question_Block that the learner answered correctly, rendering the block green.
- **Incorrect_State_Class**: The CSS class applied to a Quiz_Question_Block that the learner answered incorrectly or left unanswered, rendering the block red.
- **Submission**: The event raised when the learner submits the quiz form, handled by the Quiz_Adapter.

## Requirements

### Requirement 1: One answer option per line

**User Story:** As a learner taking the fundamentals quiz, I want each answer option on its own line, so that I can read and compare the options more easily.

#### Acceptance Criteria

1. THE Quiz_Stylesheet SHALL render each Quiz_Option as a block-level element so that each Quiz_Option occupies its own line.
2. THE Quiz_Stylesheet SHALL apply the one-option-per-line layout to every Quiz_Option within every Quiz_Question_Block on both Quiz_Pages.
3. WHERE the quiz is displayed in English or in French, THE Quiz_Stylesheet SHALL apply the same one-option-per-line layout without any per-locale HTML change.
4. THE Quiz_Page HTML SHALL retain its existing `<li class="quiz-question">` and `<label class="quiz-option">` structure with no per-option markup edits.

### Requirement 2: Submit-time green/red question coloring

**User Story:** As a learner, I want each question marked green or red after I submit, so that I can see which questions I answered correctly.

#### Acceptance Criteria

1. WHEN a Submission occurs, THE Quiz_Adapter SHALL evaluate each Quiz_Question_Block as correct or incorrect using the Scoring_Helper index comparison.
2. WHEN a Submission occurs AND a question is answered correctly, THE Quiz_Adapter SHALL apply the Correct_State_Class to that Quiz_Question_Block.
3. WHEN a Submission occurs AND a question is answered incorrectly, THE Quiz_Adapter SHALL apply the Incorrect_State_Class to that Quiz_Question_Block.
4. WHEN a Submission occurs AND a question is unanswered, THE Quiz_Adapter SHALL apply the Incorrect_State_Class to that Quiz_Question_Block.
5. THE Quiz_Stylesheet SHALL render a Quiz_Question_Block carrying the Correct_State_Class with a green visual treatment.
6. THE Quiz_Stylesheet SHALL render a Quiz_Question_Block carrying the Incorrect_State_Class with a red visual treatment.
7. WHEN a Submission occurs, THE Quiz_Adapter SHALL apply exactly one of the Correct_State_Class or the Incorrect_State_Class to each Quiz_Question_Block.

### Requirement 3: Fresh feedback on resubmission

**User Story:** As a learner who resubmits the quiz, I want the coloring to reflect my latest answers, so that stale feedback never misleads me.

#### Acceptance Criteria

1. WHEN a Submission occurs, THE Quiz_Adapter SHALL remove any Correct_State_Class or Incorrect_State_Class applied by a prior Submission before applying the current result to each Quiz_Question_Block.
2. WHEN a Submission occurs, THE Quiz_Adapter SHALL color each Quiz_Question_Block according to the answer selection present at the time of that Submission.

### Requirement 4: Accessible, locale-independent feedback

**User Story:** As a maintainer, I want the feedback to be accessible and locale-independent, so that the change respects existing architecture and users who do not perceive color.

#### Acceptance Criteria

1. THE Quiz_Adapter SHALL convey correctness through the Correct_State_Class and the Incorrect_State_Class rather than through inline text color alone.
2. WHERE the quiz is displayed in English or in French, THE Quiz_Adapter SHALL produce identical per-question correctness results for identical option selections.
3. THE Quiz_Adapter SHALL determine per-question correctness using the existing Scoring_Helper index comparison without reading answer text.
4. WHEN a Submission occurs, THE Quiz_Adapter SHALL preserve the existing result-message and completion-recording behavior.
