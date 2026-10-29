# Requirements Document

## Introduction

This feature adds one new bilingual (English/French) lesson to the SkillHub course catalog. The lesson teaches learners how to configure a SHAI agent whose single MCP (Model Context Protocol) connection reaches the OPCP-EXPLORER agentic-ai-platform, and how to read and act on the live container-discovery report that agent produces. The lesson is a configuration walkthrough framed by governance: it walks the `AGENTS_CONTROL_AGENT_NO_SKILL.config.json` file field by field, then presents and interprets a representative "Container Discovery Results (Live Scan)" runtime report, with governance callouts throughout.

The lesson lives at the end of the afternoon "Design & Governance" track, after the existing capstone lesson, and depends on it as a prerequisite. The work spans four coordinated changes that must stay consistent with one another: the lesson catalog data module, the two authored HTML pages, the hardcoded navigation lists duplicated across every lesson and index page in both locales, and the existing automated tests that assert catalog and content invariants.

## Glossary

- **SkillHub**: The bilingual (EN/FR) static learning site under `skillhub/`, whose lesson catalog, pages, navigation, and runtime are the subject of this feature.
- **Lesson_Catalog**: The data module `skillhub/js/lessons.js`, specifically the exported `lessons` array that is the single source of truth for the course catalog and the ordering/metadata of every lesson.
- **Catalog_Entry**: A single object in the `lessons` array describing one lesson (`id`, `slug`, `title.en`, `title.fr`, `track`, `difficulty`, `estimatedMinutes`, `prerequisites`).
- **Afternoon_Track**: The `'afternoon'` track in the catalog, labelled "Design & Governance" in the UI.
- **New_Lesson**: The lesson introduced by this feature, with `id` and `slug` both equal to `configuring-shai-mcp-opcp-explorer`.
- **Lesson_Page**: An authored HTML file at `skillhub/{locale}/{slug}.html` that renders a lesson, following the existing page structure (header, three-section sidebar, main lesson content, scripts).
- **Navigation_List**: A hardcoded list of lesson links duplicated on every Lesson_Page and index page. Two forms exist per page: the sidebar `<ul>` nav lists (`#nav-morning`, `#nav-afternoon`, `#nav-sandbox`) and, on index pages only, the `.lesson-card-grid` card lists.
- **SHAI_Agent**: The agent configured by the `AGENTS_CONTROL_AGENT_NO_SKILL.config.json` file described in the lesson.
- **MCP_Server_Block**: The stdio MCP server configuration block inside the SHAI_Agent config that points at the OPCP-EXPLORER agentic-ai-platform.
- **OPCP_EXPLORER**: The agentic-ai-platform (also referred to in existing pages as `opcp-explorer`) that the SHAI_Agent connects to over MCP.
- **Discovery_Report**: The "Container Discovery Results (Live Scan)" runtime report that the lesson presents and interprets.
- **Catalog_Test**: The test suite `skillhub/tests/lessons.test.js`, which asserts catalog invariants including the hardcoded afternoon-slug list and total lesson count.
- **Content_Test**: The test suite `skillhub/tests/lesson-content.test.js`, which asserts that each authored slug has bilingual pages meeting structural rules.

## Requirements

### Requirement 1: Register the new lesson in the catalog

**User Story:** As a course author, I want the new lesson registered in the lesson catalog with the agreed metadata, so that the SkillHub runtime treats it as a first-class afternoon lesson.

#### Acceptance Criteria

1. THE Lesson_Catalog SHALL contain a Catalog_Entry whose `id` equals `configuring-shai-mcp-opcp-explorer` and whose `slug` equals `configuring-shai-mcp-opcp-explorer`.
2. THE Lesson_Catalog SHALL set the New_Lesson `title.en` to `Configuring a SHAI Agent with MCP to OPCP-EXPLORER` and set a non-empty `title.fr` French translation.
3. THE Lesson_Catalog SHALL set the New_Lesson `track` to `afternoon`, `difficulty` to `advanced`, and `estimatedMinutes` to `45`.
4. THE Lesson_Catalog SHALL set the New_Lesson `prerequisites` to the single-element list `['agent-design-capstone']`.
5. THE Lesson_Catalog SHALL place the New_Lesson Catalog_Entry as the last entry of the Afternoon_Track, immediately after `agent-design-capstone`.

### Requirement 2: Preserve catalog invariants

**User Story:** As a maintainer, I want the catalog to keep its structural invariants after the new lesson is added, so that the catalog data stays valid and the dependency graph stays correct.

#### Acceptance Criteria

1. THE Lesson_Catalog SHALL keep every `id` unique and every `slug` unique across all Catalog_Entry items.
2. THE Lesson_Catalog SHALL keep `id` equal to `slug` for the New_Lesson.
3. THE Lesson_Catalog SHALL reference only existing Catalog_Entry ids in the New_Lesson `prerequisites`.
4. THE Lesson_Catalog SHALL keep the prerequisite graph acyclic after the New_Lesson is added.
5. THE Lesson_Catalog SHALL set the New_Lesson `estimatedMinutes` to an integer within the range 1 through 480 inclusive.
6. THE Lesson_Catalog SHALL ensure the New_Lesson is not an orphan by giving it at least one prerequisite.

### Requirement 3: Author the English lesson page

**User Story:** As a learner, I want an English lesson page that walks the SHAI agent configuration field by field, so that I can reproduce the MCP connection to OPCP-EXPLORER myself.

#### Acceptance Criteria

