import "server-only";

function getPennyBotToken(): string {
  const token = process.env.PENNY_TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("PENNY_TELEGRAM_BOT_TOKEN is not configured");
  }
  return token;
}

export async function sendPennyTelegramMessage(input: {
  chatId: string;
  text: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const chatId = input.chatId.trim();
  const text = input.text.trim();

  if (!chatId) {
    throw new Error("chatId is required");
  }

  if (!text) {
    throw new Error("text is required");
  }

  const response = await fetch(`https://api.telegram.org/bot${getPennyBotToken()}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; description?: string; result?: { message_id?: number } }
    | null;

  if (!response.ok || !data?.ok) {
    return {
      ok: false,
      error: data?.description || `Telegram send failed with HTTP ${response.status}`,
    };
  }

  return {
    ok: true,
    messageId: typeof data.result?.message_id === "number" ? String(data.result.message_id) : undefined,
  };
}
