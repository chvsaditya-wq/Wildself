import * as Sentry from '@sentry/node';

import type { Config } from '../config';

/**
 * Error reporting. Active only when SENTRY_DSN is set (required in production by config).
 *
 * Privacy: Sentry 11 collects user info, cookies, headers, request bodies, query strings,
 * database values and local variables by default. This app holds private habits and
 * journal entries, so every one of those is switched off. Reports carry only the error,
 * its stack trace, and the tags we add (request id, route, job).
 */
let enabled = false;

export function initErrorReporting(config: Config): void {
  if (!config.sentry.dsn) return;
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.env,
    release: config.sentry.release,
    tracesSampleRate: 0,
    initialScope: { tags: { role: config.role } },
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
    },
  });
  enabled = true;
}

export function reportError(error: unknown, context: Record<string, string | number | boolean> = {}): void {
  if (!enabled) return;
  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(context)) scope.setTag(key, String(value));
    Sentry.captureException(error);
  });
}

/**
 * Tells Sentry Crons that a scheduled job started or finished. If the worker stops,
 * Sentry alerts because the expected check-in never arrives: the scheduler cannot fail silently.
 */
export function reportCheckInStarted(monitorSlug: string): string | undefined {
  if (!enabled) return undefined;
  return Sentry.captureCheckIn({ monitorSlug, status: 'in_progress' });
}

export function reportCheckInFinished(
  monitorSlug: string,
  status: 'ok' | 'error',
  checkInId: string | undefined,
): void {
  if (!enabled) return;
  if (checkInId) {
    Sentry.captureCheckIn({ monitorSlug, status, checkInId });
  } else {
    Sentry.captureCheckIn({ monitorSlug, status });
  }
}

export async function flushErrorReporting(): Promise<void> {
  if (enabled) await Sentry.flush(2000);
}
