/**
 * Telegram relay for AuraFX
 * - Uses TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID from environment.
 * - No secrets are logged or exposed.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

const sanitizeHtml = (input: string) =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function sendTelegramMessage(message: string): Promise<void> {
  if (!BOT_TOKEN || !CHANNEL_ID) {
    console.warn("[AuraFX] Telegram credentials missing; skipping send.");
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: CHANNEL_ID,
    text: sanitizeHtml(message),
    parse_mode: "HTML",
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("[AuraFX] Telegram send failed", error);
  }
}
