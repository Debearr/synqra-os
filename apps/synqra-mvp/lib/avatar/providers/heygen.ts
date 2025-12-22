import { AvatarProviderRequest, AvatarProviderResponse } from "./types";

export async function heygenProvider(request: AvatarProviderRequest): Promise<AvatarProviderResponse> {
  if (!process.env.HEYGEN_API_KEY) {
    return {
      provider: "heygen",
      videoBuffer: Buffer.from(`heygen-fallback-${request.jobId}`),
      traceId: `heygen-local-${Date.now()}`,
    };
  }

  const response = await fetch("https://api.heygen.com/v1/video.generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.HEYGEN_API_KEY,
    },
    body: JSON.stringify({
      input_text: request.script,
      voice: request.voice,
      plan: request.plan,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`HeyGen provider error: ${response.status} ${message}`);
  }

  const payload = await response.json();
  const videoUrl: string | undefined = payload.data?.video_url ?? payload.video_url;
  let videoBuffer: Buffer | undefined;
  if (videoUrl) {
    const download = await fetch(videoUrl);
    const arrayBuffer = await download.arrayBuffer();
    videoBuffer = Buffer.from(arrayBuffer);
  }

  return {
    provider: "heygen",
    videoBuffer,
    audioBuffer: undefined,
    videoUrl,
    traceId: payload.data?.id ?? payload.request_id ?? request.jobId,
  };
}
