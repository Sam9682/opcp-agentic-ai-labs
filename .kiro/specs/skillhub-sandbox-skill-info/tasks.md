# Implementation Plan: skillhub-sandbox-skill-info

## Overview

This plan integrates collapsible `SKILL.md` prompt sections into the Sandbox group of SkillHub pages (EN + FR) as a static-HTML + CSS content task, extended by an automated Vitest suite.

The approach is incremental: first build the shared test helpers (the Page_Skill_Map and the escape/unescape transform) and the CSS so every downstream edit and test has a stable foundation. Then edit each mapped page in both locales, inserting the Skill_Section block(s) in map order after the lesson content and before the `Mark as Complete` button. A dedicated task confirms `install-bare-metal.html` stays untouched. Finally, author the structure/mapping/parity test and the embed-fidelity/escaping property test, then run the full suite and fix failures.

Each page-edit task follows the same procedure: read the mapped `SKILL.md` source(s) from `agentic-ai-plateform--skills/shai/skills/<SKILL>/SKILL.md`, apply the escape procedure (`&`→`&amp;` first, then `<`→`&lt;`, then `>`→`&gt;`), and emit one `<section class="skill-section" data-skill="<SKILL>">` per skill — intro `<p>`, conditional `alert-info` runtime note, and a collapsed `<details>`/`<summary>` wrapping `<pre><code>` with the escaped prompt — with English wrapper text in `en/` and translated wrapper text in `fr/`, embedded prompt in English for both.

## Tasks

- [x] 1. Set up shared test helpers and CSS foundation
  - [x] 1.1 Create the Page_Skill_Map helper
    - Create `skillhub/tests/helpers/page-skill-map.js` exporting `PAGE_SKILL_MAP` (the seven Sandbox pages → ordered skill lists, with `install-bare-metal.html` mapped to `[]`), `LOCALES = ['en', 'fr']`, and `SKILLS_SOURCE_ROOT` pointing at `agentic-ai-plateform--skills/shai/skills`
    - This object is the single source of truth shared by authoring and verification
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 1.2 Create the escape/unescape helper
    - Create `skillhub/tests/helpers/skill-embed.js` exporting `escapeHtml(source)` (replace `&`→`&amp;` first, then `<`→`&lt;`, then `>`→`&gt;`) and `unescapeHtml(embedded)` (reverse order: `&lt;`→`<`, `&gt;`→`>`, `&amp;`→`&`)
    - Preserve all whitespace/line breaks; escape only the three characters, in the exact order
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.3 Add Skill_Section CSS to the stylesheet
    - Append the `.skill-section`, `.skill-prompt`, `summary`, and `pre` rules from the design to `skillhub/assets/css/style.css`, reusing existing `--ovh-*`, `--spacing-*`, `--border-radius*` brand custom properties
    - Styling is cosmetic only; collapse/expand and keyboard operability come from native `<details>`/`<summary>`
    - _Requirements: 4.5_

- [x] 2. Edit single-skill pages (EN + FR)
  - [x] 2.1 Add the `START_APP` Skill_Section to `starting-applications.html` (en + fr)
    - Read `shai/skills/START_APP/SKILL.md`, apply the escape procedure, insert one `<section class="skill-section" data-skill="START_APP">` with intro `<p>`, runtime-note `alert-info` (placeholders present), and collapsed `<details>`/`<summary>`/`<pre><code>`
    - Insert after lesson content and before the `Mark as Complete` button, as last child of `lesson-body`, in both `skillhub/en/` and `skillhub/fr/`; English wrapper text in `en/`, translated wrapper text in `fr/`, embedded prompt in English in both
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 3.4, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.3, 7.4_

  - [x] 2.2 Add the `STOP_APP` Skill_Section to `stopping-applications.html` (en + fr)
    - Read `shai/skills/STOP_APP/SKILL.md`, apply the escape procedure, insert one `START_APP`-shaped section for `STOP_APP` using the same insertion point and locale rules
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 3.4, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.3, 7.4_

- [~] 3. Checkpoint - Verify single-skill pages
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Edit multi-skill pages (EN + FR)
  - [x] 4.1 Add the `making-backups.html` Skill_Sections (en + fr)
    - Read `shai/skills/BACKUP_DATABASE/SKILL.md`, `RESTORE_DATABASE/SKILL.md`, `CLEAN_DATABASE/SKILL.md`; apply the escape procedure to each
    - Emit three sibling `<section class="skill-section">` blocks in map order (`BACKUP_DATABASE`, `RESTORE_DATABASE`, `CLEAN_DATABASE`), each with intro `<p>`, runtime note, and collapsed `<details>`; same insertion point and locale rules in `en/` and `fr/`
    - _Requirements: 1.3, 1.8, 2.1, 2.2, 2.3, 3.4, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.3, 7.4_

  - [~] 4.2 Add the `modifying-applications.html` Skill_Sections (en + fr)
    - Read `shai/skills/MODIFY_CODE/SKILL.md`, `VERIFY_APP_COMPLIANCE/SKILL.md`, `MAKE_APP_COMPLIANT/SKILL.md`; apply the escape procedure
    - Emit three sibling sections in map order (`MODIFY_CODE`, `VERIFY_APP_COMPLIANCE`, `MAKE_APP_COMPLIANT`); the `MODIFY_CODE` embedded prompt must be byte-identical to its appearance on `adding-applications.html` and across both locales
    - _Requirements: 1.4, 1.8, 2.1, 2.2, 2.3, 3.4, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.3, 7.4_

  - [~] 4.3 Add the `adding-applications.html` Skill_Sections (en + fr)
    - Read `shai/skills/SPECIFY_FEATURE/SKILL.md` and `MODIFY_CODE/SKILL.md`; apply the escape procedure
    - Emit two sibling sections in map order (`SPECIFY_FEATURE`, `MODIFY_CODE`); reuse the same escaped `MODIFY_CODE` block used on `modifying-applications.html` so it is byte-identical; same insertion point and locale rules
    - _Requirements: 1.5, 1.8, 2.1, 2.2, 2.3, 3.4, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.3, 7.4_

  - [x] 4.4 Add the `agent-control.html` Skill_Sections (en + fr)
    - Read `shai/skills/AGENTS_CONTROL/SKILL.md` and `STATUS_APP/SKILL.md`; apply the escape procedure
    - Emit two sibling sections in map order (`AGENTS_CONTROL`, `STATUS_APP`); same insertion point and locale rules
    - _Requirements: 1.6, 1.8, 2.1, 2.2, 2.3, 3.4, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.3, 7.4_

