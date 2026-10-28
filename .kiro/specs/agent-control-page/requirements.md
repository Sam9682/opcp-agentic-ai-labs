# Requirements Document

## Introduction

This feature adds a new bilingual (English and French) SkillHub lesson page titled "Controlling AI Agents" / "Contrôle des agents IA". The lesson teaches governance and guardrails over agent autonomy: autonomy levels, approval gates, guardrail layers, and human-in-the-loop (HITL) controls. The lesson belongs to the Sandbox track of the opcp-explorer Platform programme and is sourced from the bilingual `ARCHITECTURE_GUIDE.md` in the agentic-ai-plateform documentation.

The page mirrors the established SkillHub pattern: two static HTML files sharing an identical slug (`skillhub/fr/agent-control.html` and `skillhub/en/agent-control.html`), a lesson entry registered in the `lessons.js` catalog, updated hardcoded sidebars across sibling pages, a dedicated hand-authored SVG diagram embedded via an `<img>` element, and language toggle behavior consistent with the existing i18n module. All catalog invariants and test suites that currently pass MUST continue to pass after this feature is added.

## Glossary

- **SkillHub**: The bilingual (EN/FR) static-site learning runtime under `skillhub/` serving lesson pages for the opcp-explorer Platform programme.
- **Lesson_Page**: A single static HTML lesson document under `skillhub/en/` or `skillhub/fr/`.
- **Lesson_Catalog**: The `lessons` array exported from `skillhub/js/lessons.js`, the single source of truth for the course catalog.
- **Catalog_Entry**: One lesson object within the Lesson_Catalog, containing `id`, `slug`, `title.en`, `title.fr`, `track`, `difficulty`, `estimatedMinutes`, and `prerequisites`.
- **Slug**: The kebab-case identifier shared by a lesson's EN and FR pages and used as both the HTML filename stem and the Catalog_Entry `id` and `slug`.
- **Sandbox_Track**: The `sandbox` track value grouping the hands-on opcp-explorer Platform lessons.
- **Sidebar**: The hardcoded `.sidebar` navigation block present in each static Lesson_Page, containing one section per track.
- **Locale_Switcher**: The header `.locale-switcher` control whose `data-locale` buttons invoke `switchLocale` in `skillhub/js/i18n.js`.
- **Diagram_Asset**: The hand-authored SVG file stored in `skillhub/assets/img/` and embedded in the Lesson_Page via an `<img>` element.
- **Catalog_Test_Suite**: The automated tests in `skillhub/tests/lessons.test.js` enforcing Lesson_Catalog invariants.
- **Content_Source**: The bilingual `ARCHITECTURE_GUIDE.md` document in the agentic-ai-plateform docs that provides the governance content.
- **Autonomy_Level**: A defined degree of agent independence along the supervised-to-autonomous spectrum.
- **HITL**: Human-in-the-loop, a control pattern requiring human review or approval of agent actions.

## Requirements

### Requirement 1: Bilingual page creation

**User Story:** As a learner, I want a dedicated lesson page on controlling AI agents available in both English and French, so that I can study agent governance in my preferred language.

#### Acceptance Criteria

1. THE SkillHub SHALL provide a Lesson_Page at `skillhub/en/agent-control.html` with `<html lang="en">`.
2. THE SkillHub SHALL provide a Lesson_Page at `skillhub/fr/agent-control.html` with `<html lang="fr">`.
3. THE SkillHub SHALL use the identical Slug `agent-control` for both the English and French Lesson_Page filenames.
4. THE English Lesson_Page SHALL display the lesson title "Controlling AI Agents".
5. THE French Lesson_Page SHALL display the lesson title "Contrôle des agents IA".

### Requirement 2: Page structure conformance

**User Story:** As a learner, I want each Lesson_Page to follow the established SkillHub page structure, so that the new lesson looks and behaves like every other lesson.

#### Acceptance Criteria

1. THE Lesson_Page SHALL include a header containing the global progress bar and the `.locale-switcher` control.
2. THE Lesson_Page SHALL include a hamburger navigation button in the header.
3. THE Lesson_Page SHALL include a hardcoded `.sidebar` containing one section for each of the morning, afternoon, and sandbox tracks.
4. THE Lesson_Page SHALL include a `.main-content` region containing a `.lesson-content` block with a `.lesson-header` holding an `h1` and a `.lesson-meta` block.
5. THE `.lesson-meta` block SHALL contain a difficulty badge and a duration indicator.
6. THE Lesson_Page SHALL include a `.btn-mark-complete` button whose `data-lesson-id` attribute equals `agent-control`.
7. THE Lesson_Page SHALL load the `../js/app.js` and `../assets/js/diagrams.js` scripts.

### Requirement 3: Governance content coverage

**User Story:** As a learner, I want the lesson body to cover agent governance, guardrails, and human-in-the-loop controls, so that I understand how to constrain agent autonomy responsibly.

#### Acceptance Criteria

