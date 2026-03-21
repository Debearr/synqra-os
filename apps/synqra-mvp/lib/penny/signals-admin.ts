import "server-only";

import { buildAuraFxContext } from "@/lib/aura-fx/engine";
import { toPublicSignal, buildSignalPayload } from "@/lib/aura-fx/signalFormatter";
import { Timeframe } from "@/lib/aura-fx/types";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  ensurePennyFounderAccessEntry,
  listPennyTelegramAccessEntries,
  type PennyAccessRow,
} from "./access-admin";
import {
  buildPennyDeliveryIdempotencyKey,
  buildPennySignalSourceIdempotencyKey,
} from "./idempotency";
import {
  buildPennyActionableSignalCard,
  type PennyToneMode,
} from "./formatter";
import { getLatestPennyAuraCandles, PENNY_MIN_SIGNAL_CANDLES, assertPennyMarketScope } from "./market-data";
import { isPennyAllowedTelegramChat, canReceivePaidAuraFxContent } from "./security";
import { sendPennyTelegramMessage } from "./telegram";

const MIN_CONFIDENCE = 0.72;
const ACTIONABLE_KILLZONES = new Set(["LONDON_OPEN", "NY_OPEN"]);

type PipelineResult =
  | {
      ok: true;
      status: "sent" | "stored";
      signalId: string;
      pair: string;
      timeframe: string;
      deliveries: {
        sent: number;
        failed: number;
        duplicates: number;
        skipped: number;
      };
    }
  | {
      ok: true;
      status: "skipped";
      pair: string;
      timeframe: string;
      reason: string;
    };

function formatZone(zone: { low: number; high: number } | string): string {
  if (typeof zone === "string") {
    return zone;
  }

  return `${zone.low.toFixed(5)} - ${zone.high.toFixed(5)}`;
}

function formatSignalTargets(targetZone: { low: number; high: number } | string) {
  if (typeof targetZone === "string") {
    return {
      tp1: targetZone,
      tp2: null,
      tp3: null,
    };
  }

  const midpoint = (targetZone.low + targetZone.high) / 2;
  return {
    tp1: targetZone.low.toFixed(5),
    tp2: midpoint.toFixed(5),
    tp3: targetZone.high.toFixed(5),
  };
}

function isActionableSignal(input: {
  direction: string;
  confidence: number;
  killzone: string;
}) {
  if (input.direction === "NO_TRADE") {
    return { ok: false, reason: "Signal direction is NO_TRADE" };
  }

  if (input.confidence < MIN_CONFIDENCE) {
    return { ok: false, reason: `Signal confidence ${input.confidence.toFixed(3)} is below ${MIN_CONFIDENCE.toFixed(2)}` };
  }

  if (!ACTIONABLE_KILLZONES.has(input.killzone)) {
    return { ok: false, reason: `Killzone ${input.killzone} is outside Penny active windows` };
  }

  return { ok: true as const };
}

