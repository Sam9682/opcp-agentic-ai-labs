# Implementation Plan

## Overview

This plan fixes two related defects in the SkillHub bilingual experience using the
exploratory bugfix workflow: the inert header locale toggle and the index pages
that never run the shared runtime. It follows explore → preserve → implement →
validate, writing a bug-condition exploration test and preservation property
tests before the fix, then applying the minimal additive changes and re-running
the same tests to confirm the fix works without regressions.

## Task Dependency Graph

- Task 1 (bug condition exploration test) — no dependencies; written and run on unfixed code first.
- Task 2 (preservation property tests) — no dependencies; written and run on unfixed code first.
- Task 3 (fix implementation) — depends on Tasks 1 and 2.
  - 3.1 `initLocaleSwitcher()` — depends on Task 1.
  - 3.2 wire into `initApp()` — depends on 3.1.
  - 3.3 load runtime on `en/index.html` — depends on 3.2.
  - 3.4 load runtime on `fr/index.html` — depends on 3.2.
  - 3.5 verify exploration test passes — depends on 3.1, 3.2, 3.3, 3.4.
  - 3.6 verify preservation tests pass — depends on 3.1, 3.2, 3.3, 3.4.
- Task 4 (unit/property/integration tests) — depends on Task 3.
- Task 5 (checkpoint) — depends on all prior tasks.

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2"],
      "dependencies": []
    },
    {
      "wave": 2,
      "tasks": ["3.1"],
      "dependencies": ["1", "2"]
    },
    {
      "wave": 3,
      "tasks": ["3.2"],
      "dependencies": ["3.1"]
    },
    {
      "wave": 4,
      "tasks": ["3.3", "3.4"],
      "dependencies": ["3.2"]
    },
    {
      "wave": 5,
      "tasks": ["3.5", "3.6"],
      "dependencies": ["3.1", "3.2", "3.3", "3.4"]
    },
    {
      "wave": 6,
      "tasks": ["4"],
      "dependencies": ["3.5", "3.6"]
    },
    {
      "wave": 7,
      "tasks": ["5"],
      "dependencies": ["4"]
    }
  ]
}
```

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Locale toggle switches language and index pages run the runtime
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists (inert locale buttons; index runtime never runs)
  - **Scoped PBT Approach**: For the deterministic form of this bug, scope the property to concrete failing cases — EN→FR and FR→EN clicks on both lesson and index DOMs, plus an index page-load that leaves the progress bar at static `0%`
  - Add the test alongside the existing Vitest + jsdom suite (e.g. `skillhub/tests/i18n-locale-switcher.property.test.js` and/or in `skillhub/tests/main.test.js`)
  - Implement the test from the Bug Condition in design (`isBugCondition`):
    - Form A: build a jsdom DOM with a `.locale-switcher` containing EN/FR `button[data-locale]` elements, run `initApp()` (unfixed), dispatch a `click` on a button, and assert `switchLocale(button.dataset.locale)` was invoked — spying on persistence (`localStorage`) and navigation (`window.location.href`) side effects
    - Form B: render an index page's header markup, run `initApp()` (unfixed), and assert the progress bar is NOT recomputed from the live catalog (stays at static `0%`)
  - The test assertions should match the Expected Behavior Properties from design (Property 1): clicking FR on `/en/lesson.html` → persist `"fr"` and navigate to `/fr/lesson.html`; clicking FR on `/en/` → persist `"fr"` and navigate to `/fr/`; clicking EN on `/fr/` → persist `"en"` and navigate to `/en/`; index `initApp()` run paints the progress bar
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g. "clicking FR triggers no persistence and no navigation — no click listener attached; index `initApp()` never runs because `app.js` script tag is absent")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - All non-toggle, non-index runtime behavior is unchanged
  - **IMPORTANT**: Follow observation-first methodology — run the UNFIXED code for non-bug-condition inputs, record the actual outputs, then write property-based tests asserting those observed outputs
  - Observe on UNFIXED code and capture behavior to preserve:
    - Direct `switchLocale(target)` calls normalize, persist, and rewrite `window.location.href` for arbitrary target/path inputs (Requirement 3.1)
    - A lesson DOM running `initApp()` wires code highlighting, the progress bar, navigation, and the guardrail self-assessment (Requirement 3.2)
    - `initApp()` on a DOM without `.locale-switcher` does not throw and attaches no toggle handlers (Requirement 3.3)
    - `detectLocale`, `getStoredLocalePreference`, `setLocalePreference`, `normalizeLocale` behave as specified, including graceful degradation when `localStorage` is unavailable (Requirement 3.4)
    - `renderSidebar` groups lessons by track, applies localized titles, and marks completed/active lessons (Requirement 3.5)
  - Reuse the existing `skillhub/tests/i18n.test.js`, `skillhub/tests/i18n.property.test.js`, and `skillhub/tests/main.test.js` suites, and add property-based coverage (in the style of `i18n.property.test.js`) over arbitrary locale/path inputs confirming `switchLocale` is driven identically whether called directly or via a wired click
  - Property-based testing generates many test cases for stronger preservation guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for inert locale toggle and un-run index runtime

  - [x] 3.1 Add exported `initLocaleSwitcher()` in `skillhub/js/i18n.js`
    - Query all `.locale-switcher button[data-locale]` elements; if none are present (or `document` is undefined), return without side effects so pages/tests omitting the switcher initialize unchanged
    - For each button, attach a `click` listener that reads `button.dataset.locale` (or the `data-locale` attribute) and calls `switchLocale(locale)`
    - Rely on the existing, tested `switchLocale` for normalization, persistence, and navigation — do not duplicate locale logic
    - _Bug_Condition: isBugCondition(input) — Form A: locale-button click with no handler wired_
    - _Expected_Behavior: expectedBehavior(result) from design — click invokes `switchLocale(button.dataset.locale)` (persist + navigate to matching route)_
    - _Preservation: Preservation Requirements from design (3.1, 3.3)_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.3_

  - [x] 3.2 Wire `initLocaleSwitcher` into `initApp()` in `skillhub/js/main.js`
    - Import `initLocaleSwitcher` from `./i18n.js`
    - Add a `runStep(wireLocaleSwitcher)` call inside `initApp()`, where `wireLocaleSwitcher` guards on `document` presence and delegates to `initLocaleSwitcher()`
    - Preserve the existing fail-isolation contract: a failure in locale wiring must not abort the other bootstrap steps, and `initApp()` must still never throw
    - _Bug_Condition: isBugCondition(input) — Form A/B: wiring step never executes_
    - _Expected_Behavior: expectedBehavior(result) from design — `initApp()` wires the toggle alongside highlighting, progress, navigation, guardrail_
    - _Preservation: Preservation Requirements from design (3.2, 3.3)_
    - _Requirements: 2.1, 2.5, 3.2, 3.3_

  - [x] 3.3 Load the shared runtime on `skillhub/en/index.html`
    - Replace the trailing `<!-- JavaScript modules will be loaded here in later tasks -->` placeholder (just before `</body>`) with `<script type="module" src="../js/app.js"></script>`, matching the lesson pages
    - _Bug_Condition: isBugCondition(input) — Form B: index page load never runs the shared runtime_
    - _Expected_Behavior: expectedBehavior(result) from design — index `initApp()` runs, paints the progress bar, wires the toggle_
    - _Preservation: Preservation Requirements from design (3.2)_
    - _Requirements: 2.4, 2.5_

  - [x] 3.4 Load the shared runtime on `skillhub/fr/index.html`
    - Replace the trailing `<!-- Les modules JavaScript seront chargés ici dans les tâches suivantes -->` placeholder (just before `</body>`) with `<script type="module" src="../js/app.js"></script>`
    - Confirm header parity: with `app.js` loaded on both index pages, the English and French index headers present and behave identically (French layout as reference). If a review surfaces a residual static divergence, align the English markup to the French reference
    - _Bug_Condition: isBugCondition(input) — Form B: index page load never runs the shared runtime_
    - _Expected_Behavior: expectedBehavior(result) from design — both index pages run `initApp()` and present an identical, fully wired header_
    - _Preservation: Preservation Requirements from design (3.2)_
    - _Requirements: 2.5_

  - [x] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Locale toggle switches language and index pages run the runtime
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — clicks invoke `switchLocale`, index `initApp()` paints the progress bar and wires the toggle)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - All non-toggle, non-index runtime behavior is unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions — `switchLocale`/`detectLocale`/persistence, lesson bootstrap, no-switcher degradation, and sidebar rendering all unchanged)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Add unit, property-based, and integration tests aligned with the Vitest + jsdom suite
  - Unit tests (`skillhub/tests/i18n.test.js` / `skillhub/tests/main.test.js`):
    - `initLocaleSwitcher()` attaches a click handler to each `.locale-switcher button[data-locale]` that calls `switchLocale` with the button's `data-locale`
    - `initApp()` invokes locale-switcher wiring and still wires highlighting, progress, navigation, and guardrail steps
    - `initApp()` on a DOM without `.locale-switcher` does not throw and attaches no handlers (edge case)
    - `initApp()` never throws even if a single step fails (fail-isolation)
  - Property-based tests (style of `skillhub/tests/i18n.property.test.js`):
    - For arbitrary target locale values and arbitrary pathnames, a wired click produces exactly the same persistence + navigation as a direct `switchLocale` call
    - For arbitrary DOMs with and without a `.locale-switcher`, `initApp()` never throws and wires the toggle only when buttons are present
  - Integration tests:
    - Full index-page flow: load `en/index.html` and `fr/index.html` DOM, run `initApp()`, assert the header progress bar is painted and the EN/FR toggle is wired on both, confirming identical header behavior across locales
    - Toggle navigation flow: from each index page, clicking the other locale navigates to the matching `/en/` or `/fr/` route and persists the preference
    - Confirm both index pages include `<script type="module" src="../js/app.js">` so the runtime loads in the browser as on lesson pages
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Checkpoint - Ensure all tests pass
  - Run the full `skillhub/tests/` Vitest suite (use `--run` for a single execution, not watch mode)
  - Ensure all tests pass — exploration/fix-checking tests green, preservation tests green, no regressions
  - Ask the user if questions arise

## Notes

- Tasks 1 and 2 MUST be completed before any implementation in Task 3. The
  exploration test (Property 1) MUST FAIL on unfixed code and the preservation
  tests (Property 2) MUST PASS on unfixed code before the fix is applied.
- Tasks 3.5 and 3.6 re-run the SAME tests authored in Tasks 1 and 2 — do not
  write new tests for verification.
- All changes are minimal and additive; no change touches `switchLocale`,
  `detectLocale`, persistence, or `renderSidebar` behavior.
- Run Vitest with `--run` for single execution (not watch mode).
