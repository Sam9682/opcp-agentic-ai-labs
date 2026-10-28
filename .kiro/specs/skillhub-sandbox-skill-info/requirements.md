# Requirements Document

## Introduction

The SkillHub learning site contains a "Sandbox — opcp-explorer Platform" group of static HTML lesson pages (both English and French locales) that teach users how to operate applications on the platform. This feature adds, to each relevant Sandbox page, a presentation of the underlying `shai` skill-agent configuration: a short human-readable intro paragraph describing what the skill does, followed by the complete source `SKILL.md` prompt content rendered inside a collapsible section that is collapsed by default.

The source prompts are the canonical `SKILL.md` files located under `\\wsl.localhost\Ubuntu-24.04\home\slepetre\workspace\github\agentic-ai-plateform--skills\shai\skills\<SKILL>\SKILL.md`. These prompts contain shell, `openssl`, and `docker` commands, HTML-sensitive characters (`<`, `>`, `&`), and templated runtime placeholders such as `{{APPLICATION_FOLDER}}` and `{{USER_ID}}`. The work is a static-HTML content-integration task: no application code in a build language is produced, though the existing Jest test suite under `skillhub/tests/` may be extended to assert the integration.

Each Sandbox page maps to one or more skills. A page with multiple mapped skills receives one collapsible block per skill. The `install-bare-metal.html` page receives no skill section. Both the `skillhub/en/` and `skillhub/fr/` copies of each page are updated for parity; intro and explanatory text is translated into French on FR pages, while the embedded `SKILL.md` prompt content remains in English in both locales.

## Glossary

- **SkillHub**: The static HTML learning site rooted at `skillhub/`, containing `en/` and `fr/` locale subfolders.
- **Sandbox_Page**: Any HTML lesson page belonging to the "Sandbox — opcp-explorer Platform" group. The set of Sandbox pages addressed by this feature is: `starting-applications.html`, `stopping-applications.html`, `making-backups.html`, `modifying-applications.html`, `adding-applications.html`, `agent-control.html`, and `install-bare-metal.html`, each present in both `skillhub/en/` and `skillhub/fr/`.
- **Skill**: A `shai` skill-agent whose canonical prompt is stored in a single `SKILL.md` file under `agentic-ai-plateform--skills/shai/skills/<SKILL>/SKILL.md`. The eleven skills are: `START_APP`, `STOP_APP`, `BACKUP_DATABASE`, `RESTORE_DATABASE`, `CLEAN_DATABASE`, `MODIFY_CODE`, `VERIFY_APP_COMPLIANCE`, `MAKE_APP_COMPLIANT`, `SPECIFY_FEATURE`, `AGENTS_CONTROL`, and `STATUS_APP`.
- **SKILL_Prompt**: The complete text content of a Skill's `SKILL.md` file.
- **Skill_Section**: An HTML block added to a Sandbox_Page for a single Skill, consisting of an intro paragraph and a collapsible element containing that Skill's SKILL_Prompt.
- **Collapsible_Element**: An HTML `<details>` element containing a `<summary>` label and the SKILL_Prompt, rendered collapsed by default.
- **Runtime_Placeholder**: A templated variable in a SKILL_Prompt (for example `{{APPLICATION_FOLDER}}` or `{{USER_ID}}`) that is substituted with a concrete value at runtime.
- **Author**: The content maintainer who integrates Skill_Sections into Sandbox_Pages.
- **Reader**: A person viewing a Sandbox_Page in a web browser.
- **Page_Skill_Map**: The authoritative mapping of each Sandbox_Page to its ordered list of Skills.

## Requirements

### Requirement 1: Per-page skill section mapping

**User Story:** As a Reader, I want each Sandbox page to show the skill configuration for exactly the skills that power that page, so that I understand which agent prompts drive the actions described on that page.

#### Acceptance Criteria

1. THE SkillHub SHALL render a Skill_Section for `START_APP` on `starting-applications.html`.
2. THE SkillHub SHALL render a Skill_Section for `STOP_APP` on `stopping-applications.html`.
3. THE SkillHub SHALL render a Skill_Section for each of `BACKUP_DATABASE`, `RESTORE_DATABASE`, and `CLEAN_DATABASE` on `making-backups.html`.
4. THE SkillHub SHALL render a Skill_Section for each of `MODIFY_CODE`, `VERIFY_APP_COMPLIANCE`, and `MAKE_APP_COMPLIANT` on `modifying-applications.html`.
5. THE SkillHub SHALL render a Skill_Section for each of `SPECIFY_FEATURE` and `MODIFY_CODE` on `adding-applications.html`.
6. THE SkillHub SHALL render a Skill_Section for each of `AGENTS_CONTROL` and `STATUS_APP` on `agent-control.html`.
7. THE SkillHub SHALL render zero Skill_Sections on `install-bare-metal.html`.
8. WHERE a Sandbox_Page maps to more than one Skill in the Page_Skill_Map, THE SkillHub SHALL render one distinct Collapsible_Element per mapped Skill.

### Requirement 2: Skill content accuracy and completeness

**User Story:** As a Reader, I want the embedded prompt to be the complete and unaltered skill configuration, so that I can trust it reflects the agent's actual behavior.

#### Acceptance Criteria

