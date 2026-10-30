import { describe, it, expect } from 'vitest';
import {
  lessons,
  getLessonBySlug,
  getLessonsByDifficulty,
  getLessonsByTrack,
  getPrerequisiteChain,
} from '../js/lessons.js';

// Section I.1 — Introduction & Fundamentals (track 'morning')
const SECTION_1_INTRO_SLUGS = [
  'assistant-vs-agent',
  'agent-anatomy-7-components',
  'agentic-loop-and-variants',
  'stopping-criteria',
];

// Section I.2 — Design & Governance (track 'afternoon')
const SECTION_1_DESIGN_SLUGS = [
  'multi-agent-patterns',
  'when-not-multi-agent',
  'guardrails-5-layers',
  'human-in-the-loop-ovhcloud-policy',
  'threat-modeling-workshop',
  'agent-design-capstone',
  'configuring-shai-mcp-opcp-explorer',
];

// Section II — Quiz (track 'quiz')
const SECTION_2_QUIZ_SLUGS = ['quiz-fundamentals'];

// Section III — Sandbox Labs (track 'sandbox')
const SECTION_3_LAB_SLUGS = ['shai-orchestrator-lab', 'running-applications-lab'];

const TOTAL_LESSON_COUNT = 14;

describe('Lesson Catalog', () => {
  describe('lessons data structure', () => {
    it('contains exactly the 14 restructured catalog entries', () => {
      expect(lessons).toHaveLength(TOTAL_LESSON_COUNT);
      expect(
        SECTION_1_INTRO_SLUGS.length +
          SECTION_1_DESIGN_SLUGS.length +
          SECTION_2_QUIZ_SLUGS.length +
          SECTION_3_LAB_SLUGS.length
      ).toBe(TOTAL_LESSON_COUNT);
    });

    it('each lesson has all required fields', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      const validTracks = ['morning', 'afternoon', 'sandbox', 'quiz'];

      for (const lesson of lessons) {
        expect(lesson).toHaveProperty('id');
        expect(lesson).toHaveProperty('slug');
        expect(lesson).toHaveProperty('title');
        expect(lesson.title).toHaveProperty('en');
        expect(lesson.title).toHaveProperty('fr');
        expect(validTracks).toContain(lesson.track);
        expect(validDifficulties).toContain(lesson.difficulty);
        expect(lesson.estimatedMinutes).toBeGreaterThanOrEqual(1);
        expect(lesson.estimatedMinutes).toBeLessThanOrEqual(480);
        expect(Array.isArray(lesson.prerequisites)).toBe(true);
      }
    });

    it('all prerequisite ids reference existing lessons', () => {
      const ids = lessons.map((l) => l.id);
      for (const lesson of lessons) {
        for (const prereq of lesson.prerequisites) {
          expect(ids).toContain(prereq);
        }
      }
    });

    it('each lesson has a unique id', () => {
      const ids = lessons.map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('each lesson has a unique slug', () => {
      const slugs = lessons.map((l) => l.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it('includes every Section I.1 (intro) lesson', () => {
      for (const slug of SECTION_1_INTRO_SLUGS) {
        expect(getLessonBySlug(slug)).toBeDefined();
      }
    });

    it('includes every Section I.2 (design) lesson', () => {
      for (const slug of SECTION_1_DESIGN_SLUGS) {
        expect(getLessonBySlug(slug)).toBeDefined();
      }
    });

    it('includes the Section II quiz and the Section III labs', () => {
      for (const slug of [...SECTION_2_QUIZ_SLUGS, ...SECTION_3_LAB_SLUGS]) {
        expect(getLessonBySlug(slug)).toBeDefined();
      }
    });
  });

  describe('getLessonBySlug()', () => {
    it('returns the correct lesson for a valid slug', () => {
      const lesson = getLessonBySlug('running-applications-lab');
      expect(lesson).toBeDefined();
      expect(lesson.id).toBe('running-applications-lab');
      expect(lesson.title.en).toBe('Lab: OPCP-EXPLORER Running Applications');
    });

    it('returns undefined for a non-existent slug', () => {
      expect(getLessonBySlug('non-existent')).toBeUndefined();
    });

    it('returns the first agentic lesson with no prerequisites', () => {
      const lesson = getLessonBySlug('assistant-vs-agent');
      expect(lesson).toBeDefined();
      expect(lesson.track).toBe('morning');
      expect(lesson.prerequisites).toEqual([]);
    });
  });

  describe('getLessonsByDifficulty()', () => {
    it('returns only lessons of the requested difficulty', () => {
      for (const difficulty of ['beginner', 'intermediate', 'advanced']) {
        const group = getLessonsByDifficulty(difficulty);
        expect(group.length).toBeGreaterThan(0);
        group.forEach((l) => expect(l.difficulty).toBe(difficulty));
      }
    });

    it('returns empty array for invalid difficulty', () => {
      expect(getLessonsByDifficulty('expert')).toEqual([]);
    });
  });

  describe('getLessonsByTrack()', () => {
    it('returns Section I.1 (morning) lessons in programme order', () => {
      const morning = getLessonsByTrack('morning');
      expect(morning.map((l) => l.slug)).toEqual(SECTION_1_INTRO_SLUGS);
    });

    it('returns Section I.2 (afternoon) lessons in programme order', () => {
      const afternoon = getLessonsByTrack('afternoon');
      expect(afternoon.map((l) => l.slug)).toEqual(SECTION_1_DESIGN_SLUGS);
    });

    it('returns the quiz track', () => {
      const quiz = getLessonsByTrack('quiz');
      expect(quiz.map((l) => l.slug)).toEqual(SECTION_2_QUIZ_SLUGS);
    });

    it('returns sandbox labs', () => {
      const sandbox = getLessonsByTrack('sandbox');
      expect(sandbox.map((l) => l.slug)).toEqual(SECTION_3_LAB_SLUGS);
    });

    it('returns empty array for an unknown track', () => {
      expect(getLessonsByTrack('evening')).toEqual([]);
    });
  });

  describe('getPrerequisiteChain()', () => {
    it('returns empty array for lesson with no prerequisites', () => {
      expect(getPrerequisiteChain('assistant-vs-agent')).toEqual([]);
    });

    it('returns direct prerequisite for single-depth dependency', () => {
      expect(getPrerequisiteChain('agent-anatomy-7-components')).toEqual([
        'assistant-vs-agent',
      ]);
    });

    it('returns the full Section I.1 chain in topological order', () => {
      expect(getPrerequisiteChain('stopping-criteria')).toEqual([
        'assistant-vs-agent',
        'agent-anatomy-7-components',
        'agentic-loop-and-variants',
      ]);
    });

    it('links the design capstone back through the whole programme', () => {
      const chain = getPrerequisiteChain('agent-design-capstone');
      expect(chain).toEqual([
        'assistant-vs-agent',
        'agent-anatomy-7-components',
        'agentic-loop-and-variants',
        'stopping-criteria',
        'multi-agent-patterns',
        'when-not-multi-agent',
        'guardrails-5-layers',
        'human-in-the-loop-ovhcloud-policy',
        'threat-modeling-workshop',
      ]);
    });

    it('fans the quiz out of the design capstone', () => {
      const chain = getPrerequisiteChain('quiz-fundamentals');
      expect(chain).toEqual([
        'assistant-vs-agent',
        'agent-anatomy-7-components',
        'agentic-loop-and-variants',
        'stopping-criteria',
        'multi-agent-patterns',
        'when-not-multi-agent',
        'guardrails-5-layers',
        'human-in-the-loop-ovhcloud-policy',
        'threat-modeling-workshop',
        'agent-design-capstone',
      ]);
    });

    it('threads the configuring lesson through the design capstone', () => {
      const chain = getPrerequisiteChain('configuring-shai-mcp-opcp-explorer');
      expect(chain).toEqual([
        'assistant-vs-agent',
        'agent-anatomy-7-components',
        'agentic-loop-and-variants',
        'stopping-criteria',
        'multi-agent-patterns',
        'when-not-multi-agent',
        'guardrails-5-layers',
        'human-in-the-loop-ovhcloud-policy',
        'threat-modeling-workshop',
        'agent-design-capstone',
      ]);
    });

    it('threads the shai orchestrator lab through the configuring lesson', () => {
      const chain = getPrerequisiteChain('shai-orchestrator-lab');
      expect(chain).toEqual([
        'assistant-vs-agent',
        'agent-anatomy-7-components',
        'agentic-loop-and-variants',
        'stopping-criteria',
        'multi-agent-patterns',
        'when-not-multi-agent',
        'guardrails-5-layers',
        'human-in-the-loop-ovhcloud-policy',
        'threat-modeling-workshop',
        'agent-design-capstone',
        'configuring-shai-mcp-opcp-explorer',
      ]);
    });

    it('extends the running-applications lab through the shai orchestrator lab', () => {
      const chain = getPrerequisiteChain('running-applications-lab');
      expect(chain).toEqual([
        'assistant-vs-agent',
        'agent-anatomy-7-components',
        'agentic-loop-and-variants',
        'stopping-criteria',
        'multi-agent-patterns',
        'when-not-multi-agent',
        'guardrails-5-layers',
        'human-in-the-loop-ovhcloud-policy',
        'threat-modeling-workshop',
        'agent-design-capstone',
        'configuring-shai-mcp-opcp-explorer',
        'shai-orchestrator-lab',
      ]);
    });

    it('returns empty array for non-existent lesson', () => {
      expect(getPrerequisiteChain('non-existent')).toEqual([]);
    });

    it('does not include the lesson itself in the chain', () => {
      const chain = getPrerequisiteChain('shai-orchestrator-lab');
      expect(chain).not.toContain('shai-orchestrator-lab');
    });

    it('produces no duplicate entries in the chain', () => {
      const chain = getPrerequisiteChain('running-applications-lab');
      const uniqueChain = [...new Set(chain)];
      expect(chain).toEqual(uniqueChain);
    });

    it('returns prerequisites in correct topological order (earliest first)', () => {
      const chain = getPrerequisiteChain('stopping-criteria');
      const a = chain.indexOf('assistant-vs-agent');
      const b = chain.indexOf('agent-anatomy-7-components');
      const c = chain.indexOf('agentic-loop-and-variants');
      expect(a).toBeLessThan(b);
      expect(b).toBeLessThan(c);
    });
  });

  describe('lesson catalog integrity', () => {
    it('all lessons have integer estimatedMinutes values', () => {
      for (const lesson of lessons) {
        expect(Number.isInteger(lesson.estimatedMinutes)).toBe(true);
      }
    });

    it('no lesson has itself as a prerequisite', () => {
      for (const lesson of lessons) {
        expect(lesson.prerequisites).not.toContain(lesson.id);
      }
    });

    it('the prerequisite graph is acyclic (no circular dependencies)', () => {
      const visited = new Set();
      const stack = new Set();

      function hasCycle(id) {
        if (stack.has(id)) return true;
        if (visited.has(id)) return false;
        visited.add(id);
        stack.add(id);
        const lesson = lessons.find((l) => l.id === id);
        if (lesson) {
          for (const prereq of lesson.prerequisites) {
            if (hasCycle(prereq)) return true;
          }
        }
        stack.delete(id);
        return false;
      }

      for (const lesson of lessons) {
        expect(hasCycle(lesson.id)).toBe(false);
      }
    });

    it('every lesson belongs to a known track', () => {
      const valid = ['morning', 'afternoon', 'sandbox', 'quiz'];
      for (const lesson of lessons) {
        expect(valid).toContain(lesson.track);
      }
    });

    it('all difficulty values are one of the valid enum values', () => {
      const valid = ['beginner', 'intermediate', 'advanced'];
      for (const lesson of lessons) {
        expect(valid).toContain(lesson.difficulty);
      }
    });

    it('all titles have non-empty en and fr values', () => {
      for (const lesson of lessons) {
        expect(lesson.title.en.length).toBeGreaterThan(0);
        expect(lesson.title.fr.length).toBeGreaterThan(0);
      }
    });

    it('has no orphaned lessons (every lesson is either a root or reachable in a chain)', () => {
      // A lesson is "connected" if it has prerequisites or is a prerequisite of
      // another lesson. The root (assistant-vs-agent) is allowed.
      const referenced = new Set();
      for (const lesson of lessons) {
        for (const prereq of lesson.prerequisites) {
          referenced.add(prereq);
        }
      }
      for (const lesson of lessons) {
        const isConnected =
          lesson.prerequisites.length > 0 || referenced.has(lesson.id);
        expect(isConnected).toBe(true);
      }
    });
  });
});
