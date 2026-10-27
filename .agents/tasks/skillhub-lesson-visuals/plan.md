# Implementation Plan — SkillHub Lesson Visuals

Add exactly ONE helpful visual (Mermaid `flowchart` diagram, or an `<img>` figure) to each of the 7 lesson pages that currently has none, in BOTH English (`skillhub/en/`) and French (`skillhub/fr/`). All paths below are relative to the worktree root:
`/home/slepetre/workspace/forgejo/opcp-agentic-ai-labs/.worktrees/skillhub-lesson-visuals/`

## Context the coder must know (verified by reading the repo)

- **Diagram rendering is already wired.** `skillhub/assets/js/diagrams.js` is a defer-loaded ES module that finds every `<pre><code>…</code></pre>` block whose source text begins with the literal word `flowchart`, replaces it with `<div class="diagram-figure"><div class="mermaid">…</div></div>`, and renders it with Mermaid pinned to `cdn.jsdelivr.net/npm/mermaid@11.4.1`. It preserves `<br/>`, `-->`, `<-->`, `-->|label|`, `{…}`, `[…]`. Blocks that do NOT start with `flowchart` are left untouched (e.g. the existing `stop when:` and `s'arrêter quand :` blocks on stopping-criteria stay as-is).
- **Exact diagrams.js script tag** (copy verbatim; path is the same for both locales because both live one directory below `assets/`):
  ```html
  <script type="module" defer src="../assets/js/diagrams.js"></script>
  ```
  Reference page that already has it: `skillhub/en/agent-anatomy-7-components.html` (immediately before `</body>`).
- **Diagram caption pattern** (verified on `agent-anatomy-7-components.html`): the `<pre><code>flowchart …</code></pre>` block is immediately followed by a `<p class="caption">…</p>`. Use this pattern for every Mermaid diagram added below.
- **Image figure pattern** (verified on `adding-applications.html` / `starting-applications.html`):
  ```html
  <figure class="lesson-figure">
      <img src="../assets/img/FILE.png" alt="…" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;">
      <figcaption>…</figcaption>
  </figure>
  ```
- **CSS:** `skillhub/assets/css/style.css` defines `.diagram-figure`, `.diagram-figure .mermaid`, and print rules. It does NOT define `.lesson-figure`, `figcaption`, or `.caption` — these render with default/inline styling and are already used on live pages. **Do NOT add any CSS.** Reuse the classes and the inline `img` style exactly as the existing pages do.
- **EN and FR diagrams must be STRUCTURALLY IDENTICAL** — same nodes, same edges, same shapes, same direction. Only the human-readable labels are localized. Do not retranslate or alter existing lesson prose.
- **Do NOT touch** header, locale-switcher, progress bar, sidebar nav, or hamburger. The only header/footer-area change permitted is adding the diagrams.js script tag before `</body>`.

### diagrams.js include state per page (what the coder must do with the tag)

| Page (both locales) | Current end-of-body | Action for the script tag |
|---|---|---|
| assistant-vs-agent.html | `</main>` then `</body>` (no script, no comment) | Insert the tag on its own line between `</main>` and `</body>`. |
| stopping-criteria.html | `</main>` then `</body>` (no script) | Insert the tag between `</main>` and `</body>`. |
| human-in-the-loop-ovhcloud-policy.html | `</main>` then `</body>` (no script) | Insert the tag between `</main>` and `</body>`. |
| threat-modeling-workshop.html | existing `<script type="module">…self-assessment…</script>` before `</body>` | Insert the diagrams.js tag on a new line AFTER that existing `</script>` and BEFORE `</body>`. Do not modify the existing script. |
| agent-design-capstone.html | existing `<script type="module">…self-assessment…</script>` before `</body>` | Insert the diagrams.js tag on a new line AFTER that existing `</script>` and BEFORE `</body>`. Do not modify the existing script. |
| making-backups.html | `<!-- JavaScript modules will be loaded here in later tasks -->` (EN) / `<!-- Les modules JavaScript seront chargés ici dans les tâches suivantes -->` (FR) before `</body>` | Insert the tag on a new line immediately AFTER that comment (keep the comment). |
| modifying-applications.html | same placeholder comment as making-backups | Insert the tag immediately AFTER that comment (keep the comment). Only if the img option is NOT chosen — see item 7. If the img option is chosen, the script tag is NOT needed; see item 7. |

### Verification (no build step; this is static HTML/CSS/JS)

