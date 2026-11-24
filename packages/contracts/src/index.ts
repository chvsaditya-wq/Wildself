/**
 * Shared contracts between the mobile app, the API and the engines.
 * Only types and constants: no runtime dependencies, no logic.
 */

/**
 * Every error the API can return has one of these codes. The app reacts to the code,
 * never to the message text. New codes are added here first.
 */
export const ErrorCode = {
  /** The request body, query or params failed validation. */
  INVALID_REQUEST: 'INVALID_REQUEST',
  /** No valid login token was sent. */
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  /** Logged in, but this resource belongs to someone else. */
  FORBIDDEN: 'FORBIDDEN',
  /** The route or resource does not exist. */
  NOT_FOUND: 'NOT_FOUND',
  /** The request is larger than allowed. */
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  /** Too many requests in a short time. */
  RATE_LIMITED: 'RATE_LIMITED',
  /** A dependency (e.g. the database) is not reachable right now. */
  UNAVAILABLE: 'UNAVAILABLE',
  /** Anything unexpected. Details are only in the server logs. */
  INTERNAL: 'INTERNAL',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Body of every error response. `requestId` lets support find the exact log lines. */
export type ErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
  };
};

/** GET /health: the process is up. */
export type LivenessResponse = { status: 'ok' };

/** GET /health/ready: the process can serve traffic (database reachable). */
export type ReadinessResponse = {
  status: 'ok' | 'unavailable';
  checks: { database: 'ok' | 'unavailable' };
};
