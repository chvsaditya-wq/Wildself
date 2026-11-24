import type { InternalApi } from '@wildself/internal-api';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApi } from '../src/api/app';
import { createAuthenticator } from '../src/auth/authenticator';
import { loadConfig } from '../src/config';

const USER = '0b6f3c1e-9a2d-4c3b-8e1f-2a7d5c9e0f11';

function fakeInternalApi(databaseOk = true): InternalApi {
  return {
    system: {
      checkDatabase: async () => (databaseOk ? { ok: true } : { ok: false, error: new Error('connection refused') }),
    },
    leadership: { tryAcquireWorkerLeadership: async () => null },
  };
}

let app: FastifyInstance | undefined;

async function makeApp(options: { databaseOk?: boolean; authMode?: 'deny-all' | 'dev-stub'; rateLimit?: number } = {}) {
  const config = loadConfig('api', {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://unused@localhost/unused',
    AUTH_MODE: options.authMode ?? 'dev-stub',
    RATE_LIMIT_PER_MINUTE: String(options.rateLimit ?? 100),
    BODY_LIMIT_BYTES: '2048',
  });
  app = await buildApi({
    config,
    internalApi: fakeInternalApi(options.databaseOk ?? true),
    authenticator: createAuthenticator(config.authMode, config.env),
  });
  return app;
}

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('health checks', () => {
  it('GET /health answers without login', async () => {
    const api = await makeApp({ authMode: 'deny-all' });
    const res = await api.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('GET /health/ready reports the database as reachable', async () => {
    const api = await makeApp();
    const res = await api.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', checks: { database: 'ok' } });
  });

  it('GET /health/ready answers 503 when the database is down, without leaking the cause', async () => {
    const api = await makeApp({ databaseOk: false });
    const res = await api.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({ status: 'unavailable', checks: { database: 'unavailable' } });
    expect(res.body).not.toContain('connection refused');
  });
});

describe('authentication', () => {
  it('protects every route by default', async () => {
    const api = await makeApp();
    const res = await api.inject({ method: 'GET', url: '/v1/session' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHENTICATED');
  });

  it('in deny-all mode, even a well-formed development token is refused', async () => {
    const api = await makeApp({ authMode: 'deny-all' });
    const res = await api.inject({
      method: 'GET',
      url: '/v1/session',
      headers: { authorization: `Bearer dev:${USER}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('takes the user id only from the verified credential', async () => {
    const api = await makeApp();
    const res = await api.inject({
      method: 'GET',
      url: '/v1/session',
      headers: { authorization: `Bearer dev:${USER}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ user: { id: USER } });
  });

  it('rejects malformed development tokens', async () => {
    const api = await makeApp();
    for (const header of ['Bearer dev:not-a-uuid', 'Bearer dev:', 'Basic abc', `dev:${USER}`]) {
      const res = await api.inject({ method: 'GET', url: '/v1/session', headers: { authorization: header } });
      expect(res.statusCode, header).toBe(401);
    }
  });

  it('answers 401, not 404, for unknown routes without login, so routes cannot be discovered', async () => {
    const api = await makeApp();
    const res = await api.inject({ method: 'GET', url: '/v1/does-not-exist' });
    expect(res.statusCode).toBe(401);
  });

  it('answers 404 for unknown routes once signed in', async () => {
    const api = await makeApp();
    const res = await api.inject({
      method: 'GET',
      url: '/v1/does-not-exist',
      headers: { authorization: `Bearer dev:${USER}` },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });

  it('refuses to create the development login in production', () => {
    expect(() => createAuthenticator('dev-stub', 'production')).toThrow();
  });
});

describe('request safety', () => {
  it('sends security headers on every response', async () => {
    const api = await makeApp();
    const res = await api.inject({ method: 'GET', url: '/health' });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('gives every response a request id, and reuses a valid incoming one', async () => {
    const api = await makeApp();
    const fresh = await api.inject({ method: 'GET', url: '/health' });
    expect(fresh.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);

    const incoming = '11111111-2222-4333-8444-555555555555';
    const reused = await api.inject({ method: 'GET', url: '/health', headers: { 'x-request-id': incoming } });
    expect(reused.headers['x-request-id']).toBe(incoming);
  });

  it('ignores a request id that could inject text into logs', async () => {
    const api = await makeApp();
    const res = await api.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-request-id': 'abc\n{"level":"fatal"}' },
    });
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('error bodies carry a code, a plain message and the request id', async () => {
    const api = await makeApp();
    const res = await api.inject({ method: 'GET', url: '/v1/session' });
    const body = res.json();
    expect(Object.keys(body.error).sort()).toEqual(['code', 'message', 'requestId']);
    expect(body.error.requestId).toBe(res.headers['x-request-id']);
  });

  it('rejects bodies over the size limit with 413', async () => {
    const api = await makeApp();
    const res = await api.inject({
      method: 'POST',
      url: '/v1/session',
      headers: { authorization: `Bearer dev:${USER}`, 'content-type': 'application/json' },
      payload: JSON.stringify({ filler: 'x'.repeat(4096) }),
    });
    expect(res.statusCode).toBe(413);
    expect(res.json().error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('rate-limits a single user with 429 and a stable error code', async () => {
    const api = await makeApp({ rateLimit: 3 });
    const call = () =>
      api.inject({ method: 'GET', url: '/v1/session', headers: { authorization: `Bearer dev:${USER}` } });
    for (let i = 0; i < 3; i++) expect((await call()).statusCode).toBe(200);
    const limited = await call();
    expect(limited.statusCode).toBe(429);
    expect(limited.json().error.code).toBe('RATE_LIMITED');
  });

  it('rate-limits callers without a login by IP too, so tokens cannot be guessed without limit', async () => {
    const api = await makeApp({ rateLimit: 3 });
    const call = () => api.inject({ method: 'GET', url: '/v1/session', headers: { authorization: 'Bearer guess' } });
    for (let i = 0; i < 3; i++) expect((await call()).statusCode).toBe(401);
    const limited = await call();
    expect(limited.statusCode).toBe(429);
    expect(limited.json().error.code).toBe('RATE_LIMITED');
  });

  it('rate-limits unknown routes without a login, so route probing is limited', async () => {
    const api = await makeApp({ rateLimit: 2 });
    const call = () => api.inject({ method: 'GET', url: '/v1/probe-' + Math.random() });
    for (let i = 0; i < 2; i++) expect((await call()).statusCode).toBe(401);
    expect((await call()).statusCode).toBe(429);
  });

  it('counts each signed-in user separately', async () => {
    const api = await makeApp({ rateLimit: 2 });
    const as = (id: string) =>
      api.inject({ method: 'GET', url: '/v1/session', headers: { authorization: `Bearer dev:${id}` } });
    const OTHER = '7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f';
    await as(USER);
    await as(USER);
    expect((await as(USER)).statusCode).toBe(429);
    expect((await as(OTHER)).statusCode).toBe(200);
  });

  it('hides internal details of unexpected errors', async () => {
    const api = await makeApp();
    api.get('/v1/explode', async () => {
      throw new Error('secret internal detail: table users missing');
    });
    const res = await api.inject({
      method: 'GET',
      url: '/v1/explode',
      headers: { authorization: `Bearer dev:${USER}` },
    });
    expect(res.statusCode).toBe(500);
    expect(res.json().error.code).toBe('INTERNAL');
    expect(res.body).not.toContain('secret internal detail');
  });
});
