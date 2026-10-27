/**
 * SkillHub lesson-page entry module (skillhub/js/app.js).
 *
 * Lesson pages load this file via `<script type="module">`. Its sole job is to
 * run the shared page bootstrap (`initApp`) at the right moment:
 *
 * - If the document is still parsing (`document.readyState === 'loading'`),
 *   defer to the `DOMContentLoaded` event so the DOM is ready before wiring.
 * - Otherwise (the module executed after the document finished loading, which
 *   can happen with a cached or late-evaluated module), call `initApp()`
 *   immediately.
 *
 * Validates: Requirement 9.1
 */

import { initApp } from './main.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
