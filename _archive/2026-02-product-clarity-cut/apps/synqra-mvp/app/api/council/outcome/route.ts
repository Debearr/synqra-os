import { NextRequest, NextResponse } from "next/server";
import { recordOutcome } from "@/lib/council/council-orchestrator";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { actionId, outcome, metrics, context } = body;

    if (!actionId || !outcome) {
      return NextResponse.json({ error: "actionId and outcome required" }, { status: 400 });
    }

    await recordOutcome({
      actionId,
      userId: user.id,
      outcome,
      metrics: metrics || {},
      context: context || {},
      timestamp: Date.now(),
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Council outcome recording error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

