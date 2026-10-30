# Implementation Plan: shai-orchestrator-lab-cao-integration

## Overview

This is a pure static-HTML content edit of two files —
`skillhub/en/shai-orchestrator-lab.html` and
`skillhub/fr/shai-orchestrator-lab.html`. The English page is reworked
section-by-section first so the content, commands, diagrams, and agent profiles
are locked in; the French page is then produced in sync with translated prose
and byte-identical technical tokens. No JavaScript, CSS, build tooling, or
shared chrome changes. All CAO commands, provider defaults, profile fields, and
governance framing are grounded in the real CAO project at
`~/workspace/forgejo/cli-agent-orchestrator`. A final verification task runs the
design's eight content checks over both files.

Because this is content editing of a fixed section order within a single file,
tasks that touch the same file are sequenced rather than parallelized to avoid
edit conflicts.

## Tasks

- [ ] 1. Rework the English page intro, setup, and chrome identity
  - [ ] 1.1 Retitle the English page and update nav label while preserving identity
    - In `skillhub/en/shai-orchestrator-lab.html`, update the `<h1>` title and the
      sidebar `nav-sandbox` active link label to CAO wording (CLI Agent
      Orchestrator supervisor loop)
    - Keep the filename `shai-orchestrator-lab.html`, the Mark-as-Complete
      `data-lesson-id="shai-orchestrator-lab"`, `lang="en"`, the site-header
      (progress bar, EN/FR locale switcher with EN `active`, hamburger), the
      sidebar `data-section="section-3"` / `nav-sandbox` and the link to
      `running-applications-lab.html`, the lesson-header/meta/difficulty-badge/
      duration, the `.lesson-body` wrapper, and both script includes
      (`../js/app.js`, `../assets/js/diagrams.js`) exactly as-is
    - _Requirements: 1.1, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 1.2 Rewrite the intro and drop all read-only framing
    - Replace the intro paragraph with a runnable-lab intro presenting CAO as the
      real tool the learner installs and runs
    - Delete the "Read-only lab … Nothing here executes" info alert entirely and
      remove any "illustrative only" wording
    - Restate learning objectives in CAO terms (orchestrator → supervisor)
    - _Requirements: 1.1, 2.1, 2.2, 2.3_

  - [ ] 1.3 Add the Prerequisites & Setup section
    - Add a new section listing Python 3.11+, tmux 3.3+, uv, and at least one
      authenticated provider CLI (default Kiro CLI)
    - _Requirements: 2.4_

- [ ] 2. Rework the English architecture, roles, and delegation sections
  - [ ] 2.1 Rewrite CAO Architecture and relabel the flowchart
    - Describe the local `cao-server` starting provider CLIs in isolated tmux
      terminal sessions, a supervisor delegating to specialist workers in
      parallel or sequence, and agents remaining full CLI processes with native
      auth
    - Relabel the flowchart `<pre><code>flowchart TD …</code></pre>` to the CAO
      terms (operator/CLI → supervisor → worker/developer + reviewer → back),
      keeping the exact `<pre><code>` wrapper and following caption pattern
    - _Requirements: 1.3, 7.1, 7.2_

  - [ ] 2.2 Rework the Agent Roles section
    - Rename "Orchestrator" to "supervisor" and describe supervisor, worker
      (developer), and reviewer with responsibilities and tool scope tied to CAO
      roles
    - _Requirements: 1.3, 4.5_

  - [ ] 2.3 Rework the Delegation Model and relabel the sequenceDiagram
    - Describe a task flowing supervisor → worker → back, with mutating work
      routed through the reviewer
    - Relabel the `<pre><code>sequenceDiagram …</code></pre>` participants to
      Operator / Supervisor / Worker / Reviewer, keeping the exact `<pre><code>`
      wrapper and caption pattern
    - _Requirements: 1.3, 7.1, 7.2_

