# Implementation Plan: SkillHub SCORM Bilingual (EN/FR) Runtime

## Overview

Build out the missing `skillhub/js/` ES-module runtime so the already-authored bilingual SkillHub site works end to end, driving the work with the existing Vitest + fast-check suite under `skillhub/tests/` as the oracle (`npx vitest --run`). Tasks follow the acyclic module order from the design: the leaf modules `i18n.js` and `lessons.js` come first, then the self-contained `progress.js`, `code-highlight.js`, and `self-assessment.js`, then `navigation.js` (which imports the leaves), then `main.js` plus a page entry module that orchestrates everything, then lesson-page wiring, and finally SCORM build/launch verification. Each module ships with its property and unit sub-tasks placed next to the implementation so regressions surface immediately. The language is JavaScript (native ES modules, no bundler), matching the detected project.

## Tasks

- [x] 1. Implement the i18n locale module (`skillhub/js/i18n.js`)
  - [x] 1.1 Implement locale detection, persistence, and normalization
    - Create `skillhub/js/i18n.js` exporting `LOCALE_KEY = 'skillhub-locale'` and `SUPPORTED_LOCALES = ['en','fr']`
    - Implement `normalizeLocale(value)` (lowercased `startsWith('fr')` → `'fr'`, else `'en'`)
    - Implement `getStoredLocalePreference()` returning stored `'en'`/`'fr'` only, else `null`, guarded so a throwing `getItem` yields `null`
    - Implement `setLocalePreference(value)` persisting `normalizeLocale(value)` under `LOCALE_KEY`, swallowing storage errors
    - Implement `detectLocale()` with precedence stored preference > browser language `startsWith('fr')` > `'en'`, falling through to browser detection if `getItem` throws
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [x] 1.2 Implement same-lesson locale switching
    - Implement `switchLocale(target)` to persist the normalized target, then navigate by replacing the first `^/(en|fr)/` path segment with the target locale and preserving the `<slug>.html` filename, or navigating to `/<locale>/` when no locale segment is present
    - Set navigation via `window.location.href`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 1.3 Verify i18n against property tests
    - **Property 1: Locale Resolution Priority** — stored > fr-browser > en, always `'en'`/`'fr'`
    - **Property 2: Locale Normalization and Persistence** — `startsWith('fr')` → `'fr'` else `'en'` under `skillhub-locale`
    - **Property 3: Same-Lesson Locale URL Construction** — segment swap preserving `<slug>.html`
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 2.1, 2.2, 2.3**
    - Run `npx vitest --run skillhub/tests/i18n.test.js skillhub/tests/i18n.property.test.js`

- [x] 2. Implement the lesson catalog (`skillhub/js/lessons.js`)
  - [x] 2.1 Build the 16-lesson bilingual catalog and query helpers
    - Create `skillhub/js/lessons.js` exporting the `lessons` array in programme order: 4 `morning`, 6 `afternoon`, 6 `sandbox`, using the slugs fixed by the tests (morning: `assistant-vs-agent`, `agent-anatomy-7-components`, `agentic-loop-and-variants`, `stopping-criteria`; afternoon: `multi-agent-patterns`, `when-not-multi-agent`, `guardrails-5-layers`, `human-in-the-loop-ovhcloud-policy`, `threat-modeling-workshop`, `agent-design-capstone`; sandbox: `install-bare-metal`, `adding-applications`, `starting-applications`, `stopping-applications`, `making-backups`, `modifying-applications`)
    - Give each entry `id` (== slug, unique), `slug` (unique), `title: { en, fr }` (both non-empty), `track`, `difficulty`, integer `estimatedMinutes` in `[1,480]`, and acyclic `prerequisites` referencing existing ids with no self-reference
    - Distribute `difficulty` so at least one lesson each of `beginner`, `intermediate`, `advanced` exists
    - Pin exact facts: `install-bare-metal` EN title `'Installation on Bare-Metal Ubuntu with Agentic AI'`; `assistant-vs-agent` has `track === 'morning'` and `prerequisites === []`; prereq chains for `agent-anatomy-7-components`, `stopping-criteria`, `agent-design-capstone` (full nine-lesson morning+afternoon chain ending at `threat-modeling-workshop`), and `making-backups` per design
    - Ensure every `AUTHORED_SLUGS` entry from `lesson-content.js` (all morning + all afternoon) has a catalog entry
    - Implement `getLessonBySlug`, `getLessonsByDifficulty` (`[]` for unknown), `getLessonsByTrack` (programme order, `[]` for unknown), and `getPrerequisiteChain` (depth-first, earliest first, dedup via visited set, no self, `[]` for missing slug)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 2.2 Verify catalog against the lesson tests
    - **Property 7: Catalog Lookup Consistency** — `getLessonBySlug`/`getLessonsByTrack`/`getLessonsByDifficulty` return matching entries, `undefined`/`[]` otherwise
    - **Validates: Requirements 4.1, 4.4**
    - Run `npx vitest --run skillhub/tests/lessons.test.js skillhub/tests/lesson-content.test.js`

