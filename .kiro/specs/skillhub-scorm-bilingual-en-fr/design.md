# Design Document

## Overview

This design builds out the missing `skillhub/js/` ES-module runtime so the already-authored bilingual SkillHub site works end to end, and it documents the SCORM export/launch contract that the runtime must coexist with. The site is a vanilla JS / HTML static site using native ES modules (no bundler), Node `.mjs` build tooling, and a Vitest + fast-check test suite under `skillhub/tests/`.

The guiding principle is **test-as-oracle**: the existing test suite defines the exact module APIs, return shapes, DOM contracts, localStorage keys, section titles, and lesson metadata. The design is derived from those tests, not the other way around. Where the requirements under-specify (for example, extra catalog fields or exact sidebar section titles), the tests are authoritative and are captured explicitly below.

Seven runtime modules are delivered under `skillhub/js/`:

| Module | Responsibility | Primary tests |
| --- | --- | --- |
| `i18n.js` | Locale detection, persistence, normalization, same-lesson switching | `i18n.test.js`, `i18n.property.test.js` |
| `lessons.js` | Bilingual lesson catalog + query helpers | `lessons.test.js`, `lesson-content.test.js` |
| `progress.js` | Slug-keyed, cross-language completion tracking | `progress.test.js`, `progress.property.test.js` |
| `navigation.js` | Sidebar rendering, hamburger menu, lesson navigation | `navigation.test.js` |
| `code-highlight.js` | Dependency-free syntax highlighting | `code-highlight.test.js` |
| `self-assessment.js` | Five-layer guardrail checklist + DOM gating | `self-assessment.test.js` |
| `main.js` | Page bootstrap (`initApp`) wiring the above | `main.test.js` |

The SCORM build (`scripts/build-scorm.mjs`) and the root launch page (`skillhub/index.html`) already exist and pass their tests. This design treats Requirement 10 as a **preserve-and-verify** contract: the runtime must live under `skillhub/js/` so the build bundles it, and nothing may change the launch page's locale-detection or explicit-file redirect behavior.

### Goals

- Make every test under `skillhub/tests/` that imports from `../js/*` pass.
- Keep the runtime framework-free: plain ES modules, importable in both jsdom (tests) and the browser.
- Degrade gracefully when `localStorage` or DOM elements are absent or throw.
- Preserve the SCORM launch/redirect/manifest contract verbatim.

### Non-Goals

- No re-translation of lesson content and no UI/markup overhaul.
- No new runtime dependencies (highlighting is hand-rolled; no highlight.js).
- No changes to `scripts/build-scorm.mjs` behavior or `skillhub/index.html` redirect logic beyond what already ships.
- No authoring of lesson HTML bodies (covered by separate authoring work; this design only requires the catalog and checklist wiring the tests read).

## Architecture

### Module Dependency Graph

```
                         ┌───────────────┐
                         │    main.js    │  initApp()
                         │  (bootstrap)  │
                         └──────┬────────┘
             ┌──────────────────┼───────────────────┬───────────────┐
             ▼                  ▼                    ▼               ▼
      ┌────────────┐   ┌─────────────────┐   ┌─────────────┐  ┌──────────────┐
      │ navigation │   │ code-highlight  │   │  progress   │  │ self-assess  │
      │    .js     │   │      .js        │   │    .js      │  │     .js      │
      └─────┬──────┘   └─────────────────┘   └──────┬──────┘  └──────┬───────┘
            │ imports                               │ (shared key)   │ marks complete
            ▼                                       ▼                ▼
      ┌────────────┐      ┌───────────┐       ┌──────────────┐
      │  lessons   │      │  i18n.js  │◄──────┤  navigation  │ detectLocale()
      │    .js     │      └───────────┘       └──────────────┘
      └────────────┘
```

Dependency rules:

- `i18n.js` and `lessons.js` are leaf modules with no intra-runtime imports.
- `navigation.js` imports `lessons.js` (catalog) and `i18n.js` (`detectLocale`), and reads the same completion key that `progress.js` writes.
- `progress.js` is self-contained (localStorage only).
- `self-assessment.js` is self-contained for evaluation; its DOM wiring may call `progress.markLessonComplete` when the complete button fires, but the tested surface is the checklist evaluation and button gating.
- `main.js` orchestrates: highlight all code blocks, compute and paint the progress bar, and (on a lesson page) initialize navigation.