There is no build or test runner in this repo for the site. Verify each page with these checks after editing:
1. **HTML well-formedness / tag balance** — the diagram/img markup is inserted inside `<div class="lesson-body">` and all tags are closed. Confirm by reading the edited region.
2. **Mermaid source sanity** — every added diagram source starts with the literal word `flowchart` on its first line (so diagrams.js will pick it up), and uses only `-->`, `-->|label|`, `<-->`, `[…]`, `{…}`, `<br/>`.
3. **Script presence** — `grep -n "diagrams.js" <file>` returns the tag on every page that got a Mermaid diagram (all except a modifying-applications.html that uses the img option).
4. **Browser smoke test (if a browser is available):** open the EN and FR page from `file://` and confirm the diagram renders as an SVG (or, if the CDN is blocked, that the readable `flowchart …` source shows — the designed graceful fallback). If no browser/network is available in the environment, state that and rely on checks 1–3.

Run from the worktree:
```
git -C /home/slepetre/workspace/forgejo/opcp-agentic-ai-labs/.worktrees/skillhub-lesson-visuals diff --stat
```
and confirm exactly the 14 lesson files (7 EN + 7 FR) are modified and nothing else.

---

## Per-lesson items

Each item covers BOTH locales for one lesson. Each leaves the site in a working (viewable) state.

---

- [ ] 1. **assistant-vs-agent.html — Mermaid: the 5-level autonomy spectrum.**
      Chosen visual: Mermaid `flowchart` of the autonomy spectrum, because the lesson's central teaching artifact is the ordered 5-level list (Suggest → Confirm each step → Act with checkpoints → Act and report → Fully autonomous); a left-to-right progression diagram mirrors that list exactly and is clearer than an assistant-vs-agent loop comparison (the table already covers that contrast).
      Insertion point: inside `<div class="lesson-body">`, immediately AFTER the closing `</ol>` of the "The Autonomy Spectrum" / "Le spectre d'autonomie" numbered list and BEFORE the `<div class="alert alert-info">` "Rule of thumb" / "Règle empirique" callout.
      diagrams.js include: **needs adding — yes.** Insert the tag between `</main>` and `</body>`.
      Files: `skillhub/en/assistant-vs-agent.html`, `skillhub/fr/assistant-vs-agent.html`

      EN source:
      ```html
      <pre><code>flowchart LR
    L1["1. Suggest<br/>human does every action"] --> L2["2. Confirm each step<br/>approve before each action"]
    L2 --> L3["3. Act with checkpoints<br/>pause at defined points"]
    L3 --> L4["4. Act and report<br/>autonomous, review after"]
    L4 --> L5["5. Fully autonomous<br/>no review within scope"]</code></pre>
      <p class="caption">The autonomy spectrum: each step to the right grants more freedom and removes a point of human control, so each must be justified by lower risk or stronger guardrails.</p>
      ```

      FR source (structurally identical, labels localized):
      ```html
      <pre><code>flowchart LR
    L1["1. Suggérer<br/>l'humain fait chaque action"] --> L2["2. Confirmer chaque étape<br/>approuver avant chaque action"]
    L2 --> L3["3. Agir avec points de contrôle<br/>s'arrêter à des points définis"]
    L3 --> L4["4. Agir et rendre compte<br/>autonome, revue après"]
    L4 --> L5["5. Entièrement autonome<br/>sans revue dans le périmètre"]</code></pre>
      <p class="caption">Le spectre d'autonomie : chaque palier vers la droite accorde plus de liberté et supprime un point de contrôle humain ; chacun doit se justifier par un risque moindre ou des garde-fous plus solides.</p>
      ```

      Verify: checks 1–3 above; `flowchart LR` present; EN/FR have the same 5 nodes L1–L5 and the same 4 edges.

---

