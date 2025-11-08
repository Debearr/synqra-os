import { NextResponse } from "next/server";
import { sendTelegramMessage, type TelegramButton } from "sales-engine";

type Payload = {
  text: string;
  chatId?: string;
  buttons?: TelegramButton[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    if (!body.text) {
      return NextResponse.json({ ok: false, error: "missing_text" }, { status: 400 });
    }

    const result = await sendTelegramMessage({
      text: body.text,
      chatId: body.chatId,
      buttons: body.buttons,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[sales-engine] Telegram broadcast route failed", error);
    return NextResponse.json({ ok: false, error: "telegram_broadcast_failed" }, { status: 500 });
  }
}
