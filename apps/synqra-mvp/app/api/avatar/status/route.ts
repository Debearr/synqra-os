import { NextRequest, NextResponse } from "next/server";
import { avatarQueue } from "@/lib/avatar/workers/queue";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { AvatarJobStatus } from "@/lib/avatar/types";

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("id");
  if (!jobId) {
    return NextResponse.json({ error: "id query param required" }, { status: 400 });
  }

  const job = await avatarQueue.getJob(jobId);
  const supabase = requireSupabaseAdmin();

  const { data: persisted } = await supabase
    .from("avatar_jobs")
    .select("provider, status, video_url, cost, updated_at")
    .eq("id", jobId)
    .single();

  if (!job && !persisted) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }

  const state = job ? await job.getState() : (persisted?.status as AvatarJobStatus["status"] | undefined) ?? "completed";
  const progress = job && typeof job.progress === "number" ? job.progress : state === "completed" ? 100 : 0;

  const status: AvatarJobStatus = {
    id: jobId,
    status: state as AvatarJobStatus["status"],
    progress,
    resultUrl: persisted?.video_url,
    provider: (persisted?.provider as AvatarJobStatus["provider"]) ?? undefined,
    cost: persisted?.cost ?? undefined,
    updatedAt: persisted?.updated_at ?? undefined,
  };

  return NextResponse.json(status);
}
