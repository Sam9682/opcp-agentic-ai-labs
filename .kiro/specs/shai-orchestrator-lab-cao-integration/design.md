# Design Document

## Overview

This feature reworks the two static Sandbox lab pages
`skillhub/en/shai-orchestrator-lab.html` and
`skillhub/fr/shai-orchestrator-lab.html` so they teach and drive the **real CLI
Agent Orchestrator (CAO)** instead of the fictional "shai" orchestrator. The
work is pure HTML content editing: no JavaScript, CSS, build tooling, data
models, or APIs change. Each page keeps its filename, its lesson identity, its
shared chrome, and its Mermaid rendering pattern; only the lesson body content
and the user-facing title/nav labels change, plus diagram labels.

The lab is narrowed to the **core supervisor loop** against a generic project
path (`/path/to/your/project`): install CAO, start `cao-server`, launch a
supervisor, delegate a small task, observe via the attached terminal and the
Web UI at `http://localhost:9889`, and shut down. Flows, workflows, skills, and
memory are out of scope and must not appear in the hands-on steps.

All CAO commands, provider defaults, agent-profile fields, and governance
framing in this design are grounded in the real CAO project at
`~/workspace/forgejo/cli-agent-orchestrator` — specifically its `README.md`,
`docs/agent-profile.md`, `docs/tool-restrictions.md`, and the built-in profiles
in `src/cli_agent_orchestrator/agent_store/` (`code_supervisor.md`,
`developer.md`, `reviewer.md`).

### Goals

- Replace all fictional "shai" product naming in user-facing content with CAO.
- Turn the read-only reference into a runnable hands-on lab.
- Replace the fictional `orchestrator.config.json` with real CAO Markdown agent
  profiles (YAML frontmatter + Markdown body).
- Keep page chrome, lesson identity, and Mermaid rendering intact.
- Keep EN and FR pages structurally identical with identical technical tokens.

### Non-Goals

- No changes to `../js/app.js`, `../assets/js/diagrams.js`, CSS, or any shared
  script.
- No flows, workflows, skills, or memory content.
- No renaming of the files or the `data-lesson-id`.
- No new pages, routes, or navigation entries.

## Architecture

The "architecture" here is the document structure of a single lab page and the
mapping from the old fictional sections to the new CAO sections. Both language
files share the identical section order; only prose language and localized
labels differ.

### Target Section Structure

Each reworked Lab_Page presents these sections in this exact order:

1. **Intro** — One paragraph introducing CAO as the real orchestration tool the
   learner will install and run. No read-only framing.
2. **Prerequisites & Setup** — Python 3.11+, tmux 3.3+, uv, and at least one
   authenticated provider CLI (default Kiro CLI).
3. **CAO Architecture** — Local `cao-server` starts provider CLIs in isolated
   tmux terminal sessions; a supervisor delegates to specialist workers in
   parallel or sequence; agents stay full CLI processes with native auth.
   Includes the relabeled flowchart Mermaid diagram.
4. **Agent Roles** — supervisor, worker (developer), reviewer, with
   responsibilities and tool scope.
5. **Delegation Model** — How a task flows from supervisor to worker and back;
   includes the relabeled sequenceDiagram Mermaid diagram.
6. **Step-by-Step: Core Supervisor Loop** — Runnable CAO commands: install,
   verify, install supervisor, start `cao-server`, launch, delegate, observe,
   shut down.
7. **Example CAO Agent Profiles** — One Supervisor_Profile and one
   Worker_Profile (developer or reviewer) as Markdown with YAML frontmatter,
   each frontmatter field explained as a governance decision.
8. **Governance Mapping** — Least privilege (`allowedTools`/`delegateTools`),
   review gate (reviewer-role agent), kill switch (shutdown commands),
   operational limits (supervisor-loop controls).
9. **Key Takeaways** — Bulleted recap in CAO terms.
10. **Next link** — Link to `running-applications-lab.html`.

### Old → New Section Mapping

