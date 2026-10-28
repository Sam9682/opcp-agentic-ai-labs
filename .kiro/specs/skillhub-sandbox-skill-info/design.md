# Design Document

## Overview

This feature is a static-HTML + CSS content-integration task. It adds, to each mapped Sandbox page (English and French), one or more **Skill_Sections** that present the underlying `shai` skill-agent configuration: a short human-readable intro paragraph, a runtime-placeholder note, and the complete source `SKILL.md` prompt rendered inside a native `<details>`/`<summary>` collapsible that is collapsed by default.

There is no new build tooling and no application code in a build language. The deliverable is edited HTML files, one small CSS addition to `skillhub/assets/css/style.css`, and an extension of the existing automated test suite under `skillhub/tests/`.

### Scope boundaries

- **In scope:** editing the seven Sandbox pages in both `skillhub/en/` and `skillhub/fr/`, adding `<details>`/`<summary>` CSS, embedding escaped `SKILL.md` content, extending the test suite.
- **Out of scope:** generating prompts, resolving runtime placeholders, JavaScript behavior (collapsible is native HTML), any build/transform pipeline, changes to pages outside the Sandbox group.

### Authoring note (not a runtime behavior)

The embedded prompt is a point-in-time copy of the source `SKILL.md`. When a source prompt changes, the Author re-runs the escape procedure and replaces the embedded block (Requirement 2.4). The embed-fidelity test (Property 2) is the regression guard that fails if an embedded block drifts from its source.

### Test runner note

The task brief refers to the test suite as "Jest." The repository's actual runner is **Vitest** (`vitest.config.js`, `environment: jsdom`, include glob `skillhub/tests/**/*.test.js`). New tests are authored as Vitest `*.test.js` files to match the existing suite; the assertion style (`describe`/`it`/`expect`) is identical to Jest, so the brief's intent is preserved.

## Architecture

The system is a collection of static files. The "runtime" is the browser rendering HTML. The only logic involved is the **authoring-time transform** that turns a source `SKILL.md` into an embedded, HTML-escaped block, plus the **mapping** that decides which skills appear on which page.

```
Source of truth                      Authoring transform                 Rendered artifact
----------------                     -------------------                 -----------------
agentic-ai-plateform--skills/        escapeHtml(prompt)                  skillhub/en/<page>.html
  shai/skills/<SKILL>/SKILL.md  ───▶  wrap in Skill_Section HTML   ───▶  skillhub/fr/<page>.html
                                      (intro + note + details)            + skillhub/assets/css/style.css
                                            ▲
                                   Page_Skill_Map decides
                                   which skills per page
```

Two conceptual pieces drive the integration:

1. **Page_Skill_Map** — the authoritative, ordered page → skills mapping (concrete table below).
2. **Skill_Section builder** — the fixed HTML shape produced for each (page, locale, skill) tuple, with locale-specific wrapper text and a locale-independent embedded prompt.

## Components and Interfaces

### Component 1: Page_Skill_Map

The map is the single source of truth for which skills appear, in what order, on each page. Both locales use **identical filenames** (confirmed: `skillhub/en/<file>` and `skillhub/fr/<file>` share the same basename).

| Sandbox_Page (EN + FR, identical filename) | Ordered Skills                                            | Count |
| ------------------------------------------ | --------------------------------------------------------- | ----- |
| `starting-applications.html`               | `START_APP`                                               | 1     |
| `stopping-applications.html`               | `STOP_APP`                                                | 1     |
| `making-backups.html`                      | `BACKUP_DATABASE`, `RESTORE_DATABASE`, `CLEAN_DATABASE`   | 3     |
| `modifying-applications.html`              | `MODIFY_CODE`, `VERIFY_APP_COMPLIANCE`, `MAKE_APP_COMPLIANT` | 3  |
| `adding-applications.html`                 | `SPECIFY_FEATURE`, `MODIFY_CODE`                          | 2     |
| `agent-control.html`                       | `AGENTS_CONTROL`, `STATUS_APP`                            | 2     |
| `install-bare-metal.html`                  | *(none)*                                                  | 0     |

