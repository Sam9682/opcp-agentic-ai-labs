# Implementation Plan: SkillHub Quiz & Sandbox Restructure

## Overview

This plan restructures the SkillHub catalog into three top-level sections, adds a 15-question bilingual quiz with instant scoring and progress persistence, introduces a shai orchestrator lab, consolidates the seven sandbox lessons into one Running Applications lab, and keeps the full test suite consistent. Work proceeds data-first (catalog) → renderer → quiz logic → pages → index/cleanup → tests → verification, so each step builds on the last and nothing is left orphaned. All code is vanilla ES modules; tests use Vitest + fast-check (already present).

## Tasks

- [x] 1. Restructure the lesson catalog in `skillhub/js/lessons.js`
  - [x] 1.1 Add grouping fields and restructure entries
    - Add `section` (`'section-1'|'section-2'|'section-3'`) and optional `subsection` (`'intro'|'design'|null`) to every catalog entry per the design's section/subsection assignment table
    - Assign the 4 morning lessons to `section-1`/`intro` and the 7 afternoon lessons to `section-1`/`design`, preserving existing programme order
    - Remove the 6 retired sandbox entries (`starting-applications`, `stopping-applications`, `making-backups`, `modifying-applications`, `agent-control`, `adding-applications`) and do not reuse `install-bare-metal`
    - Add the `quiz-fundamentals` entry (track `'quiz'`, section-2, difficulty intermediate, 15 min, prerequisites `['agent-design-capstone']`)
    - Add the `shai-orchestrator-lab` entry (track `'sandbox'`, section-3, intermediate, 40 min, prerequisites `['configuring-shai-mcp-opcp-explorer']`)
    - Add the `running-applications-lab` entry (track `'sandbox'`, section-3, beginner, 90 min, prerequisites `['shai-orchestrator-lab']`)
    - Extend the allowed `track` set to include `'quiz'`; update the header doc comment and `TRACK_ORDER`/`getLessonsByTrack` as needed
    - Ensure the resulting catalog has exactly 14 entries and preserves all Catalog_Invariants (unique id/slug with id===slug, non-empty bilingual titles, acyclic prereqs, no self-prereq, no orphans, difficulty coverage, `estimatedMinutes` in [1,480])
    - _Requirements: 7.4, 8.1, 8.2_

  - [ ]* 1.2 Write property test for catalog structural invariants
    - **Property 17: Catalog structural invariants hold after restructure**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 17**
    - **Validates: Requirements 8.1**

  - [ ]* 1.3 Write property test for difficulty coverage
    - **Property 18: Difficulty coverage is preserved**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 18**
    - **Validates: Requirements 8.2**

  - [x] 1.4 Update `skillhub/tests/lessons.test.js` for the new catalog
    - Update expected slug lists (section-1 intro/design groups, section-2 quiz, section-3 labs) and the total count (14)
    - Update the prerequisite-chain expectations to match the new fan-out at `agent-design-capstone`
    - Extend the valid-track assertion to include `'quiz'`
    - Remove every reference to the deleted sandbox slugs
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. Section → subsection navigation renderer in `skillhub/js/navigation.js`
  - [x] 2.1 Implement section/subsection grouping
    - Replace flat `TRACK_ORDER`/`TRACK_TITLES` with `SECTION_ORDER`, `SECTION_TITLES`, `SUBSECTION_ORDER`, `SUBSECTION_TITLES` using the verbatim bilingual titles from the design
    - Emit one `.sidebar-section` per non-empty section with `<h2 class="sidebar-section-title">` and a `data-section` attribute
    - Within each section, group by `SUBSECTION_ORDER[section]`; emit `<h3 class="sidebar-subsection-title">` only for labeled subsections (I.1/I.2); render Section II and Section III as a single heading with no spurious sub-heading
    - Keep the I.2 list `id="nav-afternoon"` to avoid breaking `navigation-consistency.property.test.js`
    - Preserve the per-link attribute logic unchanged: localized title text, `href="/<locale>/<slug>.html"`, `data-slug`, `data-lesson-id`, completion class + aria-label, active class + `aria-current="page"`
    - Return early on absent container; tolerate an empty lesson list
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 7.3, 7.5_

  - [ ]* 2.2 Write property test for the single Section I heading
    - **Property 1: Section I is a single heading over the fundamentals and governance lessons**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 1**
    - **Validates: Requirements 1.1**

  - [ ]* 2.3 Write property test for subsection I.1 title and ordered membership
    - **Property 2: Subsection I.1 title and ordered membership**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 2**
    - **Validates: Requirements 1.2**

  - [ ]* 2.4 Write property test for subsection I.2 title and ordered membership
    - **Property 3: Subsection I.2 title and ordered membership**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 3**
    - **Validates: Requirements 1.3, 1.4**

  - [ ]* 2.5 Write property test for preserved lesson link attributes
    - **Property 4: Lesson link attributes are preserved under subsections**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 4**
    - **Validates: Requirements 1.5**

  - [ ]* 2.6 Write property test for completion badge rendering
    - **Property 5: Completion badge on any completed item, including the quiz**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 5**
    - **Validates: Requirements 1.6, 5.4**

  - [ ]* 2.7 Write property test for the active link
    - **Property 6: Active link reflects the current page**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 6**
    - **Validates: Requirements 1.7**

  - [ ]* 2.8 Write property test for Section III two-lab ordering
    - **Property 15: Section III renders exactly two labs in order**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 15**
    - **Validates: Requirements 7.3, 7.5**

  - [x] 2.9 Update `skillhub/tests/navigation.test.js`
    - Assert the new section `<h2>` titles and subsection `<h3>` titles verbatim per locale
    - Update section/list counts and the French title assertions
    - _Requirements: 8.4_