| Current (fictional "shai") section | Reworked (real CAO) section | Change |
|---|---|---|
| Intro paragraph with "illustrative text only" framing | **Intro** | Rewrite as runnable-lab intro; drop the read-only sentence. |
| Info alert "Read-only lab: ... Nothing here executes." | *(removed)* | Delete the read-only info alert entirely (Req 2.3). |
| *(none)* | **Prerequisites & Setup** | New section (Req 2.4). |
| Learning Objectives | **Intro** (merged) or kept as a short objectives list in CAO terms | Objectives restated for CAO; "orchestrator" → "supervisor". |
| Orchestrator Architecture + flowchart | **CAO Architecture** + relabeled flowchart | Describe `cao-server`, tmux sessions, native auth; relabel diagram. |
| Agent Roles table (Orchestrator/Worker/Reviewer) | **Agent Roles** (supervisor/worker/reviewer) | Rename "Orchestrator" → "supervisor"; tie scope to CAO roles. |
| The Delegation Model + sequenceDiagram | **Delegation Model** + relabeled sequenceDiagram | Relabel diagram to supervisor/worker/reviewer. |
| Step-by-Step: Driving shai from the CLI (illustrative `shai ...` commands) | **Step-by-Step: Core Supervisor Loop** | Replace all `shai ...` commands with real `cao`/`cao-server` commands. |
| Example Orchestrator Configuration (`orchestrator.config.json`) | **Example CAO Agent Profiles** | Replace JSON with two Markdown profiles + per-field governance notes. |
| Key Takeaways | **Key Takeaways** | Restate in CAO terms. |
| Next: Running Applications link | **Next link** | Unchanged target `running-applications-lab.html`. |

Governance notes currently delivered via `alert alert-info` blocks are retained
as a presentation device but re-pointed at CAO mechanisms, and the
**Governance Mapping** section consolidates the four governance concepts (Req
5).

## Preserved Page Chrome (verbatim)

The following elements and attributes MUST be preserved exactly (Req 1.4, 1.5,
6). They are chrome, not content; edits to them are limited to the user-facing
text noted in the "User-facing text that changes" column.

| Element | What to preserve verbatim | User-facing text that changes |
|---|---|---|
| Filename | `shai-orchestrator-lab.html` (both locales) | none |
| `<html>` lang | `lang="en"` (EN), `lang="fr"` (FR) | none |
| `site-header` | `header.site-header`, logo, `progress-bar-container` markup | none |
| Locale switcher | `.locale-switcher` with `data-locale="en"`/`data-locale="fr"` buttons; `active` on the current locale (EN active on EN page, FR active on FR page) | none |
| Hamburger | `.hamburger-btn` markup | none |
| Sidebar | `.sidebar-section` with `data-section="section-3"`; `ul.sidebar-nav#nav-sandbox`; the `active` link to `shai-orchestrator-lab.html`; the link to `running-applications-lab.html` | the lab's nav link **label** (title text) is updated to CAO wording |
| Lesson header | `.lesson-header`, `.lesson-meta`, `.difficulty-badge difficulty-badge--beginner`, `.duration` | `<h1>` title and badge/duration text (localized), retitled to CAO |
| Lesson body | `.lesson-body` wrapper | inner content rewritten |
| Mark-as-Complete | `button.btn.btn-success.btn-mark-complete` with `data-lesson-id="shai-orchestrator-lab"` | button **label** localized: "Mark as Complete" (EN) / "Marquer comme terminé" (FR) |
| Script includes | `<script type="module" src="../js/app.js">` and `<script type="module" defer src="../assets/js/diagrams.js">` | none |

The `data-lesson-id` value stays `shai-orchestrator-lab` and the filename stays
`shai-orchestrator-lab.html` even though the subject is now CAO, because
progress tracking and sidebar navigation key off those identifiers (Req 1.4,
1.5, 6.3, 6.5).

## Components and Interfaces

Because this is static content, the "components" are the content blocks and the
one external contract they depend on: the Mermaid rendering convention.

