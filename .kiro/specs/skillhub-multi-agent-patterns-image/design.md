# Design Document

## Overview

This feature adds an illustrative diagram to the "Why Decompose?" section of the `multi-agent-patterns` SkillHub lesson, on both the English and French pages. The work has two parts: (1) copy a source PNG from a Windows path (mapped into the WSL environment) into the shared SkillHub image asset directory, and (2) insert a localized `<figure class="lesson-figure">` block immediately after the section heading and before the existing bullet list on each page.

The change is a small, content-only edit. It introduces no new runtime code, no build step changes, and no new dependencies. The design follows the figure convention already established across the SkillHub lessons.

### Verified Anchor Points

The target markup was confirmed by reading both files:

- `skillhub/en/multi-agent-patterns.html` — the heading `<h2>Why Decompose?</h2>` is immediately followed by `<ul>` (the bullet list begins on the next line).
- `skillhub/fr/multi-agent-patterns.html` — the heading `<h2>Pourquoi décomposer ?</h2>` is immediately followed by `<ul>`.

The existing SkillHub figure convention (used in `agent-anatomy-7-components.html`, `assistant-vs-agent.html`, `install-bare-metal.html`, `stopping-applications.html`, and others) is:

```html
<figure class="lesson-figure">
    <img src="../assets/img/<file>" alt="..." style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;">
    <figcaption>...</figcaption>
</figure>
```

The new figures reuse this structure exactly.

## Architecture

The operation is a sequence of three filesystem actions performed by the agent, with a precondition gate:

```
1. Resolve + read Source_Image
   (C:\Users\slepetre\agent-vs-assistant\multi-agent-patterns.png
    -> WSL-mapped path)
          |
          |-- if unreadable --> report failure, STOP (no page edits)   [Req 4.3]
          v
2. Copy to Asset_Image
   (skillhub/assets/img/multi-agent-patterns.png)                      [Req 1.1, 1.2]
          v
3. Insert Lesson_Figure into EN page  (after <h2>Why Decompose?</h2>)   [Req 2.*]
   Insert Lesson_Figure into FR page  (after <h2>Pourquoi décomposer ?</h2>) [Req 3.*]
```

### Design Decision: Precondition Gate Before Any Edit

Requirement 4.3 requires that if the source image cannot be read, the pages are left unchanged. To guarantee this atomicity, the image copy (step 2) is performed and verified **before** any HTML file is touched. If the source read or copy fails, the process stops and reports the failure, and no edit to either Lesson_Page is attempted. This ordering makes "leave pages unchanged on failure" a natural consequence of the step order rather than requiring a rollback mechanism.

### Design Decision: Anchored String Insertion

Each page edit is a targeted insertion at a known anchor (the heading line), not a full-file rewrite. The anchor text (`<h2>Why Decompose?</h2>` / `<h2>Pourquoi décomposer ?</h2>`) is unique within its file, so an anchored replace that turns `<heading>\n<ul>` into `<heading>\n<figure>...</figure>\n<ul>` preserves every surrounding element. This satisfies Requirement 4.2 (preserve existing content) with minimal blast radius.

## Components and Interfaces

This is a content change, so "components" are the files and the inserted markup rather than code modules.

| Component | Path | Role |
|-----------|------|------|
| Source_Image | `C:\Users\slepetre\agent-vs-assistant\multi-agent-patterns.png` (WSL-mapped) | Input image to copy |
| Asset_Image | `skillhub/assets/img/multi-agent-patterns.png` | Copied image referenced by both pages |
| EN_Lesson_Page | `skillhub/en/multi-agent-patterns.html` | Receives English Lesson_Figure |
| FR_Lesson_Page | `skillhub/fr/multi-agent-patterns.html` | Receives French Lesson_Figure |

### Inserted Markup — English Page

Inserted between `<h2>Why Decompose?</h2>` and the following `<ul>`:

```html
<h2>Why Decompose?</h2>
<figure class="lesson-figure">
    <img src="../assets/img/multi-agent-patterns.png" alt="Diagram of multi-agent decomposition patterns showing how a task is split across specialized agents" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;">
    <figcaption>Multi-agent patterns: decomposing a task across specialized agents</figcaption>
</figure>
<ul>
    <li><strong>Specialization</strong> — ...</li>
    ...
</ul>
```

### Inserted Markup — French Page

Inserted between `<h2>Pourquoi décomposer ?</h2>` and the following `<ul>`:

