# Design Document

## Overview

This feature adds a new bilingual SkillHub lesson, **"Controlling AI Agents" / "Contrôle des agents IA"** (slug `agent-control`), to the Sandbox track of the opcp-explorer Platform programme. It teaches governance over agent autonomy: autonomy levels, approval gates, the guardrail layers, and human-in-the-loop (HITL) review.

The work is deliberately conservative. SkillHub is a build-free static site of plain HTML pages plus a handful of browser ES modules (`skillhub/js/*.js`, `skillhub/assets/js/diagrams.js`). The catalog in `skillhub/js/lessons.js` is the single source of truth, and `skillhub/tests/lessons.test.js` enforces its invariants. This design:

- clones the established lesson-page template for both locales,
- registers one new `Catalog_Entry` that extends the existing sandbox prerequisite chain,
- updates the hardcoded sidebars that already list the sandbox track,
- ships one hand-authored SVG diagram in the OVHcloud palette, embedded via `<img>`,
- reuses the existing `switchLocale` and `renderSidebar` behavior unchanged, and
- updates the hardcoded expectation arrays in the catalog test suite so the new entry is covered and all previously passing tests keep passing.

No new JavaScript modules, no build step, and no changes to runtime module APIs are introduced. The only `.js` edits are the catalog data (`lessons.js`) and the test expectation arrays (`lessons.test.js`).

### Finalized decisions (previously deferred)

| Decision | Value | Rationale |
| --- | --- | --- |
| `difficulty` | `advanced` | The lesson is governance/design content layered on the whole sandbox chain. Its prerequisite is `adding-applications`, which transitively depends on `install-bare-metal` → `starting-applications` → `stopping-applications` → `modifying-applications`. Conceptually it mirrors the afternoon governance lessons (`human-in-the-loop-ovhcloud-policy`, `threat-modeling-workshop`, `agent-design-capstone`), all `advanced`. It asks the learner to reason about risk, approval gates, and kill switches rather than run a single command, which is beyond `intermediate` hands-on labs. Choosing `advanced` also keeps the catalog's "at least one lesson per difficulty" invariant comfortably satisfied. |
| `estimatedMinutes` | `35` | Reading-plus-reflection lesson with one diagram and no live lab. Comparable governance lessons sit at 40 (`human-in-the-loop-ovhcloud-policy`) and the shorter sandbox labs at 25–40. 35 minutes fits a focused read of five sections plus the diagram, and is an integer safely within `[1, 480]`. |

## Grounding: how the existing system is built

Read during research; the design conforms to all of it.

- **Lesson page shape** (`skillhub/en/assistant-vs-agent.html`, `skillhub/fr/assistant-vs-agent.html`): `<!DOCTYPE html>` → `<html lang="…">` → `<head>` with `../assets/css/style.css` → `<body>` containing `header.site-header` (logo, `.progress-bar-container`, `.locale-switcher` with two `button[data-locale]`, `.hamburger-btn`), then `aside.sidebar`, then `main.main-content > .lesson-content` (`.lesson-header` with `h1` + `.lesson-meta`, then `.lesson-body`, then `button.btn.btn-success.btn-mark-complete[data-lesson-id]`), then `<script type="module" src="../js/app.js">` and `<script type="module" defer src="../assets/js/diagrams.js">`.
- **Two sidebar variants coexist in the repo:**
  - *Three-track variant* (`data-track="morning|afternoon|sandbox"`, verbatim section titles): used by `index.html` and every morning/afternoon lesson page — `assistant-vs-agent`, `agent-anatomy-7-components`, `agentic-loop-and-variants`, `stopping-criteria`, `multi-agent-patterns`, `when-not-multi-agent`, `guardrails-5-layers`, `human-in-the-loop-ovhcloud-policy`, `threat-modeling-workshop`, `agent-design-capstone`.
  - *Difficulty-grouped variant* (sections "Beginner"/"Intermediate", no `data-track`, no explicit sandbox heading): used by the existing sandbox lab pages — `install-bare-metal`, `starting-applications`, `stopping-applications`, `making-backups`, `modifying-applications`, `adding-applications`.
  The requirement is that the Sandbox-track section of each page link to `agent-control.html`. For the three-track variant this means appending an `<li>` to the `#nav-sandbox` list. For the difficulty-grouped variant, `agent-control` is an `advanced` lesson, so its link belongs in that variant's grouping; since those pages currently have only Beginner/Intermediate groups, the link is added to the Intermediate group (the highest group present) to keep it visible and adjacent to the sandbox labs, matching how `adding-applications` is grouped today. The new `agent-control` pages themselves use the **three-track variant** (cleaner, matches the governance lessons it resembles).
