# Implementation Plan: Install Page Restructure

## Overview

Reorder the `install-bare-metal.html` lesson body across all four pages (EN site, FR site, SCORM EN, SCORM FR) so the quick path leads, with a new AI-agents architecture diagram at the top and the nine manual steps collapsed into an optional `<details>` section. The implementation is hand-authored HTML and SVG (no page build step for the SkillHub pages themselves). Work proceeds asset-first, then EN site page, then the FR and SCORM mirrors derived from it, followed by tests and a build/test verification pass. Existing content (nine steps, checklist, screenshot, `init_pltf.sh` snippet) is relocated verbatim; only the Quick Installation framing and the Manual Installation wrapper text are new.

## Tasks

- [x] 1. Author the architecture diagram SVG asset
  - [x] 1.1 Create `skillhub/assets/img/architecture-agents.svg`
    - Self-contained, dependency-free SVG (no external fonts, no raster images, no scripts)
    - Use `viewBox="0 0 720 300"`, `width="100%"`, no fixed height, `preserveAspectRatio="xMidYMid meet"`
    - Add a header band/label reading "AI-Powered Store — Agentic AI"
    - Render three rounded-rectangle boxes on one row: Operator Agent (start · stop · ps · backup · restore), Developer Agent (add applications · modify applications), Control Agent (compliance checks · verification)
    - Use light neutral fills with `#ddd`-family borders and dark neutral text; `sans-serif` font family
    - Add accessibility nodes: root `<svg role="img" aria-labelledby=...>`, `<title>` = "Platform AI agents and their responsibilities", `<desc>` naming the three agents and their duties
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Restructure the EN site lesson page
  - [x] 2.1 Reorder the EN lesson body in `skillhub/en/install-bare-metal.html`
    - Keep the existing intro paragraph at the top; insert the architecture diagram `<figure>` as the first content element after the intro, referencing `../assets/img/architecture-agents.svg` with the design's `<img>` alt and style
    - Keep Prerequisites between the diagram and the Quick Installation section
    - Add a new `Quick Installation` `<h2>` section that reuses the existing `Screen_InstallPltf1.png` screenshot figure and the `init_pltf.sh` `chmod`/run snippet verbatim, plus the new framing paragraphs
    - Wrap the existing nine `Step N` sections and the Post-Installation Checklist, verbatim, inside a `<details class="manual-install">` with a `<summary>` heading "Manual Installation (optional)" (heading `display:inline`) and the new manual intro paragraph
    - Keep Exercises as the final section inside the lesson body
    - Preserve all chrome unchanged: head stylesheet link, header, sidebar, locale switcher, progress bar, and the mark-complete button after the lesson body
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 3. Restructure the FR site lesson page
  - [x] 3.1 Reorder the FR lesson body in `skillhub/fr/install-bare-metal.html`
    - Mirror the EN structure and ordering (Architecture_Diagram, Prerequisites, Quick Installation, Manual Installation, Exercises)
    - Use the French strings from the design translation table for the diagram alt/figcaption, Quick section heading/intro/follow-up, and Manual `<summary>` heading/intro
    - Reuse the existing FR step content, checklist, screenshot figure, prerequisites, and exercises verbatim (including the pre-existing AWS CLI `<h3>` under Step 2 — do not reconcile EN/FR differences)
    - Preserve all FR chrome unchanged
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [~] 4. Checkpoint - site pages
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Mirror the restructure into the SCORM copies
  - [x] 5.1 Restructure the SCORM EN copy in `scorm/skillhub_scorm/en/install-bare-metal.html`
    - Apply the same restructured lesson body as the EN site page, byte-consistent with `skillhub/en/install-bare-metal.html` except for the build-injected bootstrap script tag (which is not committed)
    - Reference `../assets/img/architecture-agents.svg` with the identical pattern
    - Preserve the SCORM EN chrome
    - _Requirements: 4.1, 4.3_
  - [x] 5.2 Restructure the SCORM FR copy in `scorm/skillhub_scorm/fr/install-bare-metal.html`
    - Apply the same restructured lesson body as the FR site page, byte-consistent with `skillhub/fr/install-bare-metal.html` except for the build-injected bootstrap script tag
    - Reference `../assets/img/architecture-agents.svg` with the identical pattern
    - Preserve the SCORM FR chrome
    - _Requirements: 4.2, 4.4_

