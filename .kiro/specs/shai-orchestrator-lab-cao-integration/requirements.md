# Requirements Document

## Introduction

The two Sandbox lab pages `skillhub/en/shai-orchestrator-lab.html` and `skillhub/fr/shai-orchestrator-lab.html` currently teach a fictional "shai" multi-agent orchestrator using illustrative-only, non-runnable commands and a fictional JSON configuration file. This feature reworks both pages so they teach and use the **real CLI Agent Orchestrator (CAO)** tool, turning the pages from read-only references into runnable hands-on labs that a learner executes against their own CAO installation.

The scope covers the **core supervisor loop only** against a generic project path (`/path/to/your/project`): install CAO, start `cao-server`, launch a supervisor in a project directory, delegate a small task, observe via the attached terminal and the Web UI at `http://localhost:9889`, and shut down. Flows, workflows, skills, and memory tours are explicitly out of scope.

Both pages must stay fully in sync (same sections, same structure, translated content), preserve all existing page chrome and the lesson identity used for progress tracking, and preserve the Mermaid diagram rendering pattern while updating diagram labels to CAO terminology (supervisor / worker / reviewer).

## Glossary

- **Lab_Page**: Either of the two HTML lesson files — `skillhub/en/shai-orchestrator-lab.html` (English) and `skillhub/fr/shai-orchestrator-lab.html` (French) — that this feature reworks.
- **CAO**: CLI Agent Orchestrator, the real orchestration tool located at `~/workspace/forgejo/cli-agent-orchestrator`, installable from `git+https://github.com/awslabs/cli-agent-orchestrator.git@main`.
- **CAO_Server**: The local `cao-server` process that starts provider CLIs in isolated tmux terminal sessions; long-running, started in a dedicated terminal.
- **Supervisor_Profile**: A CAO agent profile with `role: supervisor` that delegates sub-tasks to worker agents.
- **Worker_Profile**: A CAO agent profile with a specialist role such as `developer` or `reviewer` that executes a delegated sub-task.
- **Agent_Profile**: A CAO agent definition expressed as a Markdown file with YAML frontmatter (fields such as `name`, `description`, `provider`, `role`, `allowedTools`, `delegateTools`) and a Markdown body used as the agent's system prompt.
- **Web_UI**: The CAO web interface served at `http://localhost:9889` for observing an orchestrated run.
- **Lesson_Identity**: The lesson filename (`shai-orchestrator-lab.html`) and the `data-lesson-id="shai-orchestrator-lab"` attribute that progress tracking and sidebar navigation depend on.
- **Page_Chrome**: The structural shell shared across lessons — `html` lang attribute, site-header (progress bar, EN/FR locale switcher, hamburger), sidebar (`data-section="section-3"`, `nav-sandbox`), lesson-header/meta/difficulty-badge/duration, lesson-body, Mark-as-Complete button, and the two script includes (`../js/app.js`, `../assets/js/diagrams.js`).
- **Mermaid_Diagram**: A diagram authored as `<pre><code>flowchart...</code></pre>` or `<pre><code>sequenceDiagram...</code></pre>` and rendered by `../assets/js/diagrams.js`.
- **Author**: The person or process producing the reworked Lab_Page content.

## Requirements

### Requirement 1: Replace fictional product naming with real CAO content

**User Story:** As a learner, I want the lab to describe the real CLI Agent Orchestrator, so that what I read matches the tool I actually install and run.

#### Acceptance Criteria

1. THE Lab_Page SHALL present the CLI Agent Orchestrator (CAO) as the subject of the lab in all user-facing content.
2. THE Lab_Page SHALL NOT contain the fictional "shai" product name in user-facing content.
3. WHERE the architecture or delegation is described, THE Lab_Page SHALL describe CAO behavior: a local CAO_Server starting provider CLIs in isolated tmux terminal sessions, a supervisor profile delegating to specialist worker agents in parallel or sequence, and agents remaining full CLI processes with native authentication.
4. THE Lab_Page SHALL retain the file name `shai-orchestrator-lab.html` unchanged.
5. THE Lab_Page SHALL retain the attribute `data-lesson-id="shai-orchestrator-lab"` on the Mark-as-Complete button unchanged.

### Requirement 2: Convert the read-only lab into a runnable hands-on lab

**User Story:** As a learner, I want to run the lab commands against my own CAO install, so that I gain hands-on experience instead of reading illustrative-only snippets.

#### Acceptance Criteria

1. THE Lab_Page SHALL present the commands as real executable CAO commands intended to run against the learner's own CAO installation.
2. THE Lab_Page SHALL NOT state that the commands are illustrative only or that nothing on the page executes.
3. THE Lab_Page SHALL NOT include the read-only lab framing currently present in the introduction and info alert.
4. THE Lab_Page SHALL include a prerequisites and setup section listing Python 3.11 or later, tmux 3.3 or later, uv, and at least one authenticated provider CLI (default Kiro CLI).

### Requirement 3: Document the core supervisor loop with real CAO commands

**User Story:** As a learner, I want step-by-step real CAO commands for the core supervisor loop, so that I can install CAO, run a supervisor, delegate a task, observe it, and shut it down.

#### Acceptance Criteria

