/**
 * Typed errors. Expected failures travel as `Result<T, AppError>`; they are never thrown.
 * This file is pure (no imports) so domain code may use it.
 */

export type AppErrorCode =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "integration";

export type AppError = {
  readonly code: AppErrorCode;
  /** Safe to show to the caller. No internals, no PII. */
  readonly message: string;
  /** Field-level problems, keyed by input path. Sent to the caller. */
  readonly details?: Readonly<Record<string, readonly string[]>>;
  /** The underlying error. Logged, never sent to the caller. */
  readonly cause?: unknown;
};

export type Result<T, E = AppError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E = AppError>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function appError(
  code: AppErrorCode,
  message: string,
  extra: Pick<AppError, "details" | "cause"> = {},
): AppError {
  return { code, message, ...extra };
}

const HTTP_STATUS: Record<AppErrorCode, number> = {
  validation: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  integration: 502,
};

/** Maps an `AppError` to an HTTP response. The only way a route turns an error into a response. */
export function errorResponse(error: AppError): Response {
  const body = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  };
  return Response.json(body, { status: HTTP_STATUS[error.code] });
}

/** Thrown only by `invariant`. Means a bug or broken infrastructure, never a user mistake. */
class InvariantError extends Error {
  override readonly name = "InvariantError";
}

/**
 * Asserts something that must be true if the code is correct. Use instead of `!` and instead of
 * `throw new Error(...)`. Do not use for expected failures: those return `err(appError(...))`.
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new InvariantError(message);
  }
}
