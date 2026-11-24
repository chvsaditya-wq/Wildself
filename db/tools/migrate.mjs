// Applies database migrations (DB.md §9). Forward-only: there is no "down" here on purpose.
// Always runs the no-logic check first, and takes PostgreSQL's advisory lock so two
// deploys can never migrate at the same time.
//
//   npm run db:migrate            apply pending migrations to DATABASE_URL
//   npm run db:migrate -- --dry   print the SQL without running it
//
// Settings come from the environment, or from services/backend/.env when present.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const ENV_FILE = 'services/backend/.env';
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

const [command = 'up', ...rest] = process.argv.slice(2);
if (command !== 'up') {
  console.error(`Only "up" is supported. Migrations are forward-only (DB.md §9); got "${command}".`);
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. See db/local-setup.md.');
  process.exit(1);
}

const run = (cmd, args) => {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run('node', ['db/tools/check-migrations.mjs', 'db/migrations']);
run('npx', [
  'node-pg-migrate',
  'up',
  '--migrations-dir',
  'db/migrations',
  '--migration-file-language',
  'sql',
  '--check-order',
  ...(rest.includes('--dry') ? ['--dry-run'] : []),
]);
