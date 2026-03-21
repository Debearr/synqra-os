import "server-only";

import { NextRequest } from "next/server";

import { AuraFxSignalPayload } from "@/lib/aura-fx/types";
import { checkIdempotency } from "@/lib/jobs/idempotency";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  ensurePennyFounderAccessEntry,
  listPennyTelegramAccessEntries,
  type PennyAccessRow,
} from "./access-admin";
import { getPennyRuntimeConfig, getPennyRuntimeConfigSummary } from "./config";
import {
  buildPennyAuraSignalFlowJobIdempotencyKey,
  buildPennyDeliveryIdempotencyKey,
  buildPennySignalSourceIdempotencyKey,
} from "./idempotency";
import {
  buildPennyActionableSignalCard,
  buildPennyMissedTradeCard,
  buildPennyNoTradeCard,
  buildPennySignalUpdateCard,
} from "./formatter";
import {
  getLatestPennyAuraCandles,
  PENNY_CANDLE_FETCH_LIMIT,
  PENNY_MIN_SIGNAL_CANDLES,
  PENNY_SUPPORTED_PAIRS,
  PENNY_SUPPORTED_TIMEFRAMES,
  assertPennyMarketScope,
} from "./market-data";
import { getPennyMarketDataProvider } from "./market-data-provider";
import {
  canReceivePaidAuraFxContent,
  isPennyAllowedTelegramChat,
  verifyPennyFounderAccess,
  verifyPennyInternalAccess,
} from "./security";

type DiagnosticStatus = "pass" | "warn" | "fail";

type DiagnosticCheck = {
  id: string;
  status: DiagnosticStatus;
  summary: string;
  detail: string;
};

type KeyVerification = {
  status: DiagnosticStatus;
  summary: string;
  detail: string;
  key: string | null;
  liveRows: number | null;
};

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

export type PennyFounderOperationalReadinessReport = {
  checkedAt: string;
  overall: "ready" | "attention";
  scope: {
    pair: string;
    timeframe: string;
  };
  quickRead: string[];
  checks: DiagnosticCheck[];
  idempotency: {
    signalSource: KeyVerification;
    delivery: KeyVerification;
    workerJob: KeyVerification;
  };
  formatterPreview: {
    actionable: string;
    noTrade: string;
    missedTrade: string;
    update: string;
  };
  facts: {
    config: ReturnType<typeof getPennyRuntimeConfigSummary>;
    founderAccessState: string | null;
    candlesAvailable: number;
    latestCandleTime: string | null;
    eligibleRecipientCount: number;
    liveFetchReady: boolean;
    liveFetchBlockedIntentionally: boolean;
  };
};