- [x] 5. Confirm no-op for install-bare-metal.html
  - Verify `skillhub/en/install-bare-metal.html` and `skillhub/fr/install-bare-metal.html` contain zero `skill-section` blocks and are otherwise unchanged by this feature
  - _Requirements: 1.7_

- [~] 6. Checkpoint - Verify all pages authored
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Author the structure, mapping, and parity tests
  - [~] 7.1 Write `skillhub/tests/skill-sections.test.js`
    - Using Vitest + jsdom, parse every page in `PAGE_SKILL_MAP` under both locales and assert structure, mapping, collapsed-by-default, summary labels, runtime notes, and parity
    - Cover: per-page section count including zero for `install-bare-metal.html`; section structure (one intro `<p>` before a single `<details>` containing `<summary>` then `<pre><code>`); no `open` attribute; `<summary>` contains the skill id; runtime note present when placeholders exist; EN/FR ordered skill-id parity; FR embed equals English source; per-skill byte-identical embed across pages/locales; heading-outline preservation; concrete EN/FR wrapper strings
    - Tag each property with `Feature: skillhub-sandbox-skill-info, Property N: ...`
    - **Property 1: Per-page section count matches the map** — Validates Requirements 1.7, 1.8
    - **Property 4: Section structure** — Validates Requirements 2.3, 3.4, 4.1, 7.1
    - **Property 5: Collapsed by default** — Validates Requirements 4.2
    - **Property 6: Summary identifies the skill** — Validates Requirements 4.4, 7.3
    - **Property 8: Runtime note when placeholders exist** — Validates Requirements 5.2
    - **Property 9: EN/FR section-set parity** — Validates Requirements 6.1
    - **Property 10: Embedded prompt is the English source in both locales** — Validates Requirements 6.4
    - **Property 11: Per-skill byte-identical embed across pages and locales** — Validates Requirements 6.5
    - **Property 12: Heading structure and outline preservation** — Validates Requirements 7.4
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.3, 3.4, 4.1, 4.2, 4.4, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.3, 7.4_

  - [~] 7.2 Write `skillhub/tests/skill-embed.property.test.js`
    - Using Vitest, drive embed-fidelity and escaping properties over all mapped (page, locale, skill) tuples, plus randomized synthetic strings for the round-trip
    - Assert verbatim/contiguous containment of `escapeHtml(sourceOf(skill))`; unescape recovers the source byte-for-byte with no raw `<`/`>`/`&` and no double-escaped entity (`&amp;lt;`); every `{{…}}` placeholder preserved verbatim with equal token counts
    - Use a minimum of 100 iterations for the randomized round-trip generator; enumerate the full map × locales for the fidelity/placeholder checks
    - Tag each property with `Feature: skillhub-sandbox-skill-info, Property N: ...`
    - **Property 2: Complete and faithful embed** — Validates Requirements 2.1, 2.2
    - **Property 3: Escaping round-trip** — Validates Requirements 3.1, 3.2, 3.3, 3.5
    - **Property 7: Placeholder preservation** — Validates Requirements 5.1, 5.3
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.5, 5.1, 5.3_

- [~] 8. Run the full Vitest suite and fix failures
  - Run the complete Vitest suite (`npx vitest --run`) and fix any failures surfaced by the new or existing tests until the suite is green
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.3, 7.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP. None here are optional: the test tasks are the regression guard that this content-integration feature relies on (per the design's Error Handling table), so they are core.
- Each task references specific requirements for traceability; test tasks additionally reference the design's correctness properties by number.
- Checkpoints ensure incremental validation after single-skill and multi-skill page edits.
- The test runner is Vitest (`vitest.config.js`, `environment: jsdom`), matching the existing suite under `skillhub/tests/`; the brief's "Jest" intent is preserved by the identical `describe`/`it`/`expect` assertion style.
- The embedded prompt is a point-in-time copy of each `SKILL.md`; if a source changes, re-run the escape procedure and replace the block (Requirement 2.4), with Property 2 as the regression guard.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "4.1", "4.4"] },
    { "id": 2, "tasks": ["4.2"] },
    { "id": 3, "tasks": ["4.3", "5"] },
    { "id": 4, "tasks": ["7.1", "7.2"] },
    { "id": 5, "tasks": ["8"] }
  ]
}
```
