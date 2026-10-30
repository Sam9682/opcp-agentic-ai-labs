# Design Document

## Overview

SkillHub is a static, bilingual (EN/FR) ES-module web app. Its single source of truth is the lesson catalog in `skillhub/js/lessons.js`; `navigation.js` groups and renders the sidebar; `progress.js` tracks slug-keyed completion in localStorage; `self-assessment.js` is the precedent for in-page, gated completion; `main.js` bootstraps every page. Invariants are enforced by the suite under `skillhub/tests/`.

This feature keeps that architecture intact and introduces no new runtime dependencies. It makes five coordinated changes:

1. **Section I restructure.** The sidebar renderer stops grouping strictly by `track` and instead groups by a small, fixed *section/subsection* configuration. The `morning` and `afternoon` tracks become subsections **I.1** and **I.2** under a single **Section I — Fundamentals & Governance** heading. Lesson data (slug, id, title, prerequisites, order) is unchanged; only the grouping config and the title constants change.

2. **Quiz module + pages.** A new `Quiz_Module` (`skillhub/js/quiz.js`) modeled on `self-assessment.js` provides a pure scorer plus DOM wiring. A new question bank (`skillhub/js/quiz-questions.js`) holds 15 bilingual MCQs covering Section I. Two bilingual pages (`en/quiz-fundamentals.html`, `fr/quiz-fundamentals.html`) share one cross-locale slug and, on a passing submit, record completion through `progress.js`.

3. **Shai orchestrator lab (III.1).** A new bilingual guided lesson page pair describing the shai multi-agent orchestrator, authored at the same depth/format as existing sandbox pages, shipping no runnable code. One new catalog entry.

4. **Sandbox consolidation (III.2).** The seven existing sandbox lessons collapse into one **Running Applications** lab page pair. Six catalog entries are removed; one is repurposed into the consolidated lab. Pages for retired slugs are deleted so no catalog entry points at a missing page.

5. **Catalog + test consistency.** The catalog, section/subsection titles, and the tests that assert slug lists, section titles, and progress totals are updated together so the full suite passes.

### Design goals and constraints

- **No new runtime dependencies.** Everything stays vanilla ES modules; tests continue using Vitest + fast-check (already present).
- **Catalog remains the single source of truth.** Progress totals derive from `lessons.length`, so the quiz and both labs must be real catalog entries.
- **Slug-keyed, locale-independent completion.** The quiz uses one slug across both locales, consistent with `progress.js` and `navigation.js`.
- **Degrade-safe storage.** All storage access stays guarded; a throwing localStorage never surfaces an error.
- **Verbatim bilingual titles.** Section/subsection titles are constants asserted verbatim by tests; changing them means changing the tests in lockstep.

## Architecture

### Module map

```
skillhub/js/
  lessons.js          (MODIFIED) catalog: new `section`/`subsection` fields; quiz + 2 labs added; 6 sandbox entries removed
  navigation.js       (MODIFIED) render by section → subsection instead of flat track
  progress.js         (UNCHANGED) slug-keyed completion; quiz reuses markLessonComplete/isLessonComplete
  quiz.js             (NEW)       pure scorer + DOM wiring, mirrors self-assessment.js
  quiz-questions.js   (NEW)       15 bilingual MCQ definitions
  main.js             (MODIFIED)  wire quiz when the quiz container is present
  i18n.js             (UNCHANGED) locale detect/persist/switch
  self-assessment.js  (UNCHANGED) precedent only
```

### Rendering flow (sidebar)

```
initApp() → wireNavigation() → initNavigation(catalog, completedIds)
  → renderSidebar(container, lessonList, completedIds)
      group lessonList by SECTION_ORDER
        for each section: emit one .sidebar-section with <h2 class="sidebar-section-title">
          group that section's lessons by SUBSECTION_ORDER[section]
            for each non-empty subsection with a title: emit <h3 class="sidebar-subsection-title">
            emit <ul class="sidebar-nav" id="nav-<key>"> of lesson links
```

Section I has two subsections (I.1, I.2); Section III has one implicit subsection (no subsection heading, just the lab links). The renderer must emit a subsection heading only when the subsection is labeled, so Section III renders as a single heading plus two lab links with no spurious sub-heading.

