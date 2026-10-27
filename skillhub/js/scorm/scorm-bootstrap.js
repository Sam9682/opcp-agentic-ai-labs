/**
 * SkillHub SCORM 1.2 runtime bootstrap (skillhub/js/scorm/scorm-bootstrap.js).
 *
 * This ES module is the single entry point that the SCORM build injects into
 * every packaged HTML page via `<script type="module" src=".../js/scorm/scorm-bootstrap.js">`.
 * It lives under `skillhub/js/scorm/` because the build (`scripts/build-scorm.mjs`)
 * bundles `js/scorm/*` into the export and wires this exact path into each page.
 *
 * Responsibilities:
 *   - Discover the SCORM 1.2 LMS API (`window.API`) by walking the opener/parent
 *     window chain, exactly as the SCORM 1.2 run-time environment specifies.
 *   - When an API is found, open the session (`LMSInitialize`), mark the SCO as
 *     at least `incomplete` on first launch, `LMSCommit` the change, and close the
 *     session (`LMSFinish`) when the learner leaves the page.
 *   - When NO API is found (plain static hosting, local preview, or the root
 *     launch/redirect page), do nothing and never throw. The SkillHub site is a
 *     fully functional static site without an LMS, so the absence of a SCORM host
 *     must be a silent no-op.
 *
 * The module runs itself for its side effects on load; it also exports its
 * helpers so they can be unit-tested in isolation.
 *
 * Requirements: 10.1, 10.2, 10.6
 */

/** Maximum number of parent/opener hops to search for the SCORM API. */
const MAX_API_SEARCH_DEPTH = 10;

/**
 * Walk up a window's `parent` chain (and then its `opener`) looking for a window
 * that exposes a SCORM 1.2 `API` object. Mirrors the discovery algorithm from the
 * SCORM 1.2 run-time spec. Pure except for reading `window` relationships; never
 * throws (cross-origin access errors are swallowed and treated as "not found").
 *
 * @param {Window} [win] Window to start the search from.
 * @returns {object|null} The SCORM 1.2 API adapter, or null when none is reachable.
 */
export function findScormApi(win) {
  if (!win) return null;

  // Search up the frame/parent chain.
  let current = win;
  let depth = 0;
  while (current && depth < MAX_API_SEARCH_DEPTH) {
    try {
      if (current.API) return current.API;
    } catch {
      // Cross-origin parent — cannot read it; stop climbing this chain.
      break;
    }
    if (current.parent === current) break; // reached the top
    current = current.parent;
    depth += 1;
  }

  // Fall back to the opener window (popup launch) and search its chain too.
  try {
    if (win.opener && win.opener !== win) {
      return findScormApi(win.opener);
    }
  } catch {
    // Cross-origin opener — treat as not found.
  }

  return null;
}

/**
 * Open a SCORM 1.2 session against the given API adapter and ensure the SCO has a
 * non-empty lesson status. On first launch the status is `"not attempted"` or
 * empty; we move it to `"incomplete"` so the LMS records that the learner entered
 * the SCO. Every call is guarded so a non-conformant adapter can never throw.
 *
 * @param {object} api A SCORM 1.2 API adapter (has LMSInitialize/LMSGetValue/...).
 * @returns {boolean} true when the session was initialized, false otherwise.
 */
export function initSession(api) {
  if (!api || typeof api.LMSInitialize !== 'function') return false;

  try {
    const ok = api.LMSInitialize('');
    if (ok !== 'true' && ok !== true) return false;

    try {
      const status = api.LMSGetValue('cmi.core.lesson_status');
      if (!status || status === 'not attempted' || status === 'unknown') {
        api.LMSSetValue('cmi.core.lesson_status', 'incomplete');
        if (typeof api.LMSCommit === 'function') api.LMSCommit('');
      }
    } catch {
      // Reading/writing status failed — the session is still open; ignore.
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Close a SCORM 1.2 session: commit any pending data then finish. Guarded so a
 * missing or throwing adapter method is harmless.
 *
 * @param {object} api A SCORM 1.2 API adapter.
 */
export function finishSession(api) {
  if (!api) return;
  try {
    if (typeof api.LMSCommit === 'function') api.LMSCommit('');
    if (typeof api.LMSFinish === 'function') api.LMSFinish('');
  } catch {
    // Nothing actionable on teardown — swallow.
  }
}

/**
 * Discover the LMS API and, if present, open a session and arrange to close it
 * when the page unloads. A no-op (returning false) when there is no SCORM host or
 * no DOM, so the static site works unchanged outside an LMS. Never throws.
 *
 * @param {Window} [win] Window to bootstrap against.
 * @returns {boolean} true when a SCORM session was started, false otherwise.
 */
export function bootstrapScorm(win) {
  if (!win) return false;

  const api = findScormApi(win);
  if (!api) return false; // no LMS — silent no-op

  const started = initSession(api);
  if (!started) return false;

  // Close the session when the learner leaves the SCO.
  try {
    win.addEventListener('unload', () => finishSession(api), { once: true });
    win.addEventListener('pagehide', () => finishSession(api), { once: true });
  } catch {
    // addEventListener unavailable (non-browser) — session will be closed by the LMS.
  }

  return true;
}

// Run for side effects on load, inside a browser only. Guarded so importing the
// module in a non-DOM environment (tests, build tooling) is harmless.
if (typeof window !== 'undefined') {
  try {
    bootstrapScorm(window);
  } catch {
    // The runtime must never break the page — swallow any unexpected error.
  }
}
