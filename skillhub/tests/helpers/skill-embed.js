// skillhub/tests/helpers/skill-embed.js
//
// Escape/unescape helpers for embedding SKILL.md prompt content into static
// HTML. Only the three HTML-sensitive characters (`&`, `<`, `>`) are escaped;
// all whitespace and line breaks are preserved verbatim.
//
// The escape order matters: `&` MUST be replaced first so that the `&` of the
// `&lt;`/`&gt;` entities produced by the later replacements is not itself
// re-escaped (avoids double-escaping to `&amp;lt;`). `unescapeHtml` applies the
// reverse order so the round-trip recovers the source byte-for-byte.

/**
 * Escape the three HTML-sensitive characters in `source`.
 *
 * Order: `&` -> `&amp;` first (avoids double-escaping), then `<` -> `&lt;`,
 * then `>` -> `&gt;`. All other characters, including whitespace and line
 * breaks, are preserved unchanged.
 *
 * @param {string} source - Raw SKILL_Prompt text.
 * @returns {string} The HTML-escaped text.
 */
export function escapeHtml(source) {
  return source
    .replace(/&/g, '&amp;') // first: avoids double-escaping
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Reverse of {@link escapeHtml}.
 *
 * Order: `&lt;` -> `<`, then `&gt;` -> `>`, then `&amp;` -> `&` (reverse of the
 * escape order) so that `unescapeHtml(escapeHtml(x)) === x`.
 *
 * @param {string} embedded - HTML-escaped text.
 * @returns {string} The original text.
 */
export function unescapeHtml(embedded) {
  return embedded
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // reverse order of escape
}