This acyclic layering keeps each module independently importable, which the per-module tests rely on.

### Runtime Environment

- **ES modules only.** Lesson pages load the runtime with `<script type="module">`. Tests import the modules directly under jsdom. No transpile/bundle step.
- **Shared global keys** (the cross-cutting contract every module must agree on):
  - Locale preference: `localStorage["skillhub-locale"]`, value exactly `"en"` or `"fr"`.
  - Completion: `localStorage["skillhub_lesson_complete_<slug>"] === "true"`.
- **Page loading contract.** Lesson pages that today load only `../assets/js/diagrams.js` additionally load the runtime entry point as a module. The entry imports `initApp` and calls it on `DOMContentLoaded`.

## Components and Interfaces

All signatures below are the exact surfaces the tests import. Code is JavaScript (the detected project language).

### `i18n.js` — Locale Module

```javascript
export const LOCALE_KEY = 'skillhub-locale';
export const SUPPORTED_LOCALES = ['en', 'fr'];

/** Normalize any input to a supported locale: lowercased startsWith 'fr' -> 'fr', else 'en'. */
export function normalizeLocale(value): 'en' | 'fr';

/** Return stored 'en'|'fr', or null if absent/invalid or on storage error. */
export function getStoredLocalePreference(): 'en' | 'fr' | null;

/** Persist normalizeLocale(value) under LOCALE_KEY; never throws on storage error. */
export function setLocalePreference(value): void;

/** Resolve locale: stored preference > browser language starting with 'fr' > 'en'. Always returns 'en'|'fr'. */
export function detectLocale(): 'en' | 'fr';

/** Persist normalized target, then navigate same-lesson: swap /en/ or /fr/ segment, else go to /<locale>/. */
export function switchLocale(target): void;
```

Behavioral contract (from `i18n.test.js`, `i18n.property.test.js`):

- `getStoredLocalePreference` returns the stored value only when it is exactly `"en"` or `"fr"`; any other stored value (e.g. `"de"`) or absence returns `null`. Wrapped in try/catch so a throwing `getItem` yields `null`.
- `setLocalePreference('fr-CA')` stores `"fr"`; `setLocalePreference('de')` stores `"en"`. A throwing `setItem` is swallowed (no throw).
- `detectLocale` precedence: a valid stored preference wins over browser language; otherwise `navigator.language`/`navigator.languages` lowercased `startsWith('fr')` → `"fr"`; otherwise `"en"`. If `getItem` throws, fall through to browser detection.
- `switchLocale('fr-BE')` on path `/en/lesson.html` persists `"fr"` and sets `window.location.href = '/fr/lesson.html'`. With no locale segment in the path, it sets `href = '/fr/'`. Segment detection replaces the first path segment matching `^/(en|fr)/` and preserves the trailing `<slug>.html`.

Degradation note: the tests stub `localStorage.getItem`/`setItem` to throw; every storage access in this module is individually guarded so a thrown error never escapes.

### `lessons.js` — Lesson Catalog

```javascript
/** Full catalog in programme order: 4 morning, 6 afternoon, 6 sandbox. */
export const lessons: Lesson[];

export function getLessonBySlug(slug): Lesson | undefined;
export function getLessonsByDifficulty(difficulty): Lesson[];   // [] for unknown difficulty
export function getLessonsByTrack(track): Lesson[];             // programme order; [] for unknown track
export function getPrerequisiteChain(slug): string[];           // topological, earliest first, no self, no dupes, [] if missing
```

`Lesson` shape (required by `lessons.test.js`):

```javascript
{
  id: string,            // equals slug; unique across catalog
  slug: string,          // filename without .html; unique
  title: { en: string, fr: string },   // both non-empty
  track: 'morning' | 'afternoon' | 'sandbox',
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  estimatedMinutes: integer 1..480,
  prerequisites: string[]   // lesson ids; acyclic; never contains self
}
```

Catalog content (slugs and order fixed by the tests):

