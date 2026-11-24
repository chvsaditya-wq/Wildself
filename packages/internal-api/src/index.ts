import {
  pingDatabase,
  tryAcquireSessionLock,
  WORKER_LEADER_LOCK_KEY,
  type Database,
  type SessionLock,
} from '@wildself/data';

/**
 * Layer 3 (internal): the one interface through which the worker and the engines reach
 * the data layer (ARCHITECTURE.md §6.4). It routes calls; it never calculates.
 *
 * Engines will depend on this *type* only, and receive an implementation at start-up,
 * so they can be tested against a fake without a database.
 * Phase 0 contains the infrastructure calls; each later phase adds its own operations.
 */
export type CheckResult = { ok: true } | { ok: false; error: unknown };

export type InternalApi = {
  system: {
    /** Is the database reachable? Never throws: failures come back as `{ ok: false, error }`. */
    checkDatabase(): Promise<CheckResult>;
  };
  leadership: {
    /**
     * Tries to become the single active worker. Returns null if another worker leads.
     * The returned lock must be verified each tick and released on shutdown.
     */
    tryAcquireWorkerLeadership(): Promise<SessionLock | null>;
  };
};

export function createInternalApi(db: Database): InternalApi {
  return {
    system: {
      checkDatabase: async () => {
        try {
          await pingDatabase(db);
          return { ok: true };
        } catch (error) {
          return { ok: false, error };
        }
      },
    },
    leadership: {
      tryAcquireWorkerLeadership: () => tryAcquireSessionLock(db, WORKER_LEADER_LOCK_KEY),
    },
  };
}

export type { SessionLock } from '@wildself/data';
