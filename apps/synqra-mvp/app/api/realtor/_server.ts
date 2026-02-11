import { randomUUID } from "crypto";
import type { TenantVertical } from "@/lib/verticals/tenant";
import { verticalTag } from "@/lib/verticals/tenant";

type LogLevel = "info" | "warn" | "error";

type StructuredLogInput = {
  level: LogLevel;
  vertical?: TenantVertical | null;
  requestId: string;
  userId: string | null;
  route: string;
  errorCode: string | null;
  message: string;
  status?: number;
  elapsedMs?: number;
  details?: Record<string, unknown>;
};

type GenerationTelemetryEvent = {
  event: "generation_attempted" | "generation_succeeded" | "generation_failed";
  vertical: TenantVertical;
  requestId: string;
  userId: string;
  route: string;
  errorCode?: string | null;
  details?: Record<string, unknown>;
};

type RateLimitBucket = {
  count: number;
  windowStartedAtMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSeconds: number;
};

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;
const RATE_LIMIT_SWEEP_INTERVAL_MS = 60 * 1000;

declare global {
  // eslint-disable-next-line no-var
  var __synqraRealtorRateLimit: Map<string, RateLimitBucket> | undefined;
  // eslint-disable-next-line no-var
  var __synqraRealtorRateLimitLastSweepAt: number | undefined;
}

function getRateLimitStore(): Map<string, RateLimitBucket> {
  if (!globalThis.__synqraRealtorRateLimit) {
    globalThis.__synqraRealtorRateLimit = new Map<string, RateLimitBucket>();
  }
  if (!globalThis.__synqraRealtorRateLimitLastSweepAt) {
    globalThis.__synqraRealtorRateLimitLastSweepAt = 0;
  }
  return globalThis.__synqraRealtorRateLimit;
}

function maybeSweepExpiredBuckets(now: number): void {
  const lastSweep = globalThis.__synqraRealtorRateLimitLastSweepAt ?? 0;
  if (now - lastSweep < RATE_LIMIT_SWEEP_INTERVAL_MS) {
    return;
  }

  const store = getRateLimitStore();
  for (const [key, bucket] of store.entries()) {
    if (now - bucket.windowStartedAtMs >= RATE_LIMIT_WINDOW_MS) {
      store.delete(key);
    }
  }
  globalThis.__synqraRealtorRateLimitLastSweepAt = now;
}

export function resolveRequestId(request: Request): string {
  const explicit = request.headers.get("x-request-id") ?? request.headers.get("x-correlation-id");
  if (explicit && explicit.trim()) {
    return explicit.trim();
  }
  return randomUUID();
}

export function consumeGenerateRateLimit(userId: string, now = Date.now()): RateLimitResult {
  maybeSweepExpiredBuckets(now);
  const store = getRateLimitStore();
  const key = `generate:${userId}`;
  const current = store.get(key);

  if (!current || now - current.windowStartedAtMs >= RATE_LIMIT_WINDOW_MS) {
    store.set(key, { count: 1, windowStartedAtMs: now });
    return {
      allowed: true,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetAtMs: now + RATE_LIMIT_WINDOW_MS,
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    const resetAtMs = current.windowStartedAtMs + RATE_LIMIT_WINDOW_MS;
    return {
      allowed: false,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: 0,
      resetAtMs,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAtMs - now) / 1000)),
    };
  }

  current.count += 1;
  store.set(key, current);
  const resetAtMs = current.windowStartedAtMs + RATE_LIMIT_WINDOW_MS;
  return {
    allowed: true,
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - current.count),
    resetAtMs,
    retryAfterSeconds: 0,
  };
}

export function buildRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAtMs / 1000)),
    ...(result.retryAfterSeconds > 0 ? { "Retry-After": String(result.retryAfterSeconds) } : {}),
  };
}

export function logStructuredServerEvent(input: StructuredLogInput): void {
  const tag = input.vertical ? verticalTag(input.vertical) : "vertical:unknown";
  const payload = {
    timestamp: new Date().toISOString(),
    vertical: input.vertical ?? null,
    vertical_tag: tag,
    request_id: input.requestId,
    user_id: input.userId,
    route: input.route,
    error_code: input.errorCode,
    message: input.message,
    status: input.status,
    elapsed_ms: input.elapsedMs,
    details: input.details ?? null,
  };

  const line = JSON.stringify(payload);
  if (input.level === "error") {
    console.error(line);
    return;
  }
  if (input.level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

export function emitGenerationTelemetryEvent(input: GenerationTelemetryEvent): void {
  const tag = verticalTag(input.vertical);
  const payload = {
    timestamp: new Date().toISOString(),
    telemetry_type: "realtor_generation",
    event: input.event,
    vertical: input.vertical,
    vertical_tag: tag,
    request_id: input.requestId,
    user_id: input.userId,
    route: input.route,
    error_code: input.errorCode ?? null,
    details: input.details ?? null,
  };
  console.info(JSON.stringify(payload));
}
