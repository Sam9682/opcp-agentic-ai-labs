# Requirements Document

## Introduction

The SkillHub static site already ships a bilingual (English/French) user interface: a root redirect launch page, translated `en/` and `fr/` lesson pages with language switcher buttons, and a SCORM 1.2 build script. The shared client-side runtime that makes this UI function — the modules under `skillhub/js/` — does not yet exist, even though the test suite and SCORM build both depend on it. Only `skillhub/assets/js/diagrams.js` is present.

This feature builds out the missing `skillhub/js/` runtime so the existing bilingual UI works end to end: locale detection, language switching that stays on the same lesson, preference persistence, a lesson catalog with bilingual titles, sidebar navigation, cross-language progress tracking, client-side code highlighting, and the guardrail self-assessment checklist. It also ensures the SCORM export bundles the `js/` runtime and preserves the launch-page locale detection and redirect contract. This is not a re-translation effort and not a UI overhaul; the authored lesson content and page markup remain as they are.

The existing Vitest + fast-check test suite under `skillhub/tests/` is the behavioral oracle. Every requirement below is derived from, and must remain consistent with, that suite.

## Glossary

- **SkillHub_Site**: The static HTML/CSS/JavaScript site rooted at `skillhub/`, served either from a host or from a packaged SCORM export.
- **Runtime**: The set of shared ES modules under `skillhub/js/` (`i18n.js`, `lessons.js`, `navigation.js`, `progress.js`, `main.js`, `self-assessment.js`, `code-highlight.js`) that the lesson pages, the test suite, and the SCORM build import.
- **I18n_Module**: The `skillhub/js/i18n.js` module responsible for locale detection, locale preference persistence, and locale switching.
- **Locale**: A supported language identifier, one of the string values `"en"` or `"fr"`.
- **Locale_Preference**: The learner's chosen Locale persisted in `localStorage` under the key `skillhub-locale`.
- **Lesson_Catalog**: The `skillhub/js/lessons.js` module exporting the `lessons` array and the `getLessonBySlug` lookup function.
- **Lesson_Slug**: The Locale-independent identifier of a lesson, equal to the lesson's HTML filename without the `.html` extension (for example `assistant-vs-agent`).
- **Session_Track**: A grouping of lessons into one of three tracks: `morning`, `afternoon`, and `sandbox`.
- **Navigation_Module**: The `skillhub/js/navigation.js` module that renders the sidebar, manages the hamburger menu, and performs lesson navigation.
- **Progress_Tracker**: The `skillhub/js/progress.js` module that records and reports lesson completion in `localStorage`.
- **Completion_Key**: The `localStorage` key `skillhub_lesson_complete_<Lesson_Slug>` used by the Progress_Tracker to mark a single lesson complete.
- **Code_Highlighter**: The `skillhub/js/code-highlight.js` module that applies syntax highlighting to code blocks.
- **Self_Assessment_Module**: The `skillhub/js/self-assessment.js` module that evaluates the five-layer guardrail checklist and wires it to the DOM.
- **Guardrail_Layer**: One of the five required guardrail layers: `permissions`, `operational-limits`, `human-approval`, `observability`, `kill-switch`.
- **Main_Module**: The `skillhub/js/main.js` module exporting `initApp`, which bootstraps page behavior.
- **Launch_Page**: The SCORM/root launch file `skillhub/index.html` that performs client-side Locale detection and redirects to the Locale landing page.
- **SCORM_Build**: The `scripts/build-scorm.mjs` build process that packages the SkillHub_Site into a SCORM 1.2 export.

## Requirements

### Requirement 1: Locale Detection and Persistence

**User Story:** As a learner, I want the site to detect and remember my language, so that I see the interface in my preferred language without reselecting it each visit.

#### Acceptance Criteria

