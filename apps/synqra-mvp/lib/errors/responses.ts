import type { ApiErrorPayload, ErrorResponse } from "./types";

export function buildErrorResponse(
  error: ApiErrorPayload,
  options?: { correlationId?: string }
): ErrorResponse {
  return {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      correlationId: options?.correlationId,
    },
  };
}
