// CI guard for DB.md §1 rule 2: the database holds data, never logic.
// Fails if any migration creates functions, procedures, triggers, rules, scheduled jobs
// or runs procedural code. Usage: node db/tools/check-migrations.mjs <migrations-dir>
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FORBIDDEN = [
  { pattern: /\bcreate\s+(or\s+replace\s+)?function\b/i, reason: 'stored functions hold logic' },
  { pattern: /\bcreate\s+(or\s+replace\s+)?procedure\b/i, reason: 'stored procedures hold logic' },
  { pattern: /\bcreate\s+(or\s+replace\s+)?(constraint\s+)?trigger\b/i, reason: 'triggers hide side effects' },
  { pattern: /\bcreate\s+event\s+trigger\b/i, reason: 'event triggers hide side effects' },
  { pattern: /\bcreate\s+(or\s+replace\s+)?rule\b/i, reason: 'rules rewrite queries invisibly' },
  { pattern: /\bdo\s+(language\s+\w+\s+)?\$\w*\$/i, reason: 'anonymous code blocks are procedural logic' },
  { pattern: /\bpg_cron\b|\bcron\.schedule\b/i, reason: 'scheduled jobs belong in the worker' },
  { pattern: /\blanguage\s+(plpgsql|plv8|plpython\w*|plperl\w*|sql)\b/i, reason: 'procedural languages hold logic' },
  { pattern: /\bgenerated\s+always\s+as\s*\(/i, reason: 'generated columns compute values (use engines)' },
];

/** Removes SQL comments so commented-out examples don't trigger the check. */
export function stripComments(sql) {
  return sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Returns one finding per forbidden construct in the given SQL text. */
export function findForbidden(sql) {
  const clean = stripComments(sql);
  return FORBIDDEN.filter(({ pattern }) => pattern.test(clean)).map(({ pattern, reason }) => ({
    match: clean.match(pattern)?.[0] ?? '',
    reason,
  }));
}

function main(dir) {
  const files = readdirSync(dir).filter((file) => file.endsWith('.sql')).sort();
  let failures = 0;
  for (const file of files) {
    for (const finding of findForbidden(readFileSync(join(dir, file), 'utf8'))) {
      failures += 1;
      console.error(`✗ ${file}: "${finding.match.trim()}" is not allowed: ${finding.reason}`);
    }
  }
  if (failures > 0) {
    console.error(`\n${failures} problem(s). The database stores data only (DB.md §1).`);
    process.exit(1);
  }
  console.log(`✓ ${files.length} migration file(s) checked: no logic in the database.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv[2] ?? 'db/migrations');
}