- **morning** (track order): `assistant-vs-agent`, `agent-anatomy-7-components`, `agentic-loop-and-variants`, `stopping-criteria`.
- **afternoon**: `multi-agent-patterns`, `when-not-multi-agent`, `guardrails-5-layers`, `human-in-the-loop-ovhcloud-policy`, `threat-modeling-workshop`, `agent-design-capstone`.
- **sandbox**: `install-bare-metal`, `adding-applications`, `starting-applications`, `stopping-applications`, `making-backups`, `modifying-applications`.

Pinned facts the tests assert directly:

- `getLessonBySlug('install-bare-metal').title.en === 'Installation on Bare-Metal Ubuntu with Agentic AI'`.
- `assistant-vs-agent`: `track === 'morning'`, `prerequisites === []`.
- Prerequisite chains (topological, earliest first):
  - `agent-anatomy-7-components` → `['assistant-vs-agent']`.
  - `stopping-criteria` → `['assistant-vs-agent', 'agent-anatomy-7-components', 'agentic-loop-and-variants']`.
  - `agent-design-capstone` → the full nine-lesson morning+afternoon chain ending at `threat-modeling-workshop`.
  - `making-backups` → `['install-bare-metal']`.
- Every slug in `lesson-content.js`'s `AUTHORED_SLUGS` (all morning + all afternoon) has a catalog entry.
- `getLessonsByDifficulty` must return a non-empty group for each of `beginner`/`intermediate`/`advanced`, so difficulties are distributed across the catalog (at least one lesson each).

`getPrerequisiteChain` algorithm: depth-first over `prerequisites`, appending each prerequisite's own chain before the prerequisite itself, deduplicating via a visited set while preserving first-seen order. Returns `[]` for a missing slug.

### `progress.js` — Progress Tracker

```javascript
export const COMPLETE_PREFIX = 'skillhub_lesson_complete_';

export function markLessonComplete(slug): void;        // sets <prefix><slug> = 'true'; idempotent; no throw
export function isLessonComplete(slug): boolean;        // false on absence or storage error
export function getCompletedLessons(): string[];        // slugs whose completion key is 'true'; [] on error
export function getCompletionPercentage(total): number; // see rule below
export function resetProgress(): void;                  // removes only completion keys; no throw
```

Behavioral contract (from `progress.test.js`, `progress.property.test.js`):

- Completion is keyed by slug and **locale-independent** — the same key is read by `navigation.js` regardless of the page's locale, which is what makes progress shared across languages.
- `getCompletedLessons` iterates `localStorage` keys (via `localStorage.length`/`localStorage.key(i)`), selects keys starting with `COMPLETE_PREFIX` whose value is `'true'`, and strips the prefix. Unrelated keys are ignored. Any thrown access returns `[]`.
- `getCompletionPercentage(total)`:
  - `total <= 0` → `0`.
  - otherwise `Math.round(getCompletedLessons().length / total * 100)`.
  - may exceed 100 when completed > total (the test asserts `>= 100` in that case); within `[0,100]` for valid inputs.
  - returns `0` if storage access throws.
- `resetProgress` removes only keys beginning with `COMPLETE_PREFIX`; unrelated keys (e.g. `other_key`) survive. Safe when nothing is stored and when `localStorage.key` throws (collect keys defensively, then remove).

Implementation caution for `resetProgress`: collect the matching keys into an array first (since removing during a live `key(i)` walk shifts indices), then remove each.

### `navigation.js` — Navigation Module

```javascript
import { lessons as catalog } from './lessons.js';
import { detectLocale } from './i18n.js';

export function renderSidebar(container, lessons, completedIds): void;
export function initHamburgerMenu(): void;
export function navigateToLesson(slug, locale): void;
export function initNavigation(lessons, completedIds): void;
```

**Track-to-section-title map** (exact strings asserted by `navigation.test.js`):

| track | EN title | FR title |
| --- | --- | --- |
| morning | `Introduction & Fundamentals` | `Matin — Introduction et fondamentaux` |
| afternoon | `Design & Governance` | `Conception et gouvernance` |
| sandbox | `Sandbox — opcp-explorer Platform` | `Bac à sable — plateforme opcp-explorer` |