- [x] 3. Implement the progress tracker (`skillhub/js/progress.js`)
  - [x] 3.1 Implement slug-keyed, locale-independent completion tracking
    - Create `skillhub/js/progress.js` exporting `COMPLETE_PREFIX = 'skillhub_lesson_complete_'`
    - Implement `markLessonComplete(slug)` (sets `<prefix><slug> = 'true'`, idempotent, no throw), `isLessonComplete(slug)` (`false` on absence or storage error)
    - Implement `getCompletedLessons()` iterating `localStorage.length`/`key(i)`, selecting prefixed keys whose value is `'true'`, stripping the prefix, ignoring unrelated keys, `[]` on error
    - Implement `getCompletionPercentage(total)` (`0` for `total <= 0`, else `Math.round(getCompletedLessons().length / total * 100)`, `0` on storage error)
    - Implement `resetProgress()` collecting matching keys into an array first, then removing only completion keys, leaving unrelated keys untouched, safe when `key` throws
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.2 Verify progress against property and unit tests
    - **Property 4: Progress Persistence Round-Trip** — mark then read back yields exactly the set, locale-independent, persisted
    - **Property 5: Completion Percentage Calculation** — `round(completed/total*100)` integer in `[0,100]`
    - **Property 6: Reset Isolation** — removes all completion records, leaves unrelated entries
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
    - Run `npx vitest --run skillhub/tests/progress.test.js skillhub/tests/progress.property.test.js`

- [x] 4. Implement the code highlighter (`skillhub/js/code-highlight.js`)
  - [x] 4.1 Implement dependency-free syntax highlighting
    - Create `skillhub/js/code-highlight.js` exporting `highlightCode(code, language)` and `highlightAll(root = document)`
    - Implement an HTML escaper (`<`, `>`, `&`) applied before tokenizing; empty input returns empty string; unrecognized language returns escaped source with no spans
    - Implement per-language tokenizers for `javascript`, `python`, `bash`, `json`, matching comments and strings before keywords/numbers, wrapping tokens in `hljs-keyword`, `hljs-string`, `hljs-attr` (JSON keys before `:`), `hljs-comment`, `hljs-number` spans
    - Implement `highlightAll(root)` for each `<code>` with a recognized `language-`/`lang-` class: skip if `data-highlighted === 'true'`, else set `innerHTML = highlightCode(textContent, lang)`, add `hljs` class, set `dataset.highlighted = 'true'`; leave unrecognized `<code>` unchanged and unmarked
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 4.2 Verify highlighter against property and unit tests
    - **Property 9: Unknown-Language Escape Identity** — unrecognized lang returns escaped source, no spans
    - **Property 10: Escape-Before-Highlight Safety** — special chars escaped before markup
    - **Property 11: Highlight Idempotence and Marking** — `hljs` + `data-highlighted` on recognized, re-run changes nothing, unrecognized stays unmarked
    - **Validates: Requirements 7.2, 7.3, 7.5, 7.6, 7.7**
    - Run `npx vitest --run skillhub/tests/code-highlight.test.js`

