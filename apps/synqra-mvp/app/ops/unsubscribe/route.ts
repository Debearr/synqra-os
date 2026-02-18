import { NextRequest, NextResponse } from "next/server";

import { decodeUnsubscribeToken } from "@/lib/ops/unsubscribe-token";
import { captureOpsException } from "@/lib/ops/sentry";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.nextUrl.searchParams.get("t") ?? "";
    const email = decodeUnsubscribeToken(token);
    if (!email) {
      return htmlResponse("Invalid unsubscribe link.", 400);
    }

    const supabase = requireSupabaseAdmin();
    const { error } = await supabase
      .schema("ops_audit")
      .from("suppression_list")
      .upsert({ email, reason: "unsubscribed" }, { onConflict: "email", ignoreDuplicates: true });

    if (error) {
      captureOpsException(new Error(error.message), {
        job_name: "unsubscribe_handler",
        service: "synqra-mvp",
        vertical: "unknown",
      });
      return htmlResponse("Unable to process unsubscribe at this time.", 500);
    }

    return htmlResponse("You have been unsubscribed.", 200);
  } catch (error) {
    captureOpsException(error, { job_name: "unsubscribe_handler", service: "synqra-mvp", vertical: "unknown" });
    return htmlResponse("Unable to process unsubscribe at this time.", 500);
  }
}

function htmlResponse(message: string, status: number): NextResponse {
  const html = `<!doctype html><html><body><p>${escapeHtml(message)}</p></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
