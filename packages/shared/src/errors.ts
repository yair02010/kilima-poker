/**
 * Shared application error and the standard error body (KP-ENG-11 §2, KP-ENG-03 §2.3).
 * Stack traces and internal details of unknown errors never reach clients.
 */

export interface ErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
}

export interface AppErrorOptions {
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown> | undefined;

  constructor(code: string, status: number, message: string, options: AppErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = options.details;
  }
}

/** Common errors used across services. Codes are stable, UPPER_SNAKE_CASE. */
export const Errors = {
  validation: (details?: Record<string, unknown>) =>
    new AppError("VALIDATION_FAILED", 400, "Request validation failed", details ? { details } : {}),
  unauthenticated: () => new AppError("UNAUTHENTICATED", 401, "Authentication required"),
  forbidden: () => new AppError("FORBIDDEN", 403, "Not allowed"),
  notFound: (what = "Resource") => new AppError("NOT_FOUND", 404, `${what} not found`),
  conflict: (message = "Conflict") => new AppError("CONFLICT", 409, message),
  rateLimited: () => new AppError("RATE_LIMITED", 429, "Too many requests"),
  unavailable: () => new AppError("SERVICE_UNAVAILABLE", 503, "Service unavailable"),
} as const;

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

/** Maps any thrown value to an HTTP status and a client-safe body. */
export function toErrorResponse(err: unknown, requestId: string): { status: number; body: ErrorBody } {
  if (isAppError(err)) {
    const body: ErrorBody = { error: { code: err.code, message: err.message, requestId } };
    if (err.details !== undefined) body.error.details = err.details;
    return { status: err.status, body };
  }
  return {
    status: 500,
    body: { error: { code: "INTERNAL", message: "Internal error", requestId } },
  };
}
