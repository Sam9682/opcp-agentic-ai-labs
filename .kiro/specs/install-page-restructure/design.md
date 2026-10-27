# Design Document

## Overview

This feature reorders the `install-bare-metal.html` lesson body so learners meet the fast path first. The restructured body presents, in order: an SVG architecture diagram of the platform's AI agents, the Prerequisites, a new Quick Installation section (the promoted automated `init_pltf.sh` path plus the existing `Screen_InstallPltf1.png` screenshot), an optional Manual Installation section (the existing nine numbered steps and the Post-Installation Checklist), and the Exercises section at the end. All page chrome — header, sidebar, locale switcher, progress bar, stylesheet link, and the Mark as Complete button — is preserved verbatim.

The change touches four files and one new asset:

- `skillhub/en/install-bare-metal.html` (EN_Lesson_Page)
- `skillhub/fr/install-bare-metal.html` (FR_Lesson_Page)
- `scorm/skillhub_scorm/en/install-bare-metal.html` (SCORM_EN_Lesson_Page)
- `scorm/skillhub_scorm/fr/install-bare-metal.html` (SCORM_FR_Lesson_Page)
- `skillhub/assets/img/architecture-agents.svg` (Architecture_Diagram, new)

The lesson pages are static HTML with no framework. "Code" in this design is therefore HTML and hand-authored SVG; there is no build step for the SkillHub pages themselves. The SCORM copies are a generated artifact (see Asset Resolution below).

## Investigation Findings

These findings were confirmed by reading the actual files and resolve the open questions from the requirements phase.

### Asset directory and image reference pattern

- The SkillHub asset image directory is `skillhub/assets/img/`. It already contains `Screen_InstallPltf1.png` and sibling screenshots.
- All four existing pages reference that screenshot as `<img src="../assets/img/Screen_InstallPltf1.png" ...>`. From a page in `skillhub/en/` or `skillhub/fr/`, `../assets/img/` resolves to `skillhub/assets/img/`.
- **Decision:** the new SVG is authored once at `skillhub/assets/img/architecture-agents.svg`. All four pages reference it with the identical pattern `<img src="../assets/img/architecture-agents.svg" ...>`.

### SCORM asset resolution (resolves Requirements 1.5, 4.3, 4.4)

- The committed `scorm/skillhub_scorm/` tree contains only `index.html`, `en/`, and `fr/`. There is **no** committed `assets/` directory in that tree.
- `scripts/build-scorm.mjs` assembles the SCORM package from `skillhub/`. Its `CONTENT_ENTRIES` list is `["index.html", "en", "fr", "js", "assets"]`, and `copyCourseContent` cleans the output dir and copies each entry wholesale, so `skillhub/assets/` is copied to `scorm/skillhub_scorm/assets/` on every build. The build also enumerates `assets/` files into `imsmanifest.xml` via `DEPENDENCY_DIRS`.
- The SCORM pages already reference the same `../assets/img/...` pattern as the site pages. From `scorm/skillhub_scorm/en/` (or `fr/`) that resolves to `scorm/skillhub_scorm/assets/img/`, which the build populates.
- **Decision:** the SCORM tree does **not** maintain a separate authored asset directory. Authoring the SVG once in `skillhub/assets/img/` is sufficient for the SCORM copies to resolve `../assets/img/architecture-agents.svg` after a SCORM build. No SVG is hand-placed into `scorm/skillhub_scorm/`; doing so would be overwritten by the next build. The Requirement 1.5 "WHERE the SCORM tree uses a separate asset image directory" condition is therefore not triggered — the SCORM tree shares the SkillHub asset directory by construction of the build.

### Image src is identical across all four pages

Because both the site pages and the SCORM copies sit one directory below their respective `assets/img/`, every page uses exactly:

```html
<img src="../assets/img/architecture-agents.svg"
     alt="Architecture of the platform's AI agents: Operator, Developer, and Control"
     style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;">
```