- **Catalog** (`skillhub/js/lessons.js`): `export const lessons = [...]`, 16 entries today (4 morning, 6 afternoon, 6 sandbox). Each entry: `{ id, slug, title: { en, fr }, track, difficulty, estimatedMinutes, prerequisites: [] }`. Sandbox chain tail today: `modifying-applications` → `adding-applications` (prereq `['modifying-applications']`).
- **Catalog invariants** (`skillhub/tests/lessons.test.js`): length equals `MORNING_SLUGS.length + AFTERNOON_SLUGS.length + SANDBOX_SLUGS.length`; `getLessonsByTrack('sandbox')` must deep-equal `SANDBOX_SLUGS` in order; unique id/slug; prereqs reference existing ids; acyclic; no self-prereq; no orphan; difficulty/track in enum; `estimatedMinutes` integer in `[1, 480]`; titles non-empty. **The hardcoded `SANDBOX_SLUGS` array and the length assertion will break unless updated** — this is the central test change.
- **i18n** (`skillhub/js/i18n.js`): `switchLocale(target)` normalizes the target, persists it, then rewrites `window.location.pathname` — if it matches `/^\/(en|fr)\//` it replaces only the leading segment and preserves the `<slug>.html` tail, else falls back to `/<locale>/`. `initLocaleSwitcher` wires every `.locale-switcher button[data-locale]`. No per-page logic; the new pages inherit correct toggle behavior for free.
- **Navigation** (`skillhub/js/navigation.js`): `renderSidebar` can render a catalog-driven sidebar with correct `href`, `active` class, and `aria-current` when a `.sidebar` container is present, but the shipped pages carry **hardcoded** sidebars. `initNavigation` renders into `.sidebar` only when present; since pages ship hardcoded markup, the hardcoded links are what users see. We therefore edit hardcoded markup, consistent with the rest of the site.
- **Diagrams** (`skillhub/assets/js/diagrams.js`): upgrades `<pre><code>flowchart …</code></pre>` blocks to Mermaid SVGs with graceful fallback. This is unrelated to the hand-authored `<img>` SVG required here; both can coexist on the page. The OVHcloud palette it uses (navy `#1a1f71`, blue `#0050d7`, light `#e8efff`) is the palette the new SVG must match.
- **Reference SVG** (`skillhub/assets/img/architecture-agents.svg`): inline `<style>` classes, `viewBox`, `role="img"`, `<title>`/`<desc>` referenced by `aria-labelledby`, rounded `rect` boxes with `text` labels. The new SVG follows the same authoring conventions but swaps the grey palette for the OVHcloud palette.
- **Content source** (`~/workspace/github/agentic-ai-plateform/docs/ARCHITECTURE_GUIDE.md`): bilingual EN/FR architecture guide describing the platform's two virtual agents (Developer, Operations), the operations they perform (START/STOP/RESTART/PS/LOGS, add/modify apps), security hardening, admin-only gates, timeouts, and graceful degradation. These concrete facts anchor the lesson's examples (approval gates on START/STOP, admin-only destructive actions, HITL review of deployments).

  > **Note — external source, outside the Kiro workspace.** This guide lives in a *separate* repository, not in this workspace. It is confirmed to exist at the absolute WSL path `/home/slepetre/workspace/github/agentic-ai-plateform/docs/ARCHITECTURE_GUIDE.md` (a bilingual EN+FR guide). It is intentionally located outside the workspace, so workspace-scoped search tools will **not** find it. Implementation of the lesson-body tasks (tasks 4 and 5) must read it directly from that absolute external path rather than relying on in-workspace search.