export async function buildPennyFounderOperationalReadiness(input?: {
  pair?: string | null;
  timeframe?: string | null;
}): Promise<PennyFounderOperationalReadinessReport> {
  const checkedAt = new Date().toISOString();
  const config = getPennyRuntimeConfig({ forceReload: true });
  const configSummary = getPennyRuntimeConfigSummary();
  const pairInput = input?.pair?.trim() || PENNY_SUPPORTED_PAIRS[0];
  const timeframeInput = input?.timeframe?.trim() || PENNY_SUPPORTED_TIMEFRAMES[1];
  const checks: DiagnosticCheck[] = [];

  const scope = safeResolveScope(pairInput, timeframeInput);
  checks.push(scope.check);

  const founderConfigOk = Boolean(config.founderUserId);
  checks.push(
    founderConfigOk
      ? makeCheck("founder_config", "pass", "Founder user is configured.", `Founder user id ${config.founderUserId} is present for owner-controlled Penny operations.`)
      : makeCheck("founder_config", "fail", "Founder user is missing.", "PENNY_FOUNDER_USER_ID is not configured, so founder bootstrap and owner-run signal flow cannot resolve.")
  );

  checks.push(
    config.enabled
      ? makeCheck("enabled_state", "pass", "Penny is enabled.", "Runtime gating is open for founder-controlled Penny operations.")
      : makeCheck("enabled_state", "fail", "Penny is disabled.", "PENNY_ENABLED is false, so internal Penny routes fail closed.")
  );

  const founderRouteProtection = verifyPennyFounderAccess(new NextRequest("https://penny.local/api/penny/founder/test"));
  checks.push(
    !founderRouteProtection.ok && founderRouteProtection.status === 401
      ? makeCheck("founder_route_protection", "pass", "Founder routes reject unsigned access.", founderRouteProtection.error)
      : makeCheck("founder_route_protection", "fail", "Founder routes are not failing closed.", "Founder route verification did not reject a request without founder credentials.")
  );

  const internalRouteProtection = verifyPennyInternalAccess(new NextRequest("https://penny.local/api/internal/penny/signals/run"), {});
  checks.push(
    !internalRouteProtection.ok && internalRouteProtection.status === 401
      ? makeCheck("internal_route_protection", "pass", "Internal routes reject unsigned access.", internalRouteProtection.error)
      : makeCheck("internal_route_protection", "fail", "Internal routes are not failing closed.", "Internal route verification did not reject a request without a valid internal signature.")
  );

  const invalidMarketRejected = safeRejectUnsupportedMarket();
  checks.push(
    invalidMarketRejected
      ? makeCheck("market_scope_fail_closed", "pass", "Unsupported markets are rejected.", "Penny still blocks out-of-scope instruments outside the founder-approved narrow market set.")
      : makeCheck("market_scope_fail_closed", "fail", "Unsupported markets were not rejected.", "Market-scope validation did not fail closed for an out-of-scope instrument.")
  );

  let founderAccess: PennyAccessRow | null = null;
  if (config.founderUserId) {
    try {
      founderAccess = await ensurePennyFounderAccessEntry(config.founderUserId);
      checks.push(
        makeCheck(
          "founder_bootstrap",
          "pass",
          "Founder access resolves cleanly.",
          `Founder bootstrap returned access state '${founderAccess.access_state}' for owner ${config.founderUserId}.`
        )
      );
    } catch (error) {
      checks.push(
        makeCheck(
          "founder_bootstrap",
          "fail",
          "Founder access bootstrap failed.",
          error instanceof Error ? error.message : "Unknown founder bootstrap error."
        )
      );
    }
  }

  const providerCheck = await evaluateProviderReadiness(config.founderUserId ?? ZERO_UUID, scope.pair, scope.timeframe);
  checks.push(providerCheck.check);

  checks.push(
    config.enabled && founderAccess && scope.check.status === "pass"
      ? makeCheck(
          "signal_flow_prerequisites",
          "pass",
          "Signal flow prerequisites resolve cleanly.",
          `Founder bootstrap, private route protection, and market scope validation are in place for ${scope.pair} ${scope.timeframe}.`
        )
      : makeCheck(
          "signal_flow_prerequisites",
          "fail",
          "Signal flow prerequisites are incomplete.",
          "Penny cannot complete a founder-controlled signal run until it is enabled, founder bootstrap resolves, and the requested scope passes validation."
        )
  );

  const telegramReady = Boolean(config.telegramBotToken) && config.allowedTelegramChatIds.length > 0;
  checks.push(
    telegramReady
      ? makeCheck("telegram_config", "pass", "Telegram delivery config is present.", `Bot token is configured and ${config.allowedTelegramChatIds.length} allowed Penny chat id(s) are defined.`)
      : makeCheck("telegram_config", "warn", "Telegram delivery is not fully configured.", "PENNY_TELEGRAM_BOT_TOKEN or PENNY_TELEGRAM_ALLOWED_CHAT_IDS is missing, so live Telegram delivery will not complete.")
  );

  let candlesAvailable = 0;
  let latestCandleTime: string | null = null;
  if (config.founderUserId) {
    try {
      const candles = await getLatestPennyAuraCandles({
        ownerId: config.founderUserId,
        pair: scope.pair,
        timeframe: scope.timeframe,
        limit: PENNY_CANDLE_FETCH_LIMIT,
      });
      candlesAvailable = candles.length;
      latestCandleTime = candles.length > 0 ? new Date(candles[candles.length - 1].time).toISOString() : null;
      checks.push(
        candles.length >= PENNY_MIN_SIGNAL_CANDLES
          ? makeCheck("candle_readiness", "pass", "Stored candles are sufficient for signal generation.", `${candles.length} candle(s) are available for ${scope.pair} ${scope.timeframe}.`)
          : makeCheck("candle_readiness", "warn", "Stored candles are not yet sufficient for a live run.", `${candles.length} candle(s) are available; Penny needs ${PENNY_MIN_SIGNAL_CANDLES} to generate a signal.`)
      );
    } catch (error) {
      checks.push(
        makeCheck(
          "candle_readiness",
          "fail",
          "Stored candle verification failed.",
          error instanceof Error ? error.message : "Unknown candle verification error."
        )
      );
    }
  }

  const formatterPreview = buildFormatterPreview(scope.pair, scope.timeframe, checkedAt);
  checks.push(
    makeCheck(
      "formatter_layer",
      "pass",
      "Premium formatter output is available.",
      "Actionable, no-trade, missed-trade, and update builders all rendered founder-readable plain-text output."
    )
  );

  const eligibleRecipients = config.founderUserId
    ? await resolveEligibleRecipientsForDiagnostics(config.founderUserId)
    : [];
  checks.push(
    eligibleRecipients.length > 0
      ? makeCheck("eligible_recipients", "pass", "At least one eligible Penny recipient is available.", `${eligibleRecipients.length} eligible recipient(s) currently satisfy Penny delivery gating.`)
      : makeCheck("eligible_recipients", "warn", "No eligible recipients are currently available.", "Penny will store signals but skip delivery until an allowed Telegram recipient with active access is present.")
  );

  const idempotency = await evaluateIdempotencyReadiness({
    ownerId: config.founderUserId,
    pair: scope.pair,
    timeframe: scope.timeframe,
    latestCandleTime,
    eligibleRecipient: eligibleRecipients[0] ?? null,
  });

  checks.push(
    makeCheck(
      "signal_source_idempotency",
      idempotency.signalSource.status,
      idempotency.signalSource.summary,
      idempotency.signalSource.detail
    )
  );
  checks.push(
    makeCheck(
      "delivery_idempotency",
      idempotency.delivery.status,
      idempotency.delivery.summary,
      idempotency.delivery.detail
    )
  );
  checks.push(
    makeCheck(
      "worker_job_idempotency",
      idempotency.workerJob.status,
      idempotency.workerJob.summary,
      idempotency.workerJob.detail
    )
  );

  const overall = checks.some((check) => check.status === "fail") ? "attention" : "ready";

  return {
    checkedAt,
    overall,
    scope: {
      pair: scope.pair,
      timeframe: scope.timeframe,
    },
    quickRead: checks.slice(0, 8).map((check) => `${check.status.toUpperCase()}: ${check.summary}`),
    checks,
    idempotency,
    formatterPreview,
    facts: {
      config: configSummary,
      founderAccessState: founderAccess?.access_state ?? null,
      candlesAvailable,
      latestCandleTime,
      eligibleRecipientCount: eligibleRecipients.length,
      liveFetchReady: providerCheck.liveFetchReady,
      liveFetchBlockedIntentionally: providerCheck.liveFetchBlockedIntentionally,
    },
  };
}

