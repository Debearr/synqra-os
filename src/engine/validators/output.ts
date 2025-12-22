import { z } from "zod";
import { StructuredResult, ValidationResult } from "../types";

const baseSchema = z.object({
  content: z.string().min(1),
  summary: z.string().optional(),
  actions: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type OutputShape = z.infer<typeof baseSchema>;

export const validateStructuredResult = (
  raw: unknown,
  metadata: Pick<StructuredResult<OutputShape>, "model" | "promptId" | "usedTokens" | "latencyMs" | "traceId">,
): ValidationResult<StructuredResult<OutputShape>> => {
  const parsed = baseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  return {
    ok: true,
    value: {
      data: parsed.data,
      ...metadata,
    },
  };
};
