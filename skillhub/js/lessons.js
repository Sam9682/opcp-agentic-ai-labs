/**
 * Lesson catalog for the SkillHub bilingual (EN/FR) runtime.
 *
 * The `lessons` array is the single source of truth for the course catalog. It
 * lists all 17 lessons in programme order: 4 morning fundamentals, 6 afternoon
 * design & governance lessons, then 7 sandbox (hands-on) lessons.
 *
 * Invariants (enforced by skillhub/tests/lessons.test.js):
 *   - `id` and `slug` are unique across the catalog, and `id === slug`.
 *   - `title.en` and `title.fr` are both non-empty.
 *   - `track` is one of 'morning' | 'afternoon' | 'sandbox'.
 *   - `difficulty` is one of 'beginner' | 'intermediate' | 'advanced', with at
 *     least one lesson per difficulty.
 *   - `estimatedMinutes` is an integer in [1, 480].
 *   - `prerequisites` only references existing ids, is acyclic, and never
 *     contains the lesson's own id.
 *   - No orphan lessons: every lesson either has a prerequisite or is itself a
 *     prerequisite of another lesson.
 */

export const lessons = [
  // ── Morning — fundamentals ────────────────────────────────────────────────
  {
    id: 'assistant-vs-agent',
    slug: 'assistant-vs-agent',
    title: {
      en: 'From Assistant to Agent',
      fr: "De l'assistant à l'agent",
    },
    track: 'morning',
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
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    prerequisites: ['agentic-loop-and-variants'],
  },

  // ── Afternoon — design & governance ───────────────────────────────────────
  {
    id: 'multi-agent-patterns',
    slug: 'multi-agent-patterns',
    title: {
      en: 'Multi-Agent Systems',
      fr: 'Systèmes multi-agents',
    },
    track: 'afternoon',
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
    difficulty: 'advanced',
    estimatedMinutes: 90,
    prerequisites: ['threat-modeling-workshop'],
  },

  // ── Sandbox — hands-on OPCP Explorer labs ─────────────────────────────────
  {
    id: 'install-bare-metal',
    slug: 'install-bare-metal',
    title: {
      en: 'Installation on Bare-Metal Ubuntu with Agentic AI',
      fr: "Installation sur Ubuntu Bare-Metal avec l'IA agentique",
    },
    track: 'sandbox',
    difficulty: 'beginner',
    estimatedMinutes: 45,
    prerequisites: [],
  },
  {
    id: 'starting-applications',
    slug: 'starting-applications',
    title: {
      en: 'Starting Applications with Agentic AI',
      fr: "Démarrage des applications avec l'IA agentique",
    },
    track: 'sandbox',
    difficulty: 'beginner',
    estimatedMinutes: 25,
    prerequisites: ['install-bare-metal'],
  },
  {
    id: 'stopping-applications',
    slug: 'stopping-applications',
    title: {
      en: 'Stopping Applications with Agentic AI',
      fr: "Arrêt des applications avec l'IA agentique",
    },
    track: 'sandbox',
    difficulty: 'beginner',
    estimatedMinutes: 25,
    prerequisites: ['starting-applications'],
  },
  {
    id: 'making-backups',
    slug: 'making-backups',
    title: {
      en: 'Making Backups with Agentic AI',
      fr: "Sauvegardes avec l'IA agentique",
    },
    track: 'sandbox',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    prerequisites: ['install-bare-metal'],
  },
  {
    id: 'modifying-applications',
    slug: 'modifying-applications',
    title: {
      en: 'Modifying Applications with Agentic AI',
      fr: "Modification d'applications avec l'IA agentique",
    },
    track: 'sandbox',
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    prerequisites: ['stopping-applications'],
  },
  {
    id: 'agent-control',
    slug: 'agent-control',
    title: {
      en: 'Controlling AI Agents',
      fr: 'Contrôle des agents IA',
    },
    track: 'sandbox',
    difficulty: 'advanced',
    estimatedMinutes: 35,
    prerequisites: ['modifying-applications'],
  },
  {
    id: 'adding-applications',
    slug: 'adding-applications',
    title: {
      en: 'Adding New Applications with Agentic AI (Annex – optional)',
      fr: "Ajout de nouvelles applications avec l'IA agentique (Annexe – facultatif)",
    },
    track: 'sandbox',
    difficulty: 'beginner',
    estimatedMinutes: 30,
    prerequisites: ['agent-control'],
  },
];

/** Track ordering used by track-scoped queries. */
const TRACK_ORDER = ['morning', 'afternoon', 'sandbox'];

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