## Architecture

```
skillhub/
├── en/agent-control.html        NEW  (three-track sidebar, EN body, <img> SVG)
├── fr/agent-control.html        NEW  (three-track sidebar, FR body, <img> SVG)
├── assets/img/
│   └── agent-control.svg        NEW  (hand-authored, OVHcloud palette)
├── js/
│   └── lessons.js               EDIT (append one Catalog_Entry)
├── tests/
│   └── lessons.test.js          EDIT (SANDBOX_SLUGS + any new assertions)
├── en/*.html  (12 pages)        EDIT (sidebar: add agent-control link)
├── fr/*.html  (12 pages)        EDIT (sidebar: add agent-control link)
└── en/index.html, fr/index.html EDIT (sidebar + sandbox card grid link)
```

Data/behavior flow is unchanged from the rest of SkillHub:

```
Browser loads /en/agent-control.html
  → app.js boots (shared) → initLocaleSwitcher() wires .locale-switcher buttons
  → EN "FR" button click → switchLocale('fr')
       normalizeLocale → 'fr'; setLocalePreference('fr')
       pathname '/en/agent-control.html' matches /^\/(en|fr)\//
       → href = '/fr/agent-control.html'   (slug preserved)
  → progress.js / self-assessment.js read data-lesson-id="agent-control" (shared)
  → diagrams.js upgrades any flowchart code blocks (none required here)
```

The new page is a pure consumer of existing modules; the only data surface that grows is the `lessons` array.

## Components and Interfaces

### 1. Catalog_Entry (data change in `skillhub/js/lessons.js`)

Append as the final element of the `lessons` array, immediately after `adding-applications`, extending the sandbox chain tail:

```javascript
  {
    id: 'agent-control',
    slug: 'agent-control',
    title: {
      en: 'Controlling AI Agents',
      fr: 'Contrôle des agents IA',
    },
    track: 'sandbox',
    difficulty: 'advanced',
    estimatedMinutes: 35,
    prerequisites: ['adding-applications'],
  },
```

This satisfies Requirement 5 in full: `id === slug === 'agent-control'`, exact bilingual titles, `track: 'sandbox'`, a valid `difficulty`, an integer `estimatedMinutes` in range, and `prerequisites: ['adding-applications']` so the entry extends the chain `… → modifying-applications → adding-applications → agent-control` without introducing a cycle (it is referenced by nothing and references one existing, acyclic ancestor).

The catalog doc comment currently says "lists all 16 lessons … then 6 sandbox"; update it to "17 lessons … then 7 sandbox" to keep the comment truthful.

### 2. New Lesson_Page template (both locales)

Both files clone the structure of `assistant-vs-agent.html` exactly (header, three-track sidebar, main-content, mark-complete button, both script tags). The three-track sidebar is used, with `agent-control.html` appended to the `#nav-sandbox` list and marked `class="active"` on the page itself (Requirement 6.5). Differences from the twin: `<title>`, `h1`, `.lesson-meta` (advanced badge, `⏱ ~35 min`), the lesson body, the embedded SVG, and `data-lesson-id="agent-control"`.