- [ ] 2. **stopping-criteria.html — Mermaid: stopping-criteria decision logic.**
      Chosen visual: Mermaid `flowchart TD` of the decision logic from the "Worked Example" `stop when:` block — one check per branch, any true branch stops the loop, otherwise continue. This visualizes the lesson's own worked example (goal / max iterations / timeout / error threshold / human halt).
      Insertion point: inside `<div class="lesson-body">`, immediately AFTER the existing `<pre><code>stop when: …</code></pre>` block (EN) / `<pre><code>s'arrêter quand : …</code></pre>` block (FR) and BEFORE the following `<p>` ("With these in place…" / "Avec ces critères…"). The existing non-flowchart `<pre>` block is left untouched.
      diagrams.js include: **needs adding — yes.** Insert the tag between `</main>` and `</body>`.
      Files: `skillhub/en/stopping-criteria.html`, `skillhub/fr/stopping-criteria.html`

      EN source:
      ```html
      <pre><code>flowchart TD
    Start([Loop turn]) --> Goal{Goal achieved?}
    Goal -->|yes| Stop([Stop and report which criterion fired])
    Goal -->|no| Iter{Max iterations reached?}
    Iter -->|yes| Stop
    Iter -->|no| Time{Timeout exceeded?}
    Time -->|yes| Stop
    Time -->|no| Err{Same error repeated?}
    Err -->|yes| Stop
    Err -->|no| Halt{Human halt?}
    Halt -->|yes| Stop
    Halt -->|no| Continue[Take next action] --> Start</code></pre>
      <p class="caption">Stopping logic: the ideal stop (goal achieved) is paired with hard limits (iterations, timeout), an error threshold, and a human halt, so the loop always terminates and reports which criterion fired.</p>
      ```

      FR source:
      ```html
      <pre><code>flowchart TD
    Start([Tour de boucle]) --> Goal{Objectif atteint ?}
    Goal -->|oui| Stop([S'arrêter et indiquer le critère déclenché])
    Goal -->|non| Iter{Max d'itérations atteint ?}
    Iter -->|oui| Stop
    Iter -->|non| Time{Délai dépassé ?}
    Time -->|oui| Stop
    Time -->|non| Err{Même erreur répétée ?}
    Err -->|oui| Stop
    Err -->|non| Halt{Arrêt humain ?}
    Halt -->|oui| Stop
    Halt -->|non| Continue[Action suivante] --> Start</code></pre>
      <p class="caption">Logique d'arrêt : l'arrêt idéal (objectif atteint) est associé à des limites strictes (itérations, délai), un seuil d'erreurs et un arrêt humain, afin que la boucle se termine toujours et indique le critère déclenché.</p>
      ```

      Verify: checks 1–3; same 6 decision nodes and the Continue→Start back-edge in both locales.

---

- [ ] 3. **human-in-the-loop-ovhcloud-policy.html — Mermaid: HITL approval flow.**
      Chosen visual: Mermaid `flowchart TD` of the human-in-the-loop approval flow (agent proposes → human reviews → approve → act / reject → revise), gated by the lesson's "Which Actions Need a Human?" criteria (irreversible / high-impact / low-confidence / sensitive).
      Insertion point: inside `<div class="lesson-body">`, immediately AFTER the `</ul>` that closes the "Which Actions Need a Human?" / "Quelles actions nécessitent un humain ?" list and BEFORE the `<h2>` "Responsible AI and the OVHcloud AI Policy" / "IA responsable et la politique IA OVHcloud".
      diagrams.js include: **needs adding — yes.** Insert the tag between `</main>` and `</body>`.
      Files: `skillhub/en/human-in-the-loop-ovhcloud-policy.html`, `skillhub/fr/human-in-the-loop-ovhcloud-policy.html`

      EN source:
      ```html
      <pre><code>flowchart TD
    Propose[Agent proposes an action] --> Gate{Irreversible, high-impact,<br/>low-confidence or sensitive?}
    Gate -->|no| Act[Agent executes within scope]
    Gate -->|yes| Review[Human reviews the proposal]
    Review --> Decide{Approve?}
    Decide -->|approve| Act
    Decide -->|reject| Revise[Agent revises or stops]
    Act --> Log[Record action for observability]
    Revise --> Propose</code></pre>
      <p class="caption">Human-in-the-loop: routine actions run within scope, while irreversible, high-impact, low-confidence, or sensitive actions wait for a human yes before they execute.</p>
      ```

      FR source:
      ```html
      <pre><code>flowchart TD
    Propose[L'agent propose une action] --> Gate{Irréversible, à fort impact,<br/>peu sûre ou sensible ?}
    Gate -->|non| Act[L'agent exécute dans le périmètre]
    Gate -->|oui| Review[Un humain examine la proposition]
    Review --> Decide{Approuver ?}
    Decide -->|approuver| Act
    Decide -->|rejeter| Revise[L'agent révise ou s'arrête]
    Act --> Log[Consigner l'action pour l'observabilité]
    Revise --> Propose</code></pre>
      <p class="caption">Human-in-the-loop : les actions courantes s'exécutent dans le périmètre, tandis que les actions irréversibles, à fort impact, peu sûres ou sensibles attendent un « oui » humain avant exécution.</p>
      ```

      Verify: checks 1–3; same nodes (Propose, Gate, Act, Review, Decide, Revise, Log) and same edges including the Revise→Propose loop.

