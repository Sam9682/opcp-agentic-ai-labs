# Implementation Plan

## Overview

This plan fixes byte-level U+FFFD ("�") corruption in 8 SkillHub lesson pages using the exploratory bugfix workflow. It starts with a detection/enumeration test that fails on the unfixed corpus (Property 1: Bug Condition), records the preservation baseline from the 28 clean files and all clean byte ranges (Property 2: Preservation), applies per-occurrence, context-driven repairs English-first (fewest occurrences) then French, and verifies that zero U+FFFD remain while clean files and interactive behavior are untouched.

## Task Dependency Graph

```
1 (Bug Condition exploration test)
2 (Preservation property tests)
        │  (1 and 2 both run on UNFIXED code, before any repair)
        ▼
3.1 (Repair English pages) ──▶ 3.2 (Repair French pages)
        │
        ▼
3.3 (Re-run Property 1 → passes)
        │
        ▼
3.4 (Re-run Property 2 → still passes)
        │
        ▼
4 (Checkpoint - full suite green)
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"], "dependsOn": [] },
    { "wave": 2, "tasks": ["3.1"], "dependsOn": ["1", "2"] },
    { "wave": 3, "tasks": ["3.2"], "dependsOn": ["3.1"] },
    { "wave": 4, "tasks": ["3.3", "3.4"], "dependsOn": ["3.1", "3.2"] },
    { "wave": 5, "tasks": ["4"], "dependsOn": ["3.3", "3.4"] }
  ]
}
```

- Tasks 1 and 2 have no dependencies and MUST be completed before task 3 (both must run against the unfixed files).
- Task 3.1 precedes 3.2 (English first, then French).
- Tasks 3.3 and 3.4 depend on 3.1 and 3.2 being complete.
- Task 4 depends on all of task 3.

## Tasks