- [x] 5. Implement the guardrail self-assessment (`skillhub/js/self-assessment.js`)
  - [x] 5.1 Implement the five-layer checklist evaluation and DOM gating
    - Create `skillhub/js/self-assessment.js` exporting `GUARDRAIL_LAYERS` exactly as `['permissions','operational-limits','human-approval','observability','kill-switch']`
    - Implement `evaluateGuardrailChecklist(layers)` returning `{ passed, missing, covered }` by normalize (lowercase) → filter-to-known → dedup → order by `GUARDRAIL_LAYERS`; `passed` when all five covered; `missing` the ordered uncovered required layers
    - Implement `readCheckedLayers(container)` returning `data-layer` of each checked `input.guardrail-check`
    - Implement `initGuardrailChecklist({ container, resultEl, completeBtn, locale })` attaching `change` listeners that recompute evaluation and set `completeBtn.disabled = !passed`, starting disabled; on pass, clicking the complete button calls `progress.markLessonComplete(lessonSlug)`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 5.2 Verify self-assessment against property and unit tests
    - **Property 12: Guardrail Checklist Evaluation** — `passed`/`missing` over normalized, deduped, known layers
    - **Property 13: Checklist Read and Gating** — `readCheckedLayers` returns the checked subset, button disabled unless all five
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**
    - Run `npx vitest --run skillhub/tests/self-assessment.test.js`

- [x] 6. Checkpoint - leaf and self-contained modules green
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement the navigation module (`skillhub/js/navigation.js`)
  - [x] 7.1 Implement sidebar rendering and lesson navigation
    - Create `skillhub/js/navigation.js` importing `lessons` from `./lessons.js` and `detectLocale` from `./i18n.js`
    - Resolve active locale from `getStoredLocalePreference()` falling back to `detectLocale()`/`'en'`
    - Implement `renderSidebar(container, lessons, completedIds)` grouping by track order `['morning','afternoon','sandbox']`, emitting one `.sidebar-section` per non-empty group with an `<h2 class="sidebar-section-title">` using the exact EN/FR track titles from the design, and a `<ul class="sidebar-nav">` of `<li>` lesson links
    - Each lesson link: text = `title[locale]`, `href = "/<locale>/<slug>.html"`, `data-slug` and `data-lesson-id` set; add `completed` class + completion `aria-label` when in `completedIds` or when its completion key is `'true'`; add `active` + `aria-current="page"` when its slug matches the current pathname; empty list renders zero sections without throwing
    - Implement `navigateToLesson(slug, locale)` navigating to `"/<locale>/<slug>.html"` for valid locale, else using `detectLocale()`, via `window.location.href`
    - Implement `initNavigation(lessons, completedIds)` rendering into `.sidebar` if present then calling `initHamburgerMenu()`, no-throw when `.sidebar` absent
    - _Requirements: 2.5, 2.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 7.2 Implement the responsive hamburger menu
    - Implement `initHamburgerMenu()` locating `.hamburger-btn` and `.sidebar`, returning early (no throw) if either is absent
    - Set button `aria-label="Toggle navigation menu"`, `aria-expanded="false"`, `aria-controls="sidebar-nav"`
    - Toggle `.sidebar` `open` class on click syncing `aria-expanded`; remove `open` on outside click while open and on `Escape` keydown while open
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 7.3 Verify navigation against unit tests
    - **Property 8: Sidebar Rendering Fidelity** — link text, `href`, `data-slug`, `completed`/`active` states per active locale
    - **Validates: Requirements 2.5, 5.2, 5.3, 5.4, 5.5, 5.6**
    - Run `npx vitest --run skillhub/tests/navigation.test.js`

- [x] 8. Implement page bootstrap and entry module (`skillhub/js/main.js`)
  - [x] 8.1 Implement `initApp` orchestration
    - Create `skillhub/js/main.js` importing `highlightAll` from `./code-highlight.js`, `getCompletionPercentage` from `./progress.js`, and `lessons` from `./lessons.js`
    - Implement `initApp()` to never throw: call `highlightAll()`; if a progress bar is present compute `pct = getCompletionPercentage(lessons.length)` and set `.progress-bar`/`.progress-bar-fill` width + `aria-valuenow` and `.progress-text`/`.progress-percent` text to `pct + '%'` (query both selector families); conditionally wire navigation and self-assessment on element presence; complete silently when no progress elements exist
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 8.2 Create the lesson-page entry module
    - Create a small entry module under `skillhub/js/` that imports `initApp` and calls it on `DOMContentLoaded`
    - _Requirements: 9.1_

  - [ ]* 8.3 Verify bootstrap against unit tests
    - Confirm `initApp` never throws, highlights recognized code blocks, and paints the progress bar from the live catalog total
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
    - Run `npx vitest --run skillhub/tests/main.test.js`

