/**
 * SkillHub I18n module.
 *
 * Locale detection, persistence, and normalization for the bilingual
 * (EN/FR) SkillHub runtime. All locale-producing boundaries return a value
 * from {@link SUPPORTED_LOCALES} ("en" or "fr"), and every storage access is
 * guarded so that a throwing or unavailable localStorage degrades gracefully.
 */

/** localStorage key under which the locale preference is persisted. */
export const LOCALE_KEY = 'skillhub-locale';

/** The locales supported by the runtime, in canonical form. */
export const SUPPORTED_LOCALES = ['en', 'fr'];

/**
 * Normalize any input to a supported locale.
 *
 * A value whose lowercased form starts with "fr" (e.g. "fr", "fr-CA",
 * "FR-FR") maps to "fr"; everything else maps to "en".
 *
 * @param {*} value - Any value; non-strings normalize to "en".
 * @returns {'en'|'fr'} The normalized locale.
 */
export function normalizeLocale(value) {
  if (typeof value === 'string' && value.toLowerCase().startsWith('fr')) {
    return 'fr';
  }
  return 'en';
}

/**
 * Return the stored locale preference.
 *
 * Only an exact stored value of "en" or "fr" is returned; any other stored
 * value, an absent key, or a storage error yields null.
 *
 * @returns {'en'|'fr'|null} The stored preference, or null.
 */
export function getStoredLocalePreference() {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === 'en' || stored === 'fr') {
      return stored;
    }
    return null;
  } catch (_err) {
    return null;
  }
}

/**
 * Persist the given value as a locale preference.
 *
 * The value is normalized via {@link normalizeLocale} before being stored
 * under {@link LOCALE_KEY}. Storage errors are swallowed; this never throws.
 *
 * @param {*} value - Any value to normalize and persist.
 * @returns {void}
 */
export function setLocalePreference(value) {
  try {
    localStorage.setItem(LOCALE_KEY, normalizeLocale(value));
  } catch (_err) {
    // Swallow storage errors (quota, unavailable, security).
  }
}

/**
 * Resolve the active locale.
 *
 * Precedence: a valid stored preference wins; otherwise the browser language
 * (`navigator.language` or the first of `navigator.languages`) lowercased
 * `startsWith('fr')` resolves to "fr"; otherwise "en". If reading the stored
 * preference throws, detection falls through to browser-language detection.
 *
 * @returns {'en'|'fr'} The resolved locale, always exactly "en" or "fr".
 */
export function detectLocale() {
  const stored = getStoredLocalePreference();
  if (stored === 'en' || stored === 'fr') {
    return stored;
  }

  const browserLang =
    (typeof navigator !== 'undefined' &&
      (navigator.language ||
        (Array.isArray(navigator.languages) ? navigator.languages[0] : ''))) ||
    '';

  if (typeof browserLang === 'string' && browserLang.toLowerCase().startsWith('fr')) {
    return 'fr';
  }

  return 'en';
}
/**
 * Switch to the given target locale on the current lesson page.
 *
 * The target is normalized via {@link normalizeLocale} and persisted under
 * {@link LOCALE_KEY} (through {@link setLocalePreference}, so storage errors are
 * swallowed). Navigation then rewrites `window.location.pathname`: if the path
 * begins with a `/en/` or `/fr/` segment, only that leading locale segment is
 * replaced by the target locale while the trailing `<slug>.html` filename is
 * preserved; otherwise navigation falls back to the locale root `/<locale>/`.
 *
 * Example: `switchLocale('fr-BE')` on `/en/lesson.html` persists `"fr"` and
 * sets `window.location.href = '/fr/lesson.html'`. With no locale segment it
 * sets `href = '/fr/'`.
 *
 * @param {*} target - Any value; normalized to a supported locale.
 * @returns {void}
 */
export function switchLocale(target) {
  const locale = normalizeLocale(target);
  setLocalePreference(locale);

  const pathname =
    (typeof window !== 'undefined' && window.location && window.location.pathname) || '';

  let destination;
  if (/^\/(en|fr)\//.test(pathname)) {
    destination = pathname.replace(/^\/(en|fr)\//, `/${locale}/`);
  } else {
    destination = `/${locale}/`;
  }

  if (typeof window !== 'undefined' && window.location) {
    window.location.href = destination;
  }
}
