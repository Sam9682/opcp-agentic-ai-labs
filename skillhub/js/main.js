/**
 * SkillHub page bootstrap (skillhub/js/main.js).
 *
 * `initApp()` is the single entry point every page calls on load. It wires the
 * shared runtime to whatever elements the current page happens to contain:
 * code highlighting, the progress bar, lesson navigation, and the guardrail
 * self-assessment checklist. Each capability is conditioned on element
 * presence, so a page that omits a feature simply skips wiring it.
 *
 * `initApp()` is defensive end to end: every step is isolated so a failure in
 * one capability never prevents the others from initializing, and the function
 * never throws regardless of DOM state (Requirement 9.1, 9.4).
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4
 */

import { highlightAll } from './code-highlight.js';
import { getCompletionPercentage } from './progress.js';
import { lessons } from './lessons.js';
import { initNavigation } from './navigation.js';
import { initGuardrailChecklist } from './self-assessment.js';

/**
 * Selectors for the two progress-bar families. The test DOM uses
 * `.progress-bar`/`.progress-text`; authored lesson pages use
 * `.progress-bar-fill`/`.progress-percent`. Both are queried so the same
 * bootstrap drives either markup.
 */
const PROGRESS_BAR_SELECTOR = '.progress-bar, .progress-bar-fill';
const PROGRESS_TEXT_SELECTOR = '.progress-text, .progress-percent';

/** The guardrail self-assessment container, as authored on lesson pages. */
const GUARDRAIL_SELECTOR = '.guardrail-checklist, [data-guardrail-checklist]';

/**
 * Bootstrap the current page.
 *
 * Highlights recognized code blocks, paints the progress bar (when present)
 * from the live catalog total, and conditionally wires navigation and the
 * guardrail self-assessment on element presence. Completes silently when no
 * progress elements exist. Never throws (Requirement 9.1, 9.4).
 *
 * @returns {void}
 */
export function initApp() {
  runStep(initHighlighting);
  runStep(updateProgressBar);
  runStep(wireNavigation);
  runStep(wireSelfAssessment);
}

/**
 * Run a bootstrap step, swallowing any error so one failure cannot abort the
 * rest of initialization or propagate out of {@link initApp}.
 *
 * @param {() => void} step
 * @returns {void}
 */
function runStep(step) {
  try {
    step();
  } catch (_err) {
    // A single capability failing must never break page bootstrap.
  }
}

/**
 * Apply syntax highlighting to recognized code blocks (Requirement 9.2).
 *
 * @returns {void}
 */
function initHighlighting() {
  highlightAll();
}

/**
 * Paint the progress bar from the live catalog total (Requirement 9.3).
 *
 * When no progress bar or text element is present the function returns without
 * side effects (Requirement 9.4). The percentage is computed once from
 * `lessons.length` so it stays correct as the catalog grows.
 *
 * @returns {void}
 */
function updateProgressBar() {
  if (typeof document === 'undefined') return;

  const bars = document.querySelectorAll(PROGRESS_BAR_SELECTOR);
  const texts = document.querySelectorAll(PROGRESS_TEXT_SELECTOR);

  if (bars.length === 0 && texts.length === 0) {
    // No progress elements — complete silently.
    return;
  }

  const pct = getCompletionPercentage(lessons.length);
  const label = pct + '%';

  bars.forEach((bar) => {
    bar.style.width = label;
    bar.setAttribute('aria-valuenow', String(pct));
  });

  texts.forEach((text) => {
    text.textContent = label;
  });
}

/**
 * Wire lesson navigation when the sidebar is present.
 *
 * `initNavigation` itself no-ops when `.sidebar` is absent, but the presence
 * check keeps bootstrap explicit and avoids importing navigation side effects
 * on pages that have no sidebar.
 *
 * @returns {void}
 */
function wireNavigation() {
  if (typeof document === 'undefined') return;
  if (!document.querySelector('.sidebar')) return;
  initNavigation();
}

/**
 * Wire the guardrail self-assessment checklist when its container is present.
 *
 * @returns {void}
 */
function wireSelfAssessment() {
  if (typeof document === 'undefined') return;

  const container = document.querySelector(GUARDRAIL_SELECTOR);
  if (!container) return;

  const resultEl = document.querySelector('.guardrail-result, [data-guardrail-result]');
  const completeBtn = document.querySelector('.mark-complete-btn, [data-mark-complete]');
  const locale =
    document.documentElement && document.documentElement.lang
      ? document.documentElement.lang
      : undefined;

  initGuardrailChecklist({ container, resultEl, completeBtn, locale });
}
