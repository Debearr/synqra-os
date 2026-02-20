import { NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * ============================================================
 * READINESS CHECK ENDPOINT
 * ============================================================
 * Used by orchestrators to determine if the app is ready to serve traffic
 */

async function checkSupabaseReadiness(): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = requireSupabaseAdmin();
    const { error } = await supabase.from("users").select("id", { count: "exact", head: true }).limit(1);
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown Supabase error" };
  }
}

async function performReadinessCheck() {
  const supabase = await checkSupabaseReadiness();
  const ready = supabase.ok;
  const status = ready ? 200 : 503;
  return NextResponse.json(
    {
      status: ready ? "ok" : "not ready",
      ready,
      timestamp: new Date().toISOString(),
      dependencies: {
        supabase: supabase.ok ? "reachable" : "unreachable",
      },
      ...(supabase.error ? { error: supabase.error } : {}),
    },
    {
      status,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}

export async function GET() {
  return performReadinessCheck();
}

export async function HEAD() {
  const response = await performReadinessCheck();
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
