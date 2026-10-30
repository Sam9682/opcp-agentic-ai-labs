/**
 * Lesson catalog for the SkillHub bilingual (EN/FR) runtime.
 *
 * The `lessons` array is the single source of truth for the course catalog. It
 * lists all 14 catalog entries in programme order, grouped into three
 * top-level sections:
 *   - Section I (Fundamentals & Governance): 4 intro (I.1) + 7 design (I.2)
 *     lessons, carried over from the former `morning`/`afternoon` tracks.
 *   - Section II (Quiz): the `quiz-fundamentals` gated quiz.
 *   - Section III (Sandbox Labs): the shai orchestrator lab and the
 *     consolidated Running Applications lab.
 *
 * Grouping fields:
 *   - `section` is one of 'section-1' | 'section-2' | 'section-3' and drives
 *     the sidebar renderer.
 *   - `subsection` is one of 'intro' | 'design' | null; only Section I uses
 *     labeled subsections (I.1 intro, I.2 design).
 *   - `track` ('morning' | 'afternoon' | 'sandbox' | 'quiz') is retained for
 *     back-compat track-scoped queries.
 *
 * Invariants (enforced by skillhub/tests/lessons.test.js):
 *   - `id` and `slug` are unique across the catalog, and `id === slug`.
 *   - `title.en` and `title.fr` are both non-empty.
 *   - `track` is one of 'morning' | 'afternoon' | 'sandbox' | 'quiz'.
 *   - `difficulty` is one of 'beginner' | 'intermediate' | 'advanced', with at
 *     least one lesson per difficulty.
 *   - `estimatedMinutes` is an integer in [1, 480].
 *   - `prerequisites` only references existing ids, is acyclic, and never
 *     contains the lesson's own id.
 *   - No orphan lessons: every lesson either has a prerequisite or is itself a
 *     prerequisite of another lesson.
 */

export const lessons = [
  // ── Section I.1 — Introduction & Fundamentals (formerly morning) ──────────
  {
    id: 'assistant-vs-agent',
    slug: 'assistant-vs-agent',
    title: {
      en: 'From Assistant to Agent',
      fr: "De l'assistant à l'agent",
    },
    track: 'morning',
    section: 'section-1',
    subsection: 'intro',
    difficulty: 'beginner',
    estimatedMinutes: 30,
    prerequisites: [],
  },
  {
    id: 'agent-anatomy-7-components',
    slug: 'agent-anatomy-7-components',
    title: {
      en: 'Anatomy of an AI Agent',
      fr: "Anatomie d'un agent IA",
    },
    track: 'morning',
    section: 'section-1',
    subsection: 'intro',
    difficulty: 'beginner',
    estimatedMinutes: 40,
    prerequisites: ['assistant-vs-agent'],
  },
  {
    id: 'agentic-loop-and-variants',
    slug: 'agentic-loop-and-variants',
    title: {
      en: 'The Agentic Loop and its Variants',
      fr: 'La boucle agentique et ses variantes',
    },
    track: 'morning',
    section: 'section-1',
    subsection: 'intro',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    prerequisites: ['agent-anatomy-7-components'],
  },
  {
    id: 'stopping-criteria',
    slug: 'stopping-criteria',
    title: {
      en: 'Stopping Criteria',
      fr: "Critères d'arrêt",
    },
    track: 'morning',
    section: 'section-1',
    subsection: 'intro',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    prerequisites: ['agentic-loop-and-variants'],
  },

  // ── Section I.2 — Design & Governance (formerly afternoon) ────────────────
  {
    id: 'multi-agent-patterns',
    slug: 'multi-agent-patterns',
    title: {
      en: 'Multi-Agent Systems',
      fr: 'Systèmes multi-agents',
    },
    track: 'afternoon',
    section: 'section-1',
    subsection: 'design',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    prerequisites: ['stopping-criteria'],
  },
  {
    id: 'when-not-multi-agent',
    slug: 'when-not-multi-agent',
    title: {
      en: 'When Not to Go Multi-Agent',
      fr: 'Quand éviter le multi-agents',
    },
    track: 'afternoon',
    section: 'section-1',
    subsection: 'design',
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    prerequisites: ['multi-agent-patterns'],
  },
  {
    id: 'guardrails-5-layers',
    slug: 'guardrails-5-layers',
    title: {
      en: 'Guardrails: the Five Layers',
      fr: 'Garde-fous : les cinq couches',
    },
    track: 'afternoon',
    section: 'section-1',
    subsection: 'design',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    prerequisites: ['when-not-multi-agent'],
  },
  {
    id: 'human-in-the-loop-ovhcloud-policy',
    slug: 'human-in-the-loop-ovhcloud-policy',
    title: {
      en: 'Human-in-the-Loop & OVHcloud AI Policy',
      fr: 'Human-in-the-Loop et politique IA OVHcloud',
    },
    track: 'afternoon',
    section: 'section-1',
    subsection: 'design',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    prerequisites: ['guardrails-5-layers'],
  },
  {
    id: 'threat-modeling-workshop',
    slug: 'threat-modeling-workshop',
    title: {
      en: 'Workshop: Threat Modeling an AI Agent',
      fr: "Atelier : modélisation des menaces d'un agent IA",
    },
    track: 'afternoon',
    section: 'section-1',
    subsection: 'design',
    difficulty: 'advanced',
    estimatedMinutes: 60,
    prerequisites: ['human-in-the-loop-ovhcloud-policy'],
  },
  {
    id: 'agent-design-capstone',
    slug: 'agent-design-capstone',
    title: {
      en: 'Capstone: Designing an AI Agent End to End',
      fr: 'Projet final : concevoir un agent IA de bout en bout',
    },
    track: 'afternoon',
    section: 'section-1',
    subsection: 'design',
    difficulty: 'advanced',
    estimatedMinutes: 90,
    prerequisites: ['threat-modeling-workshop'],
  },
  {
    id: 'configuring-shai-mcp-opcp-explorer',
    slug: 'configuring-shai-mcp-opcp-explorer',
    title: {
      en: 'Configuring a SHAI Agent with MCP to OPCP-EXPLORER',
      fr: 'Configurer un agent SHAI avec MCP vers OPCP-EXPLORER',
    },
    track: 'afternoon',
    section: 'section-1',
    subsection: 'design',
    difficulty: 'advanced',
    estimatedMinutes: 45,
    prerequisites: ['agent-design-capstone'],
  },

  // ── Section II — Quiz ─────────────────────────────────────────────────────
  {
    id: 'quiz-fundamentals',
    slug: 'quiz-fundamentals',
    title: {
      en: 'Quiz: Fundamentals & Governance',
      fr: 'Quiz : fondamentaux et gouvernance',
    },
    track: 'quiz',
    section: 'section-2',
    subsection: null,
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    prerequisites: ['agent-design-capstone'],
  },

  // ── Section III — Sandbox Labs (hands-on OPCP Explorer) ───────────────────
  {
    id: 'shai-orchestrator-lab',
    slug: 'shai-orchestrator-lab',
    title: {
      en: 'Lab: The shai Multi-Agent Orchestrator',
      fr: "Atelier : l'orchestrateur multi-agents shai",
    },
    track: 'sandbox',
    section: 'section-3',
    subsection: null,
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    prerequisites: ['configuring-shai-mcp-opcp-explorer'],
  },
  {
    id: 'running-applications-lab',
    slug: 'running-applications-lab',
    title: {
      en: 'Lab: OPCP-EXPLORER Running Applications',
      fr: 'Atelier : exploitation des applications OPCP-EXPLORER',
    },
    track: 'sandbox',
    section: 'section-3',
    subsection: null,
    difficulty: 'beginner',
    estimatedMinutes: 90,
    prerequisites: ['shai-orchestrator-lab'],
  },
];

