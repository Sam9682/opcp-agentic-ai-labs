# Review — SkillHub Lesson Visuals (branch `skillhub-lesson-visuals`)

Verdict: **APPROVED** — no blocking findings.

## Scope reviewed
- Plan: `.agents/tasks/skillhub-lesson-visuals/plan.md`
- Diff: `git diff main...skillhub-lesson-visuals` (commit `a1bfd99`)
- Original task: add one helpful visual per un-illustrated lesson in EN + FR without rewording prose.

## Diff shape
`git diff --stat` shows exactly the 14 lesson files (7 EN + 7 FR), 152 insertions, 0 deletions. No other files are in the commit. The unrelated working-tree modifications shown by `git status` (node_modules/*, labs/modules/adding-applications/setup/*.sh) are not part of this commit and are pre-existing/unrelated noise, out of scope.

## Requirement 1 — Each diagram faithfully represents its lesson
Verified each added flowchart against the surrounding lesson content visible in the diff:

| Lesson | Diagram | Grounded in lesson content |
|---|---|---|
| assistant-vs-agent | 5-level autonomy spectrum L1→L5 | Matches the "Autonomy Spectrum" `<ol>` (Suggest → … → Fully autonomous). No fabricated levels. |
| stopping-criteria | TD decision flow: goal/iterations/timeout/error/human-halt | Mirrors the lesson's own `stop when:` worked-example block (which is preserved, not replaced). |
| human-in-the-loop | Propose → gate → review → approve/reject → act/log | Gate criteria (irreversible, high-impact, low-confidence, sensitive) match the "Which Actions Need a Human?" `<ul>`. |
| threat-modeling-workshop | S1→S4 + coverage loop | Matches the Step 1–Step 4 headings and the five-layer coverage requirement. |
| agent-design-capstone | components + Think→Act→Observe loop + 5 guardrail layers | Consolidates the Design Steps; nodes map to the seven components and five guardrail layers the lesson teaches. |
| making-backups | DB→dump→S3→restore | Uses the lesson's actual commands (pg_dump, aws s3 sync, aws s3 cp, psql) and OVH S3 endpoint. |
| modifying-applications | Identify→Describe(Shai CLI)→Review→Staging→rollback/prod | Matches the "AI-Assisted Workflow" `<ol>`; correctly uses Mermaid (no mismatched screenshot), consistent with plan item 7. |

No fabricated concepts; all node/edge labels trace to real lesson steps/concepts.

## Requirement 2 — EN/FR parity and no-text-change constraints
- **Structural parity:** per-page counts confirmed identical EN vs FR — exactly 1 `<pre><code>flowchart` block each, and matching arrow (`-->`) counts per page (e.g. stopping-criteria 12/12, human-in-the-loop 8/8, capstone 8/8). Same shapes/direction; only human-readable labels localized.
- **Localization:** English labels/captions in `en/`, French in `fr/` (e.g. "Agent proposes an action" vs "L'agent propose une action"). Command literals (pg_dump, aws s3 sync, psql, Shai CLI, opcp-explorer) correctly kept untranslated in both.
- **No prose change:** the diff contains only `+` lines; zero deletion lines in the `skillhub/**` diff. No existing lesson text was reworded, translated, or deleted. The existing `stop when:` / `s'arrêter quand :` block is preserved.
- **Header/chrome untouched:** the only header/footer-area change is the single `diagrams.js` include per page. Locale switcher, progress bar, sidebar, hamburger markup are not in the diff.

## Static per-page checks (all 14 pages)
- First diagram line begins with the literal word `flowchart` on every page (LR/TD as planned).
- `diagrams.js` include present **exactly once** per page; placement matches plan (between `</main>`/`</body>` for 3 pages; after the existing self-assessment `</script>` for threat-modeling + capstone with those scripts unmodified; after the "JavaScript modules will be loaded here" comment for making-backups + modifying-applications, comment retained).
- HTML entity escaping: the capstone block intentionally keeps literal `&` and `<-->` inside the Mermaid `<pre><code>` source. This is the plan-approved, documented behavior and matches the established convention on the reference page `agent-anatomy-7-components.html` (which also ships raw `-->` source). The HTML5 tokenizer treats `<--` as character data (not a tag start), so `textContent` yields the exact Mermaid source diagrams.js expects. Not a defect.
- No `<img>` / `assets/img/` references introduced (item 7 chose Mermaid), so no missing-asset risk.
- No second diagram library, build step, or framework added. `diagrams.js` itself is unchanged (not in diff) and passes `node --check`.

## Verification evidence (read, not re-run)
Commit message records: baseline (main) 11 failed | 7 passed files, 56 tests pass; after edits 11 failed | 7 passed files, 56 passed | 5 skipped — no regression. The 11 failing files are pre-existing missing `skillhub/js/*` modules, unrelated to this change. Evidence is present and consistent with the documented baseline; no suite re-run performed.

## Pre-existing inconsistency (reported, not a blocker)
`making-backups.html` and `modifying-applications.html` (both locales) use a Beginner/Intermediate sidebar differing from the Morning/Afternoon/Sandbox nav on the other lessons. Pre-existing and explicitly out of scope per the plan; correctly left unchanged and noted by the coder.

## Conclusion
All approved requirements met; EN/FR parity and no-text-change constraints hold; verification evidence present with no regression. No blocking findings.
