import { NextRequest, NextResponse } from "next/server";
import { consultCouncil } from "@/lib/council/council-orchestrator";
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
    const { action, accountState, recentTrades, sessionData, product } = body;

    if (!action || !accountState || !product) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const response = await consultCouncil({
      userId: user.id,
      action,
      accountState,
      recentTrades: recentTrades || [],
      sessionData: sessionData || { startTime: Date.now(), errors: 0, totalActions: 0 },
      product,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Council governance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