Notes:
- `MODIFY_CODE` appears on two pages (`modifying-applications.html` and `adding-applications.html`); its embedded prompt must be byte-identical in every appearance and in both locales (Property 11).
- `install-bare-metal.html` receives **zero** skill sections (Requirement 1.7) and is edited in neither locale for this feature.
- Of the eleven skills, `SPECIFY_FEATURE` and all others are mapped at least once; `STATUS_APP` and `AGENTS_CONTROL` land only on `agent-control.html`.

### Component 2: Source SKILL.md files

All sources live under `agentic-ai-plateform--skills/shai/skills/<SKILL>/SKILL.md`:

| Skill                  | Source path (relative to the skills repo root)        |
| ---------------------- | ----------------------------------------------------- |
| `START_APP`            | `shai/skills/START_APP/SKILL.md`                      |
| `STOP_APP`             | `shai/skills/STOP_APP/SKILL.md`                       |
| `BACKUP_DATABASE`      | `shai/skills/BACKUP_DATABASE/SKILL.md`                |
| `RESTORE_DATABASE`     | `shai/skills/RESTORE_DATABASE/SKILL.md`               |
| `CLEAN_DATABASE`       | `shai/skills/CLEAN_DATABASE/SKILL.md`                 |
| `MODIFY_CODE`          | `shai/skills/MODIFY_CODE/SKILL.md`                    |
| `VERIFY_APP_COMPLIANCE`| `shai/skills/VERIFY_APP_COMPLIANCE/SKILL.md`          |
| `MAKE_APP_COMPLIANT`   | `shai/skills/MAKE_APP_COMPLIANT/SKILL.md`             |
| `SPECIFY_FEATURE`      | `shai/skills/SPECIFY_FEATURE/SKILL.md`                |
| `AGENTS_CONTROL`       | `shai/skills/AGENTS_CONTROL/SKILL.md`                 |
| `STATUS_APP`           | `shai/skills/STATUS_APP/SKILL.md`                     |

These prompts contain shell, `openssl`, and `docker` commands; HTML-sensitive characters (`<`, `>`, `&`); and templated runtime placeholders such as `{{APPLICATION_FOLDER}}` and `{{USER_ID}}`.

### Component 3: HTML-escaping procedure

The escape transform converts a raw `SKILL.md` string into a string safe to embed inside `<pre><code>…</code></pre>`. Only three characters are escaped, **in this exact order** so that `&` is replaced before the entities introduced by `<`/`>` escaping (otherwise the `&` in `&lt;`/`&gt;` would be double-escaped into `&amp;lt;`).

```text
escapeHtml(source):
    1. replace every "&" with "&amp;"      # MUST be first
    2. replace every "<" with "&lt;"
    3. replace every ">" with "&gt;"
    return result
```

Invariants of the transform:
- **Whitespace and line breaks are preserved** — no trimming, no re-indentation, no line joining/splitting. The result is embedded inside `<pre>` so the browser renders whitespace literally (Requirement 3.4).
- **Runtime placeholders are untouched** — `{{APPLICATION_FOLDER}}`, `{{USER_ID}}`, etc. contain none of `&`, `<`, `>`, so they pass through verbatim (Requirement 5.1, 5.3).
- **Round-trip safe** — applying an HTML unescape (`&amp;`→`&`, `&lt;`→`<`, `&gt;`→`>`) to the embedded block recovers the original source byte-for-byte (Requirement 3.5). The escape order is what makes this round-trip hold.

Reference implementation (JavaScript, used by the tests as the canonical transform):

```javascript
// skillhub/tests/helpers/skill-embed.js
export function escapeHtml(source) {
  return source
    .replace(/&/g, '&amp;')  // first: avoids double-escaping
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function unescapeHtml(embedded) {
  return embedded
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // reverse order of escape
}
```

### Component 4: Skill_Section HTML shape

Each Skill_Section is a self-contained block. It is inserted into the page body **after the existing lesson content and before the `Mark as Complete` button** — concretely, as the last children of `<div class="lesson-body">` (or immediately after `</div>` of `lesson-body` and before `<button class="btn btn-success btn-mark-complete">`). A wrapping `<section class="skill-section">` groups the parts and gives a stable hook for tests and CSS.

The fixed shape (EN example for `START_APP`):