/** Track ordering used by track-scoped queries. */
const TRACK_ORDER = ['morning', 'afternoon', 'sandbox', 'quiz'];

/**
 * Return the lesson whose slug matches, or `undefined` when none exists.
 * @param {string} slug
 * @returns {object | undefined}
 */
export function getLessonBySlug(slug) {
  return lessons.find((lesson) => lesson.slug === slug);
}

/**
 * Return all lessons with the requested difficulty, preserving catalog order.
 * Returns `[]` for an unknown difficulty.
 * @param {string} difficulty
 * @returns {object[]}
 */
export function getLessonsByDifficulty(difficulty) {
  return lessons.filter((lesson) => lesson.difficulty === difficulty);
}

/**
 * Return all lessons in the requested track, in programme (catalog) order.
 * Returns `[]` for an unknown track.
 * @param {string} track
 * @returns {object[]}
 */
export function getLessonsByTrack(track) {
  if (!TRACK_ORDER.includes(track)) return [];
  return lessons.filter((lesson) => lesson.track === track);
}

/**
 * Return the full prerequisite chain for a lesson in topological order
 * (earliest prerequisite first), depth-first, deduplicated, excluding the
 * lesson itself. Returns `[]` for a missing slug or a lesson without
 * prerequisites.
 * @param {string} slug
 * @returns {string[]}
 */
export function getPrerequisiteChain(slug) {
  const start = getLessonBySlug(slug);
  if (!start) return [];

  const visited = new Set();
  const chain = [];

  function walk(lessonSlug) {
    const lesson = getLessonBySlug(lessonSlug);
    if (!lesson) return;
    for (const prereq of lesson.prerequisites) {
      if (visited.has(prereq)) continue;
      // Append the prerequisite's own chain before the prerequisite itself so
      // the earliest ancestor lands first.
      walk(prereq);
      if (!visited.has(prereq)) {
        visited.add(prereq);
        chain.push(prereq);
      }
    }
  }

  walk(slug);
  return chain;
}
