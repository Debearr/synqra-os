import { type NormalizedError } from "./errors";

/**
 * Minimal, additive error envelope for AI/agent-facing responses.
 * Keeps legacy fields intact while attaching correlation metadata.
 */
export function buildAgentErrorEnvelope(options: {
  error: NormalizedError;
  correlationId: string;
  extras?: Record<string, any>;
}) {
  return {
    ok: false,
    error: options.error.safeMessage,
    code: options.error.code,
    safeMessage: options.error.safeMessage,
    correlationId: options.correlationId,
    ...options.extras,
  };
}