**EN page skeleton (`skillhub/en/agent-control.html`):**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Controlling AI Agents - Agentic AI OPCP Labs</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <header class="site-header" role="banner"> … same as twin, EN labels … 
        <div class="locale-switcher" role="navigation" aria-label="Language selector">
            <button class="active" data-locale="en" aria-label="English">EN</button>
            <button data-locale="fr" aria-label="Français">FR</button>
        </div>
        … hamburger …
    </header>

    <aside class="sidebar" role="navigation" aria-label="Lesson navigation">
        <!-- three-track sidebar identical to the EN governance lessons,
             with agent-control.html appended and active in #nav-sandbox -->
        …
        <div class="sidebar-section" data-track="sandbox">
            <h2 class="sidebar-section-title">Sandbox — opcp-explorer Platform</h2>
            <ul class="sidebar-nav" id="nav-sandbox">
                … six existing sandbox links …
                <li><a href="agent-control.html" class="active">Controlling AI Agents</a></li>
            </ul>
        </div>
    </aside>

    <main class="main-content" role="main">
        <div class="lesson-content">
            <div class="lesson-header">
                <h1>Controlling AI Agents</h1>
                <div class="lesson-meta">
                    <span class="difficulty-badge difficulty-badge--advanced">Sandbox · Governance</span>
                    <span class="duration">⏱ ~35 min</span>
                </div>
            </div>
            <div class="lesson-body"> … EN sections (see outline) … 
                <figure class="lesson-figure">
                    <img src="../assets/img/agent-control.svg"
                         alt="Agent-control architecture: autonomy levels rising left to right, each
                              gated by an approval gate, wrapped in guardrail layers, with a
                              human-in-the-loop review and kill switch.">
                    <figcaption>Controlling an agent: autonomy levels, approval gates, guardrail layers, and human-in-the-loop.</figcaption>
                </figure>
                …
            </div>
            <button class="btn btn-success btn-mark-complete" data-lesson-id="agent-control">
                Mark as Complete
            </button>
        </div>
    </main>
    <script type="module" src="../js/app.js"></script>
    <script type="module" defer src="../assets/js/diagrams.js"></script>
