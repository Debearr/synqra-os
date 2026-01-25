const TRANSIENT_PATTERNS = [
  /timeout/i,
  /timed out/i,
  /econnreset/i,
  /econnrefused/i,
  /etimedout/i,
  /rate limit/i,
  /\b429\b/,
  /\b500\b/,
  /\b502\b/,
  /\b503\b/,
  /\b504\b/,
];

const NON_RETRIABLE_PATTERNS = [
  /validation/i,
  /invalid/i,
  /unauthorized/i,
  /forbidden/i,
  /cancelled/i,
  /canceled/i,
  /\b400\b/,
  /\b401\b/,
  /\b403\b/,
  /\b404\b/,
  /\b409\b/,
  /\b422\b/,
];

type ErrorLike = {
  message?: string;
  code?: string | number;
  status?: number;
  response?: {
    status?: number;
  };
};

function getErrorText(error: unknown): string {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return "";
  const candidate = error as ErrorLike;
  const parts = [
    candidate.message,
    typeof candidate.code === "number" || typeof candidate.code === "string" ? String(candidate.code) : undefined,
    typeof candidate.status === "number" ? String(candidate.status) : undefined,
    typeof candidate.response?.status === "number" ? String(candidate.response.status) : undefined,
  ].filter(Boolean);
  return parts.join(" ").trim();
}

export function calculateBackoff(attemptNumber: number, baseSeconds: number, maxSeconds: number): number {
  const attempt = Math.max(1, attemptNumber);
  const boundedBase = Math.max(1, baseSeconds);
  const boundedMax = Math.max(boundedBase, maxSeconds);
  const exponential = Math.min(boundedMax, boundedBase * 2 ** (attempt - 1));
  const jitter = exponential * (Math.random() * 0.25);
  return Math.min(boundedMax, Math.round(exponential + jitter));
}

export function shouldRetry(error: unknown, attemptNumber: number, maxAttempts: number): boolean {
  if (attemptNumber >= maxAttempts) {
    return false;
  }

  const errorText = getErrorText(error);
  if (!errorText) return false;

  if (NON_RETRIABLE_PATTERNS.some((pattern) => pattern.test(errorText))) {
    return false;
  }

  return TRANSIENT_PATTERNS.some((pattern) => pattern.test(errorText));
}
