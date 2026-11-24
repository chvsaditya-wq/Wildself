import { pino, type Logger, type LoggerOptions } from 'pino';

import type { Config } from '../config';

/**
 * Structured JSON logs. Login tokens, cookies and anything named like a secret are
 * replaced with "[redacted]" before a line is written.
 */
export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'headers.cookie',
  '*.password',
  '*.token',
  '*.secret',
  'DATABASE_URL',
];

export function loggerOptions(config: Pick<Config, 'env' | 'logLevel' | 'role'>): LoggerOptions {
  return {
    level: config.env === 'test' ? 'silent' : config.logLevel,
    base: { role: config.role },
    redact: { paths: REDACT_PATHS, censor: '[redacted]' },
    // Human-readable lines locally; plain JSON everywhere else for the log service.
    ...(config.env === 'development'
      ? { transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss' } } }
      : {}),
  };
}

export function createLogger(config: Pick<Config, 'env' | 'logLevel' | 'role'>): Logger {
  return pino(loggerOptions(config));
}

export type { Logger };
