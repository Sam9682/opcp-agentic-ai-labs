# Bugfix Requirements Document

## Introduction

The SkillHub bilingual training site exposes an EN/FR language toggle in the
header (`.locale-switcher` buttons carrying `data-locale="en"` and
`data-locale="fr"`) and a header progress bar (`.progress-bar-container`). Two
related defects affect the experience:

1. **Language switch does nothing.** Clicking the EN or FR button in the header
   has no effect: the page is not re-rendered in the selected language and the
   URL is not switched to the matching locale route (`/en/` or `/fr/`). Code
   inspection shows the `switchLocale()` function in `skillhub/js/i18n.js` is
   fully implemented and tested, but no code anywhere attaches a click handler
   to the `.locale-switcher` buttons, so the buttons are inert on every page.

2. **Index pages do not render the shared runtime, producing a layout/header
   difference between locales.** Both `skillhub/en/index.html` and
   `skillhub/fr/index.html` contain the same static header markup (progress bar
   + locale switcher), but neither index page loads the shared bootstrap
   (`<script type="module" src="../js/app.js">`), unlike every lesson page.
   Without `initApp()`, the header progress bar is never populated and no
   runtime behavior (including the language toggle wiring that this fix adds) is
   active on the landing pages. The observed symptom is that the English index
   page header appears to be missing the progress bar and the EN/FR toggle while
   the French index page shows them. The French index layout is the reference;
   the English index must match it, and both must behave identically at runtime.

The fix must make the EN/FR toggle actually switch locale and re-render the page
in the chosen language on all pages, and ensure the `/en/` and `/fr/` index
pages present and behave identically (French layout as the reference).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks the EN or FR button in the header `.locale-switcher` THEN the system does nothing: the page is neither re-rendered in the selected language nor navigated to the matching locale route
1.2 WHEN a user is on the English index page (`/en/`) and clicks FR THEN the system does not navigate to the French index page (`/fr/`)
1.3 WHEN a user is on the French index page (`/fr/`) and clicks EN THEN the system does not navigate to the English index page (`/en/`)
1.4 WHEN the English index page (`/en/`) is loaded THEN the system does not load the shared bootstrap script, so the header progress bar is not populated and the header does not match the French index page layout
1.5 WHEN either index page (`/en/` or `/fr/`) is loaded THEN the system does not run the shared runtime, so the locale toggle remains inert even if its markup is present

### Expected Behavior (Correct)

2.1 WHEN a user clicks the EN or FR button in the header `.locale-switcher` THEN the system SHALL persist the chosen locale and navigate to the matching locale route so the page re-renders in the selected language
2.2 WHEN a user is on the English index page (`/en/`) and clicks FR THEN the system SHALL navigate to the French index page (`/fr/`)
2.3 WHEN a user is on the French index page (`/fr/`) and clicks EN THEN the system SHALL navigate to the English index page (`/en/`)
2.4 WHEN the English index page (`/en/`) is loaded THEN the system SHALL load the shared bootstrap script so the header progress bar is populated and the header matches the French index page layout
2.5 WHEN either index page (`/en/` or `/fr/`) is loaded THEN the system SHALL run the shared runtime so the locale toggle is wired and functional, presenting identical header layout and behavior across both locales

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `switchLocale(target)` is called directly THEN the system SHALL CONTINUE TO normalize the target, persist the locale preference, and set `window.location.href` to the locale-rewritten path (or `/<locale>/` when no locale segment is present) exactly as today
3.2 WHEN a lesson page (non-index) is loaded THEN the system SHALL CONTINUE TO run `initApp()` and wire code highlighting, the progress bar, lesson navigation, and the guardrail self-assessment as it does today
3.3 WHEN a page has no `.locale-switcher` buttons THEN the system SHALL CONTINUE TO initialize without error and skip locale-toggle wiring
3.4 WHEN locale detection and persistence run (`detectLocale`, `getStoredLocalePreference`, `setLocalePreference`, `normalizeLocale`) THEN the system SHALL CONTINUE TO behave exactly as specified, including graceful degradation when `localStorage` is unavailable
3.5 WHEN the sidebar is rendered via `renderSidebar` THEN the system SHALL CONTINUE TO group lessons by track, apply localized titles, and mark completed and active lessons exactly as today
