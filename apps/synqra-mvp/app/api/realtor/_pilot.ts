import type { AuthenticatedUserIdentity } from "./_account";
import type { TenantVertical } from "@/lib/verticals/tenant";

export const PILOT_ACCESS_DENIED_ERROR =
  "Pilot access is currently limited. Your account is not on the allowlist.";

const PILOT_MIN_ALLOWLIST_SIZE = 5;
const PILOT_MAX_ALLOWLIST_SIZE = 10;
const PILOT_DEFAULT_ALLOWLIST_SIZE = 10;

export type PilotAccessDecision = {
  allowed: boolean;
  reason: "user_id" | "email" | "not_allowlisted" | "allowlist_not_configured";
  maxAllowlistedUsers: number;
  configuredEntries: number;
};

type PilotAllowlistConfig = {
  maxAllowlistedUsers: number;
  userIds: Set<string>;
  emails: Set<string>;
  configuredEntries: number;
};

function parseInteger(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function parseCsvValues(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeUserId(value: string): string {
  return value.trim().toLowerCase();
}

function clampAllowlistSize(size: number | null): number {
  if (size === null) return PILOT_DEFAULT_ALLOWLIST_SIZE;
  return Math.max(PILOT_MIN_ALLOWLIST_SIZE, Math.min(PILOT_MAX_ALLOWLIST_SIZE, size));
}

function loadPilotAllowlistConfig(vertical: TenantVertical): PilotAllowlistConfig {
  const requestedMax = parseInteger(process.env.PILOT_ALLOWLIST_MAX_USERS);
  const maxAllowlistedUsers = clampAllowlistSize(requestedMax);

  const verticalSuffix = vertical.toUpperCase();
  const configuredUserIds = parseCsvValues(
    process.env[`PILOT_ALLOWLIST_USER_IDS_${verticalSuffix}`] ?? process.env.PILOT_ALLOWLIST_USER_IDS
  ).map(normalizeUserId);
  const configuredEmails = parseCsvValues(
    process.env[`PILOT_ALLOWLIST_EMAILS_${verticalSuffix}`] ?? process.env.PILOT_ALLOWLIST_EMAILS
  ).map(normalizeEmail);

  const userIds = new Set<string>();
  const emails = new Set<string>();
  let added = 0;

  for (const userId of configuredUserIds) {
    if (added >= maxAllowlistedUsers) break;
    if (!userIds.has(userId)) {
      userIds.add(userId);
      added += 1;
    }
  }
  for (const email of configuredEmails) {
    if (added >= maxAllowlistedUsers) break;
    if (!emails.has(email)) {
      emails.add(email);
      added += 1;
    }
  }

  return {
    maxAllowlistedUsers,
    userIds,
    emails,
    configuredEntries: added,
  };
}

export function evaluatePilotAccess(
  identity: AuthenticatedUserIdentity,
  vertical: TenantVertical
): PilotAccessDecision {
  const config = loadPilotAllowlistConfig(vertical);
  if (config.configuredEntries === 0) {
    return {
      allowed: false,
      reason: "allowlist_not_configured",
      maxAllowlistedUsers: config.maxAllowlistedUsers,
      configuredEntries: config.configuredEntries,
    };
  }

  const normalizedUserId = normalizeUserId(identity.id);
  if (config.userIds.has(normalizedUserId)) {
    return {
      allowed: true,
      reason: "user_id",
      maxAllowlistedUsers: config.maxAllowlistedUsers,
      configuredEntries: config.configuredEntries,
    };
  }

  const normalizedEmail = identity.email ? normalizeEmail(identity.email) : "";
  if (normalizedEmail && config.emails.has(normalizedEmail)) {
    return {
      allowed: true,
      reason: "email",
      maxAllowlistedUsers: config.maxAllowlistedUsers,
      configuredEntries: config.configuredEntries,
    };
  }

  return {
    allowed: false,
    reason: "not_allowlisted",
    maxAllowlistedUsers: config.maxAllowlistedUsers,
    configuredEntries: config.configuredEntries,
  };
}