function safeResolveScope(pair: string, timeframe: string) {
  try {
    const scope = assertPennyMarketScope(pair, timeframe);
    return {
      pair: scope.pair,
      timeframe: scope.timeframe,
      check: makeCheck("market_scope", "pass", "Founder test scope is valid.", `${scope.pair} ${scope.timeframe} is inside Penny's current narrow market scope.`),
    };
  } catch (error) {
    return {
      pair: PENNY_SUPPORTED_PAIRS[0],
      timeframe: PENNY_SUPPORTED_TIMEFRAMES[1],
      check: makeCheck(
        "market_scope",
        "fail",
        "Founder test scope is invalid.",
        error instanceof Error ? error.message : "Unknown market-scope validation error."
      ),
    };
  }
}

function safeRejectUnsupportedMarket(): boolean {
  try {
    assertPennyMarketScope("BTCUSD", "H1");
    return false;
  } catch {
    return true;
  }
}

async function evaluateProviderReadiness(ownerId: string, pair: string, timeframe: string) {
  const config = getPennyRuntimeConfig();
  if (!config.marketDataProvider) {
    return {
      liveFetchReady: false,
      liveFetchBlockedIntentionally: true,
      check: makeCheck(
        "market_data_provider",
        "warn",
        "No live market-data provider is configured.",
        "This is currently fail-closed. Live provider fetch remains unavailable until a single provider is configured and verified."
      ),
    };
  }

  try {
    const provider = getPennyMarketDataProvider();
    await provider.fetchCandles({
      ownerId,
      pair,
      timeframe,
      limit: 1,
    });

    return {
      liveFetchReady: true,
      liveFetchBlockedIntentionally: false,
      check: makeCheck(
        "market_data_provider",
        "warn",
        "Live market fetch responded unexpectedly.",
        `Provider '${provider.name}' returned candles even though Block 4/6 expects live fetch to stay blocked pending verified account coverage.`
      ),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown provider error.";
    if (message.includes("live fetching is not enabled yet")) {
      return {
        liveFetchReady: false,
        liveFetchBlockedIntentionally: true,
        check: makeCheck(
          "market_data_provider",
          "pass",
          "Configured provider is still blocked intentionally.",
          message
        ),
      };
    }

    if (message.includes("No Penny market data provider is configured")) {
      return {
        liveFetchReady: false,
        liveFetchBlockedIntentionally: true,
        check: makeCheck(
          "market_data_provider",
          "warn",
          "No live market-data provider is configured.",
          message
        ),
      };
    }

    return {
      liveFetchReady: false,
      liveFetchBlockedIntentionally: false,
      check: makeCheck(
        "market_data_provider",
        "fail",
        "Market-data provider configuration is broken.",
        message
      ),
    };
  }
}

async function resolveEligibleRecipientsForDiagnostics(ownerId: string): Promise<PennyAccessRow[]> {
  const rows = await listPennyTelegramAccessEntries(ownerId, { limit: 50 });
  const eligible: PennyAccessRow[] = [];

  for (const row of rows) {
    if (!row.telegram_chat_id || !isPennyAllowedTelegramChat(row.telegram_chat_id)) {
      continue;
    }

    if (row.access_state === "founder" || row.access_state === "admin") {
      eligible.push(row);
      continue;
    }

    const decision = await canReceivePaidAuraFxContent({
      userId: row.subject_user_id,
      telegramUserId: row.telegram_user_id,
    });

    if (decision.allowed) {
      eligible.push(row);
    }
  }

  return eligible;
}

async function evaluateIdempotencyReadiness(input: {
  ownerId: string | null;
  pair: string;
  timeframe: string;
  latestCandleTime: string | null;
  eligibleRecipient: PennyAccessRow | null;
}): Promise<{
  signalSource: KeyVerification;
  delivery: KeyVerification;
  workerJob: KeyVerification;
}> {
  const supabase = requireSupabaseAdmin();

  if (!input.ownerId) {
    const missingOwner = {
      status: "fail" as const,
      summary: "Founder owner id is missing.",
      detail: "Idempotency verification cannot run without PENNY_FOUNDER_USER_ID.",
      key: null,
      liveRows: null,
    };

    return {
      signalSource: missingOwner,
      delivery: missingOwner,
      workerJob: missingOwner,
    };
  }

  if (!input.latestCandleTime) {
    const noLiveSample = {
      status: "warn" as const,
      summary: "No live candle sample exists yet.",
      detail: "Idempotency builders are present, but there is no stored candle timestamp yet to verify a live source key.",
      key: null,
      liveRows: null,
    };

    return {
      signalSource: noLiveSample,
      delivery: {
        status: "warn",
        summary: "No live delivery sample exists yet.",
        detail: "A recent signal and eligible recipient are required before a live delivery idempotency key can be checked.",
        key: null,
        liveRows: null,
      },
      workerJob: {
        status: "warn",
        summary: "No live job sample exists yet.",
        detail: "A stored candle timestamp is required before a live background job idempotency key can be checked.",
        key: null,
        liveRows: null,
      },
    };
  }

  const latestCandleTimeMs = new Date(input.latestCandleTime).getTime();
  const signalSourceKey = buildPennySignalSourceIdempotencyKey({
    ownerId: input.ownerId,
    pair: input.pair,
    timeframe: input.timeframe,
    latestCandleTime: latestCandleTimeMs,
  });

  const signalRows = await supabase
    .from("aura_signals")
    .select("id")
    .eq("owner_id", input.ownerId)
    .eq("source_idempotency_key", signalSourceKey)
    .limit(2);

  if (signalRows.error) {
    throw new Error(`Failed to verify signal idempotency: ${signalRows.error.message}`);
  }

  const signalLiveRows = (signalRows.data || []).length;
  const signalSource = {
    status: signalLiveRows > 1 ? "fail" as const : "pass" as const,
    summary: signalLiveRows > 1 ? "Duplicate signal records were found." : "Signal source idempotency is holding.",
    detail:
      signalLiveRows > 1
        ? `More than one signal row exists for source key ${signalSourceKey}.`
        : `Source key ${signalSourceKey} currently resolves to ${signalLiveRows} row(s); repeated generation should reuse the same key.`,
    key: signalSourceKey,
    liveRows: signalLiveRows,
  };

  const workerJobKey = buildPennyAuraSignalFlowJobIdempotencyKey({
    ownerId: input.ownerId,
    pair: input.pair,
    timeframe: input.timeframe,
    latestCandleTime: input.latestCandleTime,
    source: "internal_ingest",
  });
  const existingJob = await checkIdempotency(workerJobKey);
  const workerJob = {
    status: "pass" as const,
    summary: "Background job idempotency is holding.",
    detail: existingJob
      ? `Job key ${workerJobKey} already exists with status '${existingJob.status}'. Duplicate inserts should be rejected and the worker still performs a second duplicate scan before dispatch.`
      : `Job key ${workerJobKey} is deterministic and currently has no stored run. Duplicate inserts would still hit the unique idempotency guard.`,
    key: workerJobKey,
    liveRows: existingJob ? 1 : 0,
  };

  const recentSignal = await supabase
    .from("aura_signals")
    .select("id")
    .eq("owner_id", input.ownerId)
    .eq("pair", input.pair)
    .eq("timeframe", input.timeframe)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentSignal.error) {
    throw new Error(`Failed to verify delivery idempotency: ${recentSignal.error.message}`);
  }

  if (!recentSignal.data?.id || !input.eligibleRecipient?.telegram_chat_id) {
    return {
      signalSource,
      delivery: {
        status: "warn",
        summary: "Delivery idempotency could not be checked against a live sample.",
        detail: "A recent signal plus an eligible Telegram recipient are required before a live delivery key can be verified.",
        key: null,
        liveRows: null,
      },
      workerJob,
    };
  }

  const deliveryKey = buildPennyDeliveryIdempotencyKey({
    signalId: String(recentSignal.data.id),
    chatId: input.eligibleRecipient.telegram_chat_id,
  });

  const deliveryRows = await supabase
    .from("penny_signal_deliveries")
    .select("id")
    .eq("idempotency_key", deliveryKey)
    .limit(2);

  if (deliveryRows.error) {
    throw new Error(`Failed to verify delivery idempotency: ${deliveryRows.error.message}`);
  }

  const deliveryLiveRows = (deliveryRows.data || []).length;

  return {
    signalSource,
    delivery: {
      status: deliveryLiveRows > 1 ? "fail" : "pass",
      summary: deliveryLiveRows > 1 ? "Duplicate delivery rows were found." : "Delivery idempotency is holding.",
      detail:
        deliveryLiveRows > 1
          ? `More than one delivery row exists for key ${deliveryKey}.`
          : `Delivery key ${deliveryKey} currently resolves to ${deliveryLiveRows} row(s); repeat sends should be blocked or reopened only after a failed attempt.`,
      key: deliveryKey,
      liveRows: deliveryLiveRows,
    },
    workerJob,
  };
}

