import { ZodSchema } from "zod";

const jsonBlockRegex = /```json([\s\S]*?)```/i;

const normalize = (raw: unknown): unknown => {
  if (typeof raw !== "string") return raw;

  const match = raw.match(jsonBlockRegex);
  const jsonCandidate = match ? match[1] : raw;

  try {
    return JSON.parse(jsonCandidate);
  } catch (error) {
    throw new Error(`Failed to parse model output as JSON: ${(error as Error).message}`);
  }
};

export const parseStructuredOutput = <T>(raw: unknown, schemaHint?: string): T => {
  if (!schemaHint) {
    return raw as T;
  }

  const parsed = normalize(raw);
  return parsed as T;
};

export const ensureSchema = <T>(raw: unknown, schema: ZodSchema<T>): T => {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Structured output did not match schema: ${details}`);
  }
  return parsed.data;
};

export const redactKeys = (value: unknown, keys: string[]): unknown => {
  if (Array.isArray(value)) return value.map((item) => redactKeys(item, keys));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) =>
        keys.includes(key) ? [key, "[redacted]"] : [key, redactKeys(val, keys)],
      ),
    );
  }
  return value;
};
