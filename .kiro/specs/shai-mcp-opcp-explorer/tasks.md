# Implementation Plan: Configuring a SHAI Agent with MCP to OPCP-EXPLORER

## Overview

This plan adds one bilingual (EN/FR) lesson — `configuring-shai-mcp-opcp-explorer` — to the SkillHub static site through a coordinated set of consistent edits across four surfaces: the catalog data module, the two authored HTML pages, the hardcoded navigation duplicated on every page, and the automated test suites. There is no build step for pages, so every change is a direct edit that must stay in step with the others. Tasks are ordered so the catalog lands first (the single source of truth), the authored pages follow, navigation is projected onto every page, and tests are updated last to guard the invariants. All code examples follow the conventions already established by `skillhub/en/agent-control.html` and the existing afternoon lessons. Verification runs the existing vitest suite with `npx vitest --run skillhub/tests`.

## Tasks

- [x] 1. Register the new lesson in the catalog
  - [x] 1.1 Append the New_Lesson Catalog_Entry to `skillhub/js/lessons.js`
    - Add the entry as the **last** item of the afternoon block in the `lessons` array, immediately after `agent-design-capstone` and before the sandbox section comment
    - Set `id` and `slug` both to `configuring-shai-mcp-opcp-explorer`; `title.en` to `Configuring a SHAI Agent with MCP to OPCP-EXPLORER` and `title.fr` to `Configurer un agent SHAI avec MCP vers OPCP-EXPLORER`
    - Set `track` to `afternoon`, `difficulty` to `advanced`, `estimatedMinutes` to `45`, and `prerequisites` to `['agent-design-capstone']`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 1.2 Fix the stale header comment in `skillhub/js/lessons.js`
    - Change `lists all 17 lessons` to `lists all 18 lessons` and `6 afternoon design & governance lessons` to `7 afternoon design & governance lessons`
    - _Requirements: 1.5_

- [x] 2. Author the English lesson page
  - [x] 2.1 Create `skillhub/en/configuring-shai-mcp-opcp-explorer.html` page skeleton
    - Copy the structure of `skillhub/en/agent-control.html` verbatim: `<!DOCTYPE html>`, `<html lang="en">`, `<head>` (charset, viewport, localized `<title>` ending `- Agentic AI OPCP Labs`, stylesheet link), `<header class="site-header">` (logo, progress bar container, locale switcher with EN button `class="active"`, hamburger), `<aside class="sidebar">` with the three nav sections, `<main class="main-content">` → `.lesson-content` → `.lesson-header` (`<h1>`, `.lesson-meta` with `difficulty-badge difficulty-badge--advanced` reading `Afternoon · Governance` and `⏱ ~45 min`), and the `app.js` / `diagrams.js` module scripts
    - Add the Mark-as-Complete control `<button class="btn btn-success btn-mark-complete" data-lesson-id="configuring-shai-mcp-opcp-explorer">Mark as Complete</button>` at the end of `.lesson-content`
    - Open `.lesson-body` with an intro paragraph referencing `opcp-explorer` and stating the goal
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.2 Author the English configuration-walkthrough section
    - Add `<h2>` Learning Objectives (bulleted list) and `<h2>` for the `AGENTS_CONTROL_AGENT_NO_SKILL.config.json` file with the full config in a `<pre><code>` block (angle brackets and ampersands HTML-escaped)
    - Add field-by-field `<h3>` subsections covering `name`/`description`, `llm_provider` (`ovhcloud`, `Qwen3.5-397B-A17B`, `FunctionCall`), built-in tools `read`/`write`/`bash`, `system_prompt` value `Call agent_control_containers with live=true and list the containers`, `max_tokens` `8192`, `temperature` `0.3`, the compaction block, and the disabled verification setting
    - Add `<h2>` Connecting to OPCP-EXPLORER over MCP documenting the MCP_Server_Block in a `<pre><code>` block: `command` `/home/ubuntu/agentic-ai-plateform/.venv/bin/python`, `args` `["/home/ubuntu/agentic-ai-plateform/src/mcp_interface.py"]`, `enabled_tools` `["*"]`, `required` `false`
    - Add governance callouts (`<div class="alert alert-info">`) for the model/provider choice, `write`/`bash` scoping, disabled verification, and `enabled_tools: ["*"]` / `required: false`
    - _Requirements: 3.6, 3.7, 3.12_

  - [x] 2.3 Author the English Discovery Report interpretation section
    - Add `<h2>` Reading the Discovery Report and `<h3>` Scan summary reporting the live scan of 48 containers on `opcp-psmc-platform` (`server_id` 4) and the 1 scan error on `server_id` 5 caused by an SSH authentication failure
    - Add `<h3>` Classification breakdown: 4 `probable_agent` (confidence 0.60–1.00) and 44 `unclassified` (confidence 0.00–0.40)
    - Add `<h3>` Probable agents with a 4-row `<table>` (Container / Confidence / Key evidence) listing `ai-shai-web-interface-app-25-8529` 1.00, `opcp-agentic-ai-labs-app-1-6209` 0.75, `ai-shai-web-interface-postgres-25-5432` 0.65, `opcp-agentic-ai-labs-base-1-6213` 0.60, each with evidence prose
    - Add `<h3>` Notable findings and recommendations with a closing governance callout on human-in-the-loop for stop/restart/start follow-up
    - _Requirements: 3.8, 3.9, 3.10, 3.11, 3.12_

