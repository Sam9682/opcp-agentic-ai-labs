# Implementation Plan: Controlling AI Agents (agent-control)

## Overview

Add a bilingual `agent-control` SkillHub lesson to the Sandbox track following the build-free static-site conventions. The implementation proceeds from the standalone data/asset artifacts (the SVG diagram and the catalog entry with its tests) outward to the two new pages, then the fan-out sidebar edits across every sibling page, and finally a full `vitest run` to confirm all catalog invariants and prior tests still pass. The language is HTML/SVG + browser ES modules (no build step); the only `.js` edits are catalog data and test expectation arrays.

Each page clones the established `assistant-vs-agent.html` template. The hand-authored SVG and both new pages are created with the `agent-control` sidebar link already present, so they are not part of the fan-out sidebar edits.

## Tasks

- [x] 1. Author the agent-control SVG diagram
  - Create `skillhub/assets/img/agent-control.svg`, hand-authored in the same conventions as the reference `skillhub/assets/img/architecture-agents.svg` (inline `<style>`, `viewBox`, `role="img"`, `<title id="diagramTitle">`/`<desc id="diagramDesc">` referenced via `aria-labelledby`, rounded `rect` boxes with `text` labels)
  - Use the OVHcloud palette: literal hex values `#1a1f71` (navy — outer frame, kill-switch band, arrows/strokes, heading text), `#0050d7` (blue — approval-gate stroke + level borders), and `#e8efff` (light — level fills and guardrail-band fills); dark ink `#1c2132` for label text on light fills
  - Lay out five rising autonomy-level boxes left→right: `1 Suggest`, `2 Confirm each step`, `3 Act with checkpoints`, `4 Act and report`, `5 Fully autonomous`, connected by navy arrows
  - Add a blue-stroked approval-gate node between higher-autonomy levels, the five guardrail-layer bands (Permissions, Validation, Limits/Timeouts, Observability, Kill switch) wrapping the level row with the Kill switch band in navy, and a navy HITL / Human review node above the gates with arrows down into them
  - Set `<title>` to "Controlling an AI agent: autonomy levels, approval gates, guardrails, and human-in-the-loop" and `<desc>` to a sentence describing the layering; keep all SVG labels in short locale-neutral English (shared by both pages)
  - _Requirements: 4.1, 4.2_

- [x] 2. Register the agent-control Catalog_Entry and update tests
  - [x] 2.1 Append the Catalog_Entry to `skillhub/js/lessons.js`
    - Append as the final element of the `lessons` array, immediately after `adding-applications`: `id: 'agent-control'`, `slug: 'agent-control'`, `title: { en: 'Controlling AI Agents', fr: 'Contrôle des agents IA' }`, `track: 'sandbox'`, `difficulty: 'advanced'`, `estimatedMinutes: 35`, `prerequisites: ['adding-applications']`
    - Update the file's doc comment from "all 16 lessons … then 6 sandbox" to "all 17 lessons … then 7 sandbox" so the comment stays truthful
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 2.2 Extend `SANDBOX_SLUGS` in `skillhub/tests/lessons.test.js`
    - Append `'agent-control'` as the last element of the `SANDBOX_SLUGS` array so the existing length assertion (`MORNING + AFTERNOON + SANDBOX`) and the `getLessonsByTrack('sandbox')` ordered deep-equal assertion cover the new entry
    - _Requirements: 8.1, 8.6_

  - [ ]* 2.3 Add targeted per-entry assertions in `skillhub/tests/lessons.test.js`
    - In the `lessons data structure` describe block, assert `getLessonBySlug('agent-control')` is defined with `id === slug === 'agent-control'`, `track === 'sandbox'`, `difficulty === 'advanced'`, `estimatedMinutes === 35`, `prerequisites` deep-equals `['adding-applications']`, and exact `title.en`/`title.fr` strings
    - _Requirements: 8.2, 8.4_

  - [ ]* 2.4 Add prerequisite-chain assertion in `skillhub/tests/lessons.test.js`
    - Assert `getPrerequisiteChain('agent-control')` ends with `'adding-applications'`, contains the full sandbox chain in topological order with no duplicates, and does not contain `'agent-control'` itself
    - _Requirements: 8.3, 8.5_

