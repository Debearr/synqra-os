import { NextResponse } from "next/server";
import { handleTelegramUpdate } from "sales-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await handleTelegramUpdate(body);

    return NextResponse.json({ ok: true, message: result });
  } catch (error) {
    console.error("[sales-engine] Telegram inbound handler failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
