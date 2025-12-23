import { AppError } from "./errors";
import { ensureCorrelationId } from "./logging";

export type ConfirmationResult = {
  confirmed: boolean;
  correlationId: string;
};

export function requireConfirmation(options: {
  confirmed?: boolean;
  context?: string;
  correlationId?: string | null;
}): ConfirmationResult {
  const correlationId = ensureCorrelationId(options.correlationId);
  if (options.confirmed) {
    return { confirmed: true, correlationId };
  }

  throw new AppError({
    message: "Confirmation missing",
    code: "confirmation_required",
    status: 403,
    safeMessage:
      "Please confirm this action before we proceed to keep your account safe.",
    details: {
      correlationId,
      context: options.context,
    },
  });
}
