/**
 * Lightweight application error with user-safe messaging.
 * Server-only: does not leak internal details to clients.
 */
export class AppError extends Error {
  code: string;
  status: number;
  safeMessage: string;
  details?: Record<string, any>;

  constructor(options: {
    message: string;
    code?: string;
    status?: number;
    safeMessage?: string;
    details?: Record<string, any>;
  }) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code || "unknown_error";
    this.status = options.status ?? 500;
    this.safeMessage =
      options.safeMessage ||
      "Something went wrong. Please try again or contact support.";
    this.details = options.details;
  }
}

export type NormalizedError = {
  code: string;
  status: number;
  message: string;
  safeMessage: string;
  details?: Record<string, any>;
};

/**
 * Normalize any thrown error into a safe shape for API responses.
 * Never expose stack traces or sensitive data.
 */
export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      status: error.status,
      message: error.message,
      safeMessage: error.safeMessage,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: "unhandled_error",
      status: 500,
      message: error.message,
      safeMessage:
        "We hit a snag processing your request. Please try again shortly.",
    };
  }

  return {
    code: "unknown_error",
    status: 500,
    message: "Unknown error",
    safeMessage:
      "We encountered an unexpected issue. Please try again or contact support.",
  };
}
