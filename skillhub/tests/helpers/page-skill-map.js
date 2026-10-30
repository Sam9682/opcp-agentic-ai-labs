import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Page_Skill_Map — the authoritative, ordered mapping of each Sandbox page to
 * its list of skills. This is the single source of truth shared by the
 * authoring tasks and the verification tests.
 *
 * Both locales (`skillhub/en/` and `skillhub/fr/`) use identical filenames, so
 * the map is keyed by basename only.
 *
 * NOTE (quiz & sandbox restructure): the seven former sandbox pages
 * (install-bare-metal, starting/stopping-applications, making-backups,
 * modifying-applications, adding-applications, agent-control) were consolidated
 * into the single `running-applications-lab.html` lab. All Skill_Sections that
 * previously lived across those pages now live, in the same relative order, on
 * that one page. `SPECIFY_FEATURE` (formerly on adding-applications) and the
 * duplicate `MODIFY_CODE` embed were dropped in the consolidation, so each
 * skill now appears exactly once.
 */
export const PAGE_SKILL_MAP = {
  'running-applications-lab.html': [
    'START_APP',
    'STOP_APP',
    'BACKUP_DATABASE',
    'RESTORE_DATABASE',
    'CLEAN_DATABASE',
    'MODIFY_CODE',
    'VERIFY_APP_COMPLIANCE',
    'MAKE_APP_COMPLIANT',
    'AGENTS_CONTROL',
    'STATUS_APP',
  ],
};

/** The two SkillHub locales. Pages exist under `skillhub/<locale>/`. */
export const LOCALES = ['en', 'fr'];

/**
 * Absolute path to the root of the canonical `shai` skill sources.
 *
 * Each skill's prompt lives at `<SKILLS_SOURCE_ROOT>/<SKILL>/SKILL.md`.
 *
 * The skills repository (`agentic-ai-plateform--skills`) is a sibling of this
 * workspace. From this helper file the layout is:
 *   skillhub/tests/helpers  ->  opcp-agentic-ai-labs (3 up)
 *   opcp-agentic-ai-labs    ->  workspace            (2 more up, via `forgejo`)
 * then down into `github/agentic-ai-plateform--skills/shai/skills`.
 */
export const SKILLS_SOURCE_ROOT = resolve(
  __dirname,
  '..', // tests
  '..', // skillhub
  '..', // opcp-agentic-ai-labs (workspace root)
  '..', // forgejo
  '..', // workspace
  'github',
  'agentic-ai-plateform--skills',
  'shai',
  'skills',
);

/**
 * Resolve the absolute `SKILL.md` source path for a given skill id.
 * @param {string} skillId e.g. 'START_APP'
 * @returns {string} absolute path to the skill's SKILL.md
 */
export function skillSourcePath(skillId) {
  return resolve(SKILLS_SOURCE_ROOT, skillId, 'SKILL.md');
}
