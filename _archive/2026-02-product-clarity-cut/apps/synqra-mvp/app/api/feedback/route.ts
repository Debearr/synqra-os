import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { request_id, rating, comment } = body;

    if (!request_id || !rating) {
      return NextResponse.json(
        { error: "request_id and rating are required" },
        { status: 400 }
      );
    }

    const supabase = requireSupabaseAdmin();

    const { error } = await supabase.from("ai_feedback").insert({
      request_id,
      rating,
      comment: comment || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Feedback insert error:", error);
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