- [x] 9. Wire lesson pages to load the runtime
  - [x] 9.1 Add the runtime entry module to lesson pages
    - Update `en/` and `fr/` lesson pages (which today load only `../assets/js/diagrams.js`) to additionally load the entry module via `<script type="module">`
    - Ensure `threat-modeling-workshop` and `agent-design-capstone` pages in both locales embed the five `data-layer="..."` guardrail checkboxes, a `btn-mark-complete` button starting `disabled`, and load `self-assessment.js`, as read by `self-assessment.test.js`
    - _Requirements: 8.6, 8.7, 9.1, 9.2, 9.3_

- [x] 10. Verify SCORM export and launch redirect
  - [x] 10.1 Confirm the SCORM build bundles the runtime and preserves the launch contract
    - Run the SCORM build and the SCORM test suite to confirm `skillhub/js/` is bundled, the manifest declares the SCO with `href="index.html"` and SCORM `1.2`, and the launch page still selects locale by `stored > fr-browser > en` and redirects to the explicit `<locale>/index.html` (noscript links to explicit files)
    - Do not modify `scripts/build-scorm.mjs` or `skillhub/index.html` redirect logic; adjust only if a test reveals the runtime placement broke bundling
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 10.2 Verify SCORM and launch tests
    - **Property 14: Launch Locale Selection Independent of Host** — locale selection independent of host path resolution, always `'en'`/`'fr'`
    - **Validates: Requirements 10.3, 10.4**
    - Run `npx vitest --run skillhub/tests/scorm-build-integration.test.js skillhub/tests/scorm-render-manifest.test.js skillhub/tests/scorm-launch-redirect.test.js skillhub/tests/scorm-launch-redirect-baseurl.test.js skillhub/tests/scorm-launch-locale-preservation.property.test.js skillhub/tests/scorm-multi-lab.test.js skillhub/tests/scorm-derive-metadata.test.js`

- [x] 11. Final checkpoint - run the full suite and confirm green
  - Run `npx vitest --run` and confirm every test under `skillhub/tests/` passes, including `deliverables.test.js`; fix any remaining failures before completing
  - _Requirements: 1.1-1.10, 2.1-2.6, 3.1-3.5, 4.1-4.4, 5.1-5.7, 6.1-6.6, 7.1-7.7, 8.1-8.7, 9.1-9.4, 10.1-10.6_

## Notes

- Tasks marked with `*` are optional test-verification sub-tasks and can be skipped for a faster MVP; core implementation sub-tasks are never optional.
- Each task references the specific requirements it satisfies for traceability.
- Modules are sequenced in acyclic dependency order so leaves (`i18n.js`, `lessons.js`) land before their consumers (`navigation.js`, `main.js`).
- Property tests validate the universal correctness properties from the design; unit tests pin exact strings, DOM shapes, and error behavior.
- Checkpoints provide incremental validation; the final task runs the full `npx vitest --run` suite as the oracle for completion.
- No changes to `scripts/build-scorm.mjs` behavior or `skillhub/index.html` redirect logic; Requirement 10 is preserve-and-verify.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "4.1", "5.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "3.2", "4.2", "5.2"] },
    { "id": 2, "tasks": ["7.1", "7.2"] },
    { "id": 3, "tasks": ["7.3", "8.1"] },
    { "id": 4, "tasks": ["8.2"] },
    { "id": 5, "tasks": ["8.3", "9.1"] },
    { "id": 6, "tasks": ["10.1"] },
    { "id": 7, "tasks": ["10.2"] }
  ]
}
```
