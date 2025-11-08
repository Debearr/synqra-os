import { NextResponse } from "next/server";
import { runSelfHealing } from "sales-engine";

export async function POST() {
  try {
    const report = await runSelfHealing();
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    console.error("[sales-engine] Self-healing route failed", error);
    return NextResponse.json({ ok: false, error: "self_healing_failed" }, { status: 500 });
  }
}