1. THE Lab_Page SHALL include the install command `uv tool install git+https://github.com/awslabs/cli-agent-orchestrator.git@main --upgrade` followed by `cao --help` to verify the install.
2. THE Lab_Page SHALL include the command `cao install code_supervisor` to install the supervisor agent.
3. THE Lab_Page SHALL instruct the learner to start `cao-server` as a long-running process in a dedicated terminal.
4. THE Lab_Page SHALL instruct the learner to launch the supervisor from the project directory using `cd /path/to/your/project && cao launch --agents code_supervisor` in a separate terminal.
5. THE Lab_Page SHALL use the generic project path placeholder `/path/to/your/project` wherever a project directory is referenced.
6. THE Lab_Page SHALL instruct the learner to delegate a small task to the supervisor within the launched session.
7. THE Lab_Page SHALL instruct the learner to observe the run through the attached terminal and through the Web_UI at `http://localhost:9889`.
8. THE Lab_Page SHALL include the shutdown commands `cao shutdown --session {session-name}` and `cao shutdown --all`.
9. THE Lab_Page SHALL limit the hands-on steps to the core supervisor loop and SHALL NOT include flows, workflows, skills, or memory tours.

### Requirement 4: Replace the JSON config with real CAO Markdown agent profiles

**User Story:** As a learner, I want to see real CAO agent profiles, so that I understand how CAO agents are actually configured and governed.

#### Acceptance Criteria

1. THE Lab_Page SHALL present CAO agent profiles as Markdown files with YAML frontmatter and a Markdown system-prompt body.
2. THE Lab_Page SHALL NOT present the fictional `orchestrator.config.json` JSON configuration.
3. THE Lab_Page SHALL show one Supervisor_Profile example and one Worker_Profile example (a developer or reviewer role).
4. THE Lab_Page SHALL explain the frontmatter field `name`.
5. THE Lab_Page SHALL explain the frontmatter field `role` with the allowed values supervisor, developer, and reviewer.
6. THE Lab_Page SHALL explain the frontmatter field `provider`.
7. THE Lab_Page SHALL explain the frontmatter field `allowedTools`.
8. THE Lab_Page SHALL explain the frontmatter field `delegateTools`, including that it is a delegation ceiling that defaults to `["*"]` for a supervisor.
9. WHERE a profile field is explained, THE Lab_Page SHALL frame the explanation as a governance decision.

### Requirement 5: Map governance framing onto real CAO concepts

**User Story:** As a learner, I want the governance concepts to map onto real CAO mechanisms, so that least privilege, review gates, kill switches, and operational limits remain concrete and accurate.

#### Acceptance Criteria

1. THE Lab_Page SHALL explain least privilege in terms of the CAO `allowedTools` and `delegateTools` fields.
2. THE Lab_Page SHALL explain the review gate in terms of a CAO reviewer-role agent.
3. THE Lab_Page SHALL explain the kill switch in terms of the CAO shutdown commands.
4. THE Lab_Page SHALL explain operational limits in terms of real CAO supervisor-loop controls.

### Requirement 6: Preserve page chrome and lesson structure

**User Story:** As a site maintainer, I want the reworked pages to keep their chrome and lesson identity, so that progress tracking, navigation, and the shared layout keep working.

#### Acceptance Criteria

1. THE Lab_Page SHALL preserve the `html` lang attribute (`en` for the English page, `fr` for the French page).
2. THE Lab_Page SHALL preserve the site-header, including the progress bar, the EN/FR locale switcher with correct active state, and the hamburger button.
3. THE Lab_Page SHALL preserve the sidebar with `data-section="section-3"`, the `nav-sandbox` navigation, the active link to `shai-orchestrator-lab.html`, and the link to `running-applications-lab.html`.
4. THE Lab_Page SHALL preserve the lesson-header, lesson-meta, difficulty badge, duration, and lesson-body structure.
5. THE Lab_Page SHALL preserve the Mark-as-Complete button with its `data-lesson-id` attribute and the localized label ("Mark as Complete" for English, "Marquer comme terminé" for French).
6. THE Lab_Page SHALL preserve the two script includes `../js/app.js` and `../assets/js/diagrams.js`.

### Requirement 7: Preserve and update Mermaid diagrams to CAO terminology

**User Story:** As a learner, I want the diagrams to render as before but describe CAO, so that the visuals match the real tool.

#### Acceptance Criteria

1. THE Lab_Page SHALL keep each diagram in the `<pre><code>flowchart...</code></pre>` or `<pre><code>sequenceDiagram...</code></pre>` pattern rendered by `../assets/js/diagrams.js`.
2. THE Lab_Page SHALL update diagram labels to the CAO terms supervisor, worker, and reviewer.

### Requirement 8: Keep the English and French pages in sync

**User Story:** As a bilingual learner, I want the EN and FR pages to match, so that I get the same lab regardless of language.

#### Acceptance Criteria

1. THE English Lab_Page and the French Lab_Page SHALL contain the same sections in the same order.
2. THE English Lab_Page and the French Lab_Page SHALL contain the same structure, with prose content translated into the respective language.
3. WHERE a command, agent profile, path placeholder, URL, or field name appears, THE English Lab_Page and the French Lab_Page SHALL present identical technical tokens.
