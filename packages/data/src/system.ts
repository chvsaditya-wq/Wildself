import type { Database } from './client';

/**
 * Smallest possible round trip to the database. Throws if it is unreachable;
 * the caller decides what that means.
 */
export async function pingDatabase(db: Database): Promise<void> {
  await db.sql`select 1`;
}