`renderSidebar(container, lessons, completedIds)`:

- Active locale is resolved from `getStoredLocalePreference()` (the test sets `skillhub-locale` to drive FR titles) falling back to `detectLocale()` / default `en`.
- Groups `lessons` by track in the fixed order `['morning', 'afternoon', 'sandbox']`; emits one `.sidebar-section` per **non-empty** track group. An empty lesson list yields zero sections (no throw).
- Each section has an `<h2 class="sidebar-section-title">` with the locale-appropriate title, and a `<ul class="sidebar-nav">` with one `<li>` per lesson.
- Each lesson link:
  - text = lesson `title[locale]`.
  - `href = "/<locale>/<slug>.html"`.
  - `data-slug = slug` and `data-lesson-id = id` (the tests query both attributes).
  - gets class `completed` and a completion `aria-label` (text containing `"completed"`) when `completedIds` includes the slug **or** `localStorage["skillhub_lesson_complete_<slug>"] === 'true'` (union of the supplied list and stored progress).
  - gets class `active` and `aria-current="page"` when its slug matches the current pathname (`window.location.pathname` ends with `/<slug>.html`).

`initHamburgerMenu()`:

- Locates `.hamburger-btn` and `.sidebar`. If either is missing, returns without throwing.
- Sets on the button: `aria-label="Toggle navigation menu"`, `aria-expanded="false"`, `aria-controls="sidebar-nav"`.
- Click toggles `.sidebar` `open` class and syncs `aria-expanded` (`"true"`/`"false"`).
- A document click outside the sidebar (and not on the button) while open removes `open`.
- `keydown` `Escape` while open removes `open`.

`navigateToLesson(slug, locale)`:

- If `locale` is `"en"` or `"fr"`, navigate to `"/<locale>/<slug>.html"`.
- Otherwise use `detectLocale()` (which honors the stored preference) and navigate there.
- Navigation performed via `window.location.href = ...`.

`initNavigation(lessons, completedIds)`: renders the sidebar into `.sidebar` if present, then calls `initHamburgerMenu()`. No-throw when `.sidebar` is absent.

### `code-highlight.js` — Code Highlighter

```javascript
export function highlightCode(code, language): string;   // HTML string
export function highlightAll(root = document): void;      // mutate recognized <code> elements
```

Recognized languages: `javascript`, `python`, `bash`, `json`. The highlighter is a small per-language tokenizer that **escapes HTML first**, then wraps tokens in `hljs`-prefixed spans.

`highlightCode(code, language)` contract (from `code-highlight.test.js`):

- Empty string in → empty string out.
- Unknown language → `htmlEscape(code)` with **no** highlight spans. Example: `highlightCode('<script>alert("xss")</script>', 'unknown') === '&lt;script&gt;alert("xss")&lt;/script&gt;'`. (Note the `"` is not escaped by this scheme — only `< > &`.)
- HTML special characters in source are escaped before tokenizing, so a recognized-language result contains `&lt;` rather than a raw `<5` fragment.
- Token span classes:
  - `hljs-keyword` — language keyword list (`const`, `let`, ... for JS; `def`, ... for Python; `export`, ... for bash; `true`/`false`/`null` for JSON).
  - `hljs-string` — double/single-quoted strings; for JSON, string **values** (right-hand side).
  - `hljs-attr` — JSON property **keys** (the quoted token before a `:`).
  - `hljs-comment` — `//` line and `/* */` block (JS); `#` line (Python, bash).
  - `hljs-number` — integer and decimal literals (e.g. `42`, `3.14`).

Tokenization order matters: comments and strings are matched before keywords/numbers so that keyword-like or digit-like text inside a string or comment is not re-tokenized. JSON keys vs string values are disambiguated by whether the quoted token is immediately followed by `:`.

`highlightAll(root)` contract:

- For each `<code>` element under `root` whose class names a recognized language via a `language-<lang>` or `lang-<lang>` prefix:
  - skip if `data-highlighted === "true"` (idempotent; content untouched).
  - otherwise set `innerHTML = highlightCode(textContent, lang)`, add the `hljs` class, and set `dataset.highlighted = "true"`.
