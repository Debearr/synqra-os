import crypto from "crypto";

type LogLevel = "info" | "warn" | "error";

const LOG_LEVELS: LogLevel[] = ["info", "warn", "error"];

export type SafeguardLog = {
  level: LogLevel;
  message: string;
  scope?: string;
  correlationId?: string;
  data?: Record<string, any>;
  timestamp?: string;
};

function getLogLevel(): LogLevel {
  const envLevel = (process.env.SAFEGUARDS_LOG_LEVEL || "info").toLowerCase();
  if (LOG_LEVELS.includes(envLevel as LogLevel)) {
    return envLevel as LogLevel;
  }
  return "info";
}

function shouldLog(level: LogLevel): boolean {
  const configured = getLogLevel();
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(configured);
}

export function ensureCorrelationId(seed?: string | null): string {
  if (seed && seed.trim().length > 0) return seed;
  return crypto.randomUUID();
}

/**
 * Structured, minimal logging helper with correlation IDs.
 */
export function logSafeguard(entry: SafeguardLog): void {
  if (!shouldLog(entry.level)) return;

  const payload = {
    level: entry.level,
    message: entry.message,
    scope: entry.scope,
    correlationId: ensureCorrelationId(entry.correlationId),
    timestamp: entry.timestamp || new Date().toISOString(),
    data: entry.data,
  };

  const serialized = JSON.stringify(payload);

  switch (entry.level) {
    case "error":
      console.error(serialized);
      break;
    case "warn":
      console.warn(serialized);
      break;
    default:
      console.log(serialized);
  }
}
