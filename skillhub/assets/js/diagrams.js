/*
 * diagrams.js — render raw Mermaid diagram sources as real SVG diagrams.
 *
 * The lesson pages ship their diagrams as plain preformatted text inside
 * `<pre><code>flowchart ...</code></pre>` blocks. That text is readable on its
 * own, so if Mermaid fails to load (offline / CDN blocked) the page still shows
 * the diagram source — the required graceful fallback.
 *
 * On success this script converts every such block into a
 * `<div class="diagram-figure"><div class="mermaid">…</div></div>` wrapper and
 * asks Mermaid to render it into an SVG. Only `<pre><code>` blocks whose text
 * begins with `flowchart` are touched; ordinary code samples are left alone.
 *
 * Mermaid is pinned to an exact version loaded from the jsDelivr CDN. No build
 * step, no bundler — a browser ES module only.
 */

const MERMAID_CDN =
  'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs';

// Mermaid theme variables harmonised with the OVHcloud palette used in
// assets/css/style.css (navy / blue on light backgrounds).
const OVH_THEME_VARIABLES = {
  primaryColor: '#e8efff',
  primaryBorderColor: '#0050d7',
  primaryTextColor: '#1c2132',
  secondaryColor: '#f5f6fa',
  secondaryBorderColor: '#4d90fe',
  secondaryTextColor: '#1c2132',
  tertiaryColor: '#ffffff',
  tertiaryBorderColor: '#1a1f71',
  tertiaryTextColor: '#1c2132',
  lineColor: '#1a1f71',
  mainBkg: '#e8efff',
  nodeBorder: '#0050d7',
  nodeTextColor: '#1c2132',
  clusterBkg: '#f5f6fa',
  clusterBorder: '#4d90fe',
  edgeLabelBackground: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

/**
 * Recover the original Mermaid source text from a parsed `<code>` element.
 * The browser turns the literal `<br/>` line breaks in the markup into real
 * `<br>` DOM nodes, so reading `textContent` would silently drop them. We read
 * `innerHTML` instead and put the `<br/>` tokens back as the literal string
 * Mermaid expects, then unescape the HTML entities so operators such as
 * `-->`, `<-->`, `-->|no|` and node shapes `{…}` / `[…]` survive exactly.
 */
function extractSource(codeEl) {
  let html = codeEl.innerHTML;
  // Normalise any serialised <br> variants back to the literal Mermaid token.
  html = html.replace(/<br\s*\/?>/gi, '<br/>');
  // Unescape HTML entities the parser may have introduced.
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value.trim();
}

/**
 * Find every diagram block, remember it, and swap in a `.mermaid` container
 * holding the recovered source. Returns the list of
 * { figure, originalPre, source } so we can restore on failure.
 */
function convertDiagramBlocks() {
  const converted = [];
  const codeBlocks = document.querySelectorAll('pre > code');

  codeBlocks.forEach((codeEl) => {
    const source = extractSource(codeEl);
    if (!/^flowchart\b/.test(source)) {
      return; // not a diagram — leave ordinary code samples untouched
    }

    const pre = codeEl.parentElement;

    const figure = document.createElement('div');
    figure.className = 'diagram-figure';

    const mermaid = document.createElement('div');
    mermaid.className = 'mermaid';
    mermaid.textContent = source;

    figure.appendChild(mermaid);
    pre.replaceWith(figure);

    converted.push({ figure, originalPre: pre, source });
  });

  return converted;
}

/** Put the original `<pre><code>` blocks back if rendering fails. */
function restoreDiagramBlocks(converted) {
  converted.forEach(({ figure, originalPre }) => {
    if (figure.isConnected) {
      figure.replaceWith(originalPre);
    }
  });
}

async function renderDiagrams() {
  const converted = convertDiagramBlocks();
  if (converted.length === 0) {
    return; // nothing to do on pages without diagrams
  }

  try {
    const { default: mermaid } = await import(MERMAID_CDN);
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables: OVH_THEME_VARIABLES,
    });
    await mermaid.run({ querySelector: '.mermaid' });
  } catch (err) {
    // Offline / CDN blocked / render error: fall back to the readable source.
    restoreDiagramBlocks(converted);
    // eslint-disable-next-line no-console
    console.warn('Mermaid diagrams could not be rendered; showing source.', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderDiagrams);
} else {
  renderDiagrams();
}