---

- [ ] 4. **threat-modeling-workshop.html — Mermaid: the 4-step threat-modeling process.**
      Chosen visual: Mermaid `flowchart TD` of the workshop's own 4-step process (Describe the system → Find trust boundaries → Enumerate threats → Map mitigations to guardrail layers → confirm five-layer coverage). This mirrors the "Step 1…Step 4" headings exactly.
      Insertion point: inside `<div class="lesson-body">`, immediately AFTER the `<p>` of "Step 4 — Map Mitigations…" / "Étape 4 — Mapper les atténuations…" (the paragraph ending "…confirmez la couverture ci-dessous." / "…confirm coverage below.") and BEFORE the `<div class="deliverable-callout alert alert-info">` Deliverable callout.
      diagrams.js include: **needs adding — yes.** Insert the tag on a new line AFTER the existing self-assessment `</script>` and BEFORE `</body>`. Do not modify the existing script.
      Files: `skillhub/en/threat-modeling-workshop.html`, `skillhub/fr/threat-modeling-workshop.html`

      EN source:
      ```html
      <pre><code>flowchart TD
    S1[Step 1: Describe the system<br/>goal, tools, autonomy, scope] --> S2[Step 2: Find trust boundaries<br/>prompts, tool outputs, repo files, other agents]
    S2 --> S3[Step 3: Enumerate threats<br/>tool misuse, prompt injection, runaway loops]
    S3 --> S4[Step 4: Map each mitigation<br/>to a guardrail layer]
    S4 --> Cover{All five layers covered?}
    Cover -->|no| S3
    Cover -->|yes| Done([Threat-model deliverable complete])</code></pre>
      <p class="caption">The threat-modeling workflow: describe the system, find trust boundaries, enumerate agent-specific threats, then map each mitigation to a guardrail layer until all five layers are covered.</p>
      ```

      FR source:
      ```html
      <pre><code>flowchart TD
    S1[Étape 1 : Décrire le système<br/>objectif, outils, autonomie, périmètre] --> S2[Étape 2 : Trouver les frontières de confiance<br/>invites, sorties d'outils, fichiers de dépôt, autres agents]
    S2 --> S3[Étape 3 : Énumérer les menaces<br/>usage abusif d'outils, injection d'invite, boucles emballées]
    S3 --> S4[Étape 4 : Mapper chaque atténuation<br/>à une couche de garde-fou]
    S4 --> Cover{Les cinq couches couvertes ?}
    Cover -->|non| S3
    Cover -->|oui| Done([Livrable de modélisation des menaces terminé])</code></pre>
      <p class="caption">Le flux de modélisation des menaces : décrire le système, trouver les frontières de confiance, énumérer les menaces propres aux agents, puis mapper chaque atténuation à une couche de garde-fou jusqu'à couvrir les cinq couches.</p>
      ```

      Verify: checks 1–3; same S1–S4 + Cover + Done nodes and the Cover→S3 revise edge in both locales.

---