- A `<code>` element with no recognized language class is left unchanged and does **not** get `data-highlighted` set.

### `self-assessment.js` — Guardrail Checklist

```javascript
export const GUARDRAIL_LAYERS = [
  'permissions', 'operational-limits', 'human-approval', 'observability', 'kill-switch',
];

/** { passed, missing, covered } — normalize (lowercase), dedup, ignore unknown. */
export function evaluateGuardrailChecklist(layers): { passed: boolean, missing: string[], covered: string[] };

/** Return the data-layer values of checked `input.guardrail-check` in `container`. */
export function readCheckedLayers(container): string[];

/** Wire change listeners; gate completeBtn.disabled on all-five-checked. */
export function initGuardrailChecklist({ container, resultEl, completeBtn, locale }): void;
```

Behavioral contract (from `self-assessment.test.js`):

- `GUARDRAIL_LAYERS` is exactly the five layers in the given order.
- `evaluateGuardrailChecklist(input)`:
  - normalize each entry to lowercase, keep only values in `GUARDRAIL_LAYERS`, dedup.
  - `covered` = the normalized, deduped, recognized layers **in `GUARDRAIL_LAYERS` order**.
  - `passed` = `covered` contains all five.
  - `missing` = `GUARDRAIL_LAYERS` minus `covered`, in order. On empty input, `missing` deep-equals `GUARDRAIL_LAYERS`.
- `readCheckedLayers(container)` returns the `data-layer` attribute of each checked `input.guardrail-check` inside the container.
- `initGuardrailChecklist(...)` attaches a `change` listener to each checkbox; on every change it recomputes `evaluateGuardrailChecklist(readCheckedLayers(container))` and sets `completeBtn.disabled = !passed`. Button starts disabled and only enables when all five are checked.

The `resultEl`/`locale` inputs let the DOM wiring show a localized pass/fail message; the tested invariant is purely the button-gating. The lesson-page wiring (for `threat-modeling-workshop` and `agent-design-capstone`, in both locales) embeds all five `data-layer="..."` checkboxes, a `btn-mark-complete` button that starts `disabled`, and loads `self-assessment.js` — asserted by `self-assessment.test.js` reading the lesson HTML. On pass, the complete button, when clicked, calls `progress.markLessonComplete(lessonSlug)`.

### `main.js` — Page Bootstrap

```javascript
import { highlightAll } from './code-highlight.js';
import { getCompletionPercentage } from './progress.js';
import { lessons } from './lessons.js';
// navigation + self-assessment wired conditionally on element presence

export function initApp(): void;
```

`initApp()` contract (from `main.test.js`):

- Must never throw regardless of DOM state.
- Calls `highlightAll()` so recognized code blocks get `data-highlighted="true"` and token spans.
- If a progress bar element is present, computes `pct = getCompletionPercentage(lessons.length)` and sets:
  - `.progress-bar` → `style.width = pct + '%'` and `aria-valuenow = String(pct)`.
  - any progress text element (`.progress-text`) → `textContent = pct + '%'`.
  - With two lessons complete, the value is `Math.round(2 / lessons.length * 100) + '%'` — derived from the live catalog so it stays correct as the catalog grows.
- When no progress elements are present, completes silently.

Note on selectors: `main.test.js` uses `.progress-bar` / `.progress-text`, while the authored lesson pages use `.progress-bar-fill` / `.progress-percent`. `initApp` updates whichever progress elements are present (query both selector families) so both the test DOM and the authored pages are driven correctly.

A small entry module (loaded by lesson pages via `<script type="module">`) imports `initApp` and calls it on `DOMContentLoaded`.

## Data Models

### Locale

A string restricted to `"en"` or `"fr"`. Every boundary that produces a locale (`detectLocale`, `normalizeLocale`, `getStoredLocalePreference` when non-null) returns a value from this set; arbitrary inputs are normalized by the `startsWith('fr')` rule.

### Lesson