1. WHEN `detectLocale` is called and a valid Locale_Preference of `"en"` or `"fr"` is stored, THE I18n_Module SHALL return the stored Locale_Preference.
2. WHEN `detectLocale` is called with no stored Locale_Preference AND the browser language starts with `fr` (case-insensitive), THE I18n_Module SHALL return `"fr"`.
3. WHEN `detectLocale` is called with no stored Locale_Preference AND the browser language does not start with `fr`, THE I18n_Module SHALL return `"en"`.
4. THE I18n_Module SHALL return a value that is exactly `"en"` or exactly `"fr"` from every `detectLocale` call.
5. WHEN `getStoredLocalePreference` is called and the stored value is `"en"` or `"fr"`, THE I18n_Module SHALL return that stored value.
6. WHEN `getStoredLocalePreference` is called and no value is stored or the stored value is not `"en"` or `"fr"`, THE I18n_Module SHALL return `null`.
7. WHEN `setLocalePreference` is called with a value whose lowercased form starts with `fr`, THE I18n_Module SHALL store `"fr"` under the key `skillhub-locale`.
8. WHEN `setLocalePreference` is called with a value whose lowercased form does not start with `fr`, THE I18n_Module SHALL store `"en"` under the key `skillhub-locale`.
9. IF `localStorage` access throws during `detectLocale`, THEN THE I18n_Module SHALL fall back to browser-language detection and return `"en"` or `"fr"` accordingly.
10. IF `localStorage` access throws during `setLocalePreference`, THEN THE I18n_Module SHALL return without throwing an error.

### Requirement 2: Same-Lesson Language Switching

**User Story:** As a learner, I want to switch languages while staying on my current lesson, so that I do not lose my place when I change language.

#### Acceptance Criteria

1. WHEN `switchLocale` is called with a target Locale, THE I18n_Module SHALL persist the normalized Locale under the key `skillhub-locale` before navigating.
2. WHEN `switchLocale` is called with a value whose lowercased form starts with `fr`, THE I18n_Module SHALL normalize the target Locale to `"fr"`.
3. WHEN `switchLocale` is called AND the current pathname contains a leading Locale segment `/en/` or `/fr/`, THE I18n_Module SHALL navigate to the same path with the Locale segment replaced by the target Locale, preserving the Lesson_Slug filename.
4. IF `switchLocale` is called AND the current pathname contains no recognizable Locale segment, THEN THE I18n_Module SHALL navigate to the target Locale root path `/<locale>/`.
5. WHEN `navigateToLesson` is called with a Lesson_Slug and a valid Locale, THE Navigation_Module SHALL navigate to `/<locale>/<slug>.html`.
6. IF `navigateToLesson` is called with a Locale that is not `"en"` or `"fr"`, THEN THE Navigation_Module SHALL navigate using the Locale returned by `detectLocale`.

### Requirement 3: Cross-Language Progress Tracking

**User Story:** As a learner, I want my lesson completion to be shared across both languages, so that progress I make in one language is reflected when I switch to the other.

#### Acceptance Criteria

1. WHEN `markLessonComplete` is called with a Lesson_Slug, THE Progress_Tracker SHALL record that Lesson_Slug as complete under the Completion_Key, keyed by Lesson_Slug independent of Locale.
2. WHEN `getCompletedLessons` is called after a set of unique Lesson_Slugs have been marked complete, THE Progress_Tracker SHALL return exactly that set of Lesson_Slugs with no additions and no omissions.
3. WHEN `getCompletionPercentage` is called with a total count greater than zero, THE Progress_Tracker SHALL return `round(completedCount / totalCount * 100)` as an integer in the inclusive range `0` to `100`.
4. WHEN `resetProgress` is called, THE Progress_Tracker SHALL clear all recorded lesson completions.
5. THE Progress_Tracker SHALL persist completion records in `localStorage` so they survive a page reload within the same browser.

### Requirement 4: Bilingual Lesson Catalog

**User Story:** As a learner, I want a catalog of lessons with bilingual titles grouped by session, so that the sidebar presents the course consistently in either language.

#### Acceptance Criteria