### Quiz flow

```
quiz page load → initApp() → wireQuiz() (when .quiz-form present)
  initQuiz({ form, questions, resultEl, locale, slug })
    on submit:
      answers = readSelectedAnswers(form)         // index per question, null if unanswered
      { score, passed } = scoreQuiz(questions, answers)   // pure, locale-independent
      resultEl.textContent = formatQuizResult(score, passed, locale)
      if (passed) markLessonComplete(slug)         // via progress.js, guarded
```

## Components and Interfaces

### 1. Catalog data model (`lessons.js`)

Each lesson keeps its existing fields (`id`, `slug`, `title.{en,fr}`, `track`, `difficulty`, `estimatedMinutes`, `prerequisites`) and gains two optional grouping fields:

```js
/**
 * @typedef {Object} Lesson
 * @property {string} id                 unique; id === slug
 * @property {string} slug               unique
 * @property {{en:string, fr:string}} title  non-empty both locales
 * @property {'morning'|'afternoon'|'sandbox'} track  retained for back-compat queries
 * @property {'section-1'|'section-2'|'section-3'} section      NEW top-level grouping
 * @property {'intro'|'design'|null} [subsection]               NEW within-section grouping
 * @property {'beginner'|'intermediate'|'advanced'} difficulty
 * @property {number} estimatedMinutes   integer in [1, 480]
 * @property {string[]} prerequisites    existing ids, acyclic, no self-ref
 */
```

Rationale for keeping `track`: `getLessonsByTrack` and several tests query by `track`, and the `morning`/`afternoon`/`sandbox` values map cleanly onto the new structure (morning→section-1/intro, afternoon→section-1/design, sandbox→section-3). Retaining `track` avoids churn in `getLessonsByTrack` and its tests, while `section`/`subsection` drive the new rendering.

**Section/subsection assignment after restructure:**

| Section | Subsection | Members (slugs, in order) |
|---|---|---|
| section-1 (Fundamentals & Governance) | intro (I.1) | `assistant-vs-agent`, `agent-anatomy-7-components`, `agentic-loop-and-variants`, `stopping-criteria` |
| section-1 | design (I.2) | `multi-agent-patterns`, `when-not-multi-agent`, `guardrails-5-layers`, `human-in-the-loop-ovhcloud-policy`, `threat-modeling-workshop`, `agent-design-capstone`, `configuring-shai-mcp-opcp-explorer` |
| section-2 (Quiz) | null | `quiz-fundamentals` |
| section-3 (Sandbox Labs) | null | `shai-orchestrator-lab`, `running-applications-lab` |

**Quiz catalog entry** (so progress total and the completion badge include it):

```js
{
  id: 'quiz-fundamentals',
  slug: 'quiz-fundamentals',
  title: { en: 'Quiz: Fundamentals & Governance', fr: 'Quiz : fondamentaux et gouvernance' },
  track: 'quiz',            // NEW allowed track value
  section: 'section-2',
  subsection: null,
  difficulty: 'intermediate',
  estimatedMinutes: 15,
  prerequisites: ['agent-design-capstone'], // depends on Section I, keeps it non-orphan
}
```

**Shai orchestrator lab entry:**

```js
{
  id: 'shai-orchestrator-lab',
  slug: 'shai-orchestrator-lab',
  title: { en: 'Lab: The shai Multi-Agent Orchestrator', fr: 'Atelier : l'orchestrateur multi-agents shai' },
  track: 'sandbox',
  section: 'section-3',
  subsection: null,
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  prerequisites: ['configuring-shai-mcp-opcp-explorer'],
}
```

**Running Applications lab entry** (repurposes the former `install-bare-metal` id/slug is *not* reused; a clean new slug avoids stale page confusion):

```js
{
  id: 'running-applications-lab',
  slug: 'running-applications-lab',
  title: { en: 'Lab: OPCP-EXPLORER Running Applications', fr: 'Atelier : exploitation des applications OPCP-EXPLORER' },
  track: 'sandbox',
  section: 'section-3',
  subsection: null,
  difficulty: 'beginner',   // preserves a beginner entry in section-3
  estimatedMinutes: 90,     // sum-ish of the seven merged topics, within [1,480]
  prerequisites: ['shai-orchestrator-lab'],
}
```