### Mermaid Diagram Convention

`../assets/js/diagrams.js` renders any `<pre><code>…</code></pre>` whose text
begins with a Mermaid graph keyword (`flowchart`, `sequenceDiagram`). The
rework keeps this exact pattern and only changes node/participant labels to the
CAO terms **supervisor**, **worker**, **reviewer** (Req 7).

**Architecture flowchart (relabeled):**

```html
<pre><code>flowchart TD
    U[Operator / CLI] --> S[CAO supervisor]
    S --> W1[Worker agent: developer]
    S --> W2[Worker agent: developer]
    S --> R[Reviewer agent]
    W1 --> S
    W2 --> S
    R --> S
    S --> U</code></pre>
```

**Delegation sequenceDiagram (relabeled):**

```html
<pre><code>sequenceDiagram
    Operator->>Supervisor: goal
    Supervisor->>Worker: delegate(sub-task, scoped tools)
    Worker->>Worker: run sub-task
    Worker-->>Supervisor: structured result
    Supervisor->>Reviewer: review(result) if mutating
    Reviewer-->>Supervisor: approve / reject
    Supervisor-->>Operator: aggregated outcome</code></pre>
```

The `<pre><code>` wrapper, placement, and the following `<p class="caption">`
pattern are unchanged; only labels change.

### Runnable CAO Commands (Step-by-Step content)

These are the real commands embedded in the Step-by-Step section, grounded in
the CAO README. They are presented as executable against the learner's own CAO
install (Req 2.1, 2.2, 3). Technical tokens here are identical across EN and FR
(Req 8.3).

- **Install + verify:**
  ```bash
  uv tool install git+https://github.com/awslabs/cli-agent-orchestrator.git@main --upgrade
  cao --help
  ```
- **Install the supervisor profile:**
  ```bash
  cao install code_supervisor
  ```
- **Terminal A — start the long-running server:**
  ```bash
  cao-server
  ```
- **Terminal B — launch the supervisor from the project directory:**
  ```bash
  cd /path/to/your/project
  cao launch --agents code_supervisor
  ```
- **Delegate a small task:** prose instruction to type a short goal into the
  attached supervisor session (e.g. ask the supervisor to make one small,
  reviewed change), with the supervisor delegating to a worker.
- **Observe:** attached launch terminal and the Web UI at
  `http://localhost:9889`.
- **Shut down:**
  ```bash
  cao shutdown --session {session-name}
  cao shutdown --all
  ```

The section explicitly stays within the supervisor loop and omits flows,
workflows, skills, and memory (Req 3.9).

### Example CAO Agent Profiles (Section content)

Replaces `orchestrator.config.json` (Req 4.2). Two profiles are shown as
Markdown with YAML frontmatter and a Markdown system-prompt body (Req 4.1),
derived from the real built-in profiles.

**Supervisor_Profile** (from `code_supervisor.md`):

```markdown
---
name: code_supervisor
description: Coding Supervisor Agent in a multi-agent system
role: supervisor
provider: kiro_cli
delegateTools: ["*"]
---

You are the Coding Supervisor. You never write code yourself. You break a
goal into sub-tasks, delegate each to a worker agent, route mutating work
through the reviewer, and decide when the job is done.
```

**Worker_Profile** (from `developer.md`):

```markdown
---
name: developer
description: Developer Agent in a multi-agent system
role: developer
provider: kiro_cli
allowedTools: ["fs_read", "fs_write", "execute_bash", "@cao-mcp-server"]
---

You are a Developer agent. Implement the single scoped sub-task delegated to
you and return a structured result.
```

A reviewer profile may also be referenced in prose (from `reviewer.md`,
`role: reviewer`, read-only `allowedTools`) to anchor the review-gate
explanation; showing the supervisor + developer pair satisfies the "one
supervisor and one worker" requirement (Req 4.3).

Each frontmatter field is explained as a governance decision (Req 4.4–4.9):

