# Requirements Document

## Introduction

This feature adds an illustrative image to the "Why Decompose?" section of the multi-agent-patterns lesson in the SkillHub learning content. The image must appear on both the English and French versions of the lesson page, placed immediately after the section heading and before the existing explanatory bullet list. The source image is copied into the shared SkillHub image asset directory and referenced through the established relative-path convention, with localized alternative text and caption on each page.

## Glossary

- **SkillHub**: The learning-content module located under the `skillhub/` directory of the workspace, containing mirrored English (`en/`) and French (`fr/`) lesson pages.
- **Lesson_Page**: An HTML lesson file. The two Lesson_Pages in scope are `skillhub/en/multi-agent-patterns.html` and `skillhub/fr/multi-agent-patterns.html`.
- **EN_Lesson_Page**: The English Lesson_Page at `skillhub/en/multi-agent-patterns.html`.
- **FR_Lesson_Page**: The French Lesson_Page at `skillhub/fr/multi-agent-patterns.html`.
- **Why_Decompose_Section**: The lesson section introduced by the `<h2>Why Decompose?</h2>` heading on the EN_Lesson_Page and the `<h2>Pourquoi décomposer ?</h2>` heading on the FR_Lesson_Page.
- **Source_Image**: The image file located at `C:\Users\slepetre\agent-vs-assistant\multi-agent-patterns.png`, which maps into the WSL environment for the copy operation.
- **Asset_Image**: The copied image file stored at `skillhub/assets/img/multi-agent-patterns.png`.
- **Lesson_Figure**: The figure markup block following the SkillHub convention: `<figure class="lesson-figure">` containing an `<img>` with `src="../assets/img/<file>"`, an `alt` attribute, the inline style `max-width: 100%; border: 1px solid #ddd; border-radius: 4px;`, and a `<figcaption>`.
- **Alt_Text**: The textual value of the `alt` attribute on the figure's `<img>` element, describing the image for assistive technology.
- **Figcaption**: The visible caption text within the `<figcaption>` element of the Lesson_Figure.

## Requirements

### Requirement 1: Copy image into asset directory

**User Story:** As a content maintainer, I want the source image available in the SkillHub asset directory, so that both lesson pages can reference it through the standard relative path.

#### Acceptance Criteria

1. THE System SHALL copy the Source_Image to the path `skillhub/assets/img/multi-agent-patterns.png` to create the Asset_Image.
2. THE Asset_Image SHALL have identical file content to the Source_Image.

### Requirement 2: Insert figure on English lesson page

**User Story:** As an English-speaking learner, I want to see the diagram in the "Why Decompose?" section, so that I can visually understand multi-agent decomposition.

#### Acceptance Criteria

1. THE EN_Lesson_Page SHALL contain a Lesson_Figure referencing the Asset_Image through the relative path `../assets/img/multi-agent-patterns.png`.
2. THE EN_Lesson_Page SHALL place the Lesson_Figure immediately after the `<h2>Why Decompose?</h2>` heading and before the bullet list that currently follows that heading.
3. THE EN_Lesson_Page Lesson_Figure `<img>` element SHALL include the inline style `max-width: 100%; border: 1px solid #ddd; border-radius: 4px;`.
4. THE EN_Lesson_Page Lesson_Figure SHALL contain English Alt_Text that describes the content of the Asset_Image.
5. THE EN_Lesson_Page Lesson_Figure SHALL contain an English Figcaption that describes the content of the Asset_Image.

### Requirement 3: Insert localized figure on French lesson page

**User Story:** As a French-speaking learner, I want to see the same diagram with French text in the "Pourquoi décomposer ?" section, so that the lesson remains fully localized.

#### Acceptance Criteria

1. THE FR_Lesson_Page SHALL contain a Lesson_Figure referencing the Asset_Image through the relative path `../assets/img/multi-agent-patterns.png`.
2. THE FR_Lesson_Page SHALL place the Lesson_Figure immediately after the `<h2>Pourquoi décomposer ?</h2>` heading and before the bullet list that currently follows that heading.
3. THE FR_Lesson_Page Lesson_Figure `<img>` element SHALL include the inline style `max-width: 100%; border: 1px solid #ddd; border-radius: 4px;`.
4. THE FR_Lesson_Page Lesson_Figure SHALL contain French Alt_Text that describes the content of the Asset_Image.
5. THE FR_Lesson_Page Lesson_Figure SHALL contain a French Figcaption that describes the content of the Asset_Image.

### Requirement 4: Follow SkillHub figure conventions

**User Story:** As a content maintainer, I want the new figures to follow existing SkillHub conventions, so that the pages stay consistent and valid.

#### Acceptance Criteria

1. THE System SHALL use the `<figure class="lesson-figure">` structure for each inserted Lesson_Figure, consistent with other SkillHub Lesson_Figures.
2. WHERE existing content in the Why_Decompose_Section is present, THE System SHALL preserve that existing content unchanged apart from inserting the Lesson_Figure.
3. IF the Source_Image cannot be read from its mapped path, THEN THE System SHALL report the failure and SHALL leave the Lesson_Pages unchanged.
