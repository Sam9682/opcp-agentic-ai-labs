# Implementation Plan: SkillHub Multi-Agent Patterns Image

## Overview

This plan adds an illustrative diagram to the "Why Decompose?" section of the `multi-agent-patterns` SkillHub lesson on both the English and French pages. The work is a content-only change executed in a strict order: a fail-closed copy/verify phase runs first, and the two HTML page edits happen only after the image asset is confirmed in place. This ordering makes "leave pages unchanged on failure" (Requirement 4.3) a natural consequence of task sequencing rather than a rollback mechanism.

Per the design, the acceptance criteria target two fixed static HTML files and one concrete file-copy operation, so verification is example-based and edge-case based. No property-based tests apply.

## Tasks

- [x] 1. Copy source image into the SkillHub asset directory with a fail-closed precondition gate
  - Resolve the Source_Image Windows path (`C:\Users\slepetre\agent-vs-assistant\multi-agent-patterns.png`) to its WSL-mapped location and confirm it is readable
  - If the source cannot be read, report the failure explicitly and STOP — do not create a partial/empty asset and do not touch either HTML page
  - Copy the readable source to `skillhub/assets/img/multi-agent-patterns.png` (creating the `assets/img/` directory if needed) to create the Asset_Image
  - _Requirements: 1.1, 4.3_

  - [ ]* 1.1 Verify asset copy fidelity
    - Assert `skillhub/assets/img/multi-agent-patterns.png` exists and its bytes match the source (size + hash equality)
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.2 Verify fail-closed edge case on unreadable source
    - With the source path missing/unreadable, assert the operation reports failure and both HTML pages remain byte-identical to their pre-operation state
    - _Requirements: 4.3_

- [x] 2. Insert the English Lesson_Figure into the EN lesson page
  - [x] 2.1 Insert the figure after the "Why Decompose?" heading
    - In `skillhub/en/multi-agent-patterns.html`, insert a `<figure class="lesson-figure">` block immediately after `<h2>Why Decompose?</h2>` and before the following `<ul>`, using an anchored insertion that preserves all surrounding content
    - Use `<img src="../assets/img/multi-agent-patterns.png">` with the inline style `max-width: 100%; border: 1px solid #ddd; border-radius: 4px;`
    - Set English Alt_Text describing the diagram and an English `<figcaption>` describing the diagram
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1_

  - [ ]* 2.2 Verify EN figure presence, shape, and placement
    - Assert the EN file contains a `<figure class="lesson-figure">` whose `<img>` `src` is `../assets/img/multi-agent-patterns.png`, whose `style` equals the required string, with non-empty English `alt` and non-empty English `<figcaption>`
    - Assert the figure appears after `<h2>Why Decompose?</h2>` and before the first following `<ul>`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1_

- [x] 3. Insert the French Lesson_Figure into the FR lesson page
  - [x] 3.1 Insert the localized figure after the "Pourquoi décomposer ?" heading
    - In `skillhub/fr/multi-agent-patterns.html`, insert a `<figure class="lesson-figure">` block immediately after `<h2>Pourquoi décomposer ?</h2>` and before the following `<ul>`, using an anchored insertion that preserves all surrounding content
    - Use `<img src="../assets/img/multi-agent-patterns.png">` with the identical inline style `max-width: 100%; border: 1px solid #ddd; border-radius: 4px;`
    - Set French Alt_Text describing the diagram and a French `<figcaption>` describing the diagram
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1_

  - [ ]* 3.2 Verify FR figure presence, shape, and placement
    - Assert the FR file contains a `<figure class="lesson-figure">` whose `<img>` `src` is `../assets/img/multi-agent-patterns.png`, whose `style` equals the required string, with non-empty French `alt` and non-empty French `<figcaption>`
    - Assert the figure appears after `<h2>Pourquoi décomposer ?</h2>` and before the first following `<ul>`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1_

- [x] 4. Checkpoint — verify content preservation and run all checks
  - [ ]* 4.1 Verify existing section content is preserved
    - Assert every original bullet-list item and surrounding content in the Why_Decompose_Section remains present on both pages after the edit; only the figure block is added
    - _Requirements: 4.2_

  - [x] 4.2 Run all verification checks and confirm they pass
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Task 1 is the fail-closed precondition gate: no HTML page is edited unless the image copy succeeds and is verified first (Requirement 4.3).
- Each task references specific granular acceptance criteria for traceability.
- No property-based tests apply (per the design's Correctness Properties section); verification is example-based and edge-case based.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "4.1"] }
  ]
}
```