</body>
</html>
```

**FR page (`skillhub/fr/agent-control.html`)** is the mirror: `<html lang="fr">`, FR header labels, the FR three-track sidebar (section titles "Matin — Introduction et fondamentaux", "Conception et gouvernance", "Bac à sable — plateforme opcp-explorer"), `<title>Contrôle des agents IA - Agentic AI OPCP Labs</title>`, `<h1>Contrôle des agents IA</h1>`, badge text "Bac à sable · Gouvernance", `⏱ ~35 min`, a French body, the FR locale button marked active, a French `alt` and `figcaption`, and the same two script tags. `data-lesson-id` stays `agent-control` (locale-independent, per the completion-key convention in `navigation.js`).

#### Lesson body outline (both locales, derived from ARCHITECTURE_GUIDE.md)

Five sections mirror the governance arc of the guide and the companion lessons. EN headings / FR headings:

1. **Learning Objectives / Objectifs pédagogiques** — place an operation on the autonomy spectrum; choose where approval gates belong; name the guardrail layers; decide what needs HITL.
2. **The Autonomy Spectrum / Le spectre d'autonomie** — five levels from Suggest to Fully autonomous (reuse the spectrum framing from `assistant-vs-agent`), mapped onto concrete opcp-explorer operations from the guide: START/STOP (confirm each step), deploy-to-staging (act with checkpoints), restart-crashed-app (act and report).
3. **Approval Gates / Points d'approbation** — where a human signs off before an action runs: admin-only destructive endpoints (delete app, destroy MIG instances), billing-affecting START/STOP, production promotion. Ties to the guide's "admin-only access" and "confirm before each action".
4. **Guardrail Layers / Les couches de garde-fous** — permissions/scoping, input validation and path-traversal protection, timeouts and process-group termination, observability/logging (`billing_activities.log`, prompt logs), and the kill switch. These map directly to the guide's security-hardening and timeout features; cross-link to the afternoon "Guardrails: the Five Layers" lesson.
5. **Human-in-the-Loop / Human-in-the-Loop** — when review is mandatory, graceful degradation as a safety posture, and the OVHcloud AI policy stance; cross-link to `human-in-the-loop-ovhcloud-policy`. Close with a **Key Takeaways / Points clés** list and a **Next/Suite** `alert alert-info` block.

The embedded SVG sits in Section 2 (the spectrum + gating visual). Content is authored, not copied verbatim, and kept to plain prose, `<ul>/<ol>`, one optional `<table>`, and `alert alert-info` callouts — the vocabulary the existing stylesheet already supports.

### 3. Diagram_Asset (`skillhub/assets/img/agent-control.svg`)

A single hand-authored SVG, same authoring conventions as `architecture-agents.svg` (inline `<style>`, `viewBox`, `role="img"`, `<title>`/`<desc>` via `aria-labelledby`), but in the OVHcloud palette. It visualizes the control model as one figure:

- **Palette:** navy `#1a1f71` (outer frame, kill-switch, arrows/strokes, heading text), blue `#0050d7` (approval-gate stroke + level borders), light `#e8efff` (level fills and layer band fills). Text in the dark ink `#1c2132` already used by the Mermaid theme, on light fills, for contrast.
- **Layout (left → right):** five **autonomy-level** boxes in a rising row — `1 Suggest`, `2 Confirm each step`, `3 Act with checkpoints`, `4 Act and report`, `5 Fully autonomous` — connected by navy arrows showing increasing autonomy. Between the higher-autonomy levels sits a labelled **approval gate** (a blue-stroked diamond/box "Approval gate") that an action must pass before it runs.
- **Guardrail layers:** the level row is wrapped in concentric light bands (or a stacked left-edge legend) labelled with the five guardrail layers — Permissions, Validation, Limits/Timeouts, Observability, Kill switch — showing that every level operates *inside* the guardrails. The **Kill switch** band is drawn in navy to read as the hard outer boundary.
- **Human-in-the-loop:** a distinct **HITL / Human review** node in navy sits above the gates with arrows down into them, signaling that approval gates escalate to a human.
- **Accessibility:** `<title id="diagramTitle">` = "Controlling an AI agent: autonomy levels, approval gates, guardrails, and human-in-the-loop"; `<desc id="diagramDesc">` spells out the layering in a sentence. The page `<img alt>` carries a locale-appropriate equivalent (EN on the EN page, FR on the FR page) per Requirement 4.5. The SVG itself is locale-neutral (short English labels) and shared by both pages, exactly as the reference `architecture-agents.svg` is shared.

Requirement 4.2 is satisfied by the literal presence of `#1a1f71`, `#0050d7`, and `#e8efff` in the SVG source.

### 4. Sidebar wiring (hardcoded markup edits)

Every page that ships a sandbox listing gains an `agent-control` link.

**Three-track pages** — append to `#nav-sandbox`:
- EN: `<li><a href="agent-control.html">Controlling AI Agents</a></li>`
- FR: `<li><a href="agent-control.html">Contrôle des agents IA</a></li>`

Files (three-track variant, EN and FR each): `index.html`, `assistant-vs-agent.html`, `agent-anatomy-7-components.html`, `agentic-loop-and-variants.html`, `stopping-criteria.html`, `multi-agent-patterns.html`, `when-not-multi-agent.html`, `guardrails-5-layers.html`, `human-in-the-loop-ovhcloud-policy.html`, `threat-modeling-workshop.html`, `agent-design-capstone.html`. For `index.html` also append a matching card to the `Sandbox — opcp-explorer Platform` `.lesson-card-grid`.

**Difficulty-grouped sandbox pages** — append to the Intermediate group's `<ul>` (highest group present, adjacent to the other sandbox labs):
- EN: `<li><a href="agent-control.html">Controlling AI Agents</a></li>`
- FR: `<li><a href="agent-control.html">Contrôle des agents IA</a></li>`