As defined in the `lessons.js` section. The catalog is a static, ordered array of 16 `Lesson` records. Invariants enforced by `lessons.test.js`: unique `id`, unique `slug`, non-empty bilingual titles, valid `track`/`difficulty`, integer `estimatedMinutes` in `[1,480]`, acyclic `prerequisites` referencing existing ids, no self-prerequisite, and no orphan lessons (each lesson either has prerequisites or is referenced as one).

### Completion Record

Represented implicitly as `localStorage` entries `skillhub_lesson_complete_<slug> = "true"`. The set of completed slugs is the set of such keys whose value is `"true"`. There is no separate index object — the key namespace *is* the data model, which is why it is trivially shared across locales and survives reloads.

### Guardrail Coverage

`{ passed: boolean, missing: string[], covered: string[] }` derived from a raw layer list by normalize → filter-to-known → dedup → order-by-`GUARDRAIL_LAYERS`.

## Error Handling

The runtime runs in untrusted environments (SCORM hosts, private-mode browsers) where `localStorage` may throw. The strategy is **guard at every storage boundary and degrade to a safe default**, never propagating the error:

| Function | On storage error |
| --- | --- |
| `getStoredLocalePreference` | return `null` |
| `detectLocale` | fall through to browser-language detection, else `"en"` |
| `setLocalePreference` / `switchLocale` persist | swallow; continue (switch still navigates) |
| `markLessonComplete` | swallow (no throw) |
| `isLessonComplete` | return `false` |
| `getCompletedLessons` | return `[]` |
| `getCompletionPercentage` | return `0` |
| `resetProgress` | swallow (no throw) |

DOM-boundary degradation:

- `initHamburgerMenu` / `initNavigation` return early when their required elements are absent.
- `renderSidebar` with an empty list renders nothing and does not throw.
- `highlightAll` skips elements without a recognized language class and already-highlighted elements.
- `initApp` wraps optional wiring so a missing progress bar, sidebar, or checklist never aborts bootstrap.

Each guard is narrow (wrap the specific `localStorage` call or element lookup), so a failure in one area does not suppress functionality elsewhere.

## Testing Strategy

The authoritative tests already exist under `skillhub/tests/`. The design must satisfy them without modification.

**Dual approach.** Example/edge tests pin specific strings, DOM shapes, and error behavior (section titles, exact escaped output, ARIA attributes, graceful degradation). Property tests (fast-check, ≥100 runs) cover universal input-varying behavior (locale resolution, normalization, progress round-trip, percentage arithmetic, launch-page locale selection at 300 runs).

**Existing property test tags** (keep consistent):

- `Feature: ai-store-labs, Property 1: Locale Resolution Priority` (`i18n.property.test.js`).
- `Feature: ai-store-labs, Property 2: Client-Side Progress Persistence Round-Trip` and `Property 3: Completion Percentage Calculation` (`progress.property.test.js`).
- `Property 2: Preservation` for the SCORM launch page (`scorm-launch-locale-preservation.property.test.js`).

**Out-of-runtime tests** that must continue to pass unchanged: `scorm-*` (build/manifest/launch), `lesson-content.test.js`, `deliverables.test.js`. The runtime design keeps these green by (a) placing modules under `skillhub/js/` so the build bundles them, (b) leaving `skillhub/index.html` redirect logic untouched, and (c) providing the catalog entries `lesson-content.test.js` looks up.

Run tests with `npx vitest --run` (single execution, not watch mode).

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — a formal statement about what the system should do. Properties bridge human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Locale Resolution Priority

*For any* combination of stored locale preference (valid `"en"`/`"fr"`, invalid, or absent) and browser language, `detectLocale` returns the stored preference when it is valid, otherwise `"fr"` when the browser language lowercased starts with `fr`, otherwise `"en"`; the result is always exactly `"en"` or `"fr"`. This same resolution holds for the live launch page's locale selection.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 10.3**

### Property 2: Locale Normalization and Persistence

*For any* input string, persisting a locale (`setLocalePreference` or `switchLocale`) stores exactly `"fr"` when the input lowercased starts with `fr` and exactly `"en"` otherwise, under the key `skillhub-locale`.

**Validates: Requirements 1.7, 1.8, 2.1, 2.2**

### Property 3: Same-Lesson Locale URL Construction

