import { ErrorCode } from '@wildself/contracts';

/**
 * An error the API returns on purpose, with a stable code the app can react to.
 * Anything that is not an AppError becomes a generic 500 with no internal details.
 */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errors = {
  invalidRequest: (message = 'The request is not valid.') =>
    new AppError(ErrorCode.INVALID_REQUEST, 400, message),
  unauthenticated: () => new AppError(ErrorCode.UNAUTHENTICATED, 401, 'Sign in to continue.'),
  forbidden: () => new AppError(ErrorCode.FORBIDDEN, 403, 'You do not have access to this.'),
  notFound: () => new AppError(ErrorCode.NOT_FOUND, 404, 'Not found.'),
  unavailable: () =>
    new AppError(ErrorCode.UNAVAILABLE, 503, 'The service is temporarily unavailable. Try again shortly.'),
};
