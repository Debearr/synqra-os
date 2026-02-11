/**
 * Telegram client stub for AuraFX signals.
 * - No-op unless AURAFX_TELEGRAM_ENABLED and required env vars are present.
 */

import { AuraFxSignalPayload } from "./types";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ENABLED = process.env.AURAFX_TELEGRAM_ENABLED === "1" || process.env.AURAFX_TELEGRAM_ENABLED === "true";

export async function sendSignalToTelegram(signal: AuraFxSignalPayload): Promise<void> {
  if (!ENABLED) {
    console.warn("[AuraFX] Telegram broadcast skipped: AURAFX_TELEGRAM_ENABLED not set");
    return;
  }
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("[AuraFX] Telegram broadcast skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing");
    return;
  }

  const text = [
    `AURA-FX ${signal.symbol} ${signal.timeframe}`,
    `Bias: ${signal.direction} | Confidence: ${(signal.confidence * 100).toFixed(0)}%`,
    `Entry: ${formatZone(signal.entryZone)} | Stop: ${formatZone(signal.stopZone)} | Target: ${formatZone(signal.targetZone)}`,
    `Killzone: ${signal.killzone}`,
    `Why: ${signal.rationaleShort}`,
  ].join("\n");

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body = JSON.stringify({ chat_id: CHAT_ID, text });

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (error) {
    console.warn("[AuraFX] Telegram broadcast failed", error);
  }
}

function formatZone(zone: AuraFxSignalPayload["entryZone"]) {
  if (typeof zone === "string") return zone;
  return `${zone.low.toFixed(5)} - ${zone.high.toFixed(5)}`;
}
