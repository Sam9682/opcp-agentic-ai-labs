# Language Switch and Layout Fix Bugfix Design

## Overview

Two related defects break the SkillHub bilingual (EN/FR) experience.

First, the header language toggle is inert. The `.locale-switcher` contains two
`button[data-locale]` elements (EN and FR) on every authored page, and
`switchLocale(target)` in `skillhub/js/i18n.js` is fully implemented and
unit-tested — it normalizes the target, persists the preference, and rewrites
`window.location.href` to the matching locale route. But nothing in the runtime
ever attaches a click handler to those buttons, so clicking EN or FR does
nothing on any page.

Second, the two landing pages do not run the shared runtime at all. Every lesson
page ends with `<script type="module" src="../js/app.js"></script>`, which runs
`initApp()` and wires code highlighting, the progress bar, navigation, and the
guardrail checklist. Neither `skillhub/en/index.html` nor `skillhub/fr/index.html`
loads that bootstrap — both end with a placeholder comment instead. As a result
the header progress bar is never populated on either index page, and (combined
with the first defect) the locale toggle is doubly dead there. The French index
is the layout reference; the English index must match it, and both must behave
identically once the runtime runs.

The fix has two minimal, additive parts:

1. Add a locale-switcher wiring step — a new `initLocaleSwitcher()` in
   `skillhub/js/i18n.js`, invoked from `initApp()` in `skillhub/js/main.js` —
   that finds every `.locale-switcher button[data-locale]`, and on click calls
   `switchLocale(button.dataset.locale)`. The step is guarded on element
   presence so pages without a switcher initialize unchanged.
2. Add `<script type="module" src="../js/app.js"></script>` to both
   `skillhub/en/index.html` and `skillhub/fr/index.html` so the shared runtime
   runs on the landing pages exactly as it does on lesson pages.

Neither change touches `switchLocale`, `detectLocale`, persistence, or
`renderSidebar` behavior, so all existing functionality is preserved.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — a user clicks a
  `.locale-switcher button[data-locale]` button, or an index page loads, and no
  locale switch / runtime bootstrap occurs.
- **Property (P)**: The desired behavior — clicking a locale button persists the
  chosen locale and navigates to the matching route, and both index pages run
  `initApp()` and present an identical, fully wired header.
- **Preservation**: All existing behavior that must remain unchanged —
  `switchLocale`/`detectLocale`/persistence semantics, lesson-page bootstrap,
  sidebar rendering, and graceful degradation when a feature's markup is absent.
- **initApp**: The bootstrap in `skillhub/js/main.js` that each page's `app.js`
  entry runs on load; it conditionally wires each capability on element presence
  and never throws.
- **switchLocale(target)**: The function in `skillhub/js/i18n.js` that
  normalizes `target`, persists it, and sets `window.location.href` to the
  locale-rewritten path (or `/<locale>/` when the path has no locale segment).
- **initLocaleSwitcher**: The new wiring step (added in `skillhub/js/i18n.js`)
  that attaches click handlers to `.locale-switcher button[data-locale]`.
- **.locale-switcher**: The header container holding the EN/FR buttons; each
  button carries a `data-locale` attribute of `"en"` or `"fr"`.
- **app.js**: The per-page module entry (`skillhub/js/app.js`) that runs
  `initApp()` on `DOMContentLoaded` (or immediately if the document is ready).

## Bug Details

### Bug Condition

The bug manifests in two forms. Form A: a user clicks a header locale button and
no handler is attached, so `switchLocale` is never invoked. Form B: an index
page (`/en/` or `/fr/`) is loaded and never loads `app.js`, so `initApp()` never
runs — the progress bar stays at its static `0%` and no runtime wiring (including
the locale toggle) is active.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UiEvent
         (a page load, or a click on a .locale-switcher button[data-locale])
  OUTPUT: boolean

  // Form A: locale button click with no handler wired
  IF input.type == 'locale-button-click'
     AND input.button MATCHES '.locale-switcher button[data-locale]'
  THEN
    RETURN NOT clickInvokes(switchLocale, input.button.dataset.locale)

  // Form B: index page load that never runs the shared runtime
  IF input.type == 'page-load'
     AND input.path IN ['/en/', '/fr/']
  THEN
    RETURN NOT initAppWasRun(input.path)

  RETURN false