**Track enum change:** the allowed `track` set becomes `['morning','afternoon','sandbox','quiz']`. Tests that enumerate valid tracks (`lessons.test.js`) are updated accordingly.

#### Catalog count after restructure

- Section I: 4 + 7 = 11 (unchanged lessons)
- Section II: 1 (quiz)
- Section III: 2 (shai lab + running-applications lab)

**Total = 14 catalog entries** (down from 18). Removed: the 7 sandbox slugs (`install-bare-metal`, `starting-applications`, `stopping-applications`, `making-backups`, `modifying-applications`, `agent-control`, `adding-applications`); added: `quiz-fundamentals`, `shai-orchestrator-lab`, `running-applications-lab`.

#### Prerequisite chain and invariants after restructure

Chain (acyclic, no orphans, no self-reference):

```
assistant-vs-agent
  → agent-anatomy-7-components
    → agentic-loop-and-variants
      → stopping-criteria
        → multi-agent-patterns
          → when-not-multi-agent
            → guardrails-5-layers
              → human-in-the-loop-ovhcloud-policy
                → threat-modeling-workshop
                  → agent-design-capstone
                    → configuring-shai-mcp-opcp-explorer
                    → quiz-fundamentals
                    → shai-orchestrator-lab
                      → running-applications-lab
```

`agent-design-capstone` is the fan-out point for `configuring-shai-mcp-opcp-explorer`, `quiz-fundamentals`, and `shai-orchestrator-lab`. Difficulty coverage after restructure: beginner (`assistant-vs-agent`, `agent-anatomy-7-components`, `running-applications-lab`), intermediate (several), advanced (several) — all three satisfied.

### 2. Navigation renderer (`navigation.js`)

Replace the flat `TRACK_ORDER`/`TRACK_TITLES` grouping with a section→subsection model.

```js
/** Top-level section order. */
const SECTION_ORDER = ['section-1', 'section-2', 'section-3'];

/** Verbatim bilingual section titles (asserted by tests). */
const SECTION_TITLES = {
  'section-1': { en: 'Fundamentals & Governance', fr: 'Fondamentaux et gouvernance' },
  'section-2': { en: 'Quiz', fr: 'Quiz' },
  'section-3': { en: 'Sandbox Labs', fr: 'Bac à sable — travaux pratiques' },
};

/** Ordered subsections per section; sections with a single unlabeled group use [null]. */
const SUBSECTION_ORDER = {
  'section-1': ['intro', 'design'],
  'section-2': [null],
  'section-3': [null],
};

/** Verbatim bilingual subsection titles. */
const SUBSECTION_TITLES = {
  intro:  { en: 'Introduction & Fundamentals', fr: 'Introduction et fondamentaux' },
  design: { en: 'Design & Governance',         fr: 'Conception et gouvernance' },
};
```

`renderSidebar(container, lessonList, completedIds)` becomes:

1. Clear the container.
2. For each `section` in `SECTION_ORDER`, select that section's lessons (preserving catalog order). Skip empty sections.
3. Emit one `.sidebar-section` with `<h2 class="sidebar-section-title">` set to the locale title. Keep a `data-section` attribute for styling/consistency.
4. For each `subsection` in `SUBSECTION_ORDER[section]`, select the lessons whose `subsection === key` (or all section lessons when key is `null`). Skip empty groups. When the subsection has a title (I.1/I.2), emit `<h3 class="sidebar-subsection-title">` with the locale title. Emit `<ul class="sidebar-nav" id="nav-<groupKey>">`.
5. For each lesson, build the `<a>` exactly as today: localized title text, `href="/<locale>/<slug>.html"`, `data-slug`, `data-lesson-id`; apply `completed` class + completion `aria-label` via the existing `isComplete` check; apply `active` class + `aria-current="page"` when the pathname matches.

The per-link attribute, completion, and active logic is **unchanged** — only the grouping loop changes. `navigateToLesson` and `initHamburgerMenu` are untouched.