- [x] 3. Checkpoint — catalog and tests consistent
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create the English Lesson_Page
  - Create `skillhub/en/agent-control.html` by cloning the `skillhub/en/assistant-vs-agent.html` structure: `<html lang="en">`, `header.site-header` (logo, `.progress-bar-container`, `.locale-switcher` with EN button `class="active"` and FR button, `.hamburger-btn`), the three-track `aside.sidebar`, `main.main-content > .lesson-content`, and the two script tags `../js/app.js` and `../assets/js/diagrams.js`
  - Set `<title>Controlling AI Agents - Agentic AI OPCP Labs</title>`, `<h1>Controlling AI Agents</h1>`, and a `.lesson-meta` with an advanced difficulty badge ("Sandbox · Governance") and `⏱ ~35 min`
  - In the three-track sidebar's `#nav-sandbox` list, include the six existing sandbox links plus `<li><a href="agent-control.html" class="active">Controlling AI Agents</a></li>` (own link active)
  - Add the EN `.lesson-body` with the five sections derived from `ARCHITECTURE_GUIDE.md` (Learning Objectives; The Autonomy Spectrum; Approval Gates; Guardrail Layers; Human-in-the-Loop) using plain prose, `<ul>/<ol>`, optional `<table>`, and `alert alert-info` callouts; close with Key Takeaways and a Next `alert alert-info` block
  - Embed the SVG in Section 2 inside `<figure class="lesson-figure">` via `<img src="../assets/img/agent-control.svg" alt="…English description…">` with an English `<figcaption>`
  - Add `<button class="btn btn-success btn-mark-complete" data-lesson-id="agent-control">Mark as Complete</button>`
  - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.3, 4.5, 6.5, 7.2, 7.4_

- [x] 5. Create the French Lesson_Page
  - Create `skillhub/fr/agent-control.html` as the mirror of the EN page: `<html lang="fr">`, FR header labels, FR locale button `class="active"`, `<title>Contrôle des agents IA - Agentic AI OPCP Labs</title>`, `<h1>Contrôle des agents IA</h1>`, badge text "Bac à sable · Gouvernance", `⏱ ~35 min`, and the same two script tags; keep `data-lesson-id="agent-control"` (locale-independent)
  - Use the FR three-track sidebar (section titles "Matin — Introduction et fondamentaux", "Conception et gouvernance", "Bac à sable — plateforme opcp-explorer"); in `#nav-sandbox` include the six existing sandbox links plus `<li><a href="agent-control.html" class="active">Contrôle des agents IA</a></li>`
  - Add the French `.lesson-body` with the five sections (Objectifs pédagogiques; Le spectre d'autonomie; Points d'approbation; Les couches de garde-fous; Human-in-the-Loop) mirroring the EN content; close with Points clés and a Suite `alert alert-info` block
  - Embed the SVG via `<img src="../assets/img/agent-control.svg" alt="…French description…">` with a French `<figcaption>`
  - _Requirements: 1.2, 1.3, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.4, 4.5, 6.5, 7.1, 7.4_

- [x] 6. Checkpoint — new pages render and toggle
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Wire the agent-control link into three-track EN sidebars and index
  - [x] 7.1 Append the sandbox link to the three-track EN lesson pages
    - In each page's `#nav-sandbox` list append `<li><a href="agent-control.html">Controlling AI Agents</a></li>` (no active class): `en/assistant-vs-agent.html`, `en/agent-anatomy-7-components.html`, `en/agentic-loop-and-variants.html`, `en/stopping-criteria.html`, `en/multi-agent-patterns.html`, `en/when-not-multi-agent.html`, `en/guardrails-5-layers.html`, `en/human-in-the-loop-ovhcloud-policy.html`, `en/threat-modeling-workshop.html`, `en/agent-design-capstone.html`
    - _Requirements: 6.1, 6.3_

  - [x] 7.2 Update `en/index.html` sidebar and sandbox card grid
    - Append `<li><a href="agent-control.html">Controlling AI Agents</a></li>` to the `#nav-sandbox` list, and append a matching lesson card to the "Sandbox — opcp-explorer Platform" `.lesson-card-grid`
    - _Requirements: 6.1, 6.3_

