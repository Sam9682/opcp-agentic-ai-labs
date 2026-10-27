/**
 * SkillHub code highlighter.
 *
 * A dependency-free, per-language syntax highlighter for lesson code blocks.
 * Source is HTML-escaped (only `<`, `>`, `&`) before any markup is emitted,
 * so the produced HTML is always safe to assign to `innerHTML`. Recognized
 * languages are `javascript`, `python`, `bash`, and `json`; any other
 * language yields the escaped source with no highlighting spans.
 *
 * Tokenization matches comments and strings before keywords and numbers so
 * that keyword-like or digit-like text inside a string or comment is never
 * re-tokenized.
 */

/**
 * HTML-escape a string, escaping only `&`, `<`, and `>` (not quotes).
 *
 * `&` is escaped first so already-emitted entities are not double-escaped.
 *
 * @param {string} value - The raw text to escape.
 * @returns {string} The escaped text.
 */
function htmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Wrap already-escaped content in an `hljs`-prefixed span.
 *
 * @param {string} cls - The hljs class suffix (e.g. "keyword").
 * @param {string} escaped - Content that is already HTML-escaped.
 * @returns {string} The span markup.
 */
function span(cls, escaped) {
  return `<span class="hljs-${cls}">${escaped}</span>`;
}

/**
 * Keyword lists per recognized language.
 * @type {Record<string, string[]>}
 */
const KEYWORDS = {
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'class', 'extends',
    'super', 'this', 'import', 'export', 'from', 'default', 'try', 'catch',
    'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'async', 'await',
    'yield', 'delete', 'void', 'null', 'true', 'false', 'undefined',
  ],
  python: [
    'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break',
    'continue', 'import', 'from', 'as', 'pass', 'with', 'try', 'except',
    'finally', 'raise', 'lambda', 'global', 'nonlocal', 'yield', 'assert',
    'del', 'in', 'is', 'not', 'and', 'or', 'None', 'True', 'False', 'async',
    'await',
  ],
  bash: [
    'export', 'echo', 'if', 'then', 'else', 'elif', 'fi', 'for', 'while',
    'do', 'done', 'case', 'esac', 'function', 'return', 'local', 'source',
    'alias', 'unset', 'read', 'cd', 'exit', 'in',
  ],
  json: ['true', 'false', 'null'],
};

/**
 * Build a keyword regex that matches any of the given words on a word boundary.
 *
 * @param {string[]} words - The keyword list.
 * @returns {RegExp} A sticky-free global regex.
 */
function keywordPattern(words) {
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(?:${escaped.join('|')})\\b`);
}

/**
 * Tokenize JavaScript source into highlighted, HTML-escaped markup.
 *
 * @param {string} code - Raw source code.
 * @returns {string} Highlighted HTML.
 */
function highlightJavaScript(code) {
  const kw = keywordPattern(KEYWORDS.javascript);
  let out = '';
  let i = 0;
  const n = code.length;

  while (i < n) {
    const rest = code.slice(i);

    // Block comment /* ... */
    if (rest.startsWith('/*')) {
      const end = rest.indexOf('*/');
      const chunk = end === -1 ? rest : rest.slice(0, end + 2);
      out += span('comment', htmlEscape(chunk));
      i += chunk.length;
      continue;
    }

    // Line comment // ...
    if (rest.startsWith('//')) {
      const nl = rest.indexOf('\n');
      const chunk = nl === -1 ? rest : rest.slice(0, nl);
      out += span('comment', htmlEscape(chunk));
      i += chunk.length;
      continue;
    }

    const ch = code[i];

    // Strings (double, single, backtick)
    if (ch === '"' || ch === "'" || ch === '`') {
      const str = readString(code, i, ch);
      out += span('string', htmlEscape(str));
      i += str.length;
      continue;
    }

    // Numbers
    const num = matchNumber(rest);
    if (num) {
      out += span('number', htmlEscape(num));
      i += num.length;
      continue;
    }

    // Keywords
    const kwMatch = matchAtStart(rest, kw);
    if (kwMatch) {
      out += span('keyword', htmlEscape(kwMatch));
      i += kwMatch.length;
      continue;
    }

    // Plain character
    out += htmlEscape(ch);
    i += 1;
  }

  return out;
}

/**
 * Tokenize Python source into highlighted, HTML-escaped markup.
 *
 * @param {string} code - Raw source code.
 * @returns {string} Highlighted HTML.
 */
function highlightPython(code) {
  return highlightHashLang(code, KEYWORDS.python);
}

/**
 * Tokenize Bash source into highlighted, HTML-escaped markup.
 *
 * @param {string} code - Raw source code.
 * @returns {string} Highlighted HTML.
 */
function highlightBash(code) {
  return highlightHashLang(code, KEYWORDS.bash);
}

/**
 * Shared tokenizer for `#`-comment languages (Python, bash).
 *
 * @param {string} code - Raw source code.
 * @param {string[]} keywords - Keyword list for the language.
 * @returns {string} Highlighted HTML.
 */
function highlightHashLang(code, keywords) {
  const kw = keywordPattern(keywords);
  let out = '';
  let i = 0;
  const n = code.length;

  while (i < n) {
    const rest = code.slice(i);
    const ch = code[i];

    // Line comment # ...
    if (ch === '#') {
      const nl = rest.indexOf('\n');
      const chunk = nl === -1 ? rest : rest.slice(0, nl);
      out += span('comment', htmlEscape(chunk));
      i += chunk.length;
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      const str = readString(code, i, ch);
      out += span('string', htmlEscape(str));
      i += str.length;
      continue;
    }

    // Numbers
    const num = matchNumber(rest);
    if (num) {
      out += span('number', htmlEscape(num));
      i += num.length;
      continue;
    }

    // Keywords
    const kwMatch = matchAtStart(rest, kw);
    if (kwMatch) {
      out += span('keyword', htmlEscape(kwMatch));
      i += kwMatch.length;
      continue;
    }

    out += htmlEscape(ch);
    i += 1;
  }

  return out;
}

