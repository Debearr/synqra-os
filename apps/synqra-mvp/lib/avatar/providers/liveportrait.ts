import { AvatarProviderRequest, AvatarProviderResponse } from "./types";

export async function livePortraitProvider(request: AvatarProviderRequest): Promise<AvatarProviderResponse> {
  if (!process.env.LIVEPORTRAIT_API_KEY) {
    return {
      provider: "liveportrait",
      videoBuffer: Buffer.from(`liveportrait-fallback-${request.jobId}`),
      traceId: `liveportrait-local-${Date.now()}`,
    };
  }

  const response = await fetch("https://api.liveportrait.ai/v1/render", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LIVEPORTRAIT_API_KEY}`,
    },
    body: JSON.stringify({
      script: request.script,
      voice: request.voice,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`LivePortrait provider error: ${response.status} ${message}`);
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
    provider: "liveportrait",
    videoBuffer,
    audioBuffer: undefined,
    videoUrl,
    traceId: payload.id ?? payload.trace_id ?? request.jobId,
  };
}