```html
<h2>Pourquoi décomposer ?</h2>
<figure class="lesson-figure">
    <img src="../assets/img/multi-agent-patterns.png" alt="Schéma des patrons de décomposition multi-agents montrant comment une tâche est répartie entre des agents spécialisés" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;">
    <figcaption>Patrons multi-agents : décomposer une tâche entre des agents spécialisés</figcaption>
</figure>
<ul>
    <li><strong>Spécialisation</strong> — ...</li>
    ...
</ul>
```

Both `<img>` elements use the identical `src` (`../assets/img/multi-agent-patterns.png`) and the identical inline style required by Requirements 2.3 and 3.3. Only the `alt` text and `<figcaption>` differ by language.

## Data Models

There is no structured data model. The only stable "contract" values are the fixed strings shared by both figures:

- **Relative image src:** `../assets/img/multi-agent-patterns.png`
- **Figure wrapper:** `<figure class="lesson-figure">`
- **Inline img style:** `max-width: 100%; border: 1px solid #ddd; border-radius: 4px;`

Localized values differ per page:

| Field | EN | FR |
|-------|----|----|
| Alt_Text | English description of the diagram | French description of the diagram |
| Figcaption | English caption | French caption |

## Error Handling

| Condition | Handling | Requirement |
|-----------|----------|-------------|
| Source_Image path cannot be resolved or read | Report the failure explicitly; perform no edits to either Lesson_Page; do not create a partial/empty Asset_Image | 4.3 |
| Copy completes but content differs from source | Treated as a failed copy; report and stop before editing pages | 1.2, 4.3 |
| Anchor heading not found in a page | Report the discrepancy rather than inserting at a guessed location (defensive; anchors were verified present during design) | 2.2, 3.2, 4.2 |

The guiding principle is fail-closed: any failure in the copy/verify phase leaves both HTML pages in their original state.

## Testing Strategy

Because every acceptance criterion targets two fixed static HTML files and a single concrete file-copy operation, verification is example-based and edge-case based. There is no space of generated inputs over which 100 randomized iterations would surface additional edge cases, so property-based tests do not apply here (see Correctness Properties below).

### Example-based checks

- **Asset copy fidelity (1.1, 1.2):** after the operation, `skillhub/assets/img/multi-agent-patterns.png` exists and its bytes match the source (size + hash equality).
- **EN figure presence and shape (2.1–2.5, 4.1):** the EN file contains a `<figure class="lesson-figure">` with an `<img>` whose `src` is `../assets/img/multi-agent-patterns.png`, whose `style` equals the required string, a non-empty English `alt`, and a non-empty English `<figcaption>`.
- **EN placement (2.2):** the figure appears after `<h2>Why Decompose?</h2>` and before the first `<ul>` that follows that heading.
- **FR figure presence and shape (3.1–3.5, 4.1):** same assertions against the FR file with the French heading, French `alt`, and French `<figcaption>`.
- **FR placement (3.2):** figure after `<h2>Pourquoi décomposer ?</h2>` and before the following `<ul>`.
- **Content preservation (4.2):** every original bullet-list item and surrounding content in the Why_Decompose_Section remains present after the edit; only the figure block is added.

### Edge-case checks

- **Unreadable source (4.3):** with the source path missing/unreadable, the operation reports failure and both HTML files remain byte-identical to their pre-operation state.

### Manual verification

Open both pages in a browser and confirm the diagram renders in place, is responsive (`max-width: 100%`), and shows the correct localized caption.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This feature edits two specific static HTML files and performs one concrete image copy. Per the prework analysis, every acceptance criterion is an EXAMPLE, EDGE_CASE, or SMOKE check against fixed artifacts; none range over a space of generated inputs where universal quantification ("for all generated X") adds value. Property-based testing is therefore **not appropriate** for this feature (consistent with the workflow guidance that content/markup edits and one-shot file operations are verified by example and edge-case tests, not PBT).

No property-based tests apply. Verification relies on the example-based and edge-case checks defined in the Testing Strategy, each traceable to its acceptance criteria:

- Asset copy fidelity — **Validates: Requirements 1.1, 1.2**
- EN figure presence, src, style, alt, figcaption, and `lesson-figure` structure — **Validates: Requirements 2.1, 2.3, 2.4, 2.5, 4.1**
- EN figure placement after heading and before list — **Validates: Requirements 2.2**
- FR figure presence, src, style, alt, figcaption, and `lesson-figure` structure — **Validates: Requirements 3.1, 3.3, 3.4, 3.5, 4.1**
- FR figure placement after heading and before list — **Validates: Requirements 3.2**
- Existing section content preserved apart from the insertion — **Validates: Requirements 4.2**
- Fail-closed on unreadable source (pages unchanged) — **Validates: Requirements 4.3**