async function getExistingSignalBySourceKey(sourceIdempotencyKey: string): Promise<string | null> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("aura_signals")
    .select("id")
    .eq("source_idempotency_key", sourceIdempotencyKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load Penny Aura signal by source key: ${error.message}`);
  }

  return data?.id ? String(data.id) : null;
}

async function insertAuraSignalRecord(input: {
  ownerId: string;
  pair: string;
  timeframe: string;
  sourceIdempotencyKey: string;
  direction: string;
  confidence: number;
  entry: string;
  stop: string;
  tp1: string | null;
  tp2: string | null;
  tp3: string | null;
  reason: string;
  notes: string;
  signalPayload: unknown;
}): Promise<string> {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("aura_signals")
    .insert({
      owner_id: input.ownerId,
      pair: input.pair,
      timeframe: input.timeframe,
      style: "swing",
      direction: input.direction,
      confidence: input.confidence,
      entry: input.entry,
      stop: input.stop,
      tp1: input.tp1,
      tp2: input.tp2,
      tp3: input.tp3,
      reason: input.reason,
      notes: input.notes,
      signal_payload: input.signalPayload,
      source_idempotency_key: input.sourceIdempotencyKey,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const existingSignalId = await getExistingSignalBySourceKey(input.sourceIdempotencyKey);
      if (existingSignalId) {
        return existingSignalId;
      }
    }

    throw new Error(`Failed to create Penny Aura signal: ${error.message}`);
  }

  return String(data.id);
}

async function appendAuraSignalHistory(input: {
  ownerId: string;
  signalId: string;
  note: string;
}) {
  const supabase = requireSupabaseAdmin();
  const { error } = await supabase.from("aura_signal_history").insert({
    owner_id: input.ownerId,
    signal_id: input.signalId,
    status: "open",
    note: input.note,
  });

  if (error) {
    throw new Error(`Failed to append Penny Aura signal history: ${error.message}`);
  }
}

async function reserveDelivery(input: {
  ownerId: string;
  signalId: string;
  access: PennyAccessRow;
}): Promise<
  | { status: "reserved"; deliveryId: string; idempotencyKey: string }
  | { status: "duplicate"; idempotencyKey: string }
> {
  const supabase = requireSupabaseAdmin();
  const telegramChatId = input.access.telegram_chat_id?.trim();
  if (!telegramChatId) {
    throw new Error("telegram_chat_id is required to reserve delivery");
  }

  const idempotencyKey = buildPennyDeliveryIdempotencyKey({
    signalId: input.signalId,
    chatId: telegramChatId,
  });

  const { data: existing, error: existingError } = await supabase
    .from("penny_signal_deliveries")
    .select("id,status,attempt_count")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to lookup Penny delivery reservation: ${existingError.message}`);
  }

  if (existing?.id) {
    if (existing.status === "failed") {
      const { data: retried, error: retryError } = await supabase
        .from("penny_signal_deliveries")
        .update({
          status: "pending",
          error_message: null,
          attempt_count: Number(existing.attempt_count || 0) + 1,
        })
        .eq("id", existing.id)
        .select("id")
        .single();

      if (retryError) {
        throw new Error(`Failed to reopen Penny delivery: ${retryError.message}`);
      }

      return {
        status: "reserved",
        deliveryId: String(retried.id),
        idempotencyKey,
      };
    }

    return {
      status: "duplicate",
      idempotencyKey,
    };
  }

  const { data, error } = await supabase
    .from("penny_signal_deliveries")
    .insert({
      owner_id: input.ownerId,
      signal_id: input.signalId,
      access_id: input.access.id,
      telegram_chat_id: telegramChatId,
      delivery_channel: "telegram",
      status: "pending",
      attempt_count: 1,
      idempotency_key: idempotencyKey,
      metadata: {
        accessState: input.access.access_state,
        subscriptionTier: input.access.subscription_tier,
      },
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        status: "duplicate",
        idempotencyKey,
      };
    }

    throw new Error(`Failed to reserve Penny delivery: ${error.message}`);
  }

  return {
    status: "reserved",
    deliveryId: String(data.id),
    idempotencyKey,
  };
}

async function updateDelivery(input: {
  deliveryId: string;
  status: "sent" | "failed" | "skipped";
  messageId?: string;
  errorMessage?: string;
}) {
  const supabase = requireSupabaseAdmin();
  const { error } = await supabase
    .from("penny_signal_deliveries")
    .update({
      status: input.status,
      external_message_id: input.messageId ?? null,
      error_message: input.errorMessage ?? null,
    })
    .eq("id", input.deliveryId);

  if (error) {
    throw new Error(`Failed to update Penny delivery: ${error.message}`);
  }
}

