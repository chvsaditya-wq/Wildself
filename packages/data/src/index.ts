/**
 * Layer 4: the only code that talks to PostgreSQL (DB.md §1).
 * Only services/backend (through @wildself/internal-api or its public API routes)
 * may import this package. Engines never do.
 */
export { createDatabase, type Database, type DatabaseOptions, type Sql } from './client';
export { pingDatabase } from './system';
export { tryAcquireSessionLock, WORKER_LEADER_LOCK_KEY, type SessionLock } from './locks';
