# Requirements Document

## Introduction

SkillHub is a bilingual (English/French) static web application for an agentic-AI course. Its catalog is defined in `skillhub/js/lessons.js`, navigation is rendered by `skillhub/js/navigation.js`, lesson completion is tracked by `skillhub/js/progress.js`, and `skillhub/js/self-assessment.js` is the precedent for in-page assessment gating. Per-lesson pages live under `skillhub/en/` and `skillhub/fr/`, index pages (`en/index.html`, `fr/index.html`) hard-code the sidebar and programme cards, and invariants are enforced by tests under `skillhub/tests/`.

This feature restructures the course into three top-level sections and adds new interactive content:

- **Section I — Fundamentals & Governance**: one top-level section containing two labeled subsections (I.1 Introduction & Fundamentals from the current 4 morning lessons; I.2 Design & Governance from the current 7 afternoon lessons), requiring the navigation renderer to group subsections under a single heading.
- **Section II — Quiz**: a new interactive multiple-choice quiz of 15 questions covering Section I, with instant scoring on submit, a pass threshold of 75% (12 of 15), result persisted to localStorage so it counts toward overall progress and shows a completion badge, in a single attempt, bilingual EN/FR, following the self-assessment module and test style.
- **Section III — Sandbox Labs**: exactly two labs. III.1 is a new bilingual guided lesson page for the shai multi-agent orchestrator (concepts, architecture, agent roles, delegation, example commands and configuration, with no runnable code shipped). III.2 consolidates the seven existing sandbox lessons into a single "OPCP-EXPLORER Running Applications" lab.

All catalog changes must preserve the invariants asserted by `skillhub/tests/lessons.test.js`, and all tests that assert catalog contents, section titles, navigation structure, or progress behavior must be updated to remain consistent.

## Glossary

- **SkillHub**: The bilingual static web application that delivers the agentic-AI course, comprising the lesson catalog, navigation, progress tracking, and per-locale lesson pages.
- **Lesson_Catalog**: The `lessons` array exported from `skillhub/js/lessons.js`, the single source of truth for all lessons, each with `id`, `slug`, bilingual `title`, `track`, `difficulty`, `estimatedMinutes`, and `prerequisites`.
- **Navigation_Renderer**: The module `skillhub/js/navigation.js` that groups the catalog into sidebar sections and renders lesson links.
- **Progress_Tracker**: The module `skillhub/js/progress.js` that records and reports lesson completion using the localStorage key `skillhub_lesson_complete_<slug>` with the string value `'true'`.
- **Quiz_Module**: The new JavaScript module that evaluates quiz answers, computes the score, determines pass/fail, and gates completion, following the structure of `skillhub/js/self-assessment.js`.
- **Quiz_Page**: The new bilingual quiz HTML page delivered under `skillhub/en/` and `skillhub/fr/`.
- **Shai_Orchestrator_Lab**: The new bilingual guided lesson page describing the shai multi-agent orchestrator (Section III.1).
- **Running_Applications_Lab**: The single consolidated sandbox lab (Section III.2) formed from the seven current sandbox lessons.
- **Section I**: The top-level "Fundamentals & Governance" section containing subsection I.1 (Introduction & Fundamentals) and subsection I.2 (Design & Governance).
- **Pass_Threshold**: A quiz score of at least 75 percent, equal to at least 12 correct answers out of 15 questions.
- **Completion_Badge**: The visual completion indicator applied to items whose slug is recorded as complete by the Progress_Tracker.
- **Locale**: One of the two supported language codes, `en` or `fr`.
- **Catalog_Invariants**: The structural rules asserted by `skillhub/tests/lessons.test.js`: unique `id` and `slug` with `id === slug`, non-empty bilingual titles, `track` in an allowed set, `difficulty` in {beginner, intermediate, advanced} with at least one lesson per difficulty, integer `estimatedMinutes` in [1, 480], prerequisites referencing existing ids, acyclic prerequisites, no self-prerequisite, and no orphan lessons.

## Requirements

### Requirement 1: Section I restructure into one heading with two subsections

**User Story:** As a learner, I want the fundamentals and governance lessons grouped under one "Fundamentals & Governance" section with two labeled subsections, so that I can see the course structure as one coherent part rather than two separate tracks.

#### Acceptance Criteria