*For any* pathname containing a leading locale segment `/en/` or `/fr/` and any target locale, `switchLocale` navigates to the same path with only the locale segment replaced by the normalized target, preserving the `<slug>.html` filename; and *for any* slug with a valid locale, `navigateToLesson` navigates to `/<locale>/<slug>.html`.

**Validates: Requirements 2.3, 2.5**

### Property 4: Progress Persistence Round-Trip

*For any* set of unique lesson slugs, marking each complete and then reading back the completed set via `getCompletedLessons` yields exactly that set — no slug lost and none added — keyed by slug independent of locale and persisted in `localStorage`.

**Validates: Requirements 3.1, 3.2, 3.5**

### Property 5: Completion Percentage Calculation

*For any* `(completedCount, totalCount)` with `totalCount > 0` and `0 <= completedCount <= totalCount`, `getCompletionPercentage(totalCount)` equals `round(completedCount / totalCount * 100)` and is an integer in the inclusive range `0` to `100`.

**Validates: Requirements 3.3**

### Property 6: Reset Isolation

*For any* set of completion records together with arbitrary unrelated `localStorage` entries, `resetProgress` removes every completion record (leaving `getCompletedLessons` empty) and leaves every unrelated entry untouched.

**Validates: Requirements 3.4**

### Property 7: Catalog Lookup Consistency

*For any* slug present in the catalog, `getLessonBySlug` returns the entry whose `slug`/`id` equals that slug, and `getLessonsByTrack`/`getLessonsByDifficulty` return exactly the entries matching the requested track/difficulty; for any value not in the catalog the lookups return `undefined` / `[]` respectively.

**Validates: Requirements 4.1, 4.4**

### Property 8: Sidebar Rendering Fidelity

*For any* lesson list and active locale, `renderSidebar` renders each lesson link with text equal to the lesson's title in the active locale, `href="/<locale>/<slug>.html"`, and `data-slug` equal to the slug; a link carries the `completed` class and completion `aria-label` exactly when its slug is in the supplied completed list or its completion key is set, and carries `active` with `aria-current="page"` exactly when its slug matches the current pathname.

**Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 9: Unknown-Language Escape Identity

*For any* source string, `highlightCode(source, lang)` with an unrecognized `lang` returns the HTML-escaped source (escaping `<`, `>`, `&`) and contains no `hljs` highlight spans.

**Validates: Requirements 7.2**

### Property 10: Escape-Before-Highlight Safety

*For any* source string and recognized language, the HTML produced by `highlightCode` escapes the source's HTML special characters before emitting markup, so no source `<`/`>`/`&` appears as a raw tag or entity-unsafe fragment in the output.

**Validates: Requirements 7.3**

### Property 11: Highlight Idempotence and Marking

*For any* DOM subtree, `highlightAll` sets `class` to include `hljs` and `data-highlighted="true"` on every `<code>` element with a recognized `language-`/`lang-` class, leaves elements already marked `data-highlighted="true"` byte-for-byte unchanged, and leaves elements without a recognized language class unmarked; applying `highlightAll` again changes nothing.

**Validates: Requirements 7.5, 7.6, 7.7**

### Property 12: Guardrail Checklist Evaluation

*For any* list of layer strings, `evaluateGuardrailChecklist` reports `passed` true exactly when the normalized (lowercased), deduplicated, known layers cover all five `GUARDRAIL_LAYERS`, reports `missing` as the ordered set of uncovered required layers, and ignores unknown layers.

**Validates: Requirements 8.2, 8.3, 8.4**

### Property 13: Checklist Read and Gating

*For any* subset of guardrail checkboxes marked checked, `readCheckedLayers` returns exactly that subset of `data-layer` values, and the Mark-as-Complete button is disabled exactly when that subset does not cover all five layers.

**Validates: Requirements 8.5, 8.6, 8.7**

### Property 14: Launch Locale Selection Independent of Host

*For any* combination of stored preference, browser language, and storage availability, the launch page selects the same locale (`stored > fr-browser > en`) regardless of how the host resolves the redirect path, and the selected locale is always exactly `"en"` or `"fr"`.

**Validates: Requirements 10.3, 10.4**
