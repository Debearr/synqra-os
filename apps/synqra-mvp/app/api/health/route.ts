import { NextResponse } from "next/server";

/**
 * ============================================================
 * HEALTH CHECK ENDPOINT
 * ============================================================
 * Railway and monitoring systems use this to verify the app is running
 * Simple response: { ok: true } = app is alive and responding
 */

export async function GET() {
  return NextResponse.json({ ok: true });
}
