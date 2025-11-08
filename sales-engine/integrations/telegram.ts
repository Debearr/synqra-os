import { getTelegramConfig } from "../config";
import type { TelegramButton } from "../types";
import { logSalesEvent } from "../db/client";

type TelegramSendOptions = {
  chatId?: string;
  text: string;
  buttons?: TelegramButton[];
  parseMode?: "Markdown" | "HTML";
};

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; username?: string; first_name?: string };
    chat: { id: number; type: string };
    text?: string;
  };
};

function buildButtons(buttons?: TelegramButton[]) {
  if (!buttons?.length) {
    return undefined;
  }

  return JSON.stringify({
    inline_keyboard: [
      buttons.map((button) => ({
        text: button.text,
        url: button.url,
        callback_data: button.callbackData,
      })),
    ],
  });
}

export async function sendTelegramMessage(options: TelegramSendOptions) {
  const config = getTelegramConfig();
  if (!config.token) {
    console.warn("[sales-engine] Telegram token missing; message skipped.");
    return { ok: false, reason: "token_missing" };
  }

  const chatId = options.chatId ?? config.salesChatId;
  if (!chatId) {
    console.warn("[sales-engine] Telegram chat ID missing; message skipped.");
    return { ok: false, reason: "chat_missing" };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: options.text,
        parse_mode: options.parseMode ?? "Markdown",
        reply_markup: buildButtons(options.buttons),
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn("[sales-engine] Telegram send failed", error);
      return { ok: false, reason: error };
    }

    return { ok: true };
  } catch (error) {
    console.warn("[sales-engine] Telegram send error", error);
    return { ok: false, reason: (error as Error).message };
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  if (!update.message?.text) {
    return { ok: false, reason: "no_text" };
  }

  const incoming = {
    chatId: update.message.chat.id,
    handle: update.message.from?.username,
    text: update.message.text,
  };

  await logSalesEvent({
    type: "system_notification",
    payload: { telegram: incoming },
  });

  return incoming;
}

export async function sendQualificationChatbotMessage(params: {
  leadName?: string;
  question: string;
  buttons?: TelegramButton[];
}) {
  const message = [
    params.leadName ? `Hey ${params.leadName},` : "Hey there,",
    params.question,
  ].join("\n\n");

  return sendTelegramMessage({
    text: message,
    buttons: params.buttons,
    parseMode: "Markdown",
  });
}
