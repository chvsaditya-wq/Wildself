import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createDatabase,
  pingDatabase,
  tryAcquireSessionLock,
  type Database,
} from '../src/index';

/**
 * Integration tests against a real PostgreSQL (DB.md §9: data-layer tests on a real database).
 * They need TEST_DATABASE_URL (see db/local-setup.md). Without it they are skipped, and the
 * reason is printed, so a skip is never mistaken for a pass.
 */
const envFile = resolve(import.meta.dirname, '../../../services/backend/.env');
if (!process.env.TEST_DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile);

const url = process.env.TEST_DATABASE_URL;
const databaseName = url ? new URL(url).pathname.slice(1) : '';

if (!url) {
  console.warn('\n⚠ SKIPPED data-layer integration tests: TEST_DATABASE_URL is not set (see db/local-setup.md).\n');
} else if (!/test/i.test(databaseName)) {
  throw new Error(
    `Refusing to run integration tests against "${databaseName}": the database name must contain "test".`,
  );
}

const TEST_LOCK_KEY = 4242n;

describe.skipIf(!url)('data layer on a real PostgreSQL', () => {
  let db: Database;
  let other: Database;

  beforeAll(() => {
    db = createDatabase({ url: url!, applicationName: 'wildself-test', ssl: 'disable', maxConnections: 4 });
    other = createDatabase({ url: url!, applicationName: 'wildself-test-2', ssl: 'disable', maxConnections: 2 });
  });

  afterAll(async () => {
    await db?.close();
    await other?.close();
  });

  it('reaches the database', async () => {
    await expect(pingDatabase(db)).resolves.toBeUndefined();
  });

  it('works in UTC on every connection', async () => {
    const [row] = await db.sql<{ tz: string }[]>`select current_setting('TimeZone') as tz`;
    expect(row?.tz).toBe('UTC');
  });

  it('cancels a query that runs past the timeout instead of hanging', async () => {
    const fast = createDatabase({
      url: url!,
      applicationName: 'wildself-test-timeout',
      ssl: 'disable',
      maxConnections: 1,
      queryTimeoutSeconds: 1,
    });
    try {
      await expect(fast.sql`select pg_sleep(3)`).rejects.toThrow();
    } finally {
      await fast.close();
    }
  });

  it('lets only one process hold the worker lock at a time', async () => {
    const first = await tryAcquireSessionLock(db, TEST_LOCK_KEY);
    expect(first).not.toBeNull();

    const second = await tryAcquireSessionLock(other, TEST_LOCK_KEY);
    expect(second).toBeNull();

    await first!.verify();
    await first!.release();

    const third = await tryAcquireSessionLock(other, TEST_LOCK_KEY);
    expect(third).not.toBeNull();
    await third!.release();
  });

  it('frees the lock automatically when the holding connection dies, and the holder notices', async () => {
    const crashing = createDatabase({ url: url!, applicationName: 'wildself-test-crash', ssl: 'disable', maxConnections: 1 });
    try {
      const held = await tryAcquireSessionLock(crashing, TEST_LOCK_KEY);
      expect(held).not.toBeNull();

      // Simulate a crash or network cut: the server kills the holder's connection
      // (no polite unlock). Waits up to 5 s for that backend to actually exit.
      const [killed] = await other.sql<{ n: number }[]>`
        select count(*)::int as n from (
          select pg_terminate_backend(pid, 5000) from pg_stat_activity
          where application_name = 'wildself-test-crash' and usename = current_user
        ) t
      `;
      expect(killed?.n).toBe(1);

      // The old holder's guard check must now fail, so its scheduler would step down.
      await expect(held!.verify()).rejects.toThrow();

      // And the lock is free for another worker.
      const taken = await tryAcquireSessionLock(db, TEST_LOCK_KEY);
      expect(taken).not.toBeNull();
      await taken!.release();
    } finally {
      await crashing.close();
    }
  });

  it('a released lock cannot be verified again', async () => {
    const lock = await tryAcquireSessionLock(db, TEST_LOCK_KEY);
    await lock!.release();
    await expect(lock!.verify()).rejects.toThrow();
  });
});