- **`name`** — stable identifier for the profile in logs/audit and for
  `cao install`/`cao launch --agents`.
- **`role`** — named permission preset; allowed values framed as `supervisor`,
  `developer`, `reviewer` (Req 4.5). The role maps to a default `allowedTools`
  bundle.
- **`provider`** — which authenticated provider CLI backs the agent (default
  Kiro CLI).
- **`allowedTools`** — explicit tool allowlist; overrides role defaults; the
  concrete expression of least privilege.
- **`delegateTools`** — the **delegation ceiling**: the most this agent may
  grant to workers it creates; defaults to `["*"]` for `role: supervisor` and
  to the agent's own `allowedTools` otherwise (Req 4.8).

### Governance Mapping (Section content)

Maps the course's governance vocabulary onto real CAO mechanisms (Req 5):

- **Least privilege** → `allowedTools` sizes each agent's own tools;
  `delegateTools` caps what a supervisor can hand down (Req 5.1).
- **Review gate** → a CAO `role: reviewer` agent inspects mutating work before
  it is accepted; the supervisor routes changes through it (Req 5.2).
- **Kill switch** → `cao shutdown --session {session-name}` for one session and
  `cao shutdown --all` for every session (Req 5.3).
- **Operational limits** → real supervisor-loop controls: the supervisor is the
  single coordinator that sequences sub-tasks, retries failed delegations, and
  decides when to stop; tool restrictions bound each worker's blast radius (Req
  5.4).

## Data Models

Not applicable. This feature introduces no databases, schemas, or runtime data
structures. The only structured artifacts are the two example agent profiles,
which are illustrative document content embedded in the page, not data the page
processes.

## Error Handling

Not applicable at runtime (static content). The relevant failure modes are
authoring/correctness risks, handled by the verification approach below:

- **Residual "shai" naming** in user-facing content → caught by a
  case-insensitive content scan that excludes the preserved identity tokens
  (`shai-orchestrator-lab.html`, `data-lesson-id="shai-orchestrator-lab"`).
- **EN/FR token drift** (a command, path, URL, or field name differing between
  locales) → caught by extracting and diffing technical tokens across the two
  files.
- **Broken Mermaid rendering** (diagram no longer starts with a graph keyword
  inside `<pre><code>`) → caught by confirming each diagram block still matches
  the `<pre><code>flowchart|sequenceDiagram …</code></pre>` pattern.
- **Chrome regression** (a preserved attribute removed) → caught by checking the
  preserved-chrome checklist against both files.

## Testing Strategy

Note: this is static HTML content editing, so property-based testing does not
apply — there is no pure function with varying inputs to quantify over. The
content either matches the requirements or it does not. Verification is a set of
targeted content checks over the two files.

### Verification checks

1. **Chrome preserved (both files).** Confirm, per the Preserved Page Chrome
   table: filename unchanged; `html` lang correct per locale; `site-header`,
   locale switcher with correct `active`, hamburger present; sidebar
   `data-section="section-3"`, `nav-sandbox`, active link to
   `shai-orchestrator-lab.html`, link to `running-applications-lab.html`;
   lesson-header/meta/difficulty-badge/duration present; Mark-as-Complete button
   with `data-lesson-id="shai-orchestrator-lab"` and the correct localized
   label; both script includes present (`../js/app.js`,
   `../assets/js/diagrams.js`). (Req 1.4, 1.5, 6)
2. **No fictional product naming.** A case-insensitive search for `shai` in
   user-facing content returns only the two preserved identity tokens
   (filename and `data-lesson-id`), nowhere in visible prose, headings,
   titles, commands, or profiles. (Req 1.2, 2.2, 2.3)
3. **Runnable framing.** The pages present commands as executable against the
   learner's own CAO install and contain no "illustrative only" / "nothing
   executes" / "read-only lab" framing. (Req 2.1, 2.2, 2.3)
