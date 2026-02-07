import { z } from "zod";

export function parseWithSchema<T>(
  payload: unknown,
  schema: z.ZodSchema<T>
): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Schema validation failed: ${result.error.message}`);
  }
  return result.data;
}

export function coerceNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function normalizeScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function buildJsonSchemaUsage(schema: object): string {
  return JSON.stringify(schema, null, 2);
}
