import type { ApiErrorCode } from "./codes";
import type { ApiErrorPayload } from "./types";

export class ApiError extends Error implements ApiErrorPayload {
  code: ApiErrorCode;
  status: number;
  details?: Record<string, unknown>;

  constructor(options: ApiErrorPayload) {
    super(options.message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}