1. THE SkillHub SHALL provide an English Lesson_Page at `skillhub/en/configuring-shai-mcp-opcp-explorer.html`.
2. THE English Lesson_Page SHALL follow the existing lesson page structure, including the site header, the three-section sidebar, the main lesson content region, and the page scripts, consistent with `skillhub/en/agent-control.html`.
3. THE English Lesson_Page SHALL declare `<html lang="en">`.
4. THE English Lesson_Page SHALL include a Mark-as-Complete control carrying the attribute `data-lesson-id="configuring-shai-mcp-opcp-explorer"`.
5. THE English Lesson_Page SHALL reference `opcp-explorer` in its content.
6. THE English Lesson_Page SHALL explain each field of the `AGENTS_CONTROL_AGENT_NO_SKILL.config.json` file, covering `name`, `description`, the `llm_provider` settings (`ovhcloud`, `Qwen3.5-397B-A17B`, `FunctionCall`), the built-in tools `read`, `write`, and `bash`, the `system_prompt` value `Call agent_control_containers with live=true and list the containers`, `max_tokens` `8192`, `temperature` `0.3`, the compaction block, and the disabled verification setting.
7. THE English Lesson_Page SHALL document the MCP_Server_Block for the agentic-ai-platform stdio MCP server, including `command` `/home/ubuntu/agentic-ai-plateform/.venv/bin/python`, `args` `["/home/ubuntu/agentic-ai-plateform/src/mcp_interface.py"]`, `enabled_tools` `["*"]`, and `required` `false`.
8. WHERE the page presents the Discovery_Report, THE English Lesson_Page SHALL report the live scan of 48 containers on `opcp-psmc-platform` (`server_id` 4) and the 1 scan error on `server_id` 5 caused by an SSH authentication failure.
9. WHERE the page presents the Discovery_Report classification, THE English Lesson_Page SHALL report 4 containers classified as `probable_agent` with confidence scores in the range 0.60 through 1.00 and 44 containers classified as `unclassified` with confidence scores in the range 0.00 through 0.40.
10. WHERE the page presents the Discovery_Report, THE English Lesson_Page SHALL include a probable-agent table of 4 rows, listing `ai-shai-web-interface-app-25-8529` at confidence 1.00, `opcp-agentic-ai-labs-app-1-6209` at confidence 0.75, `ai-shai-web-interface-postgres-25-5432` at confidence 0.65, and `opcp-agentic-ai-labs-base-1-6213` at confidence 0.60, each with its key classification evidence.
11. THE English Lesson_Page SHALL present the Discovery_Report notable findings and recommendations.
12. THE English Lesson_Page SHALL include governance callouts across the configuration walkthrough and the Discovery_Report interpretation.

### Requirement 4: Author the French lesson page

**User Story:** As a French-speaking learner, I want a French lesson page equivalent to the English one, so that I can learn the same material in my language.

#### Acceptance Criteria

1. THE SkillHub SHALL provide a French Lesson_Page at `skillhub/fr/configuring-shai-mcp-opcp-explorer.html`.
2. THE French Lesson_Page SHALL declare `<html lang="fr">`.
3. THE French Lesson_Page SHALL be a full translation of the English Lesson_Page covering the same configuration walkthrough, the same Discovery_Report interpretation, and equivalent governance callouts.
4. THE French Lesson_Page SHALL contain the same number of HTML headings (`h1` through `h3`) as the English Lesson_Page, matching its structure.
5. THE French Lesson_Page SHALL include a Mark-as-Complete control carrying the attribute `data-lesson-id="configuring-shai-mcp-opcp-explorer"`.
6. THE French Lesson_Page SHALL reference `opcp-explorer` in its content.

### Requirement 5: Add the lesson to navigation across all pages

**User Story:** As a learner browsing the site, I want the new lesson to appear in the Design & Governance navigation on every page, so that I can reach it from anywhere in both locales.

#### Acceptance Criteria

1. THE SkillHub SHALL add a New_Lesson link to the afternoon sidebar Navigation_List (`#nav-afternoon`) on every Lesson_Page and index page in both the `en` and `fr` locales.
2. THE SkillHub SHALL place the New_Lesson link last in the afternoon sidebar Navigation_List, immediately after the `agent-design-capstone` entry.
3. THE SkillHub SHALL add a New_Lesson card to the "Design & Governance" `.lesson-card-grid` on the `en` and `fr` index pages, placed last in that grid.
4. WHERE a Navigation_List link points to the current page, THE SkillHub SHALL mark the New_Lesson link active on the New_Lesson pages consistent with the existing active-link convention.
5. THE SkillHub SHALL point each New_Lesson Navigation_List link at `configuring-shai-mcp-opcp-explorer.html` within the same locale directory.

### Requirement 6: Update automated tests for the new lesson

**User Story:** As a maintainer, I want the automated tests to recognise the new lesson, so that the catalog and content suites pass and continue to guard the invariants.

#### Acceptance Criteria

1. THE Catalog_Test SHALL include `configuring-shai-mcp-opcp-explorer` as the last entry of its afternoon-slug expectation list.
2. THE Catalog_Test SHALL expect a total lesson count that accounts for the New_Lesson.
3. THE Content_Test SHALL include `configuring-shai-mcp-opcp-explorer` in its authored-slug list so the bilingual page checks run against the New_Lesson.
4. WHEN the SkillHub test suite is executed, THE SkillHub SHALL pass the Catalog_Test and the Content_Test with the New_Lesson present.