- [x] 3. Checkpoint — catalog and navigation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Quiz question bank `skillhub/js/quiz-questions.js`
  - [x] 4.1 Author the 15 bilingual MCQs
    - Export `QUIZ_QUESTIONS` with exactly 15 entries whose subject matter is drawn from the Section I lessons
    - Each question has a stable `id`, bilingual `prompt`, `>= 2` bilingual `options`, and exactly one `correctIndex` that is an integer within the option index range
    - Ensure every prompt and every option has non-empty `en` and `fr` text
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ]* 4.2 Write property test for well-formed questions
    - **Property 7: Every quiz question is well-formed**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 7**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 4.3 Write property test for fully bilingual questions
    - **Property 8: Every quiz question is fully bilingual**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 8**
    - **Validates: Requirements 3.4, 3.5**

- [x] 5. Quiz module `skillhub/js/quiz.js`
  - [x] 5.1 Implement the pure scorer and helpers
    - Export `QUIZ_SLUG = 'quiz-fundamentals'`, `QUIZ_PASS_THRESHOLD = 12`, `QUIZ_TOTAL = 15`
    - Implement `scoreQuiz(questions, answers)` returning `{ score, total, passed }`; count index matches only, treat null/undefined/out-of-range as incorrect, `passed = score >= QUIZ_PASS_THRESHOLD`; locale-independent
    - Implement `readSelectedAnswers(form, questions)` returning the selected option index per question in order, `null` when unanswered
    - Implement `formatQuizResult(score, total, passed, locale)` drawing messages from the active locale's message set, falling back to `en`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.2 Implement `initQuiz` DOM wiring and progress persistence
    - Mirror `self-assessment.js`: resolve slug (default `QUIZ_SLUG`), attach a `submit` handler that prevents default, score once, write the localized result to `resultEl`
    - On pass only, record completion via `progress.js` `markLessonComplete(slug)` inside try/catch; never record on fail
    - Guard all storage access so a throwing localStorage never surfaces an error; return early when the form is absent
    - _Requirements: 4.4, 5.1, 5.2, 5.5, 5.6_

  - [ ]* 5.3 Write property test for scoring correctness
    - **Property 9: Scoring counts correct answers and treats unanswered as incorrect**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 9** — random answer vectors (including holes/out-of-range) over the real 15-question bank
    - **Validates: Requirements 4.1, 4.5**

  - [ ]* 5.4 Write property test for pass determination
    - **Property 10: Pass determination matches the threshold**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 10**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 5.5 Write property test for locale-independent scoring
    - **Property 11: Scoring is locale-independent**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 11**
    - **Validates: Requirements 4.6**

  - [ ]* 5.6 Write property test for localized result message
    - **Property 12: Result message is rendered in the active locale**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 12**
    - **Validates: Requirements 4.4**

  - [ ]* 5.7 Write property test for pass/fail completion recording
    - **Property 13: Passing records completion and failing does not**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 13** — assert the `skillhub_lesson_complete_quiz-fundamentals` record is set iff score >= 12
    - **Validates: Requirements 5.1, 5.5**

  - [ ]* 5.8 Write property test for progress integration
    - **Property 14: The quiz counts toward progress against the catalog total**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 14**
    - **Validates: Requirements 5.3**

  - [ ]* 5.9 Write quiz unit/content tests in `skillhub/tests/quiz.test.js`
    - Cover `scoreQuiz` examples, `readSelectedAnswers` against a fixture form, `formatQuizResult` for both locales/outcomes, and the degrade-safe storage path
    - _Requirements: 4.1, 4.4, 5.6_

- [x] 6. Quiz pages
  - [x] 6.1 Create `skillhub/en/quiz-fundamentals.html`
    - Form (`.quiz-form`), 15 question blocks matching the question bank order, a submit control, a `.quiz-result` element, `data-lesson-id="quiz-fundamentals"`, and `<script type="module" src="../js/app.js">`
    - English question text, options, instructions, and result region
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

  - [x] 6.2 Create `skillhub/fr/quiz-fundamentals.html`
    - Same structure as the EN page with French question text, options, instructions, and result region; shared slug `quiz-fundamentals`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 5.2_

