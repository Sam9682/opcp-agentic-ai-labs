# SkillHub Encoding Character Fix Bugfix Design

## Overview

Several SkillHub lesson pages under `skillhub/fr/` and `skillhub/en/` contain the Unicode replacement character "�" (U+FFFD) baked directly into the saved file bytes, where accented French letters and typographic punctuation should be. Because `<meta charset="UTF-8">` is already declared correctly, this is **byte-level data corruption**, not a display-time decoding mismatch: the original source bytes were destroyed during an earlier save/encoding step and replaced with U+FFFD.

U+FFFD is lossy and **non-recoverable by any automatic byte transformation** — once distinct source bytes (é, è, —, ', etc.) collapse into the single replacement codepoint, the original value cannot be derived from the file alone. The fix therefore re-derives the intended character for each occurrence from **language context** (the surrounding French/English words) and from **parallel clean content** that already exists in the repository, then rewrites the affected files as valid UTF-8.

Investigation scope (measured, not assumed): of the 36 lesson HTML files (18 per locale), **8 files are affected** — `agent-anatomy-7-components.html`, `assistant-vs-agent.html`, `install-bare-metal.html`, and `guardrails-5-layers.html` in both `fr/` and `en/`. The remaining 28 files, including `fr/index.html` and `en/index.html`, are already clean and serve as authoritative cross-reference sources. The French pages carry the bulk of the damage (≈112–146 occurrences each: accents, em-dashes, apostrophes); the English pages carry fewer (≈3–16 each: mostly em-dashes, curly apostrophes, and the French `aria-label="Français"` in the locale switcher).

The strategy is a **per-occurrence, context-driven, reviewable repair**: reconstruct the intended text for each U+FFFD, apply edits file by file, and verify that zero U+FFFD remain while all already-correct content, markup, and interactive behavior are preserved byte-for-byte except at the repaired positions.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — a SkillHub page whose source bytes contain at least one U+FFFD ("�") replacement character standing in for an intended non-ASCII character.
- **Property (P)**: The desired behavior after repair — every former "�" is replaced by the correct intended character, and no U+FFFD remains anywhere in the file.
- **Preservation**: Already-correct content (ASCII and already-correct non-ASCII), HTML structure, markup, links, scripts, the `<meta charset="UTF-8">` declaration, and all interactive behavior that must remain unchanged by the fix.
- **U+FFFD (replacement character)**: The Unicode codepoint "�" inserted by a decoder when it encounters bytes it cannot interpret. Its presence in saved bytes means the original character was already lost.
- **Intended character**: The accented letter (é, è, à, ç, ê, î, ô, û, ë), typographic punctuation (curly apostrophe ', curly quotes " ", em-dash —), or other non-ASCII glyph that belongs at a given "�" position, re-derived from context.
- **Parallel clean content**: Text identical in meaning that already exists correctly elsewhere in the repository — the clean locale index pages (`fr/index.html`, `en/index.html`) and the clean opposite-locale page — used to confirm the intended characters for shared strings (nav labels, section titles, lesson descriptions).
- **Affected files**: The eight pages measured to contain U+FFFD — `agent-anatomy-7-components.html`, `assistant-vs-agent.html`, `install-bare-metal.html`, `guardrails-5-layers.html`, each under both `skillhub/fr/` and `skillhub/en/`.
- **renderPage / renderPage'**: The page content before (`F`) and after (`F'`) repairing the corrupted bytes to their intended UTF-8 characters.

## Bug Details

### Bug Condition

The bug manifests when a SkillHub page's saved bytes contain a U+FFFD replacement character in place of an intended non-ASCII character. The earlier save/encoding step either decoded the original bytes with the wrong codec and re-encoded the failures as U+FFFD, or passed the content through a tool that substituted undecodable bytes with the replacement character — destroying the original accented letters and typographic punctuation at the byte level.

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X of type PageText    // the source bytes / rendered text of a SkillHub page
  OUTPUT: boolean

  // Returns true when the text contains at least one U+FFFD replacement character
  RETURN containsCodepoint(X, U+FFFD)
END FUNCTION
```

### Examples

- `<title>De l'assistant � l'agent ...` — expected em-dash context resolves to the accented preposition "à": "De l'assistant à l'agent" (`fr/assistant-vs-agent.html`, line 6). Expected vs actual: `à` rendered as `�`.
- `aria-label="S�lecteur de langue"` → "Sélecteur de langue" — accented `é` rendered as `�` (`fr/assistant-vs-agent.html`, line 24).
- `aria-label="Fran�ais"` → "Français" — cedilla `ç` rendered as `�`, present in **both** locales' locale switcher (`fr/` and `en/` alike).
- `Crit�res d'arr�t` → "Critères d'arrêt" — two accents (`è`, `ê`) rendered as `�` (`fr/assistant-vs-agent.html`, line 44); confirmed against clean `fr/index.html` line 44.
- `Matin � Introduction et fondamentaux` → "Matin — Introduction et fondamentaux" — em-dash `—` rendered as `�` (section title; confirmed against clean `fr/index.html` line 39).
- English em-dash case: `the system proposes; a human performs every action.` preceded by `<strong>Suggest</strong> � ` → `<strong>Suggest</strong> — ` — em-dash rendered as `�` (`en/assistant-vs-agent.html`, line 116).
- Edge case — already-correct text: `fr/index.html` contains "leçons", "Critères d'arrêt", "Matin —" with zero U+FFFD and must remain untouched (`isBugCondition` is false for it).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Already-correct text — ASCII and already-correct non-ASCII (e.g., clean pages like `fr/index.html`, and any clean substring within an affected page) — must render identically after the fix.
- HTML structure, tags, attributes, element nesting, `id`/`class` values, `href` links, and `<script>`/`<style>` content that does not contain a U+FFFD must be byte-for-byte unchanged.
- The existing `<meta charset="UTF-8">` declaration must remain exactly as-is; the fix must not change the declared charset.
- Locale switching, sidebar navigation, progress bar, self-assessment, and all other interactive behaviors must function exactly as before.

**Scope:**
All content that does NOT contain a U+FFFD replacement character should be completely unaffected by this fix. This includes:
- The 28 already-clean HTML files (which must not be modified at all).
- Every ASCII byte and every already-correct non-ASCII byte within the 8 affected files.
- All markup, scripting, styling, and link targets not coincident with a corrupted character.

## Hypothesized Root Cause

Based on the bug description and measured evidence, the most likely issues are:

1. **Wrong-codec decode/re-encode during an earlier edit**: A tool or editor opened the original UTF-8 files assuming a different encoding (or an ambiguous one), failed to decode the multi-byte accented/punctuation sequences, substituted U+FFFD for each failure, and saved the result back as UTF-8. This permanently baked the replacement character into the bytes.
   - Consistent with U+FFFD appearing exactly where multi-byte UTF-8 sequences (é, è, —, ', ") would have been.
   - Consistent with ASCII content being untouched (single-byte, always decodable).

2. **Lossy copy/transform step**: Content was piped through a process (clipboard, template generator, or a script using a non-UTF-8 default stream encoding) that normalized undecodable bytes to U+FFFD before writing the file.

3. **Partial regeneration of a subset of pages**: Only 8 of 36 files are affected, suggesting these specific pages were regenerated or re-saved through the faulty path while the other 28 (including the index pages) were produced correctly — which is why clean parallels exist to cross-reference against.

Note: Because the root cause is historical byte loss, no change to decoding configuration can recover the data. The fix must reconstruct the intended characters and rewrite the bytes; the root-cause analysis mainly explains why reconstruction (not re-decoding) is the only viable repair and bounds which files need attention.

## Correctness Properties

Property 1: Bug Condition - Replacement Characters Restored to Intended Glyphs

_For any_ SkillHub page where the bug condition holds (isBugCondition returns true — the file contains at least one U+FFFD), the fixed page SHALL contain zero U+FFFD characters, and each former "�" SHALL be replaced by the correct intended character (accented letter, curly apostrophe/quote, or em-dash) as determined by French/English language context and parallel clean content, with the file saved as valid UTF-8 consistent with the declared `<meta charset="UTF-8">`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Already-Correct Content, Markup, and Behavior Unchanged

_For any_ input where the bug condition does NOT hold (isBugCondition returns false — a clean file, or any clean byte range within an affected file), the fixed page SHALL produce exactly the same bytes and the same rendered result as the original, preserving already-correct text, HTML structure, markup, links, scripts, the `<meta charset="UTF-8">` declaration, and all interactive behavior (locale switching, navigation, progress bar).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**Files**: The eight affected pages only —
- `skillhub/fr/agent-anatomy-7-components.html`
- `skillhub/fr/assistant-vs-agent.html`
- `skillhub/fr/install-bare-metal.html`
- `skillhub/fr/guardrails-5-layers.html`
- `skillhub/en/agent-anatomy-7-components.html`
- `skillhub/en/assistant-vs-agent.html`
- `skillhub/en/install-bare-metal.html`
- `skillhub/en/guardrails-5-layers.html`

The 28 clean files MUST NOT be modified.

**Specific Changes**:

1. **Per-occurrence reconstruction (no blind find/replace)**: For each U+FFFD, determine the single intended character from context. "�" does not map to one fixed glyph — it stands for different characters in different places (à, é, è, ç, ê, —, ', "). Each occurrence must be resolved individually; a global "replace � with X" is incorrect and is explicitly disallowed.

2. **Cross-reference against parallel clean content**: For shared strings (navigation labels, section titles like "Matin — Introduction et fondamentaux", lesson-card titles like "Critères d'arrêt", and lesson descriptions), copy the intended characters from the authoritative clean sources already in the repo:
   - `skillhub/fr/index.html` — confirmed to contain the correct French nav labels, section titles, and descriptions with zero U+FFFD.
   - `skillhub/en/index.html` — correct English equivalents.
   - The clean opposite-locale page, where the same structural strings appear (e.g., the French `aria-label="Français"` in the locale switcher is identical in both locales).

3. **Context-based reconstruction for page-unique prose**: For body text that has no parallel, reconstruct the intended character from the surrounding French/English word (e.g., `le�ons` → `leçons`, `Crit�res` → `Critères`, `arr�t` → `arrêt`, `mod�lisation` → `modélisation`). In English pages, isolated "�" between spaces almost always resolves to an em-dash "—"; "�" inside a word or before "s"/"t" at a possessive boundary resolves to a curly apostrophe "'".

4. **Restore across all surfaces**: Apply repairs not only to visible body text but also to `<title>`, `aria-label`, and `alt` attributes (e.g., line-24 `aria-label="Sélecteur de langue"`, line-26 `aria-label="Français"`), since Requirement 2.3 covers navigation labels, headings, titles, and `aria-label`/`alt` attributes.

5. **Preserve markup and charset exactly**: Edits must touch only the corrupted characters and their immediately intended replacements. Surrounding tags, attributes, entities (e.g., `&amp;`), whitespace, and the `<meta charset="UTF-8">` line must be left unchanged. Files must be written back as UTF-8 (no BOM change, consistent with the other clean files).

6. **File-by-file, reviewable edits**: Repair one file at a time using targeted string edits so each change is individually reviewable in a diff. Start with the English pages (fewest occurrences, simplest cases — mostly em-dashes), then the French pages (most occurrences), using the clean index pages as the reference while editing.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on the unfixed files (locate and count every U+FFFD), then verify the fix restores the intended characters and preserves all already-correct content, markup, and behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root-cause analysis (byte-level loss affecting a specific subset of files). If refuted, re-hypothesize.

**Test Plan**: Scan every HTML file under `skillhub/fr/` and `skillhub/en/`, decode as UTF-8, and count/locate U+FFFD occurrences with their line numbers and surrounding context. Run this on the UNFIXED files to enumerate the full set of defects and confirm which files are affected.

**Test Cases**:
1. **Affected-file enumeration**: Scan all 36 files; assert the set of files with ≥1 U+FFFD (will report the 8 affected files on unfixed code).
2. **French accent cases**: Locate occurrences like `le�ons`, `Crit�res`, `arr�t`, `Fran�ais`, `S�lecteur` (will be present on unfixed code).
3. **Em-dash cases (English)**: Locate standalone `�` between spaces in `en/` pages, e.g., `Suggest � the system proposes` (will be present on unfixed code).
4. **Attribute cases**: Locate `�` inside `<title>`, `aria-label`, and `alt` attributes (will be present on unfixed code).

**Expected Counterexamples**:
- 8 files contain U+FFFD (fr: ~114–146 each; en: ~3–16 each), confirming byte-level corruption confined to a subset.
- Possible causes: wrong-codec decode/re-encode, a lossy transform step, or partial faulty regeneration of these pages.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed page produces the expected behavior (zero U+FFFD, correct intended glyphs, UTF-8 consistent with the declared charset).

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  result := renderPage'(X)
  ASSERT NOT containsCodepoint(result, U+FFFD)
        AND result = intendedText(X)
        AND charsetDeclaration(result) = "UTF-8"
        AND decodesCleanlyAsUtf8(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed content equals the original content.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT renderPage(X) = renderPage'(X)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many comparison points automatically across the full input domain (all files, all byte ranges).
- It catches edge cases manual spot-checks might miss (e.g., a clean file accidentally touched, or an entity like `&amp;` altered).
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs.

**Test Plan**: Observe behavior on the UNFIXED files first — the 28 clean files and all clean byte ranges in the 8 affected files — then assert these are identical after the fix, and that no clean file was modified at all.

**Test Cases**:
1. **Clean-file immutability**: Observe the 28 clean files on unfixed code; assert their bytes are identical after the fix (none modified).
2. **Non-corrupted line preservation**: For each affected file, observe lines with no U+FFFD on unfixed code; assert those lines are byte-identical after the fix.
3. **Markup/charset preservation**: Observe tag structure, attribute names/values not coincident with "�", `&amp;`-style entities, and the `<meta charset="UTF-8">` line on unfixed code; assert unchanged after the fix.
4. **Interactive-behavior preservation**: Observe locale switching, sidebar navigation, and progress bar wiring on unfixed code; assert they behave identically after the fix (the relevant scripts are untouched).

### Unit Tests

- Assert that each of the 8 affected files contains zero U+FFFD after the fix.
- Assert specific reconstructed strings are correct, e.g., `Français`, `Sélecteur de langue`, `Critères d'arrêt`, `leçons`, `Matin — Introduction et fondamentaux`.
- Assert the em-dash reconstruction in English pages (e.g., `Suggest — the system proposes`).
- Assert `<meta charset="UTF-8">` is still present and unchanged in every affected file.

### Property-Based Tests

- For every HTML file under `skillhub/fr/` and `skillhub/en/`, assert the decoded content contains zero U+FFFD (fix checking across the whole corpus).
- For every file not in the affected set, assert byte-for-byte equality with its pre-fix content (preservation of clean files).
- For every affected file, assert that all lines not originally containing U+FFFD are unchanged (preservation of clean ranges), generating the comparison across every line.

### Integration Tests

- Load each repaired page in a headless/DOM test environment and assert the rendered `document` text contains no "�" in body content, headings, `title`, `aria-label`, and `alt` attributes.
- Exercise locale switching between a repaired `fr/` page and its `en/` counterpart and assert navigation and labels render correctly with no replacement characters.
- Verify visual/interactive elements (sidebar links resolve, progress bar initializes) still function on the repaired pages, confirming markup and script behavior were preserved.