1. THE Navigation_Renderer SHALL render the four current morning lessons and the seven current afternoon lessons under a single top-level Section I heading titled "Fundamentals & Governance" in English and "Fondamentaux et gouvernance" in French.
2. THE Navigation_Renderer SHALL render subsection I.1 under Section I with the title "Introduction & Fundamentals" in English and "Introduction et fondamentaux" in French, containing the four current morning lessons in their existing programme order.
3. THE Navigation_Renderer SHALL render subsection I.2 under Section I with the title "Design & Governance" in English and "Conception et gouvernance" in French, containing the seven current afternoon lessons in their existing programme order.
4. THE Navigation_Renderer SHALL render subsection I.1 before subsection I.2 within Section I.
5. THE Navigation_Renderer SHALL preserve each lesson link's existing `href` of `/<locale>/<slug>.html`, `data-slug`, and `data-lesson-id` attributes when rendering lessons under the subsections.
6. WHEN a lesson is recorded as complete by the Progress_Tracker, THE Navigation_Renderer SHALL apply the completed class and completion aria-label to that lesson's link within its subsection.
7. WHEN the current page pathname ends with `/<slug>.html` for a rendered lesson, THE Navigation_Renderer SHALL apply the active class and `aria-current="page"` to that lesson's link.

### Requirement 2: Index pages reflect the Section I structure and resolve the title inconsistency

**User Story:** As a learner, I want the index pages to show the same Section I heading and subsection labels as the sidebar, so that the sidebar and the programme cards present one consistent structure in both languages.

#### Acceptance Criteria

1. THE SkillHub SHALL present the Section I heading on `skillhub/en/index.html` as "Fundamentals & Governance" and on `skillhub/fr/index.html` as "Fondamentaux et gouvernance".
2. THE SkillHub SHALL present subsection labels I.1 and I.2 on both index pages using the same English and French titles rendered by the Navigation_Renderer for those subsections.
3. THE SkillHub SHALL present the English subsection I.1 label as "Introduction & Fundamentals" on both the sidebar and the index programme cards, removing the prior "Morning — Introduction & Fundamentals" wording.
4. THE SkillHub SHALL list under each index subsection the same lessons, in the same order, as the corresponding sidebar subsection.

### Requirement 3: Quiz content and presentation

**User Story:** As a learner, I want a 15-question multiple-choice quiz covering the fundamentals and governance material, so that I can check my understanding of Section I.

#### Acceptance Criteria

1. THE Quiz_Page SHALL present exactly 15 multiple-choice questions whose subject matter is drawn from the Section I lessons.
2. THE Quiz_Page SHALL present each question with at least two selectable answer options and exactly one option marked as correct.
3. THE Quiz_Page SHALL be delivered in both locales, with an `en` version under `skillhub/en/` and an `fr` version under `skillhub/fr/`.
4. WHERE the active Locale is `fr`, THE Quiz_Page SHALL present all question text, answer options, instructions, and result messages in French.
5. WHERE the active Locale is `en`, THE Quiz_Page SHALL present all question text, answer options, instructions, and result messages in English.
6. THE Quiz_Page SHALL provide a submit control that the learner activates to request scoring.

### Requirement 4: Quiz scoring and pass determination

**User Story:** As a learner, I want my quiz to be scored instantly when I submit with a clear pass or fail result, so that I immediately know whether I met the required standard.

#### Acceptance Criteria

1. WHEN the learner activates the submit control, THE Quiz_Module SHALL compute the number of questions answered correctly out of 15 and display the resulting score.
2. WHEN the computed score is at least 12 correct out of 15, THE Quiz_Module SHALL report the quiz as passed.
3. IF the computed score is fewer than 12 correct out of 15, THEN THE Quiz_Module SHALL report the quiz as not passed.
4. WHEN scoring is complete, THE Quiz_Module SHALL display the pass-or-not-passed outcome in the active Locale.
5. IF the learner activates the submit control while one or more questions are unanswered, THEN THE Quiz_Module SHALL score each unanswered question as incorrect and complete scoring for all 15 questions.
6. THE Quiz_Module SHALL evaluate answers independently of the active Locale, producing the same score for equivalent answer selections in `en` and `fr`.

### Requirement 5: Quiz completion persistence and progress integration

**User Story:** As a learner, I want a passing quiz result to be saved and counted toward my overall progress like a completed lesson, so that my course progress reflects the quiz.

#### Acceptance Criteria

