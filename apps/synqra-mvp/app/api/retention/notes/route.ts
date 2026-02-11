import { NextRequest, NextResponse } from "next/server";
import { requireSupabase } from "@/lib/supabaseClient";
import {
  enforceKillSwitch,
  ensureCorrelationId,
  logSafeguard,
  normalizeError,
  requireConfirmation,
} from "@/lib/safeguards";

/**
 * ============================================================
 * RETENTION NOTES ENDPOINT
 * ============================================================
 * POST /api/retention/notes
 * Store retention analytics from platform exports (CSV, API, manual)
 */

interface RetentionNoteRequest {
  platform: string;
  videoId: string;
  avgViewDuration?: number;
  avgCompletion?: number;
  notes?: string;
  confirmed?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const correlationId = ensureCorrelationId(request.headers.get("x-correlation-id"));
    const body: RetentionNoteRequest = await request.json();

    logSafeguard({
      level: "info",
      message: "retention.note.start",
      scope: "retention",
      correlationId,
      data: { platform: body?.platform, videoId: body?.videoId },
    });

    enforceKillSwitch({ scope: "retention", correlationId });
    requireConfirmation({
      confirmed: body?.confirmed,
      context: "Store retention analytics note",
      correlationId,
    });

    // Validate input
    if (!body.platform || !body.videoId) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Both 'platform' and 'videoId' are required",
          correlationId,
        },
        { status: 400 }
      );
    }

    const { platform, videoId, avgViewDuration, avgCompletion, notes } = body;

    // Insert retention note into Supabase
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("retention_notes")
      .insert({
        platform,
        video_id: videoId,
        avg_view_duration: avgViewDuration || null,
        avg_completion: avgCompletion || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to save retention note:", error);
      return NextResponse.json(
        {
          error: "Database error",
          message: error.message,
          correlationId,
        },
        { status: 500 }
      );
    }

    // Log the retention note
    const timestamp = new Date().toISOString();
    const logLine = `[RETENTION] ${timestamp} | Platform: ${platform} | Video: ${videoId} | Duration: ${avgViewDuration || "N/A"}s | Completion: ${avgCompletion || "N/A"}%`;
    console.log(logLine);
    logSafeguard({
      level: "info",
      message: "retention.note.success",
      scope: "retention",
      correlationId,
      data: { platform, videoId },
    });

    return NextResponse.json(
      {
        id: data.id,
        platform,
        videoId,
        avgViewDuration,
        avgCompletion,
        notes,
        timestamp: data.created_at,
        correlationId,
      },
      { status: 201 }
    );
  } catch (error) {
    const normalized = normalizeError(error);
    const correlationId = ensureCorrelationId(
      (error as any)?.correlationId || undefined
    );
    logSafeguard({
      level: "error",
      message: "retention.note.error",
      scope: "retention",
      correlationId,
      data: { error: normalized.code },
    });

    return NextResponse.json(
      {
        error: normalized.code,
        message: normalized.safeMessage,
        correlationId,
      },
      { status: normalized.status }
    );
  }
}

/**
 * GET /api/retention/notes
 * Retrieve retention notes (optional: filter by platform)
 */
export async function GET(request: NextRequest) {
  try {
    const correlationId = ensureCorrelationId(request.headers.get("x-correlation-id"));

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const limit = parseInt(searchParams.get("limit") || "50");

    const supabase = requireSupabase();
    let query = supabase
      .from("retention_notes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (platform) {
      query = query.eq("platform", platform);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch retention notes:", error);
      return NextResponse.json(
        {
          error: "Database error",
          message: error.message,
          correlationId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notes: data || [],
      count: data?.length || 0,
      platform: platform || "all",
      correlationId,
    });
  } catch (error) {
    const normalized = normalizeError(error);
    const correlationId = ensureCorrelationId(
      (error as any)?.correlationId || undefined
    );
    logSafeguard({
      level: "error",
      message: "retention.notes.list.error",
      scope: "retention",
      correlationId,
      data: { error: normalized.code },
    });

    return NextResponse.json(
      {
        error: normalized.code,
        message: normalized.safeMessage,
        correlationId,
      },
      { status: normalized.status }
    );
  }
}

/**
 * Handle unsupported methods
 */
export async function PUT() {
  return new NextResponse("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, POST" },
  });
}

export async function DELETE() {
  return new NextResponse("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, POST" },
  });
}

export async function PATCH() {
  return new NextResponse("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, POST" },
  });
}
