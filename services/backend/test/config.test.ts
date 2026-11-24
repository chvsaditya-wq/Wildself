import { describe, expect, it } from 'vitest';

import { ConfigError, loadConfig, readRole } from '../src/config';

const base = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgres://user:pw@localhost:5432/wildself_dev',
};

const production = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://user:pw@db.example.com:5432/wildself',
  SENTRY_DSN: 'https://public@o0.ingest.sentry.io/1',
};

function problems(env: Record<string, string>): string[] {
  try {
    loadConfig('api', env);
  } catch (error) {
    if (error instanceof ConfigError) return error.problems;
    throw error;
  }
  return [];
}

describe('readRole', () => {
  it('reads --role from the command line first', () => {
    expect(readRole(['node', 'main.js', '--role=worker'], { ROLE: 'api' })).toBe('worker');
  });
  it('falls back to the ROLE variable', () => {
    expect(readRole(['node', 'main.js'], { ROLE: 'api' })).toBe('api');
  });
  it('refuses anything else', () => {
    expect(() => readRole(['node', 'main.js', '--role=admin'], {})).toThrow(ConfigError);
    expect(() => readRole(['node', 'main.js'], {})).toThrow(ConfigError);
  });
});

describe('loadConfig', () => {
  it('applies safe defaults for local development', () => {
    const config = loadConfig('api', base);
    expect(config.authMode).toBe('deny-all');
    expect(config.database.ssl).toBe('disable');
    expect(config.http.host).toBe('127.0.0.1');
    expect(config.http.bodyLimitBytes).toBe(262_144);
  });

  it('turns database TLS on by default in production', () => {
    expect(loadConfig('api', production).database.ssl).toBe('require');
  });

  it('refuses to start without a database URL', () => {
    expect(problems({ NODE_ENV: 'development' }).join()).toMatch(/DATABASE_URL/);
  });

  it('refuses a database URL that is not PostgreSQL', () => {
    expect(problems({ ...base, DATABASE_URL: 'mysql://x' }).join()).toMatch(/DATABASE_URL/);
  });

  it('never allows the development login in production', () => {
    expect(problems({ ...production, AUTH_MODE: 'dev-stub' }).join()).toMatch(/AUTH_MODE/);
  });

  it('never allows an unencrypted database connection in production', () => {
    expect(problems({ ...production, DATABASE_SSL: 'disable' }).join()).toMatch(/DATABASE_SSL/);
  });

  it('requires error reporting in production, so failures are never silent', () => {
    const { SENTRY_DSN: _omit, ...withoutSentry } = production;
    expect(problems(withoutSentry).join()).toMatch(/SENTRY_DSN/);
  });

  it('never echoes secret values in its error messages', () => {
    const secret = 'postgres://user:SUPER-SECRET@localhost/x';
    const messages = problems({ ...production, DATABASE_URL: secret, AUTH_MODE: 'dev-stub' }).join(' ');
    expect(messages).not.toContain('SUPER-SECRET');
  });
});
