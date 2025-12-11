import { z } from "zod";
import { IntelligenceRequest, ValidationResult } from "../types";

const requestSchema = z.object({
  task: z.enum(["content", "analysis", "planning"]),
  input: z.string().min(8, "Input must be at least 8 characters"),
  audience: z.string().optional(),
  tone: z.string().optional(),
  maxTokens: z.number().int().positive().max(8192).optional(),
  budgetCents: z.number().int().positive().max(50_000).optional(),
  risk: z.enum(["low", "medium", "high"]),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type ParsedRequest = z.infer<typeof requestSchema>;

export const validateRequest = (
  data: unknown,
): ValidationResult<IntelligenceRequest> => {
  const parsed = requestSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }
  return { ok: true, value: parsed.data };
};
