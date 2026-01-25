import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

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
}

export async function POST(request: NextRequest) {
  try {
    const body: RetentionNoteRequest = await request.json();

    // Validate input
    if (!body.platform || !body.videoId) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Both 'platform' and 'videoId' are required",
        },
        { status: 400 }
      );
    }

    const { platform, videoId, avgViewDuration, avgCompletion, notes } = body;

    // Insert retention note into Supabase
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
        },
        { status: 500 }
      );
    }

    // Log the retention note
    const timestamp = new Date().toISOString();
    const logLine = `[RETENTION] ${timestamp} | Platform: ${platform} | Video: ${videoId} | Duration: ${avgViewDuration || "N/A"}s | Completion: ${avgCompletion || "N/A"}%`;
    console.log(logLine);

    return NextResponse.json(
      {
        id: data.id,
        platform,
        videoId,
        avgViewDuration,
        avgCompletion,
        notes,
        timestamp: data.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Retention note save error:", error);

    return NextResponse.json(
      {
        error: "Failed to save retention note",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/retention/notes
 * Retrieve retention notes (optional: filter by platform)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const limit = parseInt(searchParams.get("limit") || "50");

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
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notes: data || [],
      count: data?.length || 0,
      platform: platform || "all",
    });
  } catch (error) {
    console.error("Retention notes fetch error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch retention notes",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
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
