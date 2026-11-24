import { randomUUID } from 'node:crypto';

import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ErrorCode, type ErrorResponse } from '@wildself/contracts';
import type { InternalApi } from '@wildself/internal-api';
import Fastify, { type FastifyError, type FastifyInstance, type FastifyRequest } from 'fastify';

import type { AuthenticatedUser, Authenticator } from '../auth/authenticator';
import type { Config } from '../config';
import { loggerOptions } from '../observability/logger';
import { reportError } from '../observability/sentry';

import { AppError, errors } from './errors';
import { healthRoutes } from './routes/health';
import { sessionRoutes } from './routes/session';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by the auth hook on protected routes. Never read user ids from the body. */
    user: AuthenticatedUser | null;
  }
  interface FastifyContextConfig {
    /** Routes are protected unless marked public (only health checks are). */
    public?: boolean;
  }
}

export type ApiDependencies = {
  config: Config;
  internalApi: InternalApi;
  authenticator: Authenticator;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Builds the public API (role "api") without starting to listen, so tests can call it directly. */
export async function buildApi({ config, internalApi, authenticator }: ApiDependencies): Promise<FastifyInstance> {
  const app = Fastify({
    logger: loggerOptions(config),
    trustProxy: config.http.trustProxy,
    bodyLimit: config.http.bodyLimitBytes,
    // Every request gets an id that appears in logs, error reports and the response.
    // A client-sent id is reused only if it is a well-formed UUID, so it cannot inject text into logs.
    genReqId: (request) => {
      const incoming = request.headers['x-request-id'];
      return typeof incoming === 'string' && UUID.test(incoming) ? incoming : randomUUID();
    },
    requestTimeout: 30_000,
    connectionTimeout: 10_000,
  });

  app.decorateRequest('user', null);

  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  // Security headers on every response (ARCHITECTURE.md §3.6).
  await app.register(helmet, { global: true });

  // Access control runs first, in three steps, before the body is read or any route runs.
  // The order matters: the limit is applied BEFORE callers without a login are refused, so
  // token guessing and route probing are rate-limited too (found in Phase 0 testing).
  //
  // 1. Identify: read the credential, never reject here.
  app.addHook('onRequest', async (request) => {
    if (request.routeOptions.config?.public === true) return;
    request.user = await authenticator.authenticate(request);
  });

  // 2. Limit: per user once identified, per IP otherwise (including public health checks).
  const rateLimitOptions = {
    max: config.http.rateLimitPerMinute,
    timeWindow: '1 minute',
    keyGenerator: (request: FastifyRequest) => (request.user ? `user:${request.user.id}` : `ip:${request.ip}`),
    errorResponseBuilder: () =>
      new AppError(ErrorCode.RATE_LIMITED, 429, 'Too many requests. Wait a moment and try again.'),
  };
  await app.register(rateLimit, { global: false, ...rateLimitOptions });
  app.addHook('onRequest', app.rateLimit(rateLimitOptions));

  // 3. Enforce: everything except the health checks needs a login. Unknown routes are treated
  //    as protected too, so an unauthenticated caller cannot discover which routes exist.
  app.addHook('onRequest', async (request) => {
    if (request.routeOptions.config?.public === true) return;
    if (!request.user) throw errors.unauthenticated();
  });

  app.setNotFoundHandler(async () => {
    throw errors.notFound();
  });

  app.setErrorHandler(async (error: FastifyError | AppError | Error, request, reply) => {
    const body = (code: ErrorCode, message: string): ErrorResponse => ({
      error: { code, message, requestId: request.id },
    });

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send(body(error.code, error.message));
    }

    const fastifyError = error as FastifyError;
    if (fastifyError.validation) {
      return reply.code(400).send(body(ErrorCode.INVALID_REQUEST, 'The request is not valid.'));
    }
    if (fastifyError.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
      return reply.code(413).send(body(ErrorCode.PAYLOAD_TOO_LARGE, 'The request is too large.'));
    }
    if (
      typeof fastifyError.statusCode === 'number' &&
      fastifyError.statusCode >= 400 &&
      fastifyError.statusCode < 500
    ) {
      // Client mistakes caught by Fastify itself (bad JSON, wrong content type, ...).
      return reply.code(fastifyError.statusCode).send(body(ErrorCode.INVALID_REQUEST, 'The request is not valid.'));
    }

    // Unexpected: full details to the logs and error reporting, nothing internal to the caller.
    request.log.error({ err: error }, 'unhandled error');
    reportError(error, { requestId: request.id, route: request.routeOptions.url ?? 'unknown' });
    return reply.code(500).send(body(ErrorCode.INTERNAL, 'Something went wrong on our side.'));
  });

  await app.register(healthRoutes, { internalApi });
  await app.register(sessionRoutes, { prefix: '/v1' });

  return app;
}
