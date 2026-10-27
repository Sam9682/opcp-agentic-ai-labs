/**
 * SkillHub guardrail self-assessment module.
 *
 * Evaluates the five-layer guardrail checklist and wires it to the DOM so the
 * "Mark as Complete" button stays disabled until all five layers are covered.
 * Evaluation is Locale-independent and tolerant of unknown, repeated, or
 * mixed-case layer identifiers.
 */

/**
 * The five required guardrail layers, in canonical display order.
 *
 * @type {readonly ['permissions','operational-limits','human-approval','observability','kill-switch']}
 */
export const GUARDRAIL_LAYERS = [
  'permissions',
  'operational-limits',
  'human-approval',
  'observability',
  'kill-switch',
];

/**
 * Evaluate a list of guardrail layers against the five required layers.
 *
 * The input is normalized (lowercased), filtered to known layers, deduplicated,
 * and ordered by {@link GUARDRAIL_LAYERS}. The checklist passes only when all
 * five required layers are covered.
 *
 * @param {Array<*>} layers - Candidate layer identifiers (any case, any order).
 * @returns {{ passed: boolean, missing: string[], covered: string[] }}
 *   `covered` is the ordered set of known layers present; `missing` is the
 *   ordered set of required layers absent; `passed` is true iff all five are
 *   covered.
 */
export function evaluateGuardrailChecklist(layers) {
  const known = new Set(GUARDRAIL_LAYERS);
  const seen = new Set();

  if (Array.isArray(layers)) {
    for (const raw of layers) {
      if (typeof raw !== 'string') continue;
      const normalized = raw.toLowerCase();
      if (known.has(normalized)) {
        seen.add(normalized);
      }
    }
  }

  const covered = GUARDRAIL_LAYERS.filter((layer) => seen.has(layer));
  const missing = GUARDRAIL_LAYERS.filter((layer) => !seen.has(layer));

  return {
    passed: missing.length === 0,
    missing,
    covered,
  };
}

/**
 * Read the `data-layer` of every checked guardrail checkbox in a container.
 *
 * @param {ParentNode|null|undefined} container - The checklist container.
 * @returns {string[]} The `data-layer` values of each checked
 *   `input.guardrail-check`, in document order. Empty when the container is
 *   absent.
 */
export function readCheckedLayers(container) {
  if (!container || typeof container.querySelectorAll !== 'function') {
    return [];
  }
  const inputs = container.querySelectorAll('input.guardrail-check');
  const checked = [];
  for (const input of inputs) {
    if (input.checked) {
      checked.push(input.getAttribute('data-layer'));
    }
  }
  return checked;
}

/**
 * Wire a guardrail checklist to the DOM.
 *
 * Attaches `change` listeners to every `input.guardrail-check` in the
 * container so that each change recomputes the evaluation, updates the result
 * element (when present), and gates the complete button
 * (`completeBtn.disabled = !passed`). The button starts disabled. When the
 * checklist passes, clicking the complete button marks the lesson complete via
 * the progress tracker.
 *
 * @param {{
 *   container: ParentNode,
 *   resultEl?: Element|null,
 *   completeBtn?: HTMLButtonElement|null,
 *   locale?: string,
 * }} options
 * @returns {void}
 */
export function initGuardrailChecklist({ container, resultEl, completeBtn, locale } = {}) {
  if (!container || typeof container.querySelectorAll !== 'function') {
    return;
  }

  const lessonSlug = resolveLessonSlug(container);

  const recompute = () => {
    const checked = readCheckedLayers(container);
    const { passed, missing } = evaluateGuardrailChecklist(checked);

    if (completeBtn) {
      completeBtn.disabled = !passed;
    }

    if (resultEl) {
      resultEl.textContent = formatResult(passed, missing, locale);
    }

    return passed;
  };

  const inputs = container.querySelectorAll('input.guardrail-check');
  for (const input of inputs) {
    input.addEventListener('change', recompute);
  }

  if (completeBtn) {
    completeBtn.disabled = true;
    completeBtn.addEventListener('click', async () => {
      if (!recompute()) return;
      try {
        const progress = await import('./progress.js');
        if (progress && typeof progress.markLessonComplete === 'function') {
          progress.markLessonComplete(lessonSlug);
        }
      } catch (_err) {
        // Progress tracking is best-effort; never block the UI on it.
      }
    });
  }

  // Establish the initial (disabled) state without requiring a change event.
  recompute();
}

/**
 * Derive the lesson slug for the current page.
 *
 * Prefers an explicit `data-lesson-slug` on the container, then falls back to
 * the current pathname's `<slug>.html` filename.
 *
 * @param {Element} container
 * @returns {string}
 */
function resolveLessonSlug(container) {
  const explicit =
    container && typeof container.getAttribute === 'function'
      ? container.getAttribute('data-lesson-slug')
      : null;
  if (explicit) return explicit;

  try {
    const path = (typeof location !== 'undefined' && location.pathname) || '';
    const file = path.split('/').pop() || '';
    return file.replace(/\.html$/i, '');
  } catch (_err) {
    return '';
  }
}

/**
 * Build a short human-readable result message for the checklist.
 *
 * @param {boolean} passed
 * @param {string[]} missing
 * @param {string} [locale]
 * @returns {string}
 */
function formatResult(passed, missing, locale) {
  const isFr = typeof locale === 'string' && locale.toLowerCase().startsWith('fr');
  if (passed) {
    return isFr
      ? 'Les cinq couches de garde-fous sont couvertes.'
      : 'All five guardrail layers are covered.';
  }
  const count = missing.length;
  return isFr
    ? `${count} couche(s) manquante(s) : ${missing.join(', ')}`
    : `${count} layer(s) missing: ${missing.join(', ')}`;
}