1. THE Lesson_Catalog SHALL expose a `lessons` array in which each entry has a Lesson_Slug, an English title, a French title, and a Session_Track of `morning`, `afternoon`, or `sandbox`.
2. THE Lesson_Catalog SHALL contain four lessons in the `morning` Session_Track, six lessons in the `afternoon` Session_Track, and six lessons in the `sandbox` Session_Track.
3. THE Lesson_Catalog SHALL include a catalog entry for every authored Lesson_Slug required by the lesson-content test suite.
4. WHEN `getLessonBySlug` is called with a Lesson_Slug present in the catalog, THE Lesson_Catalog SHALL return that lesson entry.

### Requirement 5: Sidebar Rendering

**User Story:** As a learner, I want a sidebar that shows lessons grouped by track, marks my completed lessons, and highlights the current one, so that I can orient myself within the course.

#### Acceptance Criteria

1. WHEN `renderSidebar` is called with a non-empty lesson list, THE Navigation_Module SHALL render three sidebar sections corresponding to the `morning`, `afternoon`, and `sandbox` Session_Tracks.
2. WHILE the active Locale is `"en"`, THE Navigation_Module SHALL render each Session_Track title and each lesson link using its English title.
3. WHILE the active Locale is `"fr"`, THE Navigation_Module SHALL render each Session_Track title and each lesson link using its French title.
4. WHEN `renderSidebar` is called, THE Navigation_Module SHALL render each lesson link with an `href` of `/<locale>/<slug>.html` and a `data-slug` attribute equal to the Lesson_Slug.
5. WHEN a lesson is listed in the supplied completed-lessons list OR has its Completion_Key set in `localStorage`, THE Navigation_Module SHALL add the `completed` CSS class and a completion `aria-label` to that lesson's link.
6. WHEN a lesson's Lesson_Slug matches the current pathname, THE Navigation_Module SHALL add the `active` CSS class and set `aria-current="page"` on that lesson's link.
7. IF `renderSidebar` is called with an empty lesson list, THEN THE Navigation_Module SHALL render zero sidebar sections without throwing an error.

### Requirement 6: Responsive Hamburger Menu

**User Story:** As a learner on a small screen, I want a hamburger menu to open and close the sidebar, so that I can navigate lessons on mobile.

#### Acceptance Criteria

1. WHEN the hamburger button is clicked AND the sidebar is closed, THE Navigation_Module SHALL add the `open` class to the sidebar and set the button's `aria-expanded` to `"true"`.
2. WHEN the hamburger button is clicked AND the sidebar is open, THE Navigation_Module SHALL remove the `open` class from the sidebar and set the button's `aria-expanded` to `"false"`.
3. WHEN a click occurs outside the sidebar WHILE the sidebar is open, THE Navigation_Module SHALL remove the `open` class from the sidebar.
4. WHEN the Escape key is pressed WHILE the sidebar is open, THE Navigation_Module SHALL remove the `open` class from the sidebar.
5. WHEN `initHamburgerMenu` is called, THE Navigation_Module SHALL set the hamburger button's `aria-label` to `"Toggle navigation menu"`, its `aria-expanded` to `"false"`, and its `aria-controls` to `"sidebar-nav"`.
6. IF `initHamburgerMenu` is called when the hamburger button or the sidebar element is absent, THEN THE Navigation_Module SHALL return without throwing an error.

### Requirement 7: Client-Side Code Highlighting

**User Story:** As a learner, I want code samples in lessons to be syntax highlighted, so that examples are readable without an external highlighting library.

#### Acceptance Criteria

1. WHEN `highlightCode` is called with source code and a supported language of `javascript`, `python`, `bash`, or `json`, THE Code_Highlighter SHALL return HTML that wraps keywords, strings, comments, and numbers in `hljs`-prefixed span elements as defined by the highlight test suite.
2. WHEN `highlightCode` is called with an unrecognized language, THE Code_Highlighter SHALL return the HTML-escaped source code with no highlighting spans.
3. WHEN `highlightCode` is called with source code containing HTML special characters, THE Code_Highlighter SHALL HTML-escape those characters before applying highlighting.
4. WHEN `highlightCode` is called with an empty string, THE Code_Highlighter SHALL return an empty string.
5. WHEN `highlightAll` is called, THE Code_Highlighter SHALL highlight each `code` element whose class names a recognized language via a `language-` or `lang-` prefix, add the `hljs` class, and set `data-highlighted` to `"true"` on that element.
6. IF a `code` element already has `data-highlighted` set to `"true"`, THEN THE Code_Highlighter SHALL leave that element's content unchanged.
7. IF a `code` element has no recognized language class, THEN THE Code_Highlighter SHALL leave that element unhighlighted and SHALL NOT set its `data-highlighted` attribute.