- [ ] 3. Rework the English step-by-step, profiles, and governance sections
  - [ ] 3.1 Replace illustrative commands with the runnable Core Supervisor Loop
    - Replace the "Driving shai from the CLI" section with real CAO commands:
      `uv tool install git+https://github.com/awslabs/cli-agent-orchestrator.git@main --upgrade`
      then `cao --help`; `cao install code_supervisor`; `cao-server` in a
      dedicated terminal; `cd /path/to/your/project && cao launch --agents
      code_supervisor` in a separate terminal; delegate a small task into the
      session; observe via the attached terminal and the Web UI at
      `http://localhost:9889`; `cao shutdown --session {session-name}` and `cao
      shutdown --all`
    - Use the placeholder `/path/to/your/project` wherever a project directory is
      referenced, and present commands as executable against the learner's own
      install
    - Omit flows, workflows, skills, and memory from the hands-on steps
    - _Requirements: 2.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ] 3.2 Replace the JSON config with CAO Markdown agent profiles
    - Remove `orchestrator.config.json` and show one Supervisor_Profile (from
      `code_supervisor.md`) and one Worker_Profile (from `developer.md`) as
      Markdown with YAML frontmatter and a Markdown system-prompt body
    - Explain each frontmatter field as a governance decision: `name`, `role`
      (allowed values supervisor/developer/reviewer), `provider`, `allowedTools`,
      and `delegateTools` (delegation ceiling, defaults to `["*"]` for supervisor)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [ ] 3.3 Rework the Governance Mapping and Key Takeaways sections
    - Map least privilege → `allowedTools`/`delegateTools`; review gate → a
      `role: reviewer` agent; kill switch → the `cao shutdown` commands;
      operational limits → real supervisor-loop controls
    - Restate Key Takeaways in CAO terms and keep the Next link pointing to
      `running-applications-lab.html`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 4. Checkpoint — English page complete
  - Re-read the edited English file end-to-end and confirm all sections are in the
    target order with no residual "shai" product naming in user-facing content.
    Ask the user if questions arise.

- [ ] 5. Produce the French page in sync
  - [ ] 5.1 Mirror the English structure into the French page with translated prose
    - Apply the same section order and structure to
      `skillhub/fr/shai-orchestrator-lab.html`, translating all prose into French
    - Keep technical tokens identical to the English page: every CAO command, the
      path placeholder `/path/to/your/project`, the URL `http://localhost:9889`,
      and every profile field name and `name`/`role` value
    - Relabel both Mermaid diagrams with the identical CAO tokens used on the
      English page, keeping the `<pre><code>flowchart…`/`<pre><code>sequenceDiagram…`
      pattern
    - _Requirements: 8.1, 8.2, 8.3, 7.1, 7.2_

  - [ ] 5.2 Preserve French chrome and lesson identity
    - Keep the filename `shai-orchestrator-lab.html`, `lang="fr"`, the FR locale
      switcher `active` state, the sidebar `data-section="section-3"` / `nav-sandbox`
      and link to `running-applications-lab.html`, the `data-lesson-id="shai-orchestrator-lab"`
      Mark-as-Complete button with the localized label "Marquer comme terminé", and
      both script includes
    - _Requirements: 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 6. Verification — run the design's eight content checks
  - Over both files, confirm: (1) chrome preserved per the Preserved Page Chrome
    table; (2) no user-facing "shai" naming except the two preserved identity
    tokens; (3) runnable framing with no read-only/illustrative wording; (4) the
    real CAO command set present with no flows/workflows/skills/memory steps; (5)
    agent profiles shown as Markdown (not `orchestrator.config.json`) with every
    frontmatter field explained as a governance decision; (6) governance mapping
    accurate; (7) both diagrams keep the `<pre><code>flowchart/sequenceDiagram`
    pattern with supervisor/worker/reviewer labels; (8) EN/FR section order matches
    and every technical token is identical across locales. Fix any failures and
    re-check. Ask the user if questions arise.
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 3, 4, 5, 6, 7, 8_

## Notes

- This is static HTML content editing, so there is no code/test infrastructure to
  build; verification is a set of targeted content checks over the two files
  (design Testing Strategy), and property-based testing does not apply.
- Edit the English page first (tasks 1–4) to lock content, then mirror into French
  (task 5) so technical tokens stay identical.
- Tasks that touch the same file are sequenced, not parallelized, to avoid edit
  conflicts within a single HTML document.
- Ground every command, provider default, and profile field against the real CAO
  project at `~/workspace/forgejo/cli-agent-orchestrator`.
- Each task references specific requirements for traceability; checkpoints ensure
  incremental validation.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["2.1"] },
    { "id": 4, "tasks": ["2.2"] },
    { "id": 5, "tasks": ["2.3"] },
    { "id": 6, "tasks": ["3.1"] },
    { "id": 7, "tasks": ["3.2"] },
    { "id": 8, "tasks": ["3.3"] },
    { "id": 9, "tasks": ["5.1"] },
    { "id": 10, "tasks": ["5.2"] }
  ]
}
```
