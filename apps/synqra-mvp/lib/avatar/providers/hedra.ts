import { AvatarProviderRequest, AvatarProviderResponse } from "./types";

export async function hedraProvider(request: AvatarProviderRequest): Promise<AvatarProviderResponse> {
  if (!process.env.HEDRA_API_KEY) {
    return {
      provider: "hedra",
      videoBuffer: Buffer.from(`hedra-placeholder-${request.jobId}`),
      traceId: `hedra-local-${Date.now()}`,
    };
  }

  const response = await fetch("https://api.hedra.com/v1/avatar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HEDRA_API_KEY}`,
    },
    body: JSON.stringify({
      script: request.script,
      voice: request.voice,
      plan: request.plan,
      job_id: request.jobId,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Hedra provider error: ${response.status} ${message}`);
  }

  const payload = await response.json();
  const videoUrl: string | undefined = payload.video_url ?? payload.url;
  let videoBuffer: Buffer | undefined;
  if (videoUrl) {
    const download = await fetch(videoUrl);
    const arrayBuffer = await download.arrayBuffer();
    videoBuffer = Buffer.from(arrayBuffer);
  }

  return {
    provider: "hedra",
    videoBuffer,
    audioBuffer: undefined,
    videoUrl,
    traceId: payload.id ?? payload.trace_id ?? request.jobId,
  };
}