### Requirement 8: Guardrail Self-Assessment Checklist

**User Story:** As a learner completing the governance lessons, I want a guardrail self-assessment that requires all five layers before I can mark the lesson complete, so that I confirm full guardrail coverage.

#### Acceptance Criteria

1. THE Self_Assessment_Module SHALL expose the five Guardrail_Layers as `GUARDRAIL_LAYERS` in the order `permissions`, `operational-limits`, `human-approval`, `observability`, `kill-switch`.
2. WHEN `evaluateGuardrailChecklist` is called with a list that covers all five Guardrail_Layers, THE Self_Assessment_Module SHALL report `passed` as `true` with an empty `missing` list.
3. WHEN `evaluateGuardrailChecklist` is called with a list missing one or more Guardrail_Layers, THE Self_Assessment_Module SHALL report `passed` as `false` and list the missing Guardrail_Layers in `missing`.
4. WHEN `evaluateGuardrailChecklist` is called, THE Self_Assessment_Module SHALL match Guardrail_Layers case-insensitively, ignore unknown layers, and deduplicate repeated layers.
5. WHEN `readCheckedLayers` is called with a container, THE Self_Assessment_Module SHALL return only the Guardrail_Layers whose checkbox inputs are checked.
6. WHILE fewer than all five Guardrail_Layer checkboxes are checked, THE Self_Assessment_Module SHALL keep the Mark-as-Complete button disabled.
7. WHEN all five Guardrail_Layer checkboxes are checked, THE Self_Assessment_Module SHALL enable the Mark-as-Complete button.

### Requirement 9: Page Bootstrap

**User Story:** As a learner, I want each page to bootstrap its behavior automatically on load, so that highlighting, progress, and navigation work without manual wiring.

#### Acceptance Criteria

1. WHEN `initApp` is called, THE Main_Module SHALL complete initialization without throwing an error.
2. WHEN `initApp` is called AND the page contains code blocks with a recognized language class, THE Main_Module SHALL apply code highlighting to those blocks.
3. WHEN `initApp` is called AND a progress bar element is present, THE Main_Module SHALL set the progress bar width, its `aria-valuenow`, and any progress text to the completion percentage computed from the Lesson_Catalog total.
4. IF `initApp` is called AND no progress elements are present in the DOM, THEN THE Main_Module SHALL complete initialization without throwing an error.

### Requirement 10: SCORM Export and Launch Redirect

**User Story:** As a course administrator, I want the SCORM export to bundle the shared runtime and preserve locale detection, so that the packaged course launches to the correct language on a SCORM host.

#### Acceptance Criteria

1. WHEN the SCORM_Build packages the SkillHub_Site, THE SCORM_Build SHALL include the `skillhub/js/` Runtime in the exported package.
2. WHEN the SCORM_Build generates the manifest, THE SCORM_Build SHALL declare the SCO launch file as `adlcp:scormtype="sco"` with `href="index.html"` and SHALL declare SCORM version `1.2`.
3. THE Launch_Page SHALL select the Locale using the precedence stored preference (`"en"` or `"fr"`) over a browser language starting with `fr` over the default `"en"`.
4. WHEN the Launch_Page redirects, THE Launch_Page SHALL target the explicit file `<locale>/index.html` and SHALL NOT target a bare `<locale>/` directory.
5. THE Launch_Page `noscript` fallback SHALL link to the explicit files `en/index.html` and `fr/index.html` and SHALL NOT link to a bare `en/` or `fr/` directory.
6. WHEN the SCORM_Build copies the Launch_Page into the package, THE SCORM_Build SHALL preserve the Launch_Page Locale-detection and explicit-file redirect behavior verbatim.
