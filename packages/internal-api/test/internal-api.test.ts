import type { Database } from '@wildself/data';
import { describe, expect, it } from 'vitest';

import { createInternalApi } from '../src/index';

/** A stand-in database whose queries either succeed or fail, without PostgreSQL. */
function fakeDatabase(behaviour: 'up' | 'down'): Database {
  const sql = (() =>
    behaviour === 'up' ? Promise.resolve([]) : Promise.reject(new Error('connect ECONNREFUSED'))) as unknown as Database['sql'];
  return { sql, close: async () => undefined };
}

describe('internal API: system.checkDatabase', () => {
  it('reports a reachable database as ok', async () => {
    const api = createInternalApi(fakeDatabase('up'));
    await expect(api.system.checkDatabase()).resolves.toEqual({ ok: true });
  });

  it('turns a failure into a result instead of throwing, and keeps the cause for logging', async () => {
    const api = createInternalApi(fakeDatabase('down'));
    const result = await api.system.checkDatabase();
    expect(result.ok).toBe(false);
    expect(result.ok === false && String(result.error)).toContain('ECONNREFUSED');
  });
});
