import { Worker } from "bullmq";
import { stitchVideoWithAudio } from "../ffmpeg/stitch";
import { AVATAR_QUEUE_NAME, avatarQueue, avatarQueueEvents } from "./queue";
import { hedraProvider, heygenProvider, didProvider, livePortraitProvider } from "../providers";
import type { AvatarJobPayload, AvatarJobStatus } from "../types";
import { estimateAvatarCost, projectUsageAfterJob } from "../../kie-ai/cost-estimator";
import { requireSupabaseAdmin } from "../../supabaseAdmin";
import type { AvatarUsage } from "../types";
import { fetchAvatarUsage } from "../usage";

const providerMap = {
  hedra: hedraProvider,
  heygen: heygenProvider,
  did: didProvider,
  liveportrait: livePortraitProvider,
};

function decodeDataUrl(dataUrl?: string): Buffer | undefined {
  if (!dataUrl) return undefined;
  const cleaned = dataUrl.replace(/^data:[^;]+;base64,/, "");
  return Buffer.from(cleaned, "base64");
}

export function startAvatarWorker() {
  const worker = new Worker<AvatarJobPayload>(
    AVATAR_QUEUE_NAME,
    async (job) => {
      const provider = providerMap[job.data.provider];
      if (!provider) throw new Error(`Unknown provider ${job.data.provider}`);

      const supabase = requireSupabaseAdmin();
      const now = new Date().toISOString();

      await supabase.from("avatar_jobs").upsert({
        id: job.id,
        user_id: job.data.userId,
        plan: job.data.plan,
        provider: job.data.provider,
        status: "processing",
        preview_url: job.data.previewUrl,
        perceptual_hash: job.data.promptHash,
        created_at: now,
        updated_at: now,
      });

      try {
        const providerResult = await provider({
          jobId: job.data.jobId,
          script: job.data.script,
          voice: job.data.voice,
          plan: job.data.plan,
        });

        const rawVideo = providerResult.videoBuffer ?? decodeDataUrl(job.data.sanitizedImage);
        const rawAudio = providerResult.audioBuffer ?? decodeDataUrl(job.data.sanitizedAudio);

        if (!rawVideo) {
          throw new Error("Provider did not return video data");
        }

        let finalVideo = rawVideo;
        if (rawAudio) {
          job.updateProgress(50).catch(() => {});
          finalVideo = await stitchVideoWithAudio(rawVideo, rawAudio);
        }

        const uploadPath = `avatars/${job.data.userId}/${job.id}.mp4`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatar-renders")
          .upload(uploadPath, finalVideo, {
            contentType: "video/mp4",
            upsert: true,
          });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("avatar-renders").getPublicUrl(uploadData.path);
        const publicUrl = urlData.publicUrl;

        const usageForCost: AvatarUsage | undefined = await fetchAvatarUsage(supabase, job.data.userId);

        const cost = estimateAvatarCost(job.data.plan, usageForCost, 1);
        const usageRecord = projectUsageAfterJob(job.data.plan, usageForCost ?? null, 1);
        usageRecord.userId = job.data.userId;

        await supabase.from("avatar_usage").upsert({
          user_id: job.data.userId,
          plan: job.data.plan,
          videos_generated: usageRecord.videosGenerated,
          cost_to_date: usageRecord.costToDate,
          window_start: usageRecord.windowStart,
          window_end: usageRecord.windowEnd,
          perceptual_hash: job.data.promptHash,
          updated_at: new Date().toISOString(),
        });

        await supabase.from("avatar_jobs").upsert({
          id: job.id,
          user_id: job.data.userId,
          plan: job.data.plan,
          provider: job.data.provider,
          status: "completed",
          cost: cost.estimatedJobCost,
          preview_url: job.data.previewUrl,
          video_url: publicUrl,
          perceptual_hash: job.data.promptHash,
          created_at: now,
          updated_at: new Date().toISOString(),
        });

        job.updateProgress(100).catch(() => {});
        return publicUrl;
      } catch (error) {
        await supabase
          .from("avatar_jobs")
          .upsert({
            id: job.id,
            user_id: job.data.userId,
            plan: job.data.plan,
            provider: job.data.provider,
            status: "failed",
            preview_url: job.data.previewUrl,
            perceptual_hash: job.data.promptHash,
            updated_at: new Date().toISOString(),
          })
          .catch(() => {});
        throw error;
      }
    },
    { connection: avatarQueue.opts.connection as any }
  );

  avatarQueueEvents.on("failed", ({ jobId, failedReason }) => {
    const status: AvatarJobStatus = {
      id: jobId ?? "unknown",
      status: "failed",
      error: failedReason,
    };
    console.error("Avatar job failed", status);
  });

  return worker;
}

export async function enqueueAvatarJob(payload: AvatarJobPayload) {
  await avatarQueue.add("generate", payload, {
    jobId: payload.jobId,
    priority: payload.plan === "studio" ? 1 : 3,
  });
}