- [x] 7. Wire the quiz into page bootstrap `skillhub/js/main.js`
  - [x] 7.1 Add the `wireQuiz()` step
    - Statically import `QUIZ_QUESTIONS` and `initQuiz`; add a guarded `wireQuiz()` run inside the existing `runStep` isolation that activates only when the quiz form is present, passing `locale` from `document.documentElement.lang`
    - _Requirements: 4.1, 5.1_

- [x] 8. Checkpoint — quiz end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Shai orchestrator lab pages (Section III.1)
  - [x] 9.1 Create `skillhub/en/shai-orchestrator-lab.html`
    - Guided lesson at the same format/depth as existing sandbox pages: orchestrator architecture, agent roles, delegation model, step-by-step CLI instructions, example commands and configuration as illustrative `<pre><code>` only (no runnable code/scripts), `data-lesson-id="shai-orchestrator-lab"`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 9.2 Create `skillhub/fr/shai-orchestrator-lab.html`
    - Same structure and depth with French prose, headings, and instructions; EN/FR heading parity
    - _Requirements: 6.1, 6.6_

- [x] 10. Running Applications lab pages (Section III.2)
  - [x] 10.1 Create `skillhub/en/running-applications-lab.html`
    - Single lab consolidating the seven former sandbox topics (install-bare-metal, starting-applications, stopping-applications, making-backups, modifying-applications, agent-control, adding-applications), `data-lesson-id="running-applications-lab"`
    - _Requirements: 7.1, 7.2_

  - [x] 10.2 Create `skillhub/fr/running-applications-lab.html`
    - Same consolidated content in French with EN/FR heading parity
    - _Requirements: 7.1, 7.2_

- [x] 11. Remove retired sandbox pages
  - [x] 11.1 Delete the seven retired sandbox HTML pages in both locales
    - Delete `install-bare-metal.html`, `starting-applications.html`, `stopping-applications.html`, `making-backups.html`, `modifying-applications.html`, `agent-control.html`, `adding-applications.html` under both `skillhub/en/` and `skillhub/fr/`
    - _Requirements: 7.4_

  - [ ]* 11.2 Write property test for catalog-to-page consistency
    - **Property 16: Catalog-to-page consistency after consolidation**
    - **Feature: skillhub-quiz-and-sandbox-restructure, Property 16** — every catalog slug has an `en` and `fr` page and no entry points at a retired page
    - **Validates: Requirements 7.4**

- [x] 12. Index pages reflect the new structure
  - [x] 12.1 Update `skillhub/en/index.html`
    - Section I heading "Fundamentals & Governance" with I.1 "Introduction & Fundamentals" and I.2 "Design & Governance" labels (drop "Morning —" wording); Section II Quiz; Section III Sandbox Labs listing shai lab then running-applications lab
    - Remove the seven old sandbox cards and their sidebar links; keep card lessons/order matching the sidebar subsections
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.3, 7.5_

  - [x] 12.2 Update `skillhub/fr/index.html`
    - Section I heading "Fondamentaux et gouvernance" with French subsection labels; Section II and Section III matching the sidebar; remove old sandbox cards/links
    - _Requirements: 2.1, 2.2, 2.4, 7.3, 7.5_

- [x] 13. Test suite consistency sweep
  - [x] 13.1 Update `skillhub/tests/lesson-content.test.js`
    - Drop retired sandbox slugs from `AUTHORED_SLUGS` and add `shai-orchestrator-lab` and `running-applications-lab` (and optionally `quiz-fundamentals`)
    - _Requirements: 8.3, 8.6_

  - [x] 13.2 Update `skillhub/tests/index-page-runtime.integration.test.js`
    - Verify the completed-lesson fixtures reference surviving slugs (replace `adding-applications` with a surviving slug such as `running-applications-lab`)
    - _Requirements: 8.5, 8.6_

  - [x] 13.3 Sweep `skillhub/tests/` for stale sandbox slugs
    - Grep the whole test tree for every removed sandbox slug and update or remove any remaining reference (including SCORM/deliverables/skill-section tests that enumerate sandbox slugs)
    - _Requirements: 8.6_

- [x] 14. Final checkpoint — run the full suite
  - Run the entire `skillhub/tests/` suite (single run, not watch mode) and ensure it passes; fix any remaining inconsistencies.
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 8.6_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; the core restructure, quiz scoring/persistence, labs, page cleanup, and test-consistency tasks are required.
- Each task references specific requirements for traceability, and each property test task names its design property (1–18) and tag.
- Checkpoints ensure incremental validation after the catalog/navigation, quiz, and final phases.
- All code is vanilla ES modules; property tests use fast-check with a minimum of 100 iterations and the `Feature: skillhub-quiz-and-sandbox-restructure, Property N` tag.
- `scoreQuiz` compares option indices only, so scoring is locale-independent by construction.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "2.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "4.2", "4.3", "5.1"] },
    { "id": 3, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "6.1", "6.2", "9.1", "9.2", "10.1", "10.2"] },
    { "id": 4, "tasks": ["5.7", "5.8", "5.9", "7.1", "11.1", "12.1", "12.2"] },
    { "id": 5, "tasks": ["11.2", "13.1", "13.2", "13.3"] }
  ]
}
```
