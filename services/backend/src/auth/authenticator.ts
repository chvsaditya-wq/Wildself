import type { FastifyRequest } from 'fastify';

/**
 * Authentication is pluggable. The real provider (managed service or our own) is chosen
 * before Phase 1; until then the API ships with two safe options:
 * - `deny-all` (default): every protected route answers 401.
 * - `dev-stub`: local development and tests only; config refuses it in production.
 *
 * Routes only ever see `request.user.id`, taken from the verified credential, never from
 * the request body (ARCHITECTURE.md §3.6).
 */
export type AuthenticatedUser = { id: string };

export type Authenticator = {
  authenticate(request: FastifyRequest): Promise<AuthenticatedUser | null>;
};

export const denyAllAuthenticator: Authenticator = {
  authenticate: async () => null,
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Development-only: accepts `Authorization: Bearer dev:<uuid>` and treats the uuid as the
 * user id. Never constructed when NODE_ENV is production (see createAuthenticator).
 */
export const devStubAuthenticator: Authenticator = {
  authenticate: async (request) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer dev:')) return null;
    const id = header.slice('Bearer dev:'.length);
    return UUID.test(id) ? { id: id.toLowerCase() } : null;
  },
};

export function createAuthenticator(
  mode: 'deny-all' | 'dev-stub',
  env: 'development' | 'test' | 'production',
): Authenticator {
  if (mode === 'dev-stub') {
    // Second line of defence after config validation.
    if (env === 'production') throw new Error('dev-stub authentication is not allowed in production');
    return devStubAuthenticator;
  }
  return denyAllAuthenticator;
}