- [ ] 5. **agent-design-capstone.html — Mermaid: end-to-end agent design (components, loop, guardrails).**
      Chosen visual: Mermaid `flowchart` summarizing the end-to-end agent the capstone asks the learner to design — goal/autonomy feeding the seven components, the Think→Act→Observe loop with stopping criteria, and the five guardrail layers bounding tools and the loop. This consolidates the "Design Steps" list into one picture.
      Insertion point: inside `<div class="lesson-body">`, immediately AFTER the `</ol>` that closes the "Design Steps" / "Étapes de conception" list and BEFORE the `<h2>` "Rubric" / "Grille d'évaluation".
      diagrams.js include: **needs adding — yes.** Insert the tag on a new line AFTER the existing self-assessment `</script>` and BEFORE `</body>`. Do not modify the existing script.
      Files: `skillhub/en/agent-design-capstone.html`, `skillhub/fr/agent-design-capstone.html`

      EN source:
      ```html
      <pre><code>flowchart TD
    Goal[Goal & autonomy level] --> Brain[Brain / LLM + planner]
    Mem[Short-term & long-term memory] <--> Brain
    Brain --> Loop{Think -> Act -> Observe}
    Loop -->|act| Tools[opcp-explorer tools: deploy, start, stop, logs]
    Tools -->|observe| Loop
    Loop --> Stop{Stopping criteria met?}
    Stop -->|no| Loop
    Stop -->|yes| Report([Report outcome])
    Guard[Five guardrail layers: permissions, limits,<br/>human approval, observability, kill switch] -. bound .-> Tools
    Guard -. bound .-> Loop</code></pre>
      <p class="caption">The end-to-end capstone design: goal and autonomy drive the seven components, the Think→Act→Observe loop acts through opcp-explorer tools until a stopping criterion fires, and the five guardrail layers bound the tools and the loop.</p>
      ```

      FR source:
      ```html
      <pre><code>flowchart TD
    Goal[Objectif & niveau d'autonomie] --> Brain[Cerveau / LLM + planificateur]
    Mem[Mémoire court terme & long terme] <--> Brain
    Brain --> Loop{Penser -> Agir -> Observer}
    Loop -->|agir| Tools[Outils opcp-explorer : déployer, démarrer, arrêter, logs]
    Tools -->|observer| Loop
    Loop --> Stop{Critères d'arrêt atteints ?}
    Stop -->|non| Loop
    Stop -->|oui| Report([Rendre compte du résultat])
    Guard[Cinq couches de garde-fous : permissions, limites,<br/>approbation humaine, observabilité, kill switch] -. bound .-> Tools
    Guard -. bound .-> Loop</code></pre>
      <p class="caption">La conception de bout en bout du projet final : l'objectif et l'autonomie pilotent les sept composants, la boucle Penser→Agir→Observer agit via les outils opcp-explorer jusqu'au déclenchement d'un critère d'arrêt, et les cinq couches de garde-fous bornent les outils et la boucle.</p>
      ```

      Note: labels contain `&` (e.g. "Goal & autonomy"). This is inside a Mermaid node label and renders fine; keep it as a literal `&` (do NOT write `&amp;` inside the flowchart source — diagrams.js unescapes entities, but a literal `&` in the node text is what Mermaid expects here).
      Verify: checks 1–3; same nodes (Goal, Brain, Mem, Loop, Tools, Stop, Report, Guard) and same edges incl. the two dotted `-. bound .->` guardrail edges and the `<-->` memory edge in both locales.

---

- [ ] 6. **making-backups.html — Mermaid: backup → upload → restore flow.**
      Chosen visual: Mermaid `flowchart LR` of the exact command flow the lesson teaches: `pg_dump` the DB → `aws s3 sync` to OVH S3 → `aws s3 cp` download → `psql` restore.
      Insertion point: inside `<div class="lesson-body">`, immediately AFTER the `<p>` introducing the lesson ("Learn how to back up…" / "Apprenez à sauvegarder…") and BEFORE the `<h2>` "Prerequisites" / "Prérequis". (Placing it up top gives the reader the whole flow before the individual command sections.)
      diagrams.js include: **needs adding — yes.** Insert the tag on a new line immediately AFTER the `<!-- JavaScript modules will be loaded here in later tasks -->` (EN) / `<!-- Les modules JavaScript seront chargés ici dans les tâches suivantes -->` (FR) comment, keeping the comment, before `</body>`.
      Files: `skillhub/en/making-backups.html`, `skillhub/fr/making-backups.html`

      EN source:
      ```html
      <pre><code>flowchart LR
    DB[(PostgreSQL in container)] -->|pg_dump| Dump[backup_YYYYMMDD.sql]
    Dump -->|aws s3 sync| S3[(OVH S3 bucket<br/>s3.gra.io.cloud.ovh.net)]
    S3 -->|aws s3 cp| Local[restore.sql]
    Local -->|psql| DB2[(PostgreSQL in container)]</code></pre>
      <p class="caption">The backup lifecycle: dump the database, sync the dump to OVH S3 object storage, download it when needed, and restore it into the database container.</p>
      ```

      FR source:
      ```html
      <pre><code>flowchart LR
    DB[(PostgreSQL dans le conteneur)] -->|pg_dump| Dump[sauvegarde_AAAAMMJJ.sql]
    Dump -->|aws s3 sync| S3[(Bucket OVH S3<br/>s3.gra.io.cloud.ovh.net)]
    S3 -->|aws s3 cp| Local[restauration.sql]
    Local -->|psql| DB2[(PostgreSQL dans le conteneur)]</code></pre>
      <p class="caption">Le cycle de sauvegarde : dumper la base, synchroniser le dump vers le stockage objet OVH S3, le télécharger au besoin, puis le restaurer dans le conteneur de la base.</p>
      ```

      Verify: checks 1–3; same 4 edges with labels pg_dump / aws s3 sync / aws s3 cp / psql in both locales.