4. **Real CAO commands present.** All Step-by-Step commands match the grounded
   command set (install + `cao --help`, `cao install code_supervisor`,
   `cao-server`, `cd /path/to/your/project && cao launch --agents
   code_supervisor`, delegate, observe at `http://localhost:9889`, `cao
   shutdown --session {session-name}`, `cao shutdown --all`); no flows,
   workflows, skills, or memory steps. (Req 3)
5. **Agent profiles, not JSON.** The page shows one supervisor and one worker
   profile as Markdown with YAML frontmatter and a Markdown body; no
   `orchestrator.config.json`; each of `name`, `role` (with
   supervisor/developer/reviewer values), `provider`, `allowedTools`,
   `delegateTools` (ceiling, `["*"]` default for supervisor) is explained as a
   governance decision. (Req 4)
6. **Governance mapping accurate.** Least privilege ties to
   `allowedTools`/`delegateTools`; review gate to a reviewer-role agent; kill
   switch to the shutdown commands; operational limits to supervisor-loop
   controls. (Req 5)
7. **Diagrams render.** Both diagrams keep the `<pre><code>flowchart…` and
   `<pre><code>sequenceDiagram…` pattern and use the labels supervisor, worker,
   reviewer, so `../assets/js/diagrams.js` still renders them. (Req 7)
8. **EN/FR sync.** Both files contain the same sections in the same order;
   prose is translated to the respective language; and every technical token
   (commands, path placeholder `/path/to/your/project`, URL
   `http://localhost:9889`, profile field names, profile `name`/`role` values)
   is identical across the two files. FR page uses `lang="fr"` and the FR
   Mark-as-Complete label "Marquer comme terminé". (Req 8, 6.1, 6.5)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all
valid executions of a system — essentially, a formal statement about what the
system should do. Properties serve as the bridge between human-readable
specifications and machine-verifiable correctness guarantees.*

This feature is static content editing, not executable logic, so the acceptance
criteria resolve to document-level invariants and specific-example checks rather
than input-varying properties. The prework below records that analysis; the few
items expressible as universal statements over "both Lab_Pages" are listed as
properties, and the rest are verified as the targeted checks in the Testing
Strategy.

### Property 1: No fictional product naming in user-facing content

For any of the two Lab_Pages, a case-insensitive scan of its user-facing
content (visible prose, headings, titles, nav labels, command text, and profile
text) contains no occurrence of the fictional product name "shai", with the
only permitted occurrences being the preserved identity tokens — the filename
`shai-orchestrator-lab.html` and the attribute value
`data-lesson-id="shai-orchestrator-lab"`.

**Validates: Requirements 1.2, 2.2**

### Property 2: Preserved chrome and lesson identity

For any of the two Lab_Pages, every preserved chrome element and lesson-identity
token holds: the filename is `shai-orchestrator-lab.html`; the Mark-as-Complete
button carries `data-lesson-id="shai-orchestrator-lab"`; the site-header
(progress bar, locale switcher with the correct active locale, hamburger),
sidebar (`data-section="section-3"`, `nav-sandbox`, active link to this lab,
link to `running-applications-lab.html`), lesson-header/meta/difficulty/duration
structure, and both script includes (`../js/app.js`, `../assets/js/diagrams.js`)
are present.

**Validates: Requirements 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

### Property 3: Mermaid diagrams preserved and relabeled

For any diagram on either Lab_Page, it is expressed as
`<pre><code>flowchart…</code></pre>` or
`<pre><code>sequenceDiagram…</code></pre>` (so `../assets/js/diagrams.js`
renders it), and its labels are drawn from the CAO terms supervisor, worker, and
reviewer.

**Validates: Requirements 7.1, 7.2**

### Property 4: Identical technical tokens across locales

For any technical token that appears in the lab — a CAO command, the path
placeholder `/path/to/your/project`, the URL `http://localhost:9889`, an agent
profile field name, or a profile `name`/`role` value — the English Lab_Page and
the French Lab_Page present that token identically.

**Validates: Requirements 8.1, 8.2, 8.3**
