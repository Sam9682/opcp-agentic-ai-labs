# Design Document

## Overview

This feature adds one bilingual (EN/FR) lesson — `configuring-shai-mcp-opcp-explorer` — to the SkillHub static learning site. The lesson teaches learners how to configure a SHAI agent whose single stdio MCP connection reaches the OPCP-EXPLORER agentic-ai-platform, and how to read and act on the live Container Discovery report that agent produces.

SkillHub has no build step for pages: lessons are hand-authored static HTML in `skillhub/en/` and `skillhub/fr/`, the catalog is a plain JavaScript module (`skillhub/js/lessons.js`), and navigation is **hardcoded and duplicated** on every page. There is therefore no code generator to extend — the work is a coordinated set of consistent edits across four surfaces, each of which must stay in step with the others:

1. **Catalog data** — one new entry appended to the afternoon section of the `lessons` array (plus a stale header-comment fix).
2. **Authored pages** — two new static HTML files (`en/` and `fr/`) following the existing page skeleton exactly.
3. **Navigation** — the afternoon sidebar nav (`#nav-afternoon`) on every existing lesson page and the index page, in both locales, plus the Design & Governance card grid on the two index pages.
4. **Tests** — the afternoon-slug list and total count in `lessons.test.js`, and the authored-slug list in `lesson-content.test.js`.

The design introduces **no new scope**: no new catalog fields, no new page template mechanism, no refactor of the duplicated navigation. It follows the conventions already established by `skillhub/en/agent-control.html` and the existing afternoon lessons.

## Architecture

### Affected surfaces and their relationships

```
skillhub/js/lessons.js            ── single source of truth for catalog order/metadata
        │  (slug, title, track, order)
        ▼
skillhub/{en,fr}/<slug>.html      ── authored page per locale (must match catalog slug/title)
        │  (sidebar nav is copied verbatim into every page)
        ▼
#nav-afternoon on every page      ── hardcoded list, duplicated across all lesson + index pages
.lesson-card-grid on index pages  ── hardcoded card list, index pages only
        │
        ▼
skillhub/tests/lessons.test.js    ── asserts catalog order + count (fixtures must include new slug)
skillhub/tests/lesson-content.test.js ── asserts bilingual page structure (AUTHORED_SLUGS must include new slug)
```

The catalog is the only true data source; HTML navigation is a manual projection of it. Because that projection is duplicated, the consistency burden is on the edit set, and the navigation-consistency test (below) is what guards it going forward.

### Change inventory (file by file)

| # | File | Change |
|---|------|--------|
| 1 | `skillhub/js/lessons.js` | Append the new afternoon `Catalog_Entry`; fix the stale "17 lessons / 6 afternoon" header comment to "18 lessons / 7 afternoon". |
| 2 | `skillhub/en/configuring-shai-mcp-opcp-explorer.html` | New authored English page. |
| 3 | `skillhub/fr/configuring-shai-mcp-opcp-explorer.html` | New authored French page (full translation, same heading count). |
| 4 | `skillhub/en/*.html` (17 lesson pages + `index.html`) | Append the new link to `#nav-afternoon`. |
| 5 | `skillhub/fr/*.html` (17 lesson pages + `index.html`) | Append the new link to `#nav-afternoon`. |
| 6 | `skillhub/en/index.html`, `skillhub/fr/index.html` | Append the new card to the Design & Governance `.lesson-card-grid`. |
| 7 | `skillhub/en/configuring-...html`, `skillhub/fr/configuring-...html` | Mark the self-link `class="active"` in their own `#nav-afternoon`. |
| 8 | `skillhub/tests/lessons.test.js` | Append slug to `AFTERNOON_SLUGS`. |
| 9 | `skillhub/tests/lesson-content.test.js` | Append slug to `AUTHORED_SLUGS`. |
| 10 | `skillhub/tests/navigation-consistency.*.test.js` (new) | Property test asserting the afternoon-nav link appears last on every page. |