Note: the existing `navigation.test.js` asserts three sections titled `Introduction & Fundamentals` / `Design & Governance` / `Sandbox — …`. Those assertions change: the sidebar now renders section headings (`Fundamentals & Governance`, `Quiz`, `Sandbox Labs`) plus subsection headings for I.1/I.2. Tests are rewritten (Requirement 8.4) to assert the new section `<h2>` and subsection `<h3>` titles per locale.

### 3. Quiz question bank (`quiz-questions.js`)

```js
/**
 * @typedef {Object} QuizOption
 * @property {{en:string, fr:string}} text
 */

/**
 * @typedef {Object} QuizQuestion
 * @property {string} id                       stable question id
 * @property {{en:string, fr:string}} prompt   question text, both locales
 * @property {QuizOption[]} options            >= 2 options
 * @property {number} correctIndex             index into options; exactly one correct
 */

export const QUIZ_QUESTIONS = [ /* exactly 15 entries covering Section I */ ];
```

Design rules enforced by tests:
- `QUIZ_QUESTIONS.length === 15`.
- Every question: `options.length >= 2` and `correctIndex` is an integer in `[0, options.length)` (exactly one correct option).
- Every `prompt.en`, `prompt.fr`, and each `option.text.en`/`option.text.fr` is non-empty.
- Subject matter drawn from Section I lessons (assistant-vs-agent, anatomy, agentic loop, stopping criteria, multi-agent patterns, when-not-multi-agent, guardrails, human-in-the-loop, threat modeling, capstone, shai+MCP configuration).

### 4. Quiz module (`quiz.js`)

```js
/** Single cross-locale slug; must equal the catalog entry slug. */
export const QUIZ_SLUG = 'quiz-fundamentals';

/** Pass threshold: at least 12 of 15. */
export const QUIZ_PASS_THRESHOLD = 12;
export const QUIZ_TOTAL = 15;

/**
 * Score an answer vector against the question bank. Pure and locale-independent.
 * @param {QuizQuestion[]} questions
 * @param {Array<number|null|undefined>} answers  selected option index per question
 * @returns {{ score:number, total:number, passed:boolean }}
 *   score = count of answers whose value === question.correctIndex;
 *   unanswered (null/undefined/out-of-range) counts as incorrect;
 *   passed = score >= QUIZ_PASS_THRESHOLD.
 */
export function scoreQuiz(questions, answers) { /* ... */ }

/**
 * Read the selected option index for each question from the form, in question
 * order. Returns null for any unanswered question.
 * @param {ParentNode} form
 * @param {QuizQuestion[]} questions
 * @returns {Array<number|null>}
 */
export function readSelectedAnswers(form, questions) { /* ... */ }

/**
 * Build the localized result message.
 * @param {number} score @param {number} total @param {boolean} passed @param {string} locale
 * @returns {string}
 */
export function formatQuizResult(score, total, passed, locale) { /* ... */ }

/**
 * Wire the quiz form to the DOM. On submit, score, render the result in the
 * active locale, and — only when passed — record completion through
 * progress.js. All storage access is guarded; a throwing localStorage never
 * surfaces an error to the learner.
 * @param {{ form:HTMLFormElement, questions?:QuizQuestion[], resultEl?:Element|null,
 *           completeEl?:Element|null, locale?:string, slug?:string }} options
 * @returns {void}
 */
export function initQuiz(options) { /* ... */ }
```

`initQuiz` mirrors `initGuardrailChecklist`: it resolves the slug (default `QUIZ_SLUG`), attaches a `submit` handler (prevent default), computes the score once, writes the localized result, and on pass dynamically imports `progress.js` and calls `markLessonComplete(slug)` inside a try/catch so progress tracking stays best-effort. Scoring never depends on locale (Requirement 4.6): `scoreQuiz` compares indices only.

### 5. Page bootstrap (`main.js`)

Add one guarded step, `wireQuiz()`, run inside the existing `runStep` isolation:

```js
const QUIZ_FORM_SELECTOR = '.quiz-form, [data-quiz-form]';

function wireQuiz() {
  if (typeof document === 'undefined') return;
  const form = document.querySelector(QUIZ_FORM_SELECTOR);
  if (!form) return;
  const resultEl = document.querySelector('.quiz-result, [data-quiz-result]');
  const locale = document.documentElement?.lang || undefined;
  // questions imported statically at top of main.js from quiz-questions.js
  initQuiz({ form, questions: QUIZ_QUESTIONS, resultEl, locale });
}
```

The progress bar already computes against `lessons.length`, so once the quiz and labs are catalog entries the header percentage includes them automatically — no change to `updateProgressBar`.

## Data Models

### Quiz result model

| Field | Type | Meaning |
|---|---|---|
| `score` | integer `[0,15]` | number of correct answers |
| `total` | integer `15` | fixed question count |
| `passed` | boolean | `score >= 12` |

### Completion key (reused, unchanged)

`skillhub_lesson_complete_quiz-fundamentals = 'true'` written by `markLessonComplete(QUIZ_SLUG)`; read by `progress.js` and by the sidebar's `isComplete`. The single slug guarantees cross-locale recognition (Requirement 5.2).

## Error Handling

- **Storage failures** (private mode, quota, SCORM host): every access in `progress.js` and `quiz.js` is wrapped; scoring and result display always complete (Requirement 5.6). On write failure, the quiz simply does not record completion but still shows the score.
- **Unanswered questions**: treated as incorrect; the denominator remains 15 (Requirement 4.5). `readSelectedAnswers` returns `null` for missing selections and `scoreQuiz` never counts `null` as correct.
- **Malformed/absent DOM**: `initQuiz` returns early when the form is absent; `renderSidebar` returns early when the container is absent and tolerates an empty lesson list (zero sections).
- **Unknown locale**: resolved through the existing i18n precedence to `en` or `fr`; the quiz falls back to `en` strings when the locale is anything else.

## File-by-file change list

**New files**
- `skillhub/js/quiz-questions.js` — 15 bilingual MCQ definitions.
- `skillhub/js/quiz.js` — `scoreQuiz`, `readSelectedAnswers`, `formatQuizResult`, `initQuiz`, `QUIZ_SLUG`, `QUIZ_PASS_THRESHOLD`, `QUIZ_TOTAL`.
- `skillhub/en/quiz-fundamentals.html`, `skillhub/fr/quiz-fundamentals.html` — quiz pages (form, 15 question blocks, submit control, result element, `data-lesson-id="quiz-fundamentals"`, `<script type="module" src="../js/app.js">`).
- `skillhub/en/shai-orchestrator-lab.html`, `skillhub/fr/shai-orchestrator-lab.html` — shai orchestrator guided lesson (architecture, roles, delegation, CLI steps, example commands/config as illustrative `<pre><code>` only; no executable files).
- `skillhub/en/running-applications-lab.html`, `skillhub/fr/running-applications-lab.html` — consolidated lab covering the seven former sandbox topics.
- `skillhub/tests/quiz.test.js` — quiz scorer/DOM unit + content tests.
- `skillhub/tests/quiz.property.test.js` — property-based quiz tests (fast-check).

**Modified files**
- `skillhub/js/lessons.js` — add `section`/`subsection` to all entries; remove 6 sandbox entries; add quiz + 2 lab entries; extend allowed `track` set with `quiz`; update header doc comment and `TRACK_ORDER` as needed for `getLessonsByTrack`.
- `skillhub/js/navigation.js` — section→subsection grouping; `SECTION_ORDER`/`SECTION_TITLES`/`SUBSECTION_ORDER`/`SUBSECTION_TITLES`; emit `<h3 class="sidebar-subsection-title">` for labeled subsections.
- `skillhub/js/main.js` — import `QUIZ_QUESTIONS` and `initQuiz`; add `wireQuiz()` step.
- `skillhub/en/index.html`, `skillhub/fr/index.html` — Section I heading + I.1/I.2 subsection labels and cards (drop "Morning —" wording); add Section II (Quiz) and Section III (Sandbox Labs: shai lab, running-applications lab); remove the seven old sandbox cards and their sidebar links.