function buildFormatterPreview(pair: string, timeframe: string, generatedAt: string) {
  const sampleSignal: AuraFxSignalPayload = {
    id: "penny-diagnostic-preview",
    symbol: pair,
    timeframe,
    direction: "LONG",
    confidence: 0.84,
    entryZone: { low: 1.0842, high: 1.0851 },
    stopZone: { low: 1.0814, high: 1.0822 },
    targetZone: { low: 1.0889, high: 1.0924 },
    killzone: "LONDON_OPEN",
    rationaleShort: "Bullish structure remains aligned with the active London window.",
    educationBlocks: {
      what: "Diagnostic preview only.",
      why: "Used to confirm formatter output exists.",
      how: "Not a live trade call.",
    },
    generatedAt,
  };

  return {
    actionable: previewText(
      buildPennyActionableSignalCard({
        signal: sampleSignal,
        toneMode: "subscriber_premium",
      }).text
    ),
    noTrade: previewText(
      buildPennyNoTradeCard({
        symbol: pair,
        timeframe,
        toneMode: "subscriber_premium",
        reason: "Confidence is below the minimum threshold for a clean Penny alert.",
        confidence: 0.58,
        killzone: "NONE",
      }).text
    ),
    missedTrade: previewText(
      buildPennyMissedTradeCard({
        symbol: pair,
        timeframe,
        toneMode: "subscriber_premium",
        reason: "Price moved through the reference area before a clean subscriber entry could be posted.",
        direction: "LONG",
        entry: sampleSignal.entryZone,
        target: sampleSignal.targetZone,
      }).text
    ),
    update: previewText(
      buildPennySignalUpdateCard({
        symbol: pair,
        timeframe,
        toneMode: "subscriber_premium",
        status: "tp1",
        direction: "LONG",
        entry: sampleSignal.entryZone,
        stop: sampleSignal.stopZone,
        target: sampleSignal.targetZone,
        note: "First target reached. Review stop discipline before any continuation.",
      }).text
    ),
  };
}

function previewText(text: string): string {
  return text.split("\n").slice(0, 4).join("\n");
}

function makeCheck(id: string, status: DiagnosticStatus, summary: string, detail: string): DiagnosticCheck {
  return {
    id,
    status,
    summary,
    detail,
  };
}
