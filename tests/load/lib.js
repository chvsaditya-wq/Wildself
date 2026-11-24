// Shared helpers for the k6 load tests (metrics_and_testing.md §2.2).
// Never point these at production.

export const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';

/**
 * A valid development-login user id for a number (works only with AUTH_MODE=dev-stub,
 * which the server refuses in production).
 */
export function devUser(n) {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

export function authHeaders(userId) {
  return { Authorization: `Bearer dev:${userId}` };
}