async function resolveEligibleRecipients(ownerId: string): Promise<PennyAccessRow[]> {
  const rows = await listPennyTelegramAccessEntries(ownerId, { limit: 200 });
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

function resolveToneModeForRecipient(access: PennyAccessRow): PennyToneMode {
  if (access.access_state === "founder" || access.access_state === "admin") {
    return "founder_private";
  }

  return "subscriber_premium";
}

export async function runPennyAuraSignalFlow(input: {
  ownerId: string;
  pair: string;
  timeframe: Timeframe | string;
  source?: string;
}): Promise<PipelineResult> {
  const ownerId = input.ownerId.trim();
  const { pair, timeframe } = assertPennyMarketScope(input.pair, input.timeframe);

  if (!ownerId) {
    throw new Error("ownerId is required");
  }

  await ensurePennyFounderAccessEntry(ownerId);

  const candles = await getLatestPennyAuraCandles({
    ownerId,
    pair,
    timeframe,
  });

  if (candles.length < PENNY_MIN_SIGNAL_CANDLES) {
    return {
      ok: true,
      status: "skipped",
      pair,
      timeframe,
      reason: `Not enough candles for Penny signal generation. Need ${PENNY_MIN_SIGNAL_CANDLES}, got ${candles.length}.`,
    };
  }

  const engine = buildAuraFxContext({ candles });
  const signal = buildSignalPayload(engine, { symbol: pair, timeframe });
  const latestCandleTime = candles[candles.length - 1]?.time;
  const actionable = isActionableSignal({
    direction: signal.direction,
    confidence: signal.confidence,
    killzone: signal.killzone,
  });

  if (!actionable.ok) {
    return {
      ok: true,
      status: "skipped",
      pair,
      timeframe,
      reason: actionable.reason,
    };
  }

  if (typeof latestCandleTime !== "number") {
    throw new Error("Latest candle time is missing");
  }

  const targets = formatSignalTargets(signal.targetZone);
  const sourceIdempotencyKey = buildPennySignalSourceIdempotencyKey({
    ownerId,
    pair,
    timeframe,
    latestCandleTime,
  });
  const existingSignalId = await getExistingSignalBySourceKey(sourceIdempotencyKey);
  const signalId =
    existingSignalId ??
    (await insertAuraSignalRecord({
      ownerId,
      pair,
      timeframe,
      sourceIdempotencyKey,
      direction: signal.direction,
      confidence: signal.confidence,
      entry: formatZone(signal.entryZone),
      stop: formatZone(signal.stopZone),
      tp1: targets.tp1,
      tp2: targets.tp2,
      tp3: targets.tp3,
      reason: signal.rationaleShort,
      notes: `Source: ${(input.source?.trim() || "pipeline")}. Killzone: ${signal.killzone}.`,
      signalPayload: toPublicSignal(signal),
    }));

  if (!existingSignalId) {
    await appendAuraSignalHistory({
      ownerId,
      signalId,
      note: `Penny signal generated at ${(signal.confidence * 100).toFixed(0)}% confidence for ${pair} ${timeframe}.`,
    });
  }

  const recipients = await resolveEligibleRecipients(ownerId);
  if (recipients.length === 0) {
    await appendAuraSignalHistory({
      ownerId,
      signalId,
      note: "Delivery skipped. No eligible Penny Telegram recipients were available.",
    });

    return {
      ok: true,
      status: "stored",
      signalId,
      pair,
      timeframe,
      deliveries: {
        sent: 0,
        failed: 0,
        duplicates: 0,
        skipped: 1,
      },
    };
  }

  const deliveryCounts = {
    sent: 0,
    failed: 0,
    duplicates: 0,
    skipped: 0,
  };

  for (const recipient of recipients) {
    const reserved = await reserveDelivery({
      ownerId,
      signalId,
      access: recipient,
    });

    if (reserved.status === "duplicate") {
      deliveryCounts.duplicates += 1;
      continue;
    }

    try {
      const message = buildPennyActionableSignalCard({
        signal,
        toneMode: resolveToneModeForRecipient(recipient),
      }).text;

      const sent = await sendPennyTelegramMessage({
        chatId: recipient.telegram_chat_id as string,
        text: message,
      });

      if (!sent.ok) {
        await updateDelivery({
          deliveryId: reserved.deliveryId,
          status: "failed",
          errorMessage: sent.error,
        });
        deliveryCounts.failed += 1;
        continue;
      }

      await updateDelivery({
        deliveryId: reserved.deliveryId,
        status: "sent",
        messageId: sent.messageId,
      });
      deliveryCounts.sent += 1;
    } catch (error) {
      await updateDelivery({
        deliveryId: reserved.deliveryId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown Penny Telegram send failure",
      });
      deliveryCounts.failed += 1;
    }
  }

  await appendAuraSignalHistory({
    ownerId,
    signalId,
    note: `Delivery summary: sent=${deliveryCounts.sent}, failed=${deliveryCounts.failed}, duplicates=${deliveryCounts.duplicates}, skipped=${deliveryCounts.skipped}.`,
  });

  return {
    ok: true,
    status: deliveryCounts.sent > 0 ? "sent" : "stored",
    signalId,
    pair,
    timeframe,
    deliveries: deliveryCounts,
  };
}