**Deleted files** (retired sandbox pages, both locales)
- `install-bare-metal.html`, `starting-applications.html`, `stopping-applications.html`, `making-backups.html`, `modifying-applications.html`, `agent-control.html`, `adding-applications.html` under both `skillhub/en/` and `skillhub/fr/`.

**Updated tests**
- `skillhub/tests/lessons.test.js` — new slug lists (section-1 intro/design groups, section-2 quiz, section-3 labs), new total (14), updated prerequisite-chain expectations, extended valid-track set; remove references to deleted sandbox slugs.
- `skillhub/tests/navigation.test.js` — assert new section `<h2>` titles and subsection `<h3>` titles per locale; update section/list counts and the French title assertions.
- `skillhub/tests/navigation-consistency.property.test.js` — unchanged target (`configuring-shai-mcp-opcp-explorer` stays last in I.2/afternoon nav); verify selectors still resolve against the new `#nav-design`/`#nav-afternoon` list id (keep `id="nav-afternoon"` on the I.2 list to avoid breaking this test, or update the test to the new id — the design keeps the list id `nav-afternoon` for I.2 to minimize churn).
- `skillhub/tests/lesson-content.test.js` — update `AUTHORED_SLUGS` to drop retired sandbox slugs and add the two new lab slugs (and optionally the quiz, which has its own content test).
- `skillhub/tests/self-assessment.test.js` — unchanged (workshop/capstone slugs remain).
- `skillhub/tests/index-page-runtime.integration.test.js` — recomputes against `lessons.length` automatically; verify the two completed-lesson fixtures still reference existing slugs (replace `adding-applications` with a surviving slug such as `running-applications-lab`).
- Any SCORM/deliverables/skill-section tests that enumerate sandbox slugs — audit and update to the new catalog (see Testing Strategy).

## Testing Strategy

### Dual approach

- **Property tests** (fast-check, ≥100 iterations) for scoring, catalog invariants, grouping, and completion rendering.
- **Example/integration tests** for file existence, verbatim titles, bilingual page structure, and index/sidebar parity.

### Property test configuration

- Minimum 100 iterations per property.
- Each property test references its design property via a tag: **Feature: skillhub-quiz-and-sandbox-restructure, Property N: <text>**.

### Test inventory highlights

- **Quiz scorer** (`quiz.property.test.js`): random answer vectors (including holes) over the real 15-question bank; assert `score` equals the count of index matches, `passed` iff `score >= 12`, unanswered never correct, and locale-independence.
- **Catalog invariants** (`lessons.test.js`): the existing uniqueness/bounds/acyclicity/no-orphan checks run over the mutated 14-entry catalog; new expected slug lists and total.
- **Navigation grouping** (`navigation.test.js`): one Section I `<h2>` with verbatim bilingual title; I.1 before I.2 with verbatim `<h3>` titles and correct ordered membership; Section III with exactly two labs in order (shai, running-applications); per-link attributes and completion/active classes unchanged.
- **Completion rendering**: the quiz link shows the completed badge when `quiz-fundamentals` is marked complete.
- **Page parity** (`lesson-content.test.js` / quiz content test): both lab pages and both quiz pages exist per locale, declare the correct `lang`, and have EN/FR heading parity; the shai lab ships no executable files.

### Full-suite gate

After the restructure and test updates, the entire `skillhub/tests/` suite must pass (Requirement 8.6). A pre-merge sweep greps the test tree for every removed sandbox slug to ensure no stale reference remains.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Section I is a single heading over the fundamentals and governance lessons

For any catalog containing the four Section I.1 lessons and the seven Section I.2 lessons, rendering the sidebar emits exactly one Section I heading with the title "Fundamentals & Governance" in `en` and "Fondamentaux et gouvernance" in `fr`, and all eleven lessons appear beneath that single heading.

**Validates: Requirements 1.1**

### Property 2: Subsection I.1 title and ordered membership

For any catalog, the rendered Section I.1 subsection carries the title "Introduction & Fundamentals" in `en` and "Introduction et fondamentaux" in `fr`, and its lesson links are exactly the four morning lessons in their programme order.

