/**
 * Progress Tracker (skillhub/js/progress.js)
 *
 * Slug-keyed, locale-independent lesson completion tracking backed by
 * localStorage. Completion is recorded under the key
 * `skillhub_lesson_complete_<slug>` with the string value `'true'`, so the
 * same record is shared across locales and survives reloads.
 *
 * Every storage access is guarded so a throwing or unavailable localStorage
 * (private-mode browsers, SCORM hosts) degrades to a safe default and never
 * propagates an error.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

/** Shared completion key prefix. The key namespace is the data model. */
export const COMPLETE_PREFIX = 'skillhub_lesson_complete_';

/**
 * Mark a lesson complete. Sets `<prefix><slug> = 'true'`. Idempotent (marking
 * an already-complete lesson is a no-op from the caller's view). Never throws.
 *
 * @param {string} slug lesson slug
 */
export function markLessonComplete(slug) {
  try {
    localStorage.setItem(COMPLETE_PREFIX + slug, 'true');
  } catch {
    // Storage unavailable (quota, private mode, SCORM host) — degrade silently.
  }
}

/**
 * Report whether a lesson is complete.
 *
 * @param {string} slug lesson slug
 * @returns {boolean} true only when the completion key is exactly 'true';
 *   false on absence or any storage error.
 */
export function isLessonComplete(slug) {
  try {
    return localStorage.getItem(COMPLETE_PREFIX + slug) === 'true';
  } catch {
    return false;
  }
}

/**
 * List the slugs of every completed lesson by walking the localStorage key
 * space, selecting keys that start with COMPLETE_PREFIX whose value is 'true',
 * and stripping the prefix. Unrelated keys are ignored.
 *
 * @returns {string[]} completed slugs; [] on any storage error.
 */
export function getCompletedLessons() {
  const completed = [];
  try {
    const count = localStorage.length;
    for (let i = 0; i < count; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(COMPLETE_PREFIX)) {
        if (localStorage.getItem(key) === 'true') {
          completed.push(key.slice(COMPLETE_PREFIX.length));
        }
      }
    }
  } catch {
    return [];
  }
  return completed;
}

/**
 * Compute completion percentage against a total lesson count.
 *
 * @param {number} total total number of lessons
 * @returns {number} 0 when total <= 0; otherwise
 *   Math.round(completed / total * 100). Returns 0 on any storage error.
 */
export function getCompletionPercentage(total) {
  if (!(total > 0)) {
    return 0;
  }
  try {
    const completed = getCompletedLessons().length;
    return Math.round((completed / total) * 100);
  } catch {
    return 0;
  }
}

/**
 * Remove every completion record, leaving unrelated localStorage entries
 * untouched. Matching keys are collected into an array first (so removing
 * during a live key(i) walk cannot shift indices), then removed. Safe when
 * nothing is stored and when localStorage.key throws.
 */
export function resetProgress() {
  try {
    const keysToRemove = [];
    const count = localStorage.length;
    for (let i = 0; i < count; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(COMPLETE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore removal failures for individual keys.
      }
    });
  } catch {
    // Collection failed (e.g. localStorage.key throws) — degrade silently.
  }
}
