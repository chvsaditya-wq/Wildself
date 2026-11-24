import type { LivenessResponse, ReadinessResponse } from '@wildself/contracts';
import type { InternalApi } from '@wildself/internal-api';
import type { FastifyPluginAsync } from 'fastify';

import { reportError } from '../../observability/sentry';

/**
 * Health checks for the host and the uptime monitor (ARCHITECTURE.md §8.1).
 * - GET /health        the process is up (no dependencies checked)
 * - GET /health/ready  the process can serve traffic: database reachable
 * These are the only public routes.
 */
export const healthRoutes: FastifyPluginAsync<{ internalApi: InternalApi }> = async (app, { internalApi }) => {
  app.get('/health', { config: { public: true } }, async (): Promise<LivenessResponse> => ({ status: 'ok' }));

  app.get('/health/ready', { config: { public: true } }, async (request, reply) => {
    const database = await internalApi.system.checkDatabase();
    if (database.ok) {
      const body: ReadinessResponse = { status: 'ok', checks: { database: 'ok' } };
      return body;
    }
    // Never silent: logged with the cause and reported, while the caller only sees "unavailable".
    request.log.error({ err: database.error }, 'readiness check failed: database unreachable');
    reportError(database.error, { check: 'database' });
    const body: ReadinessResponse = { status: 'unavailable', checks: { database: 'unavailable' } };
    return reply.code(503).send(body);
  });
};