END FUNCTION
```

### Examples

- On `/en/assistant-vs-agent.html` (a lesson page), clicking FR does nothing —
  expected: persist `"fr"` and navigate to `/fr/assistant-vs-agent.html`.
- On `/en/` (index), clicking FR does nothing — expected: persist `"fr"` and
  navigate to `/fr/`.
- On `/fr/` (index), clicking EN does nothing — expected: persist `"en"` and
  navigate to `/en/`.
- On `/en/` (index) page load, the header progress bar stays at the static `0%`
  markup and is never recomputed from the live catalog — expected: `initApp()`
  runs and paints the bar like on lesson pages.
- Edge case: a page with no `.locale-switcher` (e.g. the Vitest/jsdom test DOM)
  must still initialize without error and simply skip locale-toggle wiring.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `switchLocale(target)` continues to normalize, persist, and rewrite
  `window.location.href` exactly as today (Requirement 3.1).
- Lesson (non-index) pages continue to run `initApp()` and wire code
  highlighting, the progress bar, navigation, and the guardrail checklist
  (Requirement 3.2).
- A page with no `.locale-switcher` continues to initialize without error and
  simply skips locale-toggle wiring (Requirement 3.3).
- `detectLocale`, `getStoredLocalePreference`, `setLocalePreference`, and
  `normalizeLocale` continue to behave exactly as specified, including graceful
  degradation when `localStorage` is unavailable (Requirement 3.4).
- `renderSidebar` continues to group lessons by track, apply localized titles,
  and mark completed and active lessons exactly as today (Requirement 3.5).

**Scope:**
All inputs that do NOT involve a locale-button click or an index-page load are
completely unaffected by this fix. This includes:
- Direct programmatic calls to `switchLocale` and all other i18n functions.
- All lesson-page bootstrap on pages that already load `app.js`.
- Any page (including the test DOM) that omits the `.locale-switcher` markup.

The concrete expected correct behavior for buggy inputs is defined in the
Correctness Properties section (Property 1).

## Hypothesized Root Cause

Based on the bug description and code inspection, the causes are confirmed:

1. **Missing locale-switcher wiring**: `switchLocale` exists and is tested, but
   no module queries `.locale-switcher button[data-locale]` or attaches a
   `click` listener. `initApp()` in `main.js` wires highlighting, progress,
   navigation, and self-assessment, but has no step for the locale toggle. The
   buttons are therefore inert on every page.

2. **Index pages never load the runtime**: `skillhub/en/index.html` and
   `skillhub/fr/index.html` end with a placeholder comment where lesson pages
   have `<script type="module" src="../js/app.js"></script>`. Without the
   bootstrap, `initApp()` never runs on the landing pages: the header progress
   bar is never painted, and even after fix #1 the toggle would stay dead on the
   index pages because the wiring step never executes there.

3. **Index layout divergence is a symptom, not an independent cause**: both
   index pages carry equivalent static header markup; the English page only
   appears to lack the progress bar / toggle because nothing populates or wires
   them at runtime. Loading `app.js` on both pages makes their headers behave
   identically. The French index is the reference layout.

## Correctness Properties

Property 1: Bug Condition - Locale toggle switches language and index pages run the runtime

_For any_ input where the bug condition holds (isBugCondition returns true), the
fixed code SHALL produce the correct behavior: (a) a click on a
`.locale-switcher button[data-locale]` button SHALL invoke
`switchLocale(button.dataset.locale)`, persisting the chosen locale and
navigating to the matching locale route so the page re-renders in the selected
language; and (b) an index page load (`/en/` or `/fr/`) SHALL run `initApp()`,
populating the header progress bar and wiring the locale toggle so both index
pages present and behave identically.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - All non-toggle, non-index runtime behavior is unchanged

_For any_ input where the bug condition does NOT hold (isBugCondition returns
false) — direct calls to `switchLocale`/`detectLocale`/persistence functions,
lesson-page bootstrap, sidebar rendering, and pages without a
`.locale-switcher` — the fixed code SHALL produce exactly the same result as the
original code, preserving locale normalization/persistence/navigation,
lesson-page wiring, graceful degradation, and sidebar rendering.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `skillhub/js/i18n.js`

**Function**: new `initLocaleSwitcher()` (exported)

**Specific Changes**:
1. **Add `initLocaleSwitcher()`**: Query all
   `.locale-switcher button[data-locale]` elements. If none are present (or
   `document` is undefined), return without side effects — this preserves
   behavior on pages/tests that omit the switcher (Requirement 3.3).
   - For each button, attach a `click` listener that reads
     `button.dataset.locale` (or the `data-locale` attribute) and calls
     `switchLocale(locale)`.
   - The handler relies on the existing, tested `switchLocale` for
     normalization, persistence, and navigation — no locale logic is duplicated
     (preserves Requirement 3.1).

**File**: `skillhub/js/main.js`

**Function**: `initApp()`

2. **Wire the new step**: Import `initLocaleSwitcher` from `./i18n.js` and add a
   `runStep(wireLocaleSwitcher)` call inside `initApp()`, where
   `wireLocaleSwitcher` guards on `document` presence and delegates to
   `initLocaleSwitcher()`. Wrapping it in `runStep` keeps the existing
   fail-isolation contract: a failure in locale wiring must not abort the other
   bootstrap steps and `initApp()` must still never throw (Requirements 9.1,
   9.4, and 3.2/3.3 preservation).

**File**: `skillhub/en/index.html`

3. **Load the shared runtime**: Replace the trailing
   `<!-- JavaScript modules will be loaded here in later tasks -->` placeholder
   (just before `</body>`) with
   `<script type="module" src="../js/app.js"></script>`, matching the lesson
   pages (Requirement 2.4).

**File**: `skillhub/fr/index.html`

4. **Load the shared runtime**: Replace the trailing
   `<!-- Les modules JavaScript seront chargés ici dans les tâches suivantes -->`
   placeholder (just before `</body>`) with
   `<script type="module" src="../js/app.js"></script>` (Requirements 2.5).

5. **Confirm header parity**: With `app.js` loaded on both pages, `initApp()`
   paints `.progress-bar-fill`/`.progress-percent` and wires the toggle on each
   index page, so the English and French index headers present and behave
   identically (French layout as reference, Requirement 2.5). No static markup
   changes are required because the headers are already structurally equivalent;
   if a review surfaces a residual static divergence, align the English markup
   to the French reference.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface
counterexamples that demonstrate the bug on the unfixed code (inert buttons,
un-run index runtime), then verify the fix wires the toggle and runs the runtime
while preserving every unchanged behavior. Tests run under the existing Vitest +
jsdom setup used by `skillhub/tests/`.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing
the fix. Confirm or refute the root cause analysis. If we refute it, we must
re-hypothesize.

**Test Plan**: Build a jsdom DOM containing a `.locale-switcher` with EN/FR
`button[data-locale]` elements, run `initApp()` (unfixed), dispatch a click on a
button, and assert `switchLocale` was invoked (spying on navigation /
`localStorage` side effects). Separately, assert that loading an index page's
markup and running the runtime currently leaves the progress bar at static `0%`.
Run these on the UNFIXED code to observe failures.

**Test Cases**:
1. **Locale click on lesson DOM**: With `pathname` `/en/lesson.html`, click the
   FR button; expect navigation to `/fr/lesson.html` and persisted `"fr"` (will
   fail on unfixed code — no handler attached).
2. **Index EN→FR**: With `pathname` `/en/`, click FR; expect navigation to
   `/fr/` and persisted `"fr"` (will fail on unfixed code).
3. **Index FR→EN**: With `pathname` `/fr/`, click EN; expect navigation to
   `/en/` and persisted `"en"` (will fail on unfixed code).
4. **Index runtime run**: Render index header markup, run `initApp()`; expect
   the progress bar painted from the live catalog (will fail on unfixed code
   because index pages never load `app.js` / run the runtime).

**Expected Counterexamples**:
- Clicking a locale button triggers no persistence and no navigation.
- Possible causes: no click listener attached, no wiring step in `initApp()`,
  index pages omit the `app.js` script tag.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed
function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := runFixedRuntime(input)
  ASSERT expectedBehavior(result)
  // locale-button click -> switchLocale(dataset.locale) invoked
  //                        (persist + navigate to matching route)
  // index page load      -> initApp() ran (progress bar painted, toggle wired)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the
fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalBehavior(input) = fixedBehavior(input)
  // switchLocale / detectLocale / persistence unchanged
  // lesson-page bootstrap unchanged
  // sidebar rendering unchanged
  // page without .locale-switcher initializes without error, skips wiring
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation
checking because:
- It generates many test cases automatically across the input domain.
- It catches edge cases that manual unit tests might miss.
- It provides strong guarantees that behavior is unchanged for all non-buggy
  inputs.

**Test Plan**: Reuse the existing `skillhub/tests/i18n.test.js` and
`skillhub/tests/main.test.js` suites to confirm unchanged behavior, and add
property-based coverage (in the style of `i18n.property.test.js`) over arbitrary
locale/path inputs to confirm `switchLocale` is driven identically whether
called directly or via a wired click.

**Test Cases**:
1. **switchLocale parity**: Observe that direct `switchLocale(target)` calls
   persist and navigate correctly on unfixed code; verify this is unchanged
   after fix, and that a wired click produces the identical effect.
2. **Lesson bootstrap preservation**: Observe highlighting/progress/navigation/
   guardrail wiring on a lesson DOM; verify unchanged after fix.
3. **No-switcher preservation**: Observe that `initApp()` on a DOM without
   `.locale-switcher` does not throw and skips toggle wiring; verify unchanged.
4. **Detection/persistence preservation**: Verify `detectLocale`,
   `getStoredLocalePreference`, `setLocalePreference`, `normalizeLocale`, and
   their graceful-degradation paths are unchanged.

### Unit Tests

- `initLocaleSwitcher()` attaches a click handler to each
  `.locale-switcher button[data-locale]` that calls `switchLocale` with the
  button's `data-locale`.
- `initApp()` invokes locale-switcher wiring and still wires highlighting,
  progress, navigation, and guardrail steps.
- `initApp()` on a DOM without `.locale-switcher` does not throw and attaches no
  handlers (edge case).
- `initApp()` never throws even if a single step fails (fail-isolation).

### Property-Based Tests

- For arbitrary target locale values and arbitrary pathnames, a wired click
  produces exactly the same persistence + navigation as a direct `switchLocale`
  call (fix correctness + `switchLocale` preservation).
- For arbitrary DOMs with and without a `.locale-switcher`, `initApp()` never
  throws and wires the toggle only when buttons are present.

### Integration Tests

- Full index-page flow: load `en/index.html` and `fr/index.html` DOM, run
  `initApp()`, assert the header progress bar is painted and the EN/FR toggle is
  wired on both, confirming identical header behavior across locales.
- Toggle navigation flow: from each index page, clicking the other locale
  navigates to the matching `/en/` or `/fr/` route and persists the preference.
- Confirm both index pages include `<script type="module" src="../js/app.js">`
  so the runtime loads in the browser as on lesson pages.
