import type { ApiErrorCode } from "./codes";

export type ApiErrorPayload = {
  code: ApiErrorCode;
  message: string;
  status: number;
  details?: Record<string, unknown>;
};

export type ErrorResponse = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    correlationId?: string;
  };
};
