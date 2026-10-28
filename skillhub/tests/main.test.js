import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initApp } from '../js/main.js';
import { lessons } from '../js/lessons.js';

describe('Main Module', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('initializes without errors when DOM is ready', () => {
    expect(() => initApp()).not.toThrow();
  });

  it('applies code highlighting to code blocks on init', () => {
    document.body.innerHTML = '<pre><code class="language-javascript">const x = 1;</code></pre>';
    initApp();
    const codeEl = document.querySelector('code');
    expect(codeEl.dataset.highlighted).toBe('true');
    expect(codeEl.innerHTML).toContain('<span class="hljs-keyword">const</span>');
  });

  it('updates progress bar if present in DOM', () => {
    document.body.innerHTML = `
      <div class="progress-bar" style="width: 0%" aria-valuenow="0"></div>
      <span class="progress-text">0%</span>
    `;
    initApp();
    // With no completed lessons, percentage should be 0
    const bar = document.querySelector('.progress-bar');
    expect(bar.style.width).toBe('0%');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('displays correct percentage when lessons are completed', () => {
    // Mark some lessons as complete in localStorage
    localStorage.setItem('skillhub_lesson_complete_install-bare-metal', 'true');
    localStorage.setItem('skillhub_lesson_complete_adding-applications', 'true');

    document.body.innerHTML = `
      <div class="progress-bar" style="width: 0%" aria-valuenow="0"></div>
      <span class="progress-text">0%</span>
    `;
    initApp();
    const bar = document.querySelector('.progress-bar');
    const text = document.querySelector('.progress-text');
    // 2 completed out of the full catalog, computed from the live catalog
    // so this stays correct as lessons are added.
    const expected = Math.round((2 / lessons.length) * 100) + '%';
    expect(bar.style.width).toBe(expected);
    expect(text.textContent).toBe(expected);
  });

  it('degrades gracefully when progress elements are not in DOM', () => {
    document.body.innerHTML = '<div>No progress bar here</div>';
    expect(() => initApp()).not.toThrow();
  });

  describe('locale-switcher wiring and fail-isolation', () => {
    let restoreLocation = null;

    afterEach(() => {
      if (restoreLocation) {
        restoreLocation();
        restoreLocation = null;
      }
    });

    /**
     * Install a mock window.location that captures href writes.
     * @param {string} pathname
     * @returns {() => void} restore
     */
    function mockLocation(pathname) {
      const original = window.location;
      delete window.location;
      window.location = { pathname, href: '' };
      return () => {
        delete window.location;
        window.location = original;
      };
    }

    it('wires the locale switcher alongside highlighting, progress, navigation, and the guardrail steps', () => {
      // A full page DOM carrying every capability the bootstrap wires: a
      // highlightable code block, the progress bar family, a sidebar, the
      // guardrail checklist, and the locale switcher.
      document.body.innerHTML = `
        <div class="locale-switcher">
          <button class="active" data-locale="en">EN</button>
          <button data-locale="fr">FR</button>
        </div>
        <div class="progress-bar" style="width: 0%" aria-valuenow="0"></div>
        <span class="progress-text">0%</span>
        <aside class="sidebar"></aside>
        <button class="hamburger-btn"><span></span><span></span><span></span></button>
        <pre><code class="language-javascript">const x = 1;</code></pre>
        <div class="guardrail-checklist" data-lesson-slug="demo-lesson">
          <input class="guardrail-check" type="checkbox" data-layer="permissions" />
          <input class="guardrail-check" type="checkbox" data-layer="operational-limits" />
          <input class="guardrail-check" type="checkbox" data-layer="human-approval" />
          <input class="guardrail-check" type="checkbox" data-layer="observability" />
          <input class="guardrail-check" type="checkbox" data-layer="kill-switch" />
        </div>
        <div class="guardrail-result"></div>
        <button class="mark-complete-btn">Mark complete</button>
      `;
      restoreLocation = mockLocation('/en/lesson.html');

      initApp();

      // Highlighting wired.
      const code = document.querySelector('code');
      expect(code.dataset.highlighted).toBe('true');

      // Progress wired (0 complete -> 0%).
      expect(document.querySelector('.progress-bar').style.width).toBe('0%');

      // Navigation wired (sidebar rendered, hamburger labelled).
      expect(document.querySelector('.sidebar').querySelectorAll('.sidebar-section').length).toBe(3);
      expect(document.querySelector('.hamburger-btn').getAttribute('aria-label')).toBe(
        'Toggle navigation menu',
      );

      // Guardrail wired (complete button toggles as the five layers are checked).
      const completeBtn = document.querySelector('.mark-complete-btn');
      expect(completeBtn.disabled).toBe(true);
      document.querySelectorAll('input.guardrail-check').forEach((input) => {
        input.checked = true;
        input.dispatchEvent(new window.Event('change', { bubbles: true }));
      });
      expect(completeBtn.disabled).toBe(false);

      // Locale switcher wired: clicking FR persists "fr" and navigates.
      document
        .querySelector('.locale-switcher button[data-locale="fr"]')
        .dispatchEvent(new window.Event('click', { bubbles: true }));
      expect(localStorage.getItem('skillhub-locale')).toBe('fr');
      expect(window.location.href).toBe('/fr/lesson.html');
    });

    it('does not throw and attaches no toggle handler on a DOM without .locale-switcher', () => {
      // A stray data-locale button outside any switcher must stay inert.
      document.body.innerHTML = `
        <div>No locale switcher here</div>
        <button id="stray" data-locale="fr">FR</button>
      `;
      restoreLocation = mockLocation('/en/lesson.html');

      expect(() => initApp()).not.toThrow();

      document
        .querySelector('#stray')
        .dispatchEvent(new window.Event('click', { bubbles: true }));

      expect(localStorage.getItem('skillhub-locale')).toBe(null);
      expect(window.location.href).toBe('');
    });

    it('never throws even when a single capability step throws (fail-isolation)', () => {
      // Force one step to fail: querySelectorAll throws during bootstrap. The
      // runStep wrapper must swallow it so initApp() still completes.
      document.body.innerHTML = '<div class="progress-bar"></div>';
      const original = document.querySelectorAll;
      let threw = false;
      document.querySelectorAll = function patched(selector) {
        if (!threw) {
          threw = true;
          throw new Error('boom');
        }
        return original.call(this, selector);
      };

      try {
        expect(() => initApp()).not.toThrow();
        // The injected failure actually fired, proving isolation was exercised.
        expect(threw).toBe(true);
      } finally {
        document.querySelectorAll = original;
      }
    });
  });
});
