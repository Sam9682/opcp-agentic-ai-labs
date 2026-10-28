/**
 * One-time baseline generator for the SkillHub encoding-char-fix preservation
 * tests (spec: skillhub-encoding-char-fix, Task 2 / Property 2).
 *
 * Observation-first methodology: this script is run ONCE against the UNFIXED
 * corpus to capture the pre-fix state that the fix must preserve. Its output,
 * `encoding-char-fix-baseline.json`, is committed as a fixture and read by the
 * preservation property test. After the fix, the test re-reads the on-disk
 * files and asserts they still match this frozen baseline for every input where
 * the bug condition does NOT hold (clean files, and clean lines of affected
 * files).
 *
 * What it records, per file under skillhub/fr/ and skillhub/en/:
 *   - rel: locale/name relative path
 *   - affected: whether the file currently contains >=1 U+FFFD
 *   - byteLength / sha256: whole-file byte identity (for clean-file immutability)
 *   - lines: 1-based line -> { text, clean } for every line; `clean` is true
 *       when the line contains no U+FFFD. The test compares only clean lines of
 *       affected files (clean byte-range preservation), and all lines of clean
 *       files (which are all clean by definition).
 *   - charsetLine: the exact `<meta charset=...>` line text (charset invariant)
 *
 * Run (inside WSL, from repo root):
 *   node skillhub/tests/helpers/generate-encoding-baseline.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const REPLACEMENT = '\uFFFD';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// skillhub/tests/helpers -> skillhub
const SKILLHUB_ROOT = path.resolve(__dirname, '..', '..');
const LOCALES = ['fr', 'en'];
const OUT = path.resolve(__dirname, '..', 'fixtures', 'encoding-char-fix-baseline.json');

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function build() {
  const files = {};
  let affectedCount = 0;
  let cleanCount = 0;

  for (const loc of LOCALES) {
    const dir = path.join(SKILLHUB_ROOT, loc);
    for (const name of fs.readdirSync(dir).sort()) {
      if (!name.endsWith('.html')) continue;
      const abs = path.join(dir, name);
      const bytes = fs.readFileSync(abs);
      const text = bytes.toString('utf8');
      const rel = `${loc}/${name}`;
      const affected = text.includes(REPLACEMENT);
      if (affected) affectedCount += 1;
      else cleanCount += 1;

      // Preserve EOLs exactly by splitting on \n and keeping any trailing \r in
      // the line text so reconstruction / comparison is faithful.
      const rawLines = text.split('\n');
      const lines = rawLines.map((lineText, i) => ({
        n: i + 1,
        text: lineText,
        clean: !lineText.includes(REPLACEMENT),
      }));

      const charsetLineObj = lines.find((l) => /<meta\s+charset=/i.test(l.text));

      files[rel] = {
        rel,
        affected,
        byteLength: bytes.length,
        sha256: sha256(bytes),
        charsetLine: charsetLineObj ? charsetLineObj.text : null,
        lineCount: lines.length,
        lines,
      };
    }
  }

  return {
    _comment:
      'Pre-fix baseline for skillhub-encoding-char-fix Property 2 (Preservation). ' +
      'Captured from the UNFIXED corpus. Do not regenerate after the fix.',
    generatedAtPhase: 'pre-fix',
    replacementCharacter: 'U+FFFD',
    totals: {
      files: Object.keys(files).length,
      affected: affectedCount,
      clean: cleanCount,
    },
    files,
  };
}

const baseline = build();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(baseline, null, 2) + '\n', 'utf8');

// eslint-disable-next-line no-console
console.log(
  `Baseline written to ${path.relative(SKILLHUB_ROOT, OUT)}\n` +
    `  files=${baseline.totals.files} affected=${baseline.totals.affected} clean=${baseline.totals.clean}`,
);