> The pages that receive the nav edit are every file under `skillhub/en/` and `skillhub/fr/`. Today each locale holds 17 existing lesson pages + 1 `index.html` = 18 files; after this feature each locale holds 18 lesson pages + 1 `index.html` = 19 files. The new lesson page gets the nav edit at authoring time.

## Components and Interfaces

### 1. Catalog entry (`skillhub/js/lessons.js`)

Append as the **last** entry of the afternoon block, immediately after `agent-design-capstone`, before the sandbox section comment. Field values are fixed by Requirements 1.1–1.5.

```javascript
  {
    id: 'configuring-shai-mcp-opcp-explorer',
    slug: 'configuring-shai-mcp-opcp-explorer',
    title: {
      en: 'Configuring a SHAI Agent with MCP to OPCP-EXPLORER',
      fr: 'Configurer un agent SHAI avec MCP vers OPCP-EXPLORER',
    },
    track: 'afternoon',
    difficulty: 'advanced',
    estimatedMinutes: 45,
    prerequisites: ['agent-design-capstone'],
  },
```

Header-comment fix (the comment is documentation only, but it is wrong once the entry lands):

- `lists all 17 lessons` → `lists all 18 lessons`
- `6 afternoon design & governance lessons` → `7 afternoon design & governance lessons`

No change to any exported function (`getLessonBySlug`, `getLessonsByTrack`, etc.) — they read the array dynamically, so appending the entry is sufficient.

### 2. Authored page skeleton (both locales)

Both new pages copy the structure of `skillhub/en/agent-control.html` verbatim except for locale-specific text, the active-link marker, and the lesson body. The skeleton, in order:

- `<!DOCTYPE html>` and `<html lang="en">` (EN) / `<html lang="fr">` (FR).
- `<head>`: `<meta charset>`, `<meta viewport>`, `<title>` (localized, ending `- Agentic AI OPCP Labs`), `<link rel="stylesheet" href="../assets/css/style.css">`.
- `<header class="site-header">`: logo, progress bar container, locale switcher (the current locale's button carries `class="active"`), hamburger button — copied verbatim from the sibling pages of the same locale.
- `<aside class="sidebar">`: the three sidebar sections `#nav-morning`, `#nav-afternoon`, `#nav-sandbox`, each with localized `sidebar-section-title`. These lists are the full navigation (see §3), and in these two pages the **self-link in `#nav-afternoon` carries `class="active"`** (Requirement 5.4).
- `<main class="main-content">` → `.lesson-content` → `.lesson-header` (`<h1>` + `.lesson-meta` with `difficulty-badge difficulty-badge--advanced` reading `Afternoon · Governance` / `Après-midi · Gouvernance` and `<span class="duration">⏱ ~45 min</span>`) → `.lesson-body` (the authored content, §2a/§2b).
- Mark-as-Complete control at the end of `.lesson-content`:
  `<button class="btn btn-success btn-mark-complete" data-lesson-id="configuring-shai-mcp-opcp-explorer">Mark as Complete</button>` (localized label; `data-lesson-id` identical in both locales).
- Scripts: `<script type="module" src="../js/app.js"></script>` and `<script type="module" defer src="../assets/js/diagrams.js"></script>`.

Every `<h1>`/`<h2>`/`<h3>` authored in EN must have a one-to-one counterpart in FR so `countHeadings(fr) === countHeadings(en)` (Requirement 4.4). The section outline below is written once and mirrored in both locales.

#### 2a. Lesson body — configuration walkthrough section outline

The body opens with an intro paragraph that references **opcp-explorer** (Requirement 3.5/4.6) and states the goal: configure a SHAI agent with a single MCP connection to the OPCP-EXPLORER agentic-ai-platform, run one discovery prompt, and read the report. Then:

- `<h2>` **Learning Objectives** — bulleted list (configure the agent, wire the MCP server, run the discovery prompt, interpret the classification report, apply governance).
- `<h2>` **The `AGENTS_CONTROL_AGENT_NO_SKILL.config.json` file** — intro, then the full config shown once in a `<pre><code>` block, followed by field-by-field subsections. The walkthrough must cover every field named in Requirement 3.6. Grouped under `<h3>` headings:
  - `<h3>` **Identity: `name` and `description`** — what each labels and why naming matters for auditability.
  - `<h3>` **`llm_provider`** — `ovhcloud` provider, model `Qwen3.5-397B-A17B`, `FunctionCall` mode; a governance callout noting the model/provider choice is itself a policy decision (OVHcloud-hosted inference).
  - `<h3>` **Built-in tools: `read`, `write`, `bash`** — what each grants; a governance callout that `write` and `bash` are powerful and should be scoped/observed.
  - `<h3>` **`system_prompt`** — the exact value `Call agent_control_containers with live=true and list the containers`, explaining that `live=true` forces an on-demand scan.
  - `<h3>` **Generation limits: `max_tokens` (`8192`) and `temperature` (`0.3`)** — why a low temperature suits an operations agent.
  - `<h3>` **Compaction block** — what the compaction settings do for long sessions.
  - `<h3>` **Disabled verification** — the disabled verification setting, with a governance callout that turning verification off removes a safety check and is a deliberate, accountable trade-off.
- `<h2>` **Connecting to OPCP-EXPLORER over MCP** — documents the `MCP_Server_Block` (Requirement 3.7) in a `<pre><code>` block and prose: stdio server, `command` `/home/ubuntu/agentic-ai-plateform/.venv/bin/python`, `args` `["/home/ubuntu/agentic-ai-plateform/src/mcp_interface.py"]`, `enabled_tools` `["*"]`, `required` `false`. A governance callout explains that `enabled_tools: ["*"]` grants the agent every tool the server exposes, and `required: false` lets the agent start even if the server is down.

Config content is presented in `<pre><code>` blocks following the `skill-prompt` / `<pre><code>` convention already used in `agent-control.html` (angle brackets and ampersands HTML-escaped).

#### 2b. Lesson body — Discovery Report interpretation section outline

- `<h2>` **Reading the Discovery Report** — intro describing the "Container Discovery Results (Live Scan)" report the agent returns.
- `<h3>` **Scan summary** — reports the live scan of **48 containers** on `opcp-psmc-platform` (`server_id` 4) and the **1 scan error** on `server_id` 5 caused by an **SSH authentication failure** (Requirement 3.8). A governance callout: an unreachable server is a blind spot — the report is complete only for the servers that answered.
- `<h3>` **Classification breakdown** — **4** containers classified `probable_agent` (confidence **0.60–1.00**) and **44** classified `unclassified` (confidence **0.00–0.40**) (Requirement 3.9). Note the classifier is an explainable heuristic (score ≥ 0.5 → probable_agent).
- `<h3>` **Probable agents** — a 4-row `<table>` (Requirement 3.10) with columns Container / Confidence / Key evidence:

  | Container | Confidence | Key classification evidence |
  |-----------|-----------|------------------------------|
  | `ai-shai-web-interface-app-25-8529` | 1.00 | SHAI web interface image + agent tokens / LLM egress |
  | `opcp-agentic-ai-labs-app-1-6209` | 0.75 | agentic-ai-labs app image, agent-related tokens |
  | `ai-shai-web-interface-postgres-25-5432` | 0.65 | part of the SHAI stack (supporting datastore) |
  | `opcp-agentic-ai-labs-base-1-6213` | 0.60 | agentic-ai-labs base image, weaker signal |

  (Evidence text is authored prose consistent with the `classification_evidence` style in `agent-control.html`; the names and confidences are fixed by the requirement.)
- `<h3>` **Notable findings and recommendations** (Requirement 3.11) — findings (e.g. the highest-confidence agent is the SHAI web interface; 44 unclassified containers are ordinary infrastructure; `server_id` 5 could not be scanned) and recommendations (investigate the SSH credential for server 5; confirm the probable agents are expected; re-run with `live=true` after remediation). A governance callout closes the section: discovery and classification are read-only and safe, but any **stop/restart/start** follow-up mutates running agents and must be confirmed with a human (human-in-the-loop) — cross-linking the existing afternoon governance lessons.

Governance callouts use the existing `<div class="alert alert-info">…</div>` pattern and appear in **both** the configuration walkthrough and the Discovery Report interpretation (Requirement 3.12).

### 3. Navigation list (every page, both locales)

The afternoon sidebar nav `#nav-afternoon` gains one `<li>` appended **last**, immediately after the `agent-design-capstone` entry (Requirements 5.1, 5.2, 5.5). The anchor is a locale-local relative filename.

EN — append after the capstone `<li>`:

```html
                <li><a href="configuring-shai-mcp-opcp-explorer.html">Configuring a SHAI Agent with MCP to OPCP-EXPLORER</a></li>
```

FR — append after the capstone `<li>`:

```html
                <li><a href="configuring-shai-mcp-opcp-explorer.html">Configurer un agent SHAI avec MCP vers OPCP-EXPLORER</a></li>
```

On the two **new** lesson pages only, the self-link in `#nav-afternoon` carries `class="active"` (Requirement 5.4), matching the existing convention (`<a href="agent-control.html" class="active">` in `agent-control.html`).

### 4. Index card grid (index pages only)

On `skillhub/en/index.html` and `skillhub/fr/index.html`, append one `.lesson-card` **last** in the Design & Governance `.lesson-card-grid` (Requirement 5.3), after the `agent-design-capstone` card.

EN:

```html
                        <a class="lesson-card" href="configuring-shai-mcp-opcp-explorer.html"><span class="lesson-card__title">Configuring a SHAI Agent with MCP to OPCP-EXPLORER</span></a>
```

FR:

```html
                        <a class="lesson-card" href="configuring-shai-mcp-opcp-explorer.html"><span class="lesson-card__title">Configurer un agent SHAI avec MCP vers OPCP-EXPLORER</span></a>
```

### 5. Test updates

- `skillhub/tests/lessons.test.js`: append `'configuring-shai-mcp-opcp-explorer'` as the **last** element of `AFTERNOON_SLUGS`. The total-count assertion (`MORNING + AFTERNOON + SANDBOX`) and the `getLessonsByTrack('afternoon')` ordering assertion then account for the new lesson automatically (Requirements 6.1, 6.2).
- `skillhub/tests/lesson-content.test.js`: append `'configuring-shai-mcp-opcp-explorer'` to `AUTHORED_SLUGS` so the bilingual structural checks (existence, `lang`, heading parity, `data-lesson-id`, `opcp-explorer`) run against the new pages (Requirement 6.3).
- New `skillhub/tests/navigation-consistency.property.test.js`: scans every `skillhub/{en,fr}/*.html` page and asserts, for each, that `#nav-afternoon` contains an anchor to `configuring-shai-mcp-opcp-explorer.html` placed last and immediately after the `agent-design-capstone.html` anchor — guarding the duplicated-navigation consistency going forward (Requirements 5.1, 5.2, 5.5).

## Data Models

The `Catalog_Entry` shape is unchanged; the new entry populates the existing fields only:

```
Catalog_Entry {
  id: string                 // 'configuring-shai-mcp-opcp-explorer'
  slug: string               // 'configuring-shai-mcp-opcp-explorer' (=== id)
  title: { en: string, fr: string }
  track: 'morning' | 'afternoon' | 'sandbox'   // 'afternoon'
  difficulty: 'beginner' | 'intermediate' | 'advanced'  // 'advanced'
  estimatedMinutes: integer  // 45, within [1, 480]
  prerequisites: string[]    // ['agent-design-capstone']
}
```

No new fields, enums, or data structures are introduced.

## Error Handling

This feature is static content and catalog data; there is no runtime error path to add.

- **Catalog integrity**: a typo in `id`/`slug`/`prerequisites` is caught by the existing catalog invariants (uniqueness, `id === slug`, prerequisite-exists, acyclic, bounds, no-orphan) in `lessons.test.js`, which now include the new entry.
- **Authoring mistakes**: a missing locale file, wrong `lang`, mismatched heading count, missing `data-lesson-id`, or missing `opcp-explorer` reference is caught by `lesson-content.test.js` once the slug is in `AUTHORED_SLUGS`.
- **Navigation drift**: a page missing the new afternoon link, or placing it out of order, is caught by the new navigation-consistency test.
- **Degradation**: if the Mark-as-Complete runtime or progress wiring is absent at view time, the page still renders as static content (the button is inert) — consistent with every existing page.

## Testing Strategy

**Dual approach**, consistent with the existing suite:

- **Property tests** (≥100 iterations where inputs are generated; set-wide assertions where the "input space" is the authored-slug set or the page set):
  - Existing catalog invariants in `lessons.test.js` run across all entries including the new one.
  - Existing content invariants in `lesson-content.test.js` run across all authored slugs including the new one.
  - New navigation-consistency test runs across every page in both locales.
- **Example tests**: the specific metadata of the new entry (id/slug/title/track/difficulty/minutes/prerequisites/ordering), the two index-card additions, and the active-link markers on the two new pages are verified by the ordering assertions and by authoring review.
- **Authoring review**: the fixed Discovery Report figures, the probable-agent table rows, the config field coverage, and the governance-callout placement (Requirements 3.6–3.12, 4.3) are qualitative content requirements verified by review against this design.

Run with the project's existing vitest setup (single run, not watch):

```
npx vitest --run skillhub/tests
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Catalog identifiers stay unique and self-consistent

*For any* catalog entry after the New_Lesson is added, its `id` equals its `slug`, and across all entries every `id` is unique and every `slug` is unique.

**Validates: Requirements 2.1, 2.2**

### Property 2: Prerequisites stay valid and acyclic

*For any* catalog entry, every id in its `prerequisites` refers to an existing catalog entry, and cycle detection starting from any entry finds no cycle.

**Validates: Requirements 2.3, 2.4**

### Property 3: Estimated duration stays in range

*For any* catalog entry, `estimatedMinutes` is an integer in the inclusive range 1 through 480.

**Validates: Requirements 2.5**

### Property 4: No orphan lessons

*For any* catalog entry, it has at least one prerequisite or it is referenced as a prerequisite by another entry.

**Validates: Requirements 2.6**

### Property 5: Every authored lesson declares the correct locale

*For any* authored slug, the English page contains `<html lang="en">` and the French page contains `<html lang="fr">`.

**Validates: Requirements 3.3, 4.2**

### Property 6: Bilingual heading parity

*For any* authored slug, the English page has at least one heading (`h1`–`h3`) and the French page has exactly the same number of headings as the English page.

**Validates: Requirements 4.4**

### Property 7: Mark-as-Complete control is wired to the lesson id

*For any* authored slug, both the English and French pages contain a control carrying `data-lesson-id="<slug>"`.

**Validates: Requirements 3.4, 4.5**

### Property 8: Authored pages reference opcp-explorer

*For any* authored slug, both the English and French pages reference `opcp-explorer` in their content.

**Validates: Requirements 3.5, 4.6**

### Property 9: The new lesson link appears last in every afternoon navigation list

*For any* lesson page or index page in either locale, the afternoon sidebar navigation (`#nav-afternoon`) contains a locale-local link to `configuring-shai-mcp-opcp-explorer.html`, placed last and immediately after the `agent-design-capstone.html` link.

**Validates: Requirements 5.1, 5.2, 5.5**
