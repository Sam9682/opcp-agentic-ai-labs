# Requirements Document

## Introduction

The `install-bare-metal.html` lesson page currently presents a long, nine-step manual installation procedure first and surfaces the automated/quick installation path only at the bottom under "Automated Script". This ordering forces learners through the detailed manual path before they discover the faster recommended route. This feature restructures the lesson page so the quick (automated) installation path appears first, the detailed nine-step manual procedure becomes an optional secondary section, and an architecture diagram of the platform's AI agents is displayed at the top of the lesson body.

The restructure must be applied consistently across four files — the English and French lesson pages in the SkillHub site and their corresponding SCORM package copies — while preserving the existing page chrome (header, sidebar navigation, locale switcher, progress bar, stylesheet references, and the Mark as Complete button).

## Glossary

- **Lesson_Page**: An `install-bare-metal.html` document, in either the English or French locale, in either the SkillHub site tree or the SCORM package tree.
- **EN_Lesson_Page**: The English lesson page at `skillhub/en/install-bare-metal.html`.
- **FR_Lesson_Page**: The French lesson page at `skillhub/fr/install-bare-metal.html`.
- **SCORM_EN_Lesson_Page**: The SCORM English copy at `scorm/skillhub_scorm/en/install-bare-metal.html`.
- **SCORM_FR_Lesson_Page**: The SCORM French copy at `scorm/skillhub_scorm/fr/install-bare-metal.html`.
- **Architecture_Diagram**: A standalone SVG asset depicting the platform's AI agents and their responsibilities, referenced from a Lesson_Page via an `<img>` tag.
- **Operator_Agent**: The AI agent responsible for platform lifecycle operations: start, stop, ps, backup, and restore.
- **Developer_Agent**: The AI agent responsible for adding and modifying applications.
- **Control_Agent**: The AI agent responsible for compliance checks and verification.
- **Quick_Installation_Section**: The lesson section that promotes the automated `init_pltf.sh` installation path, including the existing `Screen_InstallPltf1.png` screenshot.
- **Manual_Installation_Section**: The optional lesson section containing the nine numbered manual installation steps and the Post-Installation Checklist.
- **Page_Chrome**: The shared page elements that must be preserved: header, sidebar navigation, locale switcher, progress bar, stylesheet reference, and the Mark as Complete button.
- **Lesson_Body**: The `<div class="lesson-body">` container within a Lesson_Page that holds the restructured content sections.

## Requirements

### Requirement 1: Architecture diagram asset

**User Story:** As a lesson author, I want a standalone SVG architecture diagram of the AI agents, so that learners see the platform's agent roles before reading installation instructions.

#### Acceptance Criteria

1. THE Architecture_Diagram SHALL be created as a standalone SVG file placed in the SkillHub asset image directory used by the `../assets/img/` reference pattern.
2. THE Architecture_Diagram SHALL depict the Operator_Agent with its responsibilities labeled as start, stop, ps, backup, and restore.
3. THE Architecture_Diagram SHALL depict the Developer_Agent with its responsibilities labeled as adding and modifying applications.
4. THE Architecture_Diagram SHALL depict the Control_Agent with its responsibilities labeled as compliance checks and verification.
5. WHERE the SCORM package tree uses a separate asset image directory from the SkillHub site tree, THE Architecture_Diagram SHALL be placed in the SCORM asset image directory so the SCORM copies resolve the image reference.

### Requirement 2: English page restructure

**User Story:** As a learner, I want the English lesson page reordered so the quick path comes first, so that I can choose the fastest installation route immediately.

#### Acceptance Criteria

1. THE EN_Lesson_Page SHALL display the Architecture_Diagram via an `<img>` tag as the first content element inside the Lesson_Body.
2. THE EN_Lesson_Page SHALL order the Lesson_Body sections as Architecture_Diagram, Prerequisites, Quick_Installation_Section, Manual_Installation_Section, and Exercises.
3. THE EN_Lesson_Page Quick_Installation_Section SHALL present the automated `init_pltf.sh` installation path including the `Screen_InstallPltf1.png` screenshot.
4. THE EN_Lesson_Page Manual_Installation_Section SHALL contain the nine numbered installation steps and the Post-Installation Checklist.
5. THE EN_Lesson_Page Quick_Installation_Section SHALL precede the Manual_Installation_Section.
6. THE EN_Lesson_Page SHALL retain the Prerequisites section between the Architecture_Diagram and the Quick_Installation_Section.

### Requirement 3: French page restructure

**User Story:** As a French-speaking learner, I want the French lesson page restructured identically, so that both locales offer the same experience.

#### Acceptance Criteria

1. THE FR_Lesson_Page SHALL use the same Lesson_Body section ordering as the EN_Lesson_Page: Architecture_Diagram, Prerequisites, Quick_Installation_Section, Manual_Installation_Section, and Exercises.
2. THE FR_Lesson_Page SHALL present all restructured section headings and body text in French consistent with the EN_Lesson_Page content.
3. THE FR_Lesson_Page SHALL display the Architecture_Diagram via an `<img>` tag as the first content element inside the Lesson_Body.
4. THE FR_Lesson_Page Quick_Installation_Section SHALL present the automated `init_pltf.sh` installation path including the `Screen_InstallPltf1.png` screenshot.
5. THE FR_Lesson_Page Manual_Installation_Section SHALL contain the nine numbered installation steps and the Post-Installation Checklist translated into French.

### Requirement 4: SCORM copy parity

**User Story:** As a maintainer, I want the SCORM copies to match the SkillHub pages, so that the packaged course content stays in parity with the site.

#### Acceptance Criteria

1. THE SCORM_EN_Lesson_Page SHALL use the same Lesson_Body structure, section ordering, and content as the EN_Lesson_Page.
2. THE SCORM_FR_Lesson_Page SHALL use the same Lesson_Body structure, section ordering, and content as the FR_Lesson_Page.
3. THE SCORM_EN_Lesson_Page SHALL display the Architecture_Diagram via an `<img>` tag that resolves within the SCORM package.
4. THE SCORM_FR_Lesson_Page SHALL display the Architecture_Diagram via an `<img>` tag that resolves within the SCORM package.

### Requirement 5: Page chrome preservation

**User Story:** As a learner, I want the existing page navigation and controls preserved, so that the restructure does not break the learning experience.

#### Acceptance Criteria

1. THE Lesson_Page SHALL preserve the existing header, including the logo and header actions.
2. THE Lesson_Page SHALL preserve the existing sidebar navigation with its Beginner and Intermediate sections and the active lesson link.
3. THE Lesson_Page SHALL preserve the existing locale switcher with its EN and FR buttons and active-state marking.
4. THE Lesson_Page SHALL preserve the existing progress bar in the header.
5. THE Lesson_Page SHALL preserve the existing stylesheet reference `../assets/css/style.css`.
6. THE Lesson_Page SHALL preserve the existing Mark as Complete button with its `data-lesson-id="install-bare-metal"` attribute positioned after the Lesson_Body.
7. THE Lesson_Page SHALL retain the Exercises section as the final content section inside the Lesson_Body.
