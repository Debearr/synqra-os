import { ApiError } from "./api-error";
import { ERROR_CODES } from "./codes";
import type { ApiErrorPayload } from "./types";

export function toApiError(error: unknown, fallback?: ApiErrorPayload): ApiErrorPayload {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: fallback?.code || ERROR_CODES.INTERNAL_ERROR,
      message: fallback?.message || error.message,
      status: fallback?.status || 500,
      details: fallback?.details,
    };
  }

  return (
    fallback || {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Unexpected error",
      status: 500,
    }
  );
}