Files (difficulty-grouped variant, EN and FR each): `install-bare-metal.html`, `starting-applications.html`, `stopping-applications.html`, `making-backups.html`, `modifying-applications.html`, `adding-applications.html`.

**Active-state rule (Requirement 6.5):** on `agent-control.html` itself, its own sidebar link gets `class="active"`; no other page marks it active.

#### Complete enumeration of sidebar files to edit

EN (17): `en/index.html`, `en/assistant-vs-agent.html`, `en/agent-anatomy-7-components.html`, `en/agentic-loop-and-variants.html`, `en/stopping-criteria.html`, `en/multi-agent-patterns.html`, `en/when-not-multi-agent.html`, `en/guardrails-5-layers.html`, `en/human-in-the-loop-ovhcloud-policy.html`, `en/threat-modeling-workshop.html`, `en/agent-design-capstone.html`, `en/install-bare-metal.html`, `en/starting-applications.html`, `en/stopping-applications.html`, `en/making-backups.html`, `en/modifying-applications.html`, `en/adding-applications.html`.

FR (mirror): the identical 17 filenames under `fr/`.

(That is every HTML file in `skillhub/en/` and `skillhub/fr/` *except* the two new `agent-control.html` pages, which are authored already wired.) The new `agent-control.html` pages are **not** in the edit list because they are created with the link present.

### 5. i18n toggle behavior (no code change)

The new pages carry the standard `.locale-switcher` with two `button[data-locale]`. `initLocaleSwitcher` (invoked by the shared boot) wires them to `switchLocale`. Because both pages live at `/{en,fr}/agent-control.html`, `switchLocale`'s existing regex `/^\/(en|fr)\//` matches and rewrites only the leading segment, preserving `agent-control.html`:

- FR page, click EN → `/en/agent-control.html` (Req 7.1)
- EN page, click FR → `/fr/agent-control.html` (Req 7.2)
- slug preserved, only locale segment rewritten (Req 7.3)
- active button is the page's own locale, set in static markup (Req 7.4)

No change to `i18n.js` is needed or made.

## Data Models

The only data model touched is the `Catalog_Entry`, unchanged in shape:

```
Catalog_Entry = {
  id: string,                 // kebab-case, === slug
  slug: string,               // kebab-case, === id, === HTML filename stem
  title: { en: string, fr: string },   // both non-empty
  track: 'morning' | 'afternoon' | 'sandbox',
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  estimatedMinutes: integer,  // 1..480
  prerequisites: string[],    // existing ids, acyclic, excludes self
}
```

Post-change sandbox chain (topological):
`install-bare-metal → starting-applications → stopping-applications → modifying-applications → adding-applications → agent-control`
(with `making-backups` branching off `install-bare-metal`, unchanged).

## Error Handling

This is static content; "errors" are authoring and invariant violations caught before ship, not runtime faults.

- **Catalog invariant breakage** (bad track/difficulty, out-of-range minutes, duplicate id/slug, dangling or cyclic prereq, empty title): caught by `skillhub/tests/lessons.test.js`. The chosen values are constructed to pass all of them.
- **Stale test expectation arrays:** adding the entry without updating `SANDBOX_SLUGS` makes the length assertion and the `getLessonsByTrack('sandbox')` deep-equal assertion fail. The test edit (below) is mandatory and is part of this feature, not an afterthought.
- **Broken sidebar link / missing page:** mitigated by creating both HTML pages before (or with) the sidebar edits, and by the slug being identical across catalog, filenames, and links.
- **Diagram load failure:** an `<img>` that fails to load degrades to its `alt` text (the required accessible description); no script dependency. This is strictly more robust than the Mermaid path.
- **localStorage unavailable:** `switchLocale`/`setLocalePreference` already swallow storage errors and still navigate; inherited unchanged.

## Testing Strategy

**Dual approach.** The catalog invariants are genuine universal properties already enforced across all lessons; the per-page and per-file requirements are example/static assertions. Both run under the existing Vitest setup (`vitest run`, no watch mode) — no new tooling.