**Validates: Requirements 1.2**

### Property 3: Subsection I.2 title and ordered membership

For any catalog, the rendered Section I.2 subsection carries the title "Design & Governance" in `en` and "Conception et gouvernance" in `fr`, and its lesson links are exactly the seven afternoon lessons in their programme order.

**Validates: Requirements 1.3**

### Property 4: Lesson link attributes are preserved under subsections

For any lesson rendered under any subsection and for either locale, its link has `href` equal to `/<locale>/<slug>.html`, `data-slug` equal to the lesson slug, and `data-lesson-id` equal to the lesson id.

**Validates: Requirements 1.5**

### Property 5: Completion badge on any completed item, including the quiz

For any set of completed slugs, every rendered lesson or quiz link whose slug is in that set receives the completed class and a completion aria-label, and every link whose slug is not in the set does not.

**Validates: Requirements 1.6, 5.4**

### Property 6: Active link reflects the current page

For any lesson whose page is the current pathname, its rendered link — and only that link — receives the active class and `aria-current="page"`.

**Validates: Requirements 1.7**

### Property 7: Every quiz question is well-formed

For every question in the 15-question bank, the option count is at least two and exactly one option is designated correct by a `correctIndex` that is an integer within the option index range.

**Validates: Requirements 3.1, 3.2**

### Property 8: Every quiz question is fully bilingual

For every question in the bank, the prompt and each answer option have non-empty text in both `en` and `fr`.

**Validates: Requirements 3.4, 3.5**

### Property 9: Scoring counts correct answers and treats unanswered as incorrect

For any answer vector over the 15 questions (including vectors with missing or out-of-range entries), the computed score equals the number of positions whose selected index equals that question's correct index, unanswered positions never contribute to the score, and scoring always ranges over all 15 questions.

**Validates: Requirements 4.1, 4.5**

### Property 10: Pass determination matches the threshold

For any answer vector, the quiz is reported as passed if and only if the computed score is at least 12 out of 15.

**Validates: Requirements 4.2, 4.3**

### Property 11: Scoring is locale-independent

For any answer vector, the computed score and pass outcome are identical regardless of the active locale.

**Validates: Requirements 4.6**

### Property 12: Result message is rendered in the active locale

For any pass-or-fail outcome and either locale, the displayed result message is drawn from that locale's message set for that outcome.

**Validates: Requirements 4.4**

### Property 13: Passing records completion and failing does not

For any answer vector submitted to the quiz, the completion record `skillhub_lesson_complete_quiz-fundamentals` is set to `'true'` if and only if the computed score is at least 12; a failing submission leaves the record unset.

**Validates: Requirements 5.1, 5.5**

### Property 14: The quiz counts toward progress against the catalog total

For any completion state in which the quiz slug is recorded complete, the quiz slug appears in the completed-lesson list and the overall completion percentage equals `round(completed / total * 100)` where `total` is the full catalog count including the quiz and both labs.

**Validates: Requirements 5.3**

### Property 15: Section III renders exactly two labs in order

For any catalog, the rendered Section III heading is "Sandbox Labs" in `en` and "Bac à sable — travaux pratiques" in `fr`, and it lists exactly two lab links with the shai orchestrator lab before the running-applications lab.

**Validates: Requirements 7.3, 7.5**

### Property 16: Catalog-to-page consistency after consolidation

For every lesson, quiz, or lab in the catalog there exists an `en` and an `fr` HTML page for its slug, and no catalog entry references a slug whose page has been retired.

**Validates: Requirements 7.4**

### Property 17: Catalog structural invariants hold after restructure

For the post-restructure catalog, all of the following hold: `id` and `slug` are unique with `id === slug`; `title.en` and `title.fr` are non-empty; `estimatedMinutes` is an integer in `[1, 480]`; every prerequisite references an existing id; the prerequisite graph is acyclic; no lesson lists itself as a prerequisite; and there are no orphan lessons.

**Validates: Requirements 8.1**

### Property 18: Difficulty coverage is preserved

For the post-restructure catalog, there is at least one lesson for each of the difficulty values beginner, intermediate, and advanced.

**Validates: Requirements 8.2**
