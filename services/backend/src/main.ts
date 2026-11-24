import { createDatabase } from '@wildself/data';
import { createInternalApi } from '@wildself/internal-api';

import { buildApi } from './api/app';
import { createAuthenticator } from './auth/authenticator';
import { ConfigError, loadConfig, readRole } from './config';
import { createLogger } from './observability/logger';
import { flushErrorReporting, initErrorReporting, reportError } from './observability/sentry';
import { startWorker } from './worker/worker';

/**
 * Entry point. One build, two roles (ARCHITECTURE.md §6.4):
 *   node dist/main.js --role=api     public HTTPS API
 *   node dist/main.js --role=worker  scheduler and midnight pipeline (one active copy)
 */
async function main(): Promise<void> {
  let config;
  try {
    config = loadConfig(readRole(process.argv, process.env), process.env);
  } catch (error) {
    if (error instanceof ConfigError) {
      // Fail fast and loudly. The message names settings, never their values.
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }

  initErrorReporting(config);
  const logger = createLogger(config);

  const db = createDatabase({
    url: config.database.url,
    ssl: config.database.ssl,
    maxConnections: config.database.maxConnections,
    applicationName: `wildself-${config.role}`,
  });
  const internalApi = createInternalApi(db);

  let stopRole: () => Promise<void>;
  if (config.role === 'api') {
    const app = await buildApi({
      config,
      internalApi,
      authenticator: createAuthenticator(config.authMode, config.env),
    });
    await app.listen({ host: config.http.host, port: config.http.port });
    stopRole = () => app.close();
  } else {
    const worker = startWorker({ internalApi, logger });
    stopRole = () => worker.stop();
  }
  logger.info({ env: config.env }, `${config.role} started`);

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'shutting down');
    const forceExit = setTimeout(() => {
      logger.error('shutdown took too long; exiting');
      process.exit(1);
    }, 15_000);
    forceExit.unref();
    try {
      await stopRole();
      await db.close();
      await flushErrorReporting();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // Nothing may fail silently: anything unexpected is logged, reported, and the process
  // exits so the host restarts it in a clean state.
  const crash = async (error: unknown, origin: string) => {
    logger.fatal({ err: error, origin }, 'fatal error');
    reportError(error, { origin });
    await flushErrorReporting();
    process.exit(1);
  };
  process.on('unhandledRejection', (reason) => void crash(reason, 'unhandledRejection'));
  process.on('uncaughtException', (error) => void crash(error, 'uncaughtException'));
}

void main();