1. WHEN the Quiz_Module reports the quiz as passed, THE Quiz_Module SHALL record the quiz as complete through the Progress_Tracker using the localStorage key `skillhub_lesson_complete_<quiz-slug>` with the value `'true'`.
2. THE Quiz_Page SHALL use a single quiz slug shared across both locales so that a pass recorded in one Locale is recognized in the other Locale.
3. WHEN the quiz slug is recorded as complete, THE Progress_Tracker SHALL include the quiz in its completed-lesson count and in the overall completion percentage against the total item count.
4. WHEN the quiz slug is recorded as complete, THE Navigation_Renderer SHALL display the Completion_Badge on the quiz entry.
5. IF the Quiz_Module reports the quiz as not passed, THEN THE Quiz_Module SHALL leave the quiz completion record unset.
6. IF localStorage is unavailable or raises an error, THEN THE Quiz_Module SHALL complete scoring and display the result without raising an error to the learner.

### Requirement 6: Shai multi-agent orchestrator lab (Section III.1)

**User Story:** As a learner, I want a guided lesson on the shai multi-agent orchestrator, so that I can understand its architecture and how to drive it from the command line without needing runnable scripts.

#### Acceptance Criteria

1. THE Shai_Orchestrator_Lab SHALL be delivered as a guided lesson page in both locales, with an `en` version under `skillhub/en/` and an `fr` version under `skillhub/fr/`.
2. THE Shai_Orchestrator_Lab SHALL present the orchestrator architecture, agent roles, and the delegation model.
3. THE Shai_Orchestrator_Lab SHALL present step-by-step shai command-line instructions together with example commands and example configuration.
4. THE Shai_Orchestrator_Lab SHALL present its content in the same page format and at the same depth as the existing sandbox lesson pages.
5. THE Shai_Orchestrator_Lab SHALL present example commands and configuration as illustrative text only and SHALL ship no runnable code files or executable scripts.
6. WHERE the active Locale is `fr`, THE Shai_Orchestrator_Lab SHALL present its prose, headings, and instructions in French; WHERE the active Locale is `en`, it SHALL present them in English.

### Requirement 7: OPCP-EXPLORER Running Applications lab consolidation (Section III.2)

**User Story:** As a learner, I want the seven OPCP-EXPLORER sandbox lessons consolidated into one "Running Applications" lab, so that the hands-on material is a single coherent lab instead of seven separate lessons.

#### Acceptance Criteria

1. THE Running_Applications_Lab SHALL present, within a single lab, the subject matter currently covered by the seven sandbox lessons: install-bare-metal, starting-applications, stopping-applications, making-backups, modifying-applications, agent-control, and adding-applications.
2. THE Running_Applications_Lab SHALL be delivered in both locales, with an `en` version under `skillhub/en/` and an `fr` version under `skillhub/fr/`.
3. THE SkillHub SHALL present exactly two labs under Section III: the Shai_Orchestrator_Lab and the Running_Applications_Lab.
4. WHERE a current sandbox lesson page is retired or merged during consolidation, THE SkillHub SHALL remove that page's entry from the Lesson_Catalog so that no catalog entry points to a page that no longer exists.
5. THE Navigation_Renderer SHALL render Section III with a top-level heading titled "Sandbox Labs" in English and "Bac à sable — travaux pratiques" in French, listing the Shai_Orchestrator_Lab before the Running_Applications_Lab.

### Requirement 8: Catalog and section-title consistency with tests

**User Story:** As a maintainer, I want the lesson catalog, section titles, and their tests kept consistent after the restructure, so that the test suite reflects the new structure and continues to enforce the catalog invariants.

#### Acceptance Criteria

1. THE Lesson_Catalog SHALL satisfy all Catalog_Invariants after the restructure, including unique `id` and `slug` with `id === slug`, non-empty `title.en` and `title.fr`, integer `estimatedMinutes` in [1, 480], prerequisites referencing only existing ids, acyclic prerequisites, no self-prerequisite, and no orphan lessons.
2. THE Lesson_Catalog SHALL include at least one lesson for each of the difficulty values beginner, intermediate, and advanced after the restructure.
3. WHEN a lesson, lab, or quiz entry is added to, renamed in, or removed from the Lesson_Catalog, THE SkillHub SHALL update the catalog tests in `skillhub/tests/lessons.test.js` so that the expected slug lists and lesson count match the new catalog.
4. WHEN the Navigation_Renderer section and subsection titles change, THE SkillHub SHALL update the navigation tests that assert section titles verbatim so that the asserted titles match the rendered titles for both locales.
5. THE SkillHub SHALL update the progress-related tests so that the overall item total and completion-percentage expectations include the quiz and the two sandbox labs as rendered.
6. WHEN the restructure is complete, THE SkillHub SHALL make the full `skillhub/tests/` suite pass.