### Required test edits (`skillhub/tests/lessons.test.js`)

1. **Extend `SANDBOX_SLUGS`** to append `'agent-control'` as the last element. This single edit makes the existing length assertion (`MORNING + AFTERNOON + SANDBOX`) and the `getLessonsByTrack('sandbox')` ordered-deep-equal assertion cover the new entry (Requirements 8.1, 8.6).
2. **Optional targeted assertions** reinforcing Requirement 5/8 at the entry level (add to the `lessons data structure` describe block):
   - `getLessonBySlug('agent-control')` is defined, `id === slug === 'agent-control'`, `track === 'sandbox'`, `difficulty === 'advanced'`, `estimatedMinutes === 35`, `prerequisites` deep-equals `['adding-applications']`, and `title.en`/`title.fr` equal the exact strings.
   - `getPrerequisiteChain('agent-control')` ends with `'adding-applications'` and contains the full sandbox chain in topological order with no duplicates and without `'agent-control'` itself.

All existing invariant tests (unique id/slug, acyclic graph, no self-prereq, no orphan, enum/range checks, non-empty titles) then automatically validate the new entry (Requirements 8.2–8.5) with no further edits.

### Optional static-page assertions (if a DOM/string test is added)

These cover the file-specific requirements that are not expressible as catalog properties: page existence and `lang`, presence of header/sidebar/main structure, `data-lesson-id="agent-control"`, both script tags, an `<img>` pointing at `agent-control.svg` with non-empty `alt`, the SVG containing all three palette hex values, and each sidebar's sandbox listing including `agent-control.html`. If no HTML-testing harness exists in the repo, these are verified by review plus a quick `vitest run` of the catalog suite; the design does not mandate introducing a DOM test runner.

### Property test configuration

Property tests here are the catalog invariants, already iterated across the full `lessons` array (every entry is a generated-equivalent case). Each keeps its existing form. New runtime properties are **not** introduced because `switchLocale` and `renderSidebar` properties already exist and already hold for the `agent-control` slug by construction.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The per-entry checks for the new lesson (valid enum/range fields, unique id/slug, referential-integrity of prerequisites) are instances of catalog-wide universal invariants rather than one-off assertions, so they are expressed here as properties over the whole catalog that the `agent-control` entry must satisfy. The two runtime properties below are already implemented in `i18n.js` and `navigation.js`; the new slug inherits them.

### Property 1: Catalog field validity

*For all* lessons in the catalog, `track` is one of `morning | afternoon | sandbox`, `difficulty` is one of `beginner | intermediate | advanced`, `estimatedMinutes` is an integer within `[1, 480]`, and `title.en` and `title.fr` are both non-empty.

**Validates: Requirements 5.3, 5.4, 5.5, 8.4**

### Property 2: Identifier uniqueness

*For all* pairs of distinct lessons in the catalog, their `id` values differ and their `slug` values differ, and *for all* lessons `id === slug`.

**Validates: Requirements 5.1, 5.7, 8.2**

### Property 3: Prerequisite graph integrity

*For all* lessons and *for all* entries in that lesson's `prerequisites`, the entry references an existing lesson `id`, is never the lesson's own `id`, the resulting dependency graph is acyclic, and every lesson is either a root or reachable within some chain (no orphans).

**Validates: Requirements 5.6, 8.3, 8.5**

### Property 4: Locale toggle preserves the slug

*For any* lesson page whose path matches `/<en|fr>/<slug>.html`, invoking `switchLocale(L)` for a target locale `L` navigates to `/<L>/<slug>.html`, rewriting only the leading locale segment and preserving the `<slug>.html` filename.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 5: Active lesson marking

*For any* rendered sidebar and *for any* lesson whose slug matches the current page path, that lesson's link is marked active (`active` class and `aria-current="page"`) while all other links are not.

**Validates: Requirements 6.5**
