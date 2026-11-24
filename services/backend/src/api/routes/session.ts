import type { FastifyPluginAsync } from 'fastify';

import { errors } from '../errors';

/**
 * GET /v1/session: who is signed in. Phase 0 uses it to prove the auth chain end to end:
 * no valid credential → 401; valid credential → the user id taken from that credential.
 */
export const sessionRoutes: FastifyPluginAsync = async (app) => {
  app.get('/session', async (request) => {
    if (!request.user) throw errors.unauthenticated();
    return { user: { id: request.user.id } };
  });
};
