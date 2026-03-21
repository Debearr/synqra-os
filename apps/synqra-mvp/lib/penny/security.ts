import "server-only";

import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

import { verifyInternalSignedRequest } from "@/lib/jobs/internal-auth";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getPennyAccessEntryBySubjectUserId,
  getPennyAccessEntryByTelegramUserId,
  type PennyAccessRow,
  type PennyAccessState,
} from "./access-admin";
import { getPennyRuntimeConfig, isPennyEnabled } from "./config";

const FOUNDER_TOKEN_HEADER = "x-penny-founder-token";
const SHUTDOWN_TOKEN_HEADER = "x-penny-shutdown-token";

type TokenSource = "body" | "header";

export type PennyFounderAccessResult =
  | { ok: true; founderTokenSource: TokenSource; shutdownTokenSource?: TokenSource }
  | { ok: false; status: number; error: string };

export type PennyAccessResolution = {
  access: PennyAccessRow | null;
  controlRole: "founder" | "admin" | "member" | "none";
  allowed: boolean;
};

export type PennyPaidAccessDecision = {
  allowed: boolean;
  reason: string;
  accessState: PennyAccessState | null;
  subscriptionTier: string;
};

function normalizeToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function constantTimeTokenCompare(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

function resolvePresentedToken(
  request: NextRequest,
  headerName: string,
  bodyToken?: string | null
): { source: TokenSource; value: string } | null {
  const candidates: Array<{ source: TokenSource; value: string | null }> = [
    { source: "body", value: normalizeToken(bodyToken) },
    { source: "header", value: normalizeToken(request.headers.get(headerName)) },
  ];

  const match = candidates.find((candidate) => candidate.value);
  return match?.value ? { source: match.source, value: match.value } : null;
}

export function verifyPennyFounderAccess(
  request: NextRequest,
  options?: {
    bodyFounderToken?: string | null;
    bodyShutdownToken?: string | null;
    requireShutdownToken?: boolean;
  }
): PennyFounderAccessResult {
  const config = getPennyRuntimeConfig();
  if (!config.founderToken) {
    return {
      ok: false,
      status: 503,
      error: "PENNY_FOUNDER_TOKEN is not configured",
    };
  }

  const founderToken = resolvePresentedToken(request, FOUNDER_TOKEN_HEADER, options?.bodyFounderToken ?? null);

  if (!founderToken) {
    return {
      ok: false,
      status: 401,
      error: "Founder token required",
    };
  }

  if (!constantTimeTokenCompare(founderToken.value, config.founderToken)) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized - invalid founder token",
    };
  }

  if (!options?.requireShutdownToken) {
    return {
      ok: true,
      founderTokenSource: founderToken.source,
    };
  }

  if (!config.shutdownToken) {
    return {
      ok: false,
      status: 503,
      error: "PENNY_SHUTDOWN_TOKEN is not configured",
    };
  }

  const shutdownToken = resolvePresentedToken(request, SHUTDOWN_TOKEN_HEADER, options.bodyShutdownToken ?? null);

  if (!shutdownToken) {
    return {
      ok: false,
      status: 401,
      error: "Shutdown token required",
    };
  }

  if (!constantTimeTokenCompare(shutdownToken.value, config.shutdownToken)) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized - invalid shutdown token",
    };
  }

  return {
    ok: true,
    founderTokenSource: founderToken.source,
    shutdownTokenSource: shutdownToken.source,
  };
}

export function verifyPennyInternalAccess(request: NextRequest, body: unknown): { ok: true } | { ok: false; status: number; error: string } {
  const verification = verifyInternalSignedRequest(request, body);
  if (!verification.ok) {
    return {
      ok: false,
      status: 401,
      error: verification.error,
    };
  }

  return { ok: true };
}

export function isPennyFounderTelegramUser(telegramUserId: string | null | undefined): boolean {
  const expected = getPennyRuntimeConfig().founderTelegramUserId;
  const actual = normalizeToken(telegramUserId ?? null);
  return Boolean(expected && actual && expected === actual);
}

export function isPennyAllowedTelegramChat(chatId: string | null | undefined): boolean {
  const actual = normalizeToken(chatId ?? null);
  if (!actual) return false;

  return getPennyRuntimeConfig().allowedTelegramChatIds.includes(actual);
}

export function resolvePennyControlState() {
  const config = getPennyRuntimeConfig();

  return {
    enabled: config.enabled,
    paused: !config.enabled,
    founderOnly: true,
    privateByDefault: true,
    shutdownTokenConfigured: Boolean(config.shutdownToken),
  };
}

export function assertPennyEnabledOrThrow(): void {
  if (!isPennyEnabled()) {
    throw new Error("Penny is disabled");
  }
}

function resolveControlRoleFromState(state: PennyAccessState | null): "founder" | "admin" | "member" | "none" {
  if (state === "founder") return "founder";
  if (state === "admin") return "admin";
  if (state) return "member";
  return "none";
}

function isAccessStateAllowed(state: PennyAccessState | null): boolean {
  return Boolean(state && !["expired", "revoked"].includes(state));
}

async function resolveUserSubscriptionTier(userId: string | null | undefined): Promise<string> {
  const resolvedUserId = normalizeToken(userId ?? null);
  if (!resolvedUserId) return "none";

  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", resolvedUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve Penny user subscription tier: ${error.message}`);
  }

  return typeof data?.subscription_tier === "string" && data.subscription_tier.trim()
    ? data.subscription_tier.trim()
    : "none";
}

export async function resolvePennyAccessForIdentity(input: {
  userId?: string | null;
  telegramUserId?: string | null;
}): Promise<PennyAccessResolution> {
  const userId = normalizeToken(input.userId ?? null);
  const telegramUserId = normalizeToken(input.telegramUserId ?? null);

  const access =
    (userId ? await getPennyAccessEntryBySubjectUserId(userId) : null) ??
    (telegramUserId ? await getPennyAccessEntryByTelegramUserId(telegramUserId) : null);

  const accessState = access?.access_state ?? null;

  return {
    access,
    controlRole: resolveControlRoleFromState(accessState),
    allowed: isAccessStateAllowed(accessState),
  };
}

export async function canReceivePaidAuraFxContent(input: {
  userId?: string | null;
  telegramUserId?: string | null;
}): Promise<PennyPaidAccessDecision> {
  const resolution = await resolvePennyAccessForIdentity(input);
  const accessState = resolution.access?.access_state ?? null;

  if (accessState === "founder" || accessState === "admin") {
    return {
      allowed: true,
      reason: "Privileged Penny access state",
      accessState,
      subscriptionTier: resolution.access?.subscription_tier ?? "none",
    };
  }

  if (accessState !== "active" && accessState !== "grace") {
    return {
      allowed: false,
      reason: "Access state is not eligible for paid AuraFX delivery",
      accessState,
      subscriptionTier: resolution.access?.subscription_tier ?? "none",
    };
  }

  const resolvedUserId = normalizeToken(input.userId ?? resolution.access?.subject_user_id ?? null);
  const userSubscriptionTier = await resolveUserSubscriptionTier(resolvedUserId);
  const subscriptionTier = resolution.access?.subscription_tier ?? userSubscriptionTier;
  const effectiveTier = subscriptionTier !== "none" ? subscriptionTier : userSubscriptionTier;

  if (!effectiveTier || effectiveTier === "none") {
    return {
      allowed: false,
      reason: "No paid subscription tier is associated with this Penny identity",
      accessState,
      subscriptionTier: "none",
    };
  }

  return {
    allowed: true,
    reason: "Paid Penny access is active",
    accessState,
    subscriptionTier: effectiveTier,
  };
}