1. THE SkillHub SHALL embed, within each Skill_Section, the complete SKILL_Prompt from the mapped Skill's `SKILL.md` source file.
2. THE SkillHub SHALL preserve the textual content of the SKILL_Prompt without adding, removing, or reordering lines relative to the source `SKILL.md`, except for the HTML escaping defined in Requirement 3.
3. THE SkillHub SHALL render, before the Collapsible_Element in each Skill_Section, one intro paragraph that describes what the mapped Skill does.
4. WHEN the source `SKILL.md` for a mapped Skill is updated, THE Author SHALL re-embed the updated SKILL_Prompt so the Skill_Section matches the source.

### Requirement 3: HTML escaping of embedded prompt content

**User Story:** As a Reader, I want command syntax in the embedded prompt to display exactly as written, so that I can copy commands without corruption and the page renders correctly.

#### Acceptance Criteria

1. WHEN a SKILL_Prompt contains the character `<`, THE SkillHub SHALL render that character as the HTML entity `&lt;` in the embedded content.
2. WHEN a SKILL_Prompt contains the character `>`, THE SkillHub SHALL render that character as the HTML entity `&gt;` in the embedded content.
3. WHEN a SKILL_Prompt contains the character `&`, THE SkillHub SHALL render that character as the HTML entity `&amp;` in the embedded content.
4. THE SkillHub SHALL render the embedded SKILL_Prompt inside `<pre>` and `<code>` elements so that whitespace and line breaks are preserved.
5. WHEN a Sandbox_Page containing a Skill_Section is opened in a browser, THE SkillHub SHALL display the escaped SKILL_Prompt characters as their literal source characters (`<`, `>`, `&`) to the Reader.

### Requirement 4: Collapsible behavior

**User Story:** As a Reader, I want the long prompt hidden behind a collapsible control, so that the page stays scannable and I can expand the detail only when I want it.

#### Acceptance Criteria

1. THE SkillHub SHALL render each embedded SKILL_Prompt inside a Collapsible_Element built from an HTML `<details>` element and a `<summary>` element.
2. THE SkillHub SHALL render each Collapsible_Element in the collapsed state by default by omitting the `open` attribute from the `<details>` element.
3. WHEN a Reader activates the `<summary>` of a Collapsible_Element, THE SkillHub SHALL reveal the SKILL_Prompt content of that Collapsible_Element.
4. THE SkillHub SHALL provide a `<summary>` label that identifies the Skill whose prompt the Collapsible_Element contains.
5. WHERE `<details>` styling is required for visual consistency with existing lesson styles, THE Author SHALL add the supporting CSS to the SkillHub stylesheet.

### Requirement 5: Placeholder preservation and runtime note

**User Story:** As a Reader, I want templated variables shown verbatim with an explanation, so that I understand which parts of the prompt are substituted at runtime.

#### Acceptance Criteria

1. THE SkillHub SHALL render each Runtime_Placeholder (for example `{{APPLICATION_FOLDER}}` and `{{USER_ID}}`) in the embedded SKILL_Prompt verbatim, including the surrounding double braces.
2. WHERE a Skill_Section embeds a SKILL_Prompt that contains one or more Runtime_Placeholders, THE SkillHub SHALL display a note stating that the Runtime_Placeholders are substituted with concrete values at runtime.
3. THE SkillHub SHALL NOT substitute, resolve, or remove any Runtime_Placeholder in the embedded SKILL_Prompt.

### Requirement 6: EN/FR locale parity and translation rules

**User Story:** As a Reader using either locale, I want the skill information present in both the English and French versions of each page, with explanatory text in my language, so that the learning experience is equivalent across locales.

#### Acceptance Criteria

1. THE SkillHub SHALL add the same set of Skill_Sections to the `skillhub/en/` and `skillhub/fr/` copy of each Sandbox_Page, according to the Page_Skill_Map.
2. WHERE a Skill_Section is rendered on a page under `skillhub/fr/`, THE SkillHub SHALL present the intro paragraph, the `<summary>` label, and the runtime-placeholder note in French.
3. WHERE a Skill_Section is rendered on a page under `skillhub/en/`, THE SkillHub SHALL present the intro paragraph, the `<summary>` label, and the runtime-placeholder note in English.
4. THE SkillHub SHALL embed the SKILL_Prompt content in English within Skill_Sections under both `skillhub/en/` and `skillhub/fr/`.
5. THE SkillHub SHALL embed, for a given Skill, identical SKILL_Prompt content in the `skillhub/en/` and `skillhub/fr/` copies of the pages that map to that Skill.

### Requirement 7: Accessibility of collapsible sections

**User Story:** As a Reader who relies on a keyboard or assistive technology, I want the collapsible skill sections to be operable and understandable, so that I can access the prompt content on equal terms.

#### Acceptance Criteria

1. THE SkillHub SHALL use the native HTML `<details>` and `<summary>` elements for each Collapsible_Element so that keyboard operability and expanded/collapsed state exposure are provided by the browser.
2. WHEN a Reader navigates to a `<summary>` element using the keyboard, THE SkillHub SHALL allow the Reader to toggle the Collapsible_Element using the keyboard.
3. THE SkillHub SHALL provide, in each `<summary>` label, text that identifies the Skill so that the purpose of the Collapsible_Element is clear without expanding it.
4. THE SkillHub SHALL preserve the existing heading structure of each Sandbox_Page so that each added Skill_Section is reachable within the page's document outline.