---

- [ ] 7. **modifying-applications.html — Mermaid: AI-assisted modify-and-redeploy flow.**
      Chosen visual: **Mermaid `flowchart TD`, NOT an `<img>`.** Rationale for rejecting the screenshot option: the only screenshots that exist in `assets/img/` are OPCP platform panels (OPCP-core, Screen_InstallPltf1, Screen_Apps1, Screen_AppStart1, Screen_AppStop1, Screen_Dashboard1) and the currently-unused Screen_Serverless1, Screen_Users1, Screen_Billing1, Screen_Deployments1, Screen_Servers1. None of these depicts an AI-assisted code-modification / staging / rollback / redeploy workflow, which is what this lesson teaches (Shai CLI modifications, test in staging, roll back, deploy to production). Using any of them would be a mismatched illustration. A flowchart of the lesson's own 5-step "AI-Assisted Workflow" is faithful and clearer.
      Insertion point: inside `<div class="lesson-body">`, immediately AFTER the `</ol>` that closes the "AI-Assisted Workflow" / "Workflow assisté par IA" numbered list and BEFORE the following `<div class="alert alert-info">` "Lab Available" / "Labo disponible" callout.
      diagrams.js include: **needs adding — yes.** Insert the tag on a new line immediately AFTER the `<!-- JavaScript modules will be loaded here in later tasks -->` (EN) / `<!-- Les modules JavaScript seront chargés ici dans les tâches suivantes -->` (FR) comment, keeping the comment, before `</body>`.
      Files: `skillhub/en/modifying-applications.html`, `skillhub/fr/modifying-applications.html`

      EN source:
      ```html
      <pre><code>flowchart TD
    Identify[Identify the app and the change needed] --> Describe[Describe the change to Shai CLI]
    Describe --> Review[Review the generated code changes]
    Review --> Staging[Apply and test in a staging environment]
    Staging --> OK{Tests pass?}
    OK -->|no| Rollback[Roll back the change] --> Describe
    OK -->|yes| Prod[Deploy to production]</code></pre>
      <p class="caption">The AI-assisted modification workflow: describe the change to the Shai CLI, review the generated code, validate it in staging, roll back on failure, and deploy to production once it passes.</p>
      ```

      FR source:
      ```html
      <pre><code>flowchart TD
    Identify[Identifier l'app et la modification requise] --> Describe[Décrire la modification au Shai CLI]
    Describe --> Review[Examiner les changements de code générés]
    Review --> Staging[Appliquer et tester en préproduction]
    Staging --> OK{Les tests passent ?}
    OK -->|non| Rollback[Revenir en arrière] --> Describe
    OK -->|oui| Prod[Déployer en production]</code></pre>
      <p class="caption">Le workflow de modification assistée par IA : décrire la modification au Shai CLI, examiner le code généré, le valider en préproduction, revenir en arrière en cas d'échec, puis déployer en production une fois validé.</p>
      ```

      Verify: checks 1–3; same nodes (Identify, Describe, Review, Staging, OK, Rollback, Prod) and the Rollback→Describe loop in both locales.

---

## Pre-existing inconsistency to REPORT (do NOT fix)

`making-backups.html` and `modifying-applications.html` (both EN and FR) use a different sidebar than the other lesson pages: a two-section **Beginner / Intermediate** nav with 6 links, whereas the Morning/Afternoon track pages use a three-section **Morning / Afternoon / Sandbox** nav. This is a pre-existing structural inconsistency in the course. It is out of scope for this visual-enrichment task — note it in the final report, do not change any sidebar.

## Out of scope / constraints reaffirmed

- Do not reword, translate, or delete any existing lesson text. You are only ADDING one visual + its caption per locale, plus the diagrams.js script tag.
- Exactly ONE new visual per lesson per locale (14 visuals total).
- No new CSS, no second diagram library, no build step, no framework. Static HTML/CSS/vanilla JS only.
- Only reference image files that exist in `assets/img/`. (Item 7 chose Mermaid, so no image is referenced.)
- Final `git diff --stat` must show exactly the 14 lesson files changed.
