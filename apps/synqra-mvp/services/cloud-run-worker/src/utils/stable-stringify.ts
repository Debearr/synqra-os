type JsonLike =
  | null
  | boolean
  | number
  | string
  | JsonLike[]
  | { [key: string]: JsonLike };

function normalize(value: unknown): JsonLike {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }

  if (typeof value === "object" && value !== null) {
    const objectValue = value as Record<string, unknown>;
    const sortedKeys = Object.keys(objectValue).sort();
    const normalized: Record<string, JsonLike> = {};
    for (const key of sortedKeys) {
      normalized[key] = normalize(objectValue[key]);
    }
    return normalized;
  }

  return String(value);
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(normalize(value));
}