- [x] 8. Wire the agent-control link into three-track FR sidebars and index
  - [x] 8.1 Append the sandbox link to the three-track FR lesson pages
    - In each page's `#nav-sandbox` list append `<li><a href="agent-control.html">Contrôle des agents IA</a></li>` (no active class): `fr/assistant-vs-agent.html`, `fr/agent-anatomy-7-components.html`, `fr/agentic-loop-and-variants.html`, `fr/stopping-criteria.html`, `fr/multi-agent-patterns.html`, `fr/when-not-multi-agent.html`, `fr/guardrails-5-layers.html`, `fr/human-in-the-loop-ovhcloud-policy.html`, `fr/threat-modeling-workshop.html`, `fr/agent-design-capstone.html`
    - _Requirements: 6.2, 6.4_

  - [x] 8.2 Update `fr/index.html` sidebar and sandbox card grid
    - Append `<li><a href="agent-control.html">Contrôle des agents IA</a></li>` to the `#nav-sandbox` list, and append a matching lesson card to the "Bac à sable — plateforme opcp-explorer" `.lesson-card-grid`
    - _Requirements: 6.2, 6.4_

- [x] 9. Wire the agent-control link into difficulty-grouped sandbox pages
  - [x] 9.1 Append the sandbox link to the difficulty-grouped EN sandbox pages
    - Append `<li><a href="agent-control.html">Controlling AI Agents</a></li>` to the Intermediate group's `<ul>` (highest group present) in: `en/install-bare-metal.html`, `en/starting-applications.html`, `en/stopping-applications.html`, `en/making-backups.html`, `en/modifying-applications.html`, `en/adding-applications.html`
    - _Requirements: 6.1, 6.3_

  - [x] 9.2 Append the sandbox link to the difficulty-grouped FR sandbox pages
    - Append `<li><a href="agent-control.html">Contrôle des agents IA</a></li>` to the Intermediate group's `<ul>` in: `fr/install-bare-metal.html`, `fr/starting-applications.html`, `fr/stopping-applications.html`, `fr/making-backups.html`, `fr/modifying-applications.html`, `fr/adding-applications.html`
    - _Requirements: 6.2, 6.4_

- [x] 10. Final checkpoint — run the full test suite
  - Run `npm test` (which runs `vitest --run`) and confirm all tests pass, including the updated catalog length and sandbox-order assertions and all previously passing tests
  - Fix any failures before completing; ask the user if questions arise
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; the required `SANDBOX_SLUGS` edit (2.2) already drives the core catalog coverage, while 2.3/2.4 add targeted reinforcement.
- Each task references specific requirements for traceability.
- Checkpoints ensure incremental validation after the data/asset layer, after page creation, and after the full fan-out.
- The two new `agent-control.html` pages are authored with their own sidebar link already present and active, so they are not part of the fan-out sidebar edits (tasks 7–9).
- Sidebar fan-out tasks are split by locale and sidebar variant so no two parallel tasks edit the same file.
- No build step and no runtime module API changes: only `lessons.js` (data) and `lessons.test.js` (expectations) are edited in JavaScript.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2.1", "2.2"] },
    { "id": 1, "tasks": ["2.3", "2.4", "4", "5"] },
    { "id": 2, "tasks": ["7.1", "7.2", "8.1", "8.2", "9.1", "9.2"] }
  ]
}
```
