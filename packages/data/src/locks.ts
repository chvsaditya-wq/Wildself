import type { Database } from './client';

/**
 * Key of the session lock that makes exactly one worker the "leader" that runs
 * scheduled jobs (ARCHITECTURE.md §6.4). Any fixed 64-bit number works; this one
 * spells "WILDSELF" in ASCII.
 */
export const WORKER_LEADER_LOCK_KEY = 0x57494c4453454c46n;

export type SessionLock = {
  /** Runs a trivial query on the lock's own connection; throws if that connection is gone (and so is the lock). */
  verify(): Promise<void>;
  /** Unlocks and returns the connection to the pool. */
  release(): Promise<void>;
};

/**
 * Tries to take a PostgreSQL session-level advisory lock on a dedicated connection.
 * Returns null immediately if another process holds it.
 *
 * This uses PostgreSQL's built-in locking primitive for coordination only. It holds no
 * business rules, so it fits the "database never decides" rule (DB.md §1).
 * If the connection drops, PostgreSQL frees the lock automatically.
 */
export async function tryAcquireSessionLock(
  db: Database,
  key: bigint,
): Promise<SessionLock | null> {
  const reserved = await db.sql.reserve();
  try {
    const [row] = await reserved<{ locked: boolean }[]>`
      select pg_try_advisory_lock(${key.toString()}::bigint) as locked
    `;
    if (!row?.locked) {
      reserved.release();
      return null;
    }
  } catch (error) {
    reserved.release();
    throw error;
  }

  let released = false;
  return {
    verify: async () => {
      if (released) throw new Error('Session lock already released');
      await reserved`select 1`;
    },
    release: async () => {
      if (released) return;
      released = true;
      try {
        await reserved`select pg_advisory_unlock(${key.toString()}::bigint)`;
      } finally {
        reserved.release();
      }
    },
  };
}