```html
<section class="skill-section" data-skill="START_APP">
    <h2>Skill configuration: START_APP</h2>
    <p>This page's actions are driven by the <code>START_APP</code> agent skill. The prompt below is the exact configuration the agent follows to deploy and start an application.</p>
    <div class="alert alert-info">
        <strong>Runtime placeholders:</strong> Tokens such as <code>{{APPLICATION_FOLDER}}</code> and <code>{{USER_ID}}</code> are substituted with concrete values at runtime.
    </div>
    <details class="skill-prompt">
        <summary>View the START_APP skill prompt (SKILL.md)</summary>
        <pre><code>...escaped SKILL.md content here...</code></pre>
    </details>
</section>
```

Structural rules (apply to every section):
- Exactly one intro `<p>` precedes the `<details>` (Requirement 2.3).
- A heading (`<h2>` to match the page's existing subsection level — see "document outline" below) names the skill so the section is reachable in the outline (Requirement 7.4).
- The runtime-note `alert-info` block is present **only when** the skill's prompt contains at least one `{{…}}` placeholder (Requirement 5.2). All eleven skills in this feature contain placeholders, but the rule is conditional so the design stays correct if a future prompt has none.
- `<details>` omits the `open` attribute → collapsed by default (Requirement 4.2).
- `<summary>` text contains the skill identifier (Requirement 4.4, 7.3).
- The embedded prompt lives inside `<pre><code>` (Requirement 3.4) and is the escaped source (Requirement 2.1).
- When a page maps to N skills, N sibling `<section class="skill-section">` blocks are emitted in map order (Requirement 1.8); the embedded prompt is locale-independent (Requirement 6.4, 6.5).

### Component 5: Insertion point per page

Existing Sandbox pages share this body skeleton:

```html
<main class="main-content" role="main">
  <div class="lesson-content">
    <div class="lesson-header"> … </div>
    <div class="lesson-body">
      … existing lesson content …
      <div class="alert alert-info"> … Lab Available … </div>   <!-- last existing node -->
      <!-- ▼ INSERT Skill_Section(s) HERE, in map order ▼ -->
    </div>
    <button class="btn btn-success btn-mark-complete" …>Mark as Complete</button>   <!-- unchanged -->
  </div>
</main>
```

Skill_Sections are appended as the final children of `lesson-body`, after the existing content and before the `Mark as Complete` button. This keeps the existing heading structure intact (Requirement 7.4) and preserves the complete lesson narrative ahead of the skill detail.

### Component 6: CSS addition

A small block is appended to `skillhub/assets/css/style.css`, reusing existing brand custom properties (`--ovh-*`, `--spacing-*`, `--border-radius*`, `--font-mono`) so the collapsible matches existing lesson styling (Requirement 4.5). The `<pre>`/`<code>` inside already inherit the existing dark code-block styling, so no overrides are needed there.

```css
/* --------------------------------------------------------------------------
   Skill Sections (collapsible SKILL.md prompts)
   -------------------------------------------------------------------------- */
.skill-section {
    margin-top: var(--spacing-xl);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--ovh-gray-light);
}

.skill-prompt {
    margin-bottom: var(--spacing-lg);
    border: 1px solid var(--ovh-gray-light);
    border-radius: var(--border-radius);
    background-color: var(--ovh-gray-lightest);
}

.skill-prompt > summary {
    cursor: pointer;
    padding: var(--spacing-md);
    font-weight: 600;
    color: var(--ovh-blue-dark);
    list-style: none;
}

.skill-prompt > summary::-webkit-details-marker { display: none; }

.skill-prompt > summary::before {
    content: "▸ ";
    display: inline-block;
    transition: transform var(--transition-fast);
}

.skill-prompt[open] > summary::before { content: "▾ "; }

.skill-prompt > summary:focus-visible {
    outline: 2px solid var(--ovh-blue);
    outline-offset: 2px;
}

.skill-prompt > pre {
    margin: 0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}
```

Styling is cosmetic only: the collapse/expand and keyboard operability come from the native `<details>`/`<summary>` elements, not from CSS or JavaScript.

## Data Models

### Page_Skill_Map (as test/data structure)

The tests encode the map as a plain object so both the authoring and the verification share one source of truth:

```javascript
// skillhub/tests/helpers/page-skill-map.js
export const PAGE_SKILL_MAP = {
  'starting-applications.html':  ['START_APP'],
  'stopping-applications.html':  ['STOP_APP'],
  'making-backups.html':         ['BACKUP_DATABASE', 'RESTORE_DATABASE', 'CLEAN_DATABASE'],
  'modifying-applications.html': ['MODIFY_CODE', 'VERIFY_APP_COMPLIANCE', 'MAKE_APP_COMPLIANT'],
  'adding-applications.html':    ['SPECIFY_FEATURE', 'MODIFY_CODE'],
  'agent-control.html':          ['AGENTS_CONTROL', 'STATUS_APP'],
  'install-bare-metal.html':     [],
};

export const LOCALES = ['en', 'fr'];

// Resolves <SKILL> to its SKILL.md source path for embed-fidelity checks.
export const SKILLS_SOURCE_ROOT =
  '…/agentic-ai-plateform--skills/shai/skills';
```

### Skill_Section (conceptual record)

| Field            | Type         | Source                               | Locale-dependent? |
| ---------------- | ------------ | ------------------------------------ | ----------------- |
| `skillId`        | string       | Page_Skill_Map                       | no                |
| `heading`        | string       | authored, e.g. "Skill configuration: START_APP" | no (skill id) / label text yes |
| `introParagraph` | HTML string  | authored, describes the skill        | **yes** (EN/FR)   |
| `runtimeNote`    | HTML string  | authored (alert-info)                | **yes** (EN/FR)   |
| `summaryLabel`   | string       | authored, identifies the skill       | **yes** (EN/FR)   |
| `embeddedPrompt` | escaped text | `escapeHtml(read(SKILL.md))`         | **no** (English)  |

### EN vs FR translation table

The embedded prompt is identical across locales (English, byte-identical). Only the wrapper text differs. Representative strings:

| Element       | EN                                                                 | FR                                                                              |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Heading       | `Skill configuration: <SKILL>`                                     | `Configuration du skill : <SKILL>`                                              |
| Summary label | `View the <SKILL> skill prompt (SKILL.md)`                         | `Afficher le prompt du skill <SKILL> (SKILL.md)`                                |
| Runtime note  | `Runtime placeholders: Tokens such as {{APPLICATION_FOLDER}} and {{USER_ID}} are substituted with concrete values at runtime.` | `Variables d'exécution : les jetons tels que {{APPLICATION_FOLDER}} et {{USER_ID}} sont remplacés par des valeurs concrètes au moment de l'exécution.` |
| Intro (per skill) | authored English sentence describing what the skill does      | French translation of the same sentence                                         |

The `<SKILL>` identifier and any `{{…}}` placeholders stay in their literal form in both locales.

## Error Handling

Because this is static content, "errors" are authoring mistakes caught by the test suite rather than runtime exceptions:

| Failure mode                                                    | Detection                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| Wrong skills / wrong count on a page                            | Per-page section-count property (Property 1) + example tests    |
| Embedded prompt drifted from source (stale/partial copy)        | Embed-fidelity property (Property 2) — exact escaped-source containment |
| Double-escaping (`&amp;lt;`) or un-escaped `<`/`>`/`&`          | Escaping round-trip property (Property 3)                       |
| Placeholder accidentally resolved/removed                       | Placeholder-preservation property (Property 7)                  |
| Missing runtime note where placeholders exist                   | Runtime-note property (Property 8)                              |
| `open` attribute left on → expanded by default                  | Collapsed-by-default property (Property 5)                      |
| EN/FR drift (different skills, or translated prompt)            | EN/FR parity (Property 9) + English-embed property (Property 10)|
| `MODIFY_CODE` embeds differ between its two pages               | Per-skill byte-identity property (Property 11)                  |
| Added section breaks the heading outline                        | Heading parity/outline property (Property 12)                   |
| Missing source `SKILL.md`                                       | Embed-fidelity test throws on read → suite fails loudly         |

If a source `SKILL.md` cannot be read during testing, the test reads it directly and will fail with a file-not-found error, surfacing the problem immediately rather than silently embedding nothing.

## Testing Strategy

New tests extend the existing suite under `skillhub/tests/` using Vitest + jsdom, matching the conventions in `lesson-content.test.js`. Suggested files:

- `skillhub/tests/skill-sections.test.js` — structure, mapping, collapsed-by-default, summary labels, runtime notes, parity (Properties 1, 4–12 and the example-level mapping checks).
- `skillhub/tests/skill-embed.property.test.js` — the escaping/embed-fidelity and placeholder round-trip properties (Properties 2, 3, 7) driven over all mapped (page, locale, skill) tuples.
- Shared helpers `skillhub/tests/helpers/page-skill-map.js` and `skillhub/tests/helpers/skill-embed.js` as shown above.

### Dual approach

- **Example tests** pin the concrete authored facts that are not input-varying: exactly which skill(s) each specific page carries (Requirements 1.1–1.7), the zero-section rule for `install-bare-metal.html`, and the specific EN/FR wrapper strings (Requirements 6.2, 6.3).
- **Property tests** quantify over the whole Page_Skill_Map and all source prompts: fidelity, escaping round-trip, structure, parity, and byte-identity. Each property iterates over every mapped tuple (a bounded but complete input set); where a generator adds value (e.g. escaping on randomized strings containing `&`, `<`, `>` adjacencies) it runs ≥100 iterations.

### Property test configuration

- Minimum 100 iterations for any test using randomized generators (the escaping round-trip over synthetic strings).
- Enumerated-input properties iterate over the full Page_Skill_Map × locales set (complete coverage, deterministic).
- Each property test is tagged with the format **Feature: skillhub-sandbox-skill-info, Property {number}: {property_text}** in its `describe`/`it` title.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Per-page section count matches the map

*For any* page and locale in the Page_Skill_Map, the number of rendered `skill-section` collapsible blocks on that page equals the number of skills the map assigns to that page, and `install-bare-metal.html` has zero.

**Validates: Requirements 1.7, 1.8**

### Property 2: Complete and faithful embed

*For any* mapped (page, locale, skill) tuple, the page contains, verbatim and contiguously, `escapeHtml(sourceOf(skill))` — the entire escaped source `SKILL.md`, with no lines added, removed, or reordered.

**Validates: Requirements 2.1, 2.2**

### Property 3: Escaping round-trip

*For any* source prompt (and for any synthetic string containing arbitrary combinations of `&`, `<`, `>`), unescaping the embedded block recovers the original source byte-for-byte, and the embedded block contains no raw `<`, `>`, or un-intended `&` and no double-escaped entity such as `&amp;lt;`.

**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

### Property 4: Section structure

*For any* rendered Skill_Section, the section contains exactly one intro `<p>` before a single native `<details>` element, that `<details>` contains a `<summary>` followed by a `<pre><code>` wrapping the embedded prompt.

**Validates: Requirements 2.3, 3.4, 4.1, 7.1**

### Property 5: Collapsed by default

*For any* rendered Skill_Section, its `<details>` element does not carry the `open` attribute.

**Validates: Requirements 4.2**

### Property 6: Summary identifies the skill

*For any* rendered Skill_Section, the text of its `<summary>` contains the identifier of the skill whose prompt the section embeds.

**Validates: Requirements 4.4, 7.3**

### Property 7: Placeholder preservation

*For any* mapped (page, locale, skill) tuple, every `{{…}}` runtime placeholder present in the source appears verbatim in the embedded block, and the count of `{{…}}` tokens in the embed equals the count in the source.

**Validates: Requirements 5.1, 5.3**

### Property 8: Runtime note when placeholders exist

*For any* rendered Skill_Section whose source prompt contains at least one `{{…}}` placeholder, the section includes a runtime-placeholder note.

**Validates: Requirements 5.2**

### Property 9: EN/FR section-set parity

*For any* page in the Page_Skill_Map, the ordered list of skill identifiers exposed by the sections under `skillhub/en/` equals the ordered list exposed by the corresponding page under `skillhub/fr/`.

**Validates: Requirements 6.1**

### Property 10: Embedded prompt is the English source in both locales

*For any* mapped (page, skill) tuple, the embedded prompt under `skillhub/fr/` equals `escapeHtml(sourceOf(skill))` (the English source), i.e. it is not translated.

**Validates: Requirements 6.4**

### Property 11: Per-skill byte-identical embed across pages and locales

*For any* skill, all embedded blocks for that skill — across every page that maps it and across both `en/` and `fr/` — are byte-identical.

**Validates: Requirements 6.5**

### Property 12: Heading structure and outline preservation

*For any* page edited by this feature, the English and French copies have the same number of headings, and each added Skill_Section contributes a subsection heading so the section is reachable within the page's document outline.

**Validates: Requirements 7.4**