(The `alt` text is translated on the FR pages — see French Translations.)

### SCORM-vs-site difference

The only intended difference between a SCORM copy and its site page is the bootstrap `<script type="module" src="../js/scorm/scorm-bootstrap.js"></script>` tag that `injectBootstrapScript` inserts before `</body>` during the build. The lesson body and all chrome are otherwise byte-identical. The committed SCORM copies currently do **not** contain that tag (it is injected at build time and is idempotent), so this restructure keeps the committed SCORM copies byte-consistent with the site pages' `lesson-body` and chrome.

## Architecture

### File-level view

```
skillhub/
  assets/img/
    architecture-agents.svg        (NEW — authored here, single source of truth)
  en/install-bare-metal.html       (restructured lesson-body)
  fr/install-bare-metal.html       (restructured lesson-body)
scorm/skillhub_scorm/
  en/install-bare-metal.html       (restructured lesson-body, byte-consistent w/ site EN)
  fr/install-bare-metal.html       (restructured lesson-body, byte-consistent w/ site FR)
  assets/img/architecture-agents.svg   (regenerated by build-scorm.mjs, not committed)
```

### Lesson-body section order (all four pages)

```
<div class="lesson-body">
  1. Intro paragraph
  2. Architecture diagram   (<figure> with <img> — first content element)
  3. Prerequisites          (<h2> + <ul>)
  4. Quick Installation     (<h2> + screenshot figure + init_pltf.sh)
  5. Manual Installation    (<details> optional wrapper → 9 steps + checklist)
  6. Exercises              (<h2> + lab alert, final section)
</div>
<button class="btn btn-success btn-mark-complete" data-lesson-id="install-bare-metal"> ... </button>
```

The intro paragraph stays at the very top (it already precedes everything and is page framing, not a numbered section). The diagram is the first *content element* after the intro; "first content element inside the Lesson_Body" (Req 2.1/3.3) is satisfied by placing the diagram figure immediately after the intro paragraph and before Prerequisites. The Mark as Complete button remains a sibling positioned after `.lesson-body` (Req 5.6).

## Components and Interfaces

### Component 1: Architecture diagram SVG

