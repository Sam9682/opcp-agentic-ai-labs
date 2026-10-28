# Bugfix Requirements Document

## Introduction

The SkillHub web pages (under `skillhub/`) render some characters as the Unicode replacement character "�" (U+FFFD) instead of the intended glyphs. This affects both French (`skillhub/fr/`) and English (`skillhub/en/`) localized pages. The corruption impacts accented French letters (é, è, à, ç, ê, î, ô, û, ë…), typographic punctuation (curly apostrophes ', curly quotes " ", em-dashes —), and other non-ASCII characters.

Investigation of the known-affected file `skillhub/fr/assistant-vs-agent.html` confirms the pages already declare `<meta charset="UTF-8">`, yet the saved file bytes themselves already contain the U+FFFD replacement character where accented/typographic characters should be (e.g., "De l'assistant � l'agent", "S�lecteur de langue", "Fran�ais", "le�ons"). This indicates the character data was destroyed at the byte level during an earlier save/encoding step rather than being a pure display-time decoding mismatch. Multiple pages across `skillhub/fr/` and `skillhub/en/` exhibit the same corruption.

The impact is user-facing: learners see garbled, unprofessional text throughout the training content, harming readability and credibility of the SkillHub lessons.

## Bug Analysis

### Current Behavior (Defect)

What currently happens when the bug is triggered.

1.1 WHEN a SkillHub HTML page contains text whose source bytes hold a U+FFFD replacement character in place of an intended accented letter THEN the system renders "�" instead of the correct letter (e.g., "le�ons" instead of "leçons", "Fran�ais" instead of "Français")
1.2 WHEN a SkillHub HTML page contains text whose source bytes hold a U+FFFD replacement character in place of intended typographic punctuation THEN the system renders "�" instead of the correct punctuation (e.g., curly apostrophe ', curly quotes " ", em-dash —)
1.3 WHEN an affected page is loaded in either the French (`skillhub/fr/`) or English (`skillhub/en/`) locale THEN the system displays one or more "�" characters in the rendered content, navigation labels, headings, titles, and `aria-label` / `alt` attributes

### Expected Behavior (Correct)

What should happen instead.

2.1 WHEN a SkillHub HTML page contains text that previously held a U+FFFD replacement character in place of an intended accented letter THEN the system SHALL render the correct intended letter (e.g., "leçons", "Français") with no "�" present
2.2 WHEN a SkillHub HTML page contains text that previously held a U+FFFD replacement character in place of intended typographic punctuation THEN the system SHALL render the correct intended punctuation (curly apostrophe ', curly quotes " ", em-dash —) with no "�" present
2.3 WHEN any page under `skillhub/fr/` or `skillhub/en/` is loaded THEN the system SHALL display zero U+FFFD replacement characters anywhere in its rendered content, navigation labels, headings, titles, and `aria-label` / `alt` attributes
2.4 WHEN a repaired page is served THEN the system SHALL have its bytes encoded as UTF-8 consistent with the declared `<meta charset="UTF-8">`, so the intended characters decode correctly

### Unchanged Behavior (Regression Prevention)

Existing behavior that must be preserved.

3.1 WHEN a SkillHub page contains text that is already correct (plain ASCII or already-correct non-ASCII characters with no U+FFFD) THEN the system SHALL CONTINUE TO display that text unchanged
3.2 WHEN a page's HTML structure, markup, tags, attributes, links, and scripts do not involve corrupted characters THEN the system SHALL CONTINUE TO render and behave identically to before the fix
3.3 WHEN the existing `<meta charset="UTF-8">` declaration is present THEN the system SHALL CONTINUE TO declare UTF-8 (the fix SHALL NOT change the declared charset)
3.4 WHEN a page's locale switching, navigation, progress bar, and other interactive behaviors are exercised THEN the system SHALL CONTINUE TO function exactly as before the fix

## Bug Condition

The bug condition identifies inputs (page text/bytes) that trigger the defect: any source byte sequence that currently contains a U+FFFD replacement character standing in for an intended non-ASCII character.

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type PageText   // the rendered text / source bytes of a SkillHub page
  OUTPUT: boolean

  // Returns true when the text contains at least one U+FFFD replacement character
  RETURN containsCodepoint(X, U+FFFD)
END FUNCTION
```

```pascal
// Property: Fix Checking - no replacement characters remain, intended glyphs restored
FOR ALL X WHERE isBugCondition(X) DO
  result ← renderPage'(X)
  ASSERT NOT containsCodepoint(result, U+FFFD)
        AND result = intendedText(X)   // each "�" replaced by the correct intended character
END FOR
```

```pascal
// Property: Preservation Checking - already-correct content is untouched
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT renderPage(X) = renderPage'(X)
END FOR
```

Where **F** = `renderPage` is the SkillHub page content as it exists before the fix, and **F'** = `renderPage'` is the content after repairing the corrupted bytes to their intended UTF-8 characters.