- [ ] 6. Add asset and content example/smoke tests
  - [ ]* 6.1 Write SVG smoke test
    - Assert `skillhub/assets/img/architecture-agents.svg` exists and parses as well-formed SVG containing a `<title>` and `<desc>`
    - _Requirements: 1.1_
  - [ ]* 6.2 Write diagram-content example tests
    - Assert the Operator box lists start/stop/ps/backup/restore; the Developer box references adding and modifying applications; the Control box references compliance checks and verification
    - _Requirements: 1.2, 1.3, 1.4_
  - [ ]* 6.3 Write Quick-section example tests
    - Assert the EN and FR Quick Installation sections present `init_pltf.sh` and the `Screen_InstallPltf1.png` screenshot
    - _Requirements: 2.3, 3.4_
  - [ ]* 6.4 Write FR heading example test
    - Assert the FR restructured section headings equal the expected French strings from the design translation table
    - _Requirements: 3.2_

- [ ] 7. Add property tests for the four correctness properties
  - [ ]* 7.1 Write property test for canonical lesson-body section ordering
    - **Property 1: Canonical lesson-body section ordering**
    - Enumerate the four pages each iteration and randomize over derived inputs (locale, section label); assert order is Architecture Diagram, Prerequisites, Quick Installation, Manual Installation, Exercises, with the diagram first and Exercises last
    - **Validates: Requirements 2.1, 2.2, 2.5, 2.6, 3.1, 3.3, 5.7**
  - [ ]* 7.2 Write property test for manual-section content preservation
    - **Property 2: Manual-section content preservation**
    - Randomize over the nine step indices across the four pages; assert the Manual Installation section contains Steps 1–9 and the Post-Installation Checklist with per-page pre-restructure content
    - **Validates: Requirements 2.4, 3.5**
  - [ ]* 7.3 Write property test for SCORM-vs-site lesson-body parity
    - **Property 3: SCORM-vs-site lesson-body parity**
    - Randomize over locale in {EN, FR}; assert the SCORM copy's lesson body equals the site page's lesson body after normalizing away the build-injected bootstrap script tag
    - **Validates: Requirements 4.1, 4.2**
  - [ ]* 7.4 Write property test for page-chrome preservation
    - **Property 4: Page-chrome preservation**
    - Enumerate the four pages; assert the header, sidebar nav, locale switcher, progress bar, stylesheet reference `../assets/css/style.css`, and the mark-complete button with `data-lesson-id="install-bare-metal"` (positioned after the lesson body) are each unchanged
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

- [ ] 8. Add SCORM build integration test
  - [ ]* 8.1 Write SCORM build integration test
    - Run the SCORM build and assert `scorm/skillhub_scorm/assets/img/architecture-agents.svg` exists and that each SCORM page's diagram `<img src>` resolves within the package (1–2 examples; behavior does not vary with input)
    - _Requirements: 1.5, 4.3, 4.4_

- [x] 9. Final checkpoint - build and verify
  - Run the SCORM build (`scripts/build-scorm.mjs`) and the full test suite; ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional (test tasks) and can be skipped for a faster MVP.
- Each task references specific requirements for traceability; property test tasks reference their design property number.
- Existing content (nine steps, checklist, `Screen_InstallPltf1.png` figure, `init_pltf.sh` snippet, prerequisites, exercises, chrome) is relocated verbatim — only Quick Installation framing and the Manual Installation wrapper text are new.
- No SVG is hand-placed into `scorm/skillhub_scorm/`; the SCORM build copies `skillhub/assets/` wholesale, so the single authored SVG serves all four pages.
- The SVG parses dependency-free, so the smoke and content tests read the committed file directly.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1", "5.1"] },
    { "id": 3, "tasks": ["5.2", "6.1", "6.2", "7.1", "7.4"] },
    { "id": 4, "tasks": ["6.3", "6.4", "7.2", "7.3", "8.1"] }
  ]
}
```