- [x] 3. Author the French lesson page
  - [x] 3.1 Create `skillhub/fr/configuring-shai-mcp-opcp-explorer.html` as a full translation
    - Mirror the English page skeleton with `<html lang="fr">`, the FR locale switcher button `class="active"`, localized `<title>`, `.lesson-meta` reading `Après-midi · Gouvernance` and `⏱ ~45 min`, and the Mark-as-Complete control with the identical `data-lesson-id="configuring-shai-mcp-opcp-explorer"`
    - Translate the intro (referencing `opcp-explorer`), the configuration walkthrough, the Discovery Report interpretation, and the governance callouts so content is equivalent
    - Ensure every `<h1>`/`<h2>`/`<h3>` in the English page has a one-to-one French counterpart so the heading count matches exactly
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 4. Checkpoint - catalog and authored pages
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add the new lesson to navigation across every page
  - [x] 5.1 Append the afternoon nav link on every English page
    - On each `skillhub/en/*.html` lesson page and `skillhub/en/index.html`, append `<li><a href="configuring-shai-mcp-opcp-explorer.html">Configuring a SHAI Agent with MCP to OPCP-EXPLORER</a></li>` as the **last** item of `#nav-afternoon`, immediately after the `agent-design-capstone` entry
    - On the two new lesson pages, the self-link in `#nav-afternoon` carries `class="active"`
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

  - [x] 5.2 Append the afternoon nav link on every French page
    - On each `skillhub/fr/*.html` lesson page and `skillhub/fr/index.html`, append `<li><a href="configuring-shai-mcp-opcp-explorer.html">Configurer un agent SHAI avec MCP vers OPCP-EXPLORER</a></li>` as the **last** item of `#nav-afternoon`, immediately after the `agent-design-capstone` entry
    - On the two new lesson pages, the self-link in `#nav-afternoon` carries `class="active"`
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

  - [x] 5.3 Append the Design & Governance card on both index pages
    - On `skillhub/en/index.html`, append `<a class="lesson-card" href="configuring-shai-mcp-opcp-explorer.html"><span class="lesson-card__title">Configuring a SHAI Agent with MCP to OPCP-EXPLORER</span></a>` as the **last** card in the Design & Governance `.lesson-card-grid`
    - On `skillhub/fr/index.html`, append the French equivalent (`Configurer un agent SHAI avec MCP vers OPCP-EXPLORER`) as the **last** card in that grid
    - _Requirements: 5.3_

- [x] 6. Update automated tests for the new lesson
  - [x] 6.1 Add the slug to the catalog test fixtures
    - In `skillhub/tests/lessons.test.js`, append `'configuring-shai-mcp-opcp-explorer'` as the **last** element of `AFTERNOON_SLUGS` so the total-count and afternoon-ordering assertions account for the new lesson
    - _Requirements: 6.1, 6.2_

  - [x] 6.2 Add the slug to the content test fixtures
    - In `skillhub/tests/lesson-content.test.js`, append `'configuring-shai-mcp-opcp-explorer'` to `AUTHORED_SLUGS` so the bilingual structural checks run against the new pages
    - _Requirements: 6.3_

  - [x]* 6.3 Write the navigation-consistency property test
    - Create `skillhub/tests/navigation-consistency.property.test.js` scanning every `skillhub/{en,fr}/*.html` page and asserting `#nav-afternoon` contains a locale-local link to `configuring-shai-mcp-opcp-explorer.html` placed last and immediately after the `agent-design-capstone.html` link
    - **Property 9: The new lesson link appears last in every afternoon navigation list**
    - **Validates: Requirements 5.1, 5.2, 5.5**

- [x] 7. Final checkpoint - run the full suite
  - Run `npx vitest --run skillhub/tests` and ensure the Catalog_Test, Content_Test, and navigation-consistency test all pass with the New_Lesson present. Ask the user if questions arise.
  - _Requirements: 6.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements (and the navigation test references Property 9) for traceability.
- Checkpoints ensure incremental validation before moving to the next surface.
- The existing catalog invariants in `lessons.test.js` (Properties 1–4) and content invariants in `lesson-content.test.js` (Properties 5–8) run automatically against the new entry once its slug is added to the fixtures — no new catalog or content property tests are authored for them.
- Verification command for all tasks: `npx vitest --run skillhub/tests` (single run, not watch).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 5, "tasks": ["6.1", "6.2", "6.3"] }
  ]
}
```