- [x] 1. Write bug condition exploration test (detection/enumeration)
  - **Property 1: Bug Condition** - Replacement Characters Present in Affected Pages
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior (zero U+FFFD) - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists and enumerate the full defect set before touching any file
  - **Scoped PBT Approach**: The bug is deterministic (fixed files, fixed byte positions). Scope the property to the concrete corpus: for each HTML file under `skillhub/fr/` and `skillhub/en/`, decode as UTF-8 and assert it contains zero U+FFFD (U+FFFD = "�") codepoints. The 8 affected files will fail; the 28 clean files will pass.
  - Implement detection from the Bug Condition in design: `isBugCondition(X) = containsCodepoint(X, U+FFFD)` over all 36 lesson files
  - Enumerate and record, for every occurrence: file path, line number, surrounding context, and the per-file U+FFFD count (expected fr: ~114-146 each; en: ~3-16 each)
  - Assert the set of files with >=1 U+FFFD equals exactly the 8 affected files: `agent-anatomy-7-components.html`, `assistant-vs-agent.html`, `install-bare-metal.html`, `guardrails-5-layers.html` under both `skillhub/fr/` and `skillhub/en/`
  - Cover the specific counterexample shapes from design: French accents (`le�ons`, `Crit�res`, `arr�t`, `Fran�ais`, `S�lecteur`), English standalone em-dash (`Suggest � the system proposes`), and attribute positions inside `<title>`, `aria-label`, `alt`
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS - the 8 affected files report U+FFFD occurrences (this is correct, it proves the bug exists and confirms byte-level corruption confined to a subset)
  - Document counterexamples found (the per-file, per-line occurrence list) to drive the per-occurrence reconstruction and confirm the root-cause analysis
  - Mark task complete when test is written, run, and the failure/enumeration is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Already-Correct Content, Markup, and Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology - record baseline from the UNFIXED files, then assert equality after the fix
  - Observe on unfixed code: snapshot the bytes of the 28 clean files (including `skillhub/fr/index.html` and `skillhub/en/index.html`) - these must not be modified at all
  - Observe on unfixed code: for each of the 8 affected files, record every line that contains no U+FFFD (clean byte ranges)
  - Observe on unfixed code: record the `<meta charset="UTF-8">` line, tag structure, attribute names/values not coincident with "�", and entities like `&amp;` in the affected files
  - Observe on unfixed code: record interactive-behavior wiring (locale switching, sidebar navigation, progress bar, self-assessment) - the relevant scripts are untouched by the fix
  - Write property-based tests capturing observed behavior patterns from the Preservation Requirements in design:
    - For every file NOT in the affected set, assert byte-for-byte equality with the pre-fix snapshot (no clean file modified)
    - For every affected file, assert that every line not originally containing U+FFFD is byte-identical after the fix
    - Assert the `<meta charset="UTF-8">` declaration and surrounding markup/entities are unchanged
    - Assert interactive behavior (locale switching, navigation, progress bar) behaves identically after the fix
  - Property-based testing generates many comparison points across the full corpus for stronger regression guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms the baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix the U+FFFD byte-level corruption in the 8 affected pages

  - [x] 3.1 Repair the English pages (fewest occurrences first)
    - Repair `skillhub/en/agent-anatomy-7-components.html`, `skillhub/en/assistant-vs-agent.html`, `skillhub/en/install-bare-metal.html`, `skillhub/en/guardrails-5-layers.html` - one file at a time, using targeted string edits so each change is individually reviewable in a diff
    - Per-occurrence, context-driven reconstruction only - NO blind global find/replace of "�" (it maps to different characters in different places)
    - English cases: standalone "�" between spaces resolves to em-dash "—" (e.g., `<strong>Suggest</strong> � ` -> `<strong>Suggest</strong> — `); "�" inside a word or at a possessive boundary resolves to a curly apostrophe "'"; the locale switcher `aria-label="Fran�ais"` -> `aria-label="Français"`
    - Cross-reference shared strings (nav labels, section titles, descriptions) against the authoritative clean source `skillhub/en/index.html` and the clean opposite-locale page
    - Apply repairs across all surfaces: body text, `<title>`, `aria-label`, and `alt` attributes
    - Preserve markup and charset exactly: touch only the corrupted characters; leave tags, attributes, entities (`&amp;`), whitespace, and the `<meta charset="UTF-8">` line unchanged; write back as UTF-8 (no BOM change)
    - _Bug_Condition: isBugCondition(X) = containsCodepoint(X, U+FFFD) from design_
    - _Expected_Behavior: result has zero U+FFFD and result = intendedText(X), decoded cleanly as UTF-8 consistent with declared charset (from design)_
    - _Preservation: Preservation Requirements from design (clean files/ranges, markup, charset, interactive behavior unchanged)_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

  - [x] 3.2 Repair the French pages (most occurrences)
    - Repair `skillhub/fr/agent-anatomy-7-components.html`, `skillhub/fr/assistant-vs-agent.html`, `skillhub/fr/install-bare-metal.html`, `skillhub/fr/guardrails-5-layers.html` - one file at a time, using targeted string edits so each change is individually reviewable in a diff
    - Per-occurrence, context-driven reconstruction only - NO blind global find/replace
    - French accent/punctuation cases from context: `le�ons` -> `leçons`, `Crit�res` -> `Critères`, `arr�t` -> `arrêt`, `mod�lisation` -> `modélisation`, `Fran�ais` -> `Français`, `S�lecteur de langue` -> `Sélecteur de langue`, `De l'assistant � l'agent` -> `De l'assistant à l'agent`, `Matin � Introduction` -> `Matin — Introduction`
    - Cross-reference shared strings against the authoritative clean source `skillhub/fr/index.html` (confirmed to contain correct nav labels, section titles like `Matin — Introduction et fondamentaux`, and lesson-card titles like `Critères d'arrêt`) and the clean opposite-locale page
    - Apply repairs across all surfaces: body text, `<title>`, `aria-label`, and `alt` attributes
    - Preserve markup and charset exactly: touch only the corrupted characters; leave tags, attributes, entities, whitespace, and the `<meta charset="UTF-8">` line unchanged; write back as UTF-8 (no BOM change)
    - _Bug_Condition: isBugCondition(X) = containsCodepoint(X, U+FFFD) from design_
    - _Expected_Behavior: result has zero U+FFFD and result = intendedText(X), decoded cleanly as UTF-8 consistent with declared charset (from design)_
    - _Preservation: Preservation Requirements from design (clean files/ranges, markup, charset, interactive behavior unchanged)_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Replacement Characters Restored to Intended Glyphs
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (zero U+FFFD across the corpus)
    - When this test passes, it confirms every former "�" was replaced by the correct intended character and each affected file decodes cleanly as UTF-8
    - Run the detection/enumeration test from task 1 over all 36 files
    - Spot-check specific reconstructed strings: `Français`, `Sélecteur de langue`, `Critères d'arrêt`, `leçons`, `Matin — Introduction et fondamentaux`, and the English `Suggest — the system proposes`
    - **EXPECTED OUTCOME**: Test PASSES (confirms the bug is fixed - zero U+FFFD remain)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Already-Correct Content, Markup, and Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run the preservation property tests from task 2
    - Confirm the 28 clean files are byte-identical to their pre-fix snapshot (none modified)
    - Confirm every non-corrupted line in the 8 affected files is byte-identical, the `<meta charset="UTF-8">` line is unchanged, and interactive behavior (locale switching, navigation, progress bar) is identical
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run the full detection (Property 1) and preservation (Property 2) suites across the entire `skillhub/fr/` and `skillhub/en/` corpus
  - Confirm zero U+FFFD remain in all 36 files, the 28 clean files are untouched, and interactive behavior is preserved
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- **Deterministic bug, scoped PBT**: The corruption sits at fixed byte positions in fixed files, so the Property 1 test is scoped to the concrete 36-file corpus rather than randomized input - this keeps it reproducible while still asserting the universal "zero U+FFFD" property.
- **No blind global replace**: "�" stands for different intended characters at different positions (à, é, è, ç, ê, —, ', "). Every occurrence is resolved individually from language context and parallel clean content; a global `replace � with X` is explicitly disallowed.
- **Authoritative references**: `skillhub/fr/index.html` and `skillhub/en/index.html` (and the clean opposite-locale page) are clean and used to confirm shared strings. They are part of the 28 clean files and MUST NOT be modified.
- **Affected files (8)**: `agent-anatomy-7-components.html`, `assistant-vs-agent.html`, `install-bare-metal.html`, `guardrails-5-layers.html` under both `skillhub/fr/` and `skillhub/en/`.
- **Charset invariant**: `<meta charset="UTF-8">` must remain exactly as-is; files are rewritten as UTF-8 with no BOM change.
- **Ordering rationale**: English pages are repaired first because they carry the fewest, simplest occurrences (mostly em-dashes), building confidence before the heavier French pages.