/**
 * Tokenize JSON source into highlighted, HTML-escaped markup.
 *
 * Quoted tokens immediately followed by `:` are property keys (`hljs-attr`);
 * all other quoted tokens are string values (`hljs-string`).
 *
 * @param {string} code - Raw source code.
 * @returns {string} Highlighted HTML.
 */
function highlightJson(code) {
  const kw = keywordPattern(KEYWORDS.json);
  let out = '';
  let i = 0;
  const n = code.length;

  while (i < n) {
    const rest = code.slice(i);
    const ch = code[i];

    // Strings — classify as key (hljs-attr) or value (hljs-string)
    if (ch === '"' || ch === "'") {
      const str = readString(code, i, ch);
      const after = code.slice(i + str.length);
      const isKey = /^\s*:/.test(after);
      out += span(isKey ? 'attr' : 'string', htmlEscape(str));
      i += str.length;
      continue;
    }

    // Numbers
    const num = matchNumber(rest);
    if (num) {
      out += span('number', htmlEscape(num));
      i += num.length;
      continue;
    }

    // Boolean / null keywords
    const kwMatch = matchAtStart(rest, kw);
    if (kwMatch) {
      out += span('keyword', htmlEscape(kwMatch));
      i += kwMatch.length;
      continue;
    }

    out += htmlEscape(ch);
    i += 1;
  }

  return out;
}

/**
 * Read a quoted string starting at `start` (whose char is `quote`),
 * honoring backslash escapes, returning the full literal including quotes.
 *
 * @param {string} code - Raw source.
 * @param {number} start - Index of the opening quote.
 * @param {string} quote - The quote character.
 * @returns {string} The string literal (including quotes).
 */
function readString(code, start, quote) {
  let j = start + 1;
  const n = code.length;
  while (j < n) {
    const c = code[j];
    if (c === '\\') {
      j += 2;
      continue;
    }
    if (c === quote) {
      j += 1;
      break;
    }
    j += 1;
  }
  return code.slice(start, j);
}

/**
 * Match a numeric literal at the start of `rest`, or return null.
 *
 * @param {string} rest - The remaining source.
 * @returns {string|null} The matched number, or null.
 */
function matchNumber(rest) {
  const m = /^\d+(?:\.\d+)?/.exec(rest);
  return m ? m[0] : null;
}

/**
 * Match a pattern anchored at the start of `rest`, or return null.
 *
 * @param {string} rest - The remaining source.
 * @param {RegExp} pattern - A (non-anchored) pattern.
 * @returns {string|null} The match if it begins at index 0, else null.
 */
function matchAtStart(rest, pattern) {
  const m = pattern.exec(rest);
  return m && m.index === 0 ? m[0] : null;
}

/**
 * The tokenizer dispatch table for recognized languages.
 * @type {Record<string, (code: string) => string>}
 */
const TOKENIZERS = {
  javascript: highlightJavaScript,
  python: highlightPython,
  bash: highlightBash,
  json: highlightJson,
};

/**
 * Highlight a snippet of source code for the given language.
 *
 * Empty input returns an empty string. An unrecognized language returns the
 * HTML-escaped source with no highlighting spans. For recognized languages,
 * the source is escaped as it is tokenized and wrapped in `hljs`-prefixed
 * spans.
 *
 * @param {string} code - The source code to highlight.
 * @param {string} language - The language identifier.
 * @returns {string} HTML-safe highlighted markup.
 */
export function highlightCode(code, language) {
  if (!code) {
    return '';
  }
  const tokenizer = TOKENIZERS[language];
  if (!tokenizer) {
    return htmlEscape(code);
  }
  return tokenizer(code);
}

/**
 * Extract a recognized language from a `<code>` element's class list.
 *
 * Looks for a `language-<lang>` or `lang-<lang>` class whose `<lang>` is a
 * recognized tokenizer language.
 *
 * @param {Element} el - The code element.
 * @returns {string|null} The recognized language, or null.
 */
function recognizedLanguage(el) {
  const classes = (el.getAttribute('class') || '').split(/\s+/);
  for (const cls of classes) {
    const m = /^(?:language|lang)-(.+)$/.exec(cls);
    if (m && TOKENIZERS[m[1]]) {
      return m[1];
    }
  }
  return null;
}

/**
 * Highlight every eligible `<code>` element under `root`.
 *
 * For each `<code>` whose class names a recognized language via a
 * `language-`/`lang-` prefix: skip it if `data-highlighted === "true"`;
 * otherwise set its `innerHTML` to the highlighted markup of its text
 * content, add the `hljs` class, and mark `data-highlighted="true"`.
 * Elements without a recognized language class are left untouched and
 * unmarked.
 *
 * @param {Document|Element} [root=document] - The subtree to process.
 * @returns {void}
 */
export function highlightAll(root = document) {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return;
  }
  const codeEls = root.querySelectorAll('code');
  codeEls.forEach((el) => {
    const lang = recognizedLanguage(el);
    if (!lang) {
      return;
    }
    if (el.dataset && el.dataset.highlighted === 'true') {
      return;
    }
    el.innerHTML = highlightCode(el.textContent, lang);
    el.classList.add('hljs');
    el.dataset.highlighted = 'true';
  });
}