1. THE Lesson_Page SHALL present content describing Autonomy_Level progression from supervised to autonomous operation.
2. THE Lesson_Page SHALL present content describing approval gates applied to agent actions.
3. THE Lesson_Page SHALL present content describing guardrail controls over agent autonomy.
4. THE Lesson_Page SHALL present content describing HITL review of agent actions.
5. THE English Lesson_Page body SHALL present lesson content in English and the French Lesson_Page body SHALL present the corresponding lesson content in French.
6. THE Lesson_Page content SHALL be derived from the Content_Source.

### Requirement 4: Architecture SVG diagram

**User Story:** As a learner, I want a clear diagram of agent control concepts that matches the site's visual style, so that I can grasp the governance model visually.

#### Acceptance Criteria

1. THE SkillHub SHALL provide a hand-authored Diagram_Asset in SVG format stored under `skillhub/assets/img/`.
2. THE Diagram_Asset SHALL use the OVHcloud palette colors navy `#1a1f71`, blue `#0050d7`, and light `#e8efff`.
3. THE English Lesson_Page SHALL embed the Diagram_Asset through an `<img>` element.
4. THE French Lesson_Page SHALL embed the Diagram_Asset through an `<img>` element.
5. THE `<img>` element embedding the Diagram_Asset SHALL include an `alt` attribute describing the diagram, in English on the English Lesson_Page and in French on the French Lesson_Page.

### Requirement 5: Catalog registration

**User Story:** As a maintainer, I want the new lesson registered in the Lesson_Catalog, so that navigation, progress tracking, and prerequisite logic recognize it.

#### Acceptance Criteria

1. THE Lesson_Catalog SHALL contain a Catalog_Entry whose `id` equals `agent-control` and whose `slug` equals `agent-control`.
2. THE Catalog_Entry SHALL set `title.en` to "Controlling AI Agents" and `title.fr` to "Contrôle des agents IA".
3. THE Catalog_Entry SHALL set `track` to `sandbox`.
4. THE Catalog_Entry SHALL set `difficulty` to one of `beginner`, `intermediate`, or `advanced`.
5. THE Catalog_Entry SHALL set `estimatedMinutes` to an integer between 1 and 480 inclusive.
6. THE Catalog_Entry SHALL set `prerequisites` to `["adding-applications"]` so that the new lesson extends the existing sandbox chain.
7. THE Catalog_Entry `id` and `slug` SHALL be unique across the Lesson_Catalog.

### Requirement 6: Sidebar wiring

**User Story:** As a learner, I want the new lesson to appear in the sidebar of every lesson page, so that I can navigate to it from anywhere in the programme.

#### Acceptance Criteria

1. THE Sidebar of every English Lesson_Page SHALL include a link to `agent-control.html` within the Sandbox_Track section.
2. THE Sidebar of every French Lesson_Page SHALL include a link to `agent-control.html` within the Sandbox_Track section.
3. THE English Sidebar link SHALL display the text "Controlling AI Agents".
4. THE French Sidebar link SHALL display the text "Contrôle des agents IA".
5. WHILE the active Lesson_Page is `agent-control`, THE Sidebar SHALL mark its `agent-control.html` link as active.

### Requirement 7: Language toggle correctness

**User Story:** As a bilingual learner, I want the language toggle on the new page to switch between the EN and FR versions correctly, so that I keep reading the same lesson in the other language.

#### Acceptance Criteria

1. WHEN a learner activates the Locale_Switcher English button on the French Lesson_Page, THE SkillHub SHALL navigate to `/en/agent-control.html`.
2. WHEN a learner activates the Locale_Switcher French button on the English Lesson_Page, THE SkillHub SHALL navigate to `/fr/agent-control.html`.
3. THE Locale_Switcher navigation SHALL preserve the `agent-control` Slug filename while rewriting only the leading locale path segment.
4. THE English Lesson_Page Locale_Switcher SHALL mark the English button as active, and the French Lesson_Page Locale_Switcher SHALL mark the French button as active.

### Requirement 8: Test coverage

**User Story:** As a maintainer, I want automated tests to confirm the new lesson satisfies all catalog invariants, so that the catalog remains valid as the programme grows.

#### Acceptance Criteria

1. WHEN the Catalog_Test_Suite runs, THE Catalog_Test_Suite SHALL confirm the `agent-control` Catalog_Entry is present in the Sandbox_Track.
2. WHEN the Catalog_Test_Suite runs, THE Catalog_Test_Suite SHALL confirm the `agent-control` Catalog_Entry has a unique `id` and `slug` with `id` equal to `slug`.
3. WHEN the Catalog_Test_Suite runs, THE Catalog_Test_Suite SHALL confirm the `agent-control` prerequisites reference existing Catalog_Entry ids and introduce no cycle.
4. WHEN the Catalog_Test_Suite runs, THE Catalog_Test_Suite SHALL confirm the `agent-control` Catalog_Entry has non-empty `title.en` and `title.fr` values.
5. IF the `agent-control` Catalog_Entry violates any Lesson_Catalog invariant, THEN THE Catalog_Test_Suite SHALL report a failure.
6. WHEN the full SkillHub test suite runs after this feature is added, THE SkillHub SHALL report that all previously passing tests continue to pass.