- **Path:** `skillhub/assets/img/architecture-agents.svg`
- **Filename rationale:** `architecture-agents.svg` is descriptive and matches the existing kebab/underscore asset naming without colliding with the `Screen_*` screenshots.
- **Authoring style:** hand-authored, self-contained SVG. No external fonts (uses the generic `sans-serif` family so it inherits the system UI font like the rest of the clean doc style), no embedded raster images, no scripts. This keeps it portable into the SCORM package and dependency-free.
- **Canvas:** `viewBox="0 0 720 300"` with `width="100%"` and no fixed pixel height, so it scales responsively inside the `max-width: 100%` figure. `preserveAspectRatio="xMidYMid meet"`.
- **Accessibility:** root `<svg>` carries `role="img"` and `aria-labelledby` pointing at a `<title>` and `<desc>`:
  - `<title>`: "Platform AI agents and their responsibilities"
  - `<desc>`: a sentence naming the three agents and what each does.
  - The consuming `<img>` also carries descriptive `alt` text (redundant-but-robust: when referenced via `<img>`, the SVG's internal title/desc are not exposed, so the `<img alt>` is the operative accessible name; the internal title/desc serve direct-open and inline-SVG use).
- **Layout:** three horizontally arranged rounded-rectangle boxes on a single row, each with a bold agent name and a short responsibility list beneath it:

  | Box | Agent name | Responsibility labels |
  |-----|-----------|----------------------|
  | Left | Operator Agent | start · stop · ps · backup · restore |
  | Center | Developer Agent | add applications · modify applications |
  | Right | Control Agent | compliance checks · verification |

  A thin header band or label above the three boxes reads "AI-Powered Store — Agentic AI". Box fills use light neutral tones with a `#ddd`-family border to match the screenshot figure styling; text uses a dark neutral. No gradients or external assets.

- **Interface:** consumed only via `<img src="../assets/img/architecture-agents.svg">`. No JS, no CSS class dependencies.

### Component 2: Restructured EN lesson body

Reorders the existing EN `lesson-body` content. No chrome (head, header, sidebar, locale switcher, progress bar, mark-complete button) changes.

Structure (EN):

```html
<div class="lesson-body">
    <p>Learn how to deploy the AI-Powered-Store platform ...</p>  <!-- existing intro, unchanged -->

    <!-- Architecture diagram: first content element -->
    <figure class="lesson-figure">
        <img src="../assets/img/architecture-agents.svg"
             alt="Architecture of the platform's AI agents: Operator, Developer, and Control"
             style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;">
        <figcaption>The platform's AI agents and their responsibilities</figcaption>
    </figure>

    <h2>Prerequisites</h2>
    <ul> ... existing prerequisites, unchanged ... </ul>

    <!-- Quick Installation: promoted automated path -->
    <h2>Quick Installation</h2>
    <p>The fastest way to deploy the platform is the automated <code>init_pltf.sh</code> script, which runs every step in this guide for you.</p>
    <figure class="lesson-figure">
        <img src="../assets/img/Screen_InstallPltf1.png"
             alt="Screenshot of the platform installation script execution"
             style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;">
        <figcaption>Example of the platform installation script execution</figcaption>
    </figure>
    <pre><code>chmod +x init_pltf.sh
./init_pltf.sh</code></pre>
    <p>Prefer to understand each step, or need to customize the install? Expand the manual installation below.</p>

    <!-- Manual Installation: optional, collapsible -->
    <details class="manual-install">
        <summary><h2 style="display:inline">Manual Installation (optional)</h2></summary>
        <p>These are the individual steps the automated script performs. Follow them only if you want a step-by-step install or need to customize the process.</p>

        <h2>Step 1: Install System Dependencies</h2> ... (existing Steps 1–9, unchanged) ...
        <h2>Step 9: Final Configuration</h2> ...

        <h2>Post-Installation Checklist</h2>
        <div class="alert alert-warning"> ... existing checklist, unchanged ... </div>
    </details>

    <h2>Exercises</h2>
    <p>This lesson includes hands-on lab exercises. ...</p>
    <div class="alert alert-info"> ... Lab Available ... </div>
</div>
```

Notes:
- The existing "Automated Script" section's screenshot (`Screen_InstallPltf1.png`) and the `init_pltf.sh` `chmod`/run snippet move up into Quick Installation. The old "Automated Script" heading is replaced by "Quick Installation"; its content is reused, not rewritten.
- The nine `Step N` headings, their code blocks, their alerts, and the Post-Installation Checklist move verbatim into the Manual Installation `<details>` wrapper — same inner HTML, same `<h2>`/`<h3>` structure, same code.
- Inside `<summary>`, the heading uses `display:inline` so the native disclosure triangle and the heading sit on one line while keeping the heading in the document outline.

### Component 3: Restructured FR lesson body

Identical structure to EN with French headings and intro text. The nine step bodies are already translated in the current FR page and are relocated verbatim into the `<details>` wrapper — no re-translation of step content.

### Component 4 & 5: SCORM EN / FR copies

The SCORM copies receive the same restructured `lesson-body` and the same (locale-appropriate) chrome as their site counterparts. They are kept byte-consistent with the site pages except for the build-injected bootstrap script tag, which is not part of the committed files. No path differences are needed — the `../assets/img/architecture-agents.svg` reference is identical and resolves after a SCORM build populates `assets/`.

## French Translations

New and changed strings for the FR pages. Existing FR strings (intro, prerequisites, the nine steps, the checklist, exercises, chrome) are reused unchanged.

| Context | English | French |
|--------|---------|--------|
| Diagram `alt` | Architecture of the platform's AI agents: Operator, Developer, and Control | Architecture des agents IA de la plateforme : Opérateur, Développeur et Contrôle |
| Diagram `figcaption` | The platform's AI agents and their responsibilities | Les agents IA de la plateforme et leurs responsabilités |
| Quick section heading | Quick Installation | Installation rapide |
| Quick intro | The fastest way to deploy the platform is the automated `init_pltf.sh` script, which runs every step in this guide for you. | Le moyen le plus rapide de déployer la plateforme est le script automatisé `init_pltf.sh`, qui exécute pour vous chaque étape de ce guide. |
| Quick follow-up | Prefer to understand each step, or need to customize the install? Expand the manual installation below. | Vous préférez comprendre chaque étape ou devez personnaliser l'installation ? Développez l'installation manuelle ci-dessous. |
| Manual `<summary>` heading | Manual Installation (optional) | Installation manuelle (optionnelle) |
| Manual intro | These are the individual steps the automated script performs. Follow them only if you want a step-by-step install or need to customize the process. | Voici les étapes individuelles exécutées par le script automatisé. Suivez-les uniquement si vous souhaitez une installation pas à pas ou devez personnaliser le processus. |

The FR screenshot `figcaption` ("Exemple d'exécution du script d'installation de la plateforme") and its `alt` are reused from the existing page. The FR Post-Installation Checklist heading ("Actions post-installation") and Prerequisites heading ("Prérequis") stay as they already are in the FR page.

Note: the current FR page contains an extra "AWS CLI" `<h3>` block under Step 2 that the EN page lacks. This design relocates the FR content verbatim and does not attempt to reconcile that pre-existing EN/FR difference — reconciliation is out of scope for this restructure.

## Data Models

No runtime data models. The relevant structures are static DOM fragments:

- **Lesson_Body section list:** the ordered sequence of top-level sections `[Diagram, Prerequisites, Quick Installation, Manual Installation, Exercises]`. The Manual Installation node is a `<details>` element whose children include the nine `Step N` sections and the Post-Installation Checklist.
- **Chrome block:** the `<head>` link, `<header>`, `<aside class="sidebar">`, locale switcher, progress bar, and the mark-complete `<button>` — treated as immutable relative to the current pages.

## Error Handling

Static HTML/SVG has no runtime error paths. The relevant failure modes and mitigations:

- **Broken image reference:** if `architecture-agents.svg` is missing or the path is wrong, the `<img>` shows its `alt` text. Mitigation: the single authoring location plus the build's wholesale `assets/` copy; a build-integration test asserts the SVG resolves in the SCORM package.
- **Malformed SVG:** a syntax error could render nothing. Mitigation: hand-authored SVG validated as well-formed XML in tests; no scripts or external refs reduce surface area.
- **`<details>` not supported:** `<details>`/`<summary>` is supported by all current evergreen and recent browsers. On a non-supporting agent the content degrades to always-visible (the manual steps still render, just not collapsed), which is acceptable and preserves content accessibility.
- **Chrome regression:** an accidental edit to header/sidebar/switcher/progress/stylesheet/button would break navigation. Mitigation: the chrome-preservation property asserts these blocks are unchanged across all four pages.

## Design Rationale and Alternatives

- **Single-source SVG in `skillhub/assets/img/`:** chosen because the SCORM build copies `skillhub/assets/` wholesale, so one authored file serves all four pages and both trees. Hand-placing a copy under `scorm/skillhub_scorm/` was rejected — the build cleans and regenerates that tree, so a committed copy would be redundant and could drift.
- **`<details>` for the optional Manual section (chosen):** it marks the section as clearly optional, collapses the long nine-step procedure so the Quick path dominates the first screen, needs no JavaScript, and degrades gracefully. Alternatives considered: (a) a plain `<h2>Manual Installation (optional)</h2>` with all steps always visible — simpler but reintroduces the long scroll the feature is trying to de-emphasize; (b) a JS-driven accordion — rejected because the lesson pages currently load no JS for content behavior and adding a dependency conflicts with the dependency-free chrome. `<details>` is the minimal, standards-based middle ground.
- **Reusing existing content verbatim:** the nine steps, checklist, screenshot, and `init_pltf.sh` snippet are moved, not rewritten, to minimize review surface and guarantee content preservation. Only the Quick Installation framing text and the Manual Installation wrapper text are new.
- **Keeping SCORM copies byte-consistent:** rather than special-casing SCORM paths, the design relies on the identical `../assets/` depth in both trees, so the four pages share the exact same `lesson-body` markup (chrome differs only by the pre-existing locale text and the build-time bootstrap tag).

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Canonical lesson-body section ordering

*For any* of the four Lesson_Pages (EN site, FR site, SCORM EN, SCORM FR), the ordered sequence of top-level lesson-body sections SHALL be exactly: Architecture Diagram, Prerequisites, Quick Installation, Manual Installation, Exercises — with the diagram as the first content element and Exercises as the final section (matched per locale via the heading-text mapping).

**Validates: Requirements 2.1, 2.2, 2.5, 2.6, 3.1, 3.3, 5.7**

### Property 2: Manual-section content preservation

*For any* of the four Lesson_Pages, the Manual Installation section SHALL contain all nine numbered installation steps (Step 1 through Step 9) and the Post-Installation Checklist, with each step's heading and code/body content equal to that page's pre-restructure content for the same step.

**Validates: Requirements 2.4, 3.5**

### Property 3: SCORM-vs-site lesson-body parity

*For any* locale L in {EN, FR}, the SCORM copy's lesson-body for L SHALL equal the corresponding SkillHub site page's lesson-body for L after normalizing away the build-injected SCORM bootstrap script tag.

**Validates: Requirements 4.1, 4.2**

### Property 4: Page-chrome preservation

*For any* of the four Lesson_Pages, the page chrome SHALL be preserved: the header (logo and header actions), the sidebar navigation (Beginner and Intermediate sections with the active lesson link), the locale switcher (EN and FR buttons with correct active state), the header progress bar, the stylesheet reference `../assets/css/style.css`, and the Mark as Complete button carrying `data-lesson-id="install-bare-metal"` positioned after the lesson-body — each unchanged from its pre-restructure form.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

## Testing Strategy

A dual approach: property tests for universal invariants across the four pages, and example/smoke/integration tests for the static asset content and build behavior.

**Property tests** (minimum 100 iterations each, tagged `Feature: install-page-restructure, Property {n}: {text}`):
- Property 1–4 above. Generators iterate over the set of four pages (and, for Property 2, over the nine step indices; for Property 3, over the two locale pairs). Where the input domain is the fixed four-page set, the test enumerates all members on every iteration and additionally randomizes over derived inputs (step index, locale, section label) to exercise the mapping logic.

**Example tests:**
- Diagram SVG content: Operator box lists start/stop/ps/backup/restore (Req 1.2); Developer box references adding and modifying applications (Req 1.3); Control box references compliance checks and verification (Req 1.4).
- EN/FR Quick section presents `init_pltf.sh` and the `Screen_InstallPltf1.png` screenshot (Req 2.3, 3.4).
- FR section headings equal the expected French strings (Req 3.2).

**Smoke test:**
- `architecture-agents.svg` exists at `skillhub/assets/img/` and parses as well-formed SVG with a `<title>`/`<desc>` (Req 1.1).

**Integration tests:**
- Run the SCORM build and assert `scorm/skillhub_scorm/assets/img/architecture-agents.svg` exists and that each SCORM page's diagram `<img src>` target resolves within the package (Req 1.5, 4.3, 4.4). 1–2 examples only; behavior does not vary with input.
