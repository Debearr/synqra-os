import { AvatarProviderRequest, AvatarProviderResponse } from "./types";

export async function didProvider(request: AvatarProviderRequest): Promise<AvatarProviderResponse> {
  if (!process.env.DID_API_KEY) {
    return {
      provider: "did",
      videoBuffer: Buffer.from(`did-fallback-${request.jobId}`),
      traceId: `did-local-${Date.now()}`,
    };
  }

  const response = await fetch("https://api.d-id.com/v1/videos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DID_API_KEY}`,
    },
    body: JSON.stringify({
      script: request.script,
      voice: request.voice,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`D-ID provider error: ${response.status} ${message}`);
  }

  const payload = await response.json();
  const videoUrl: string | undefined = payload.result_url ?? payload.url;
  let videoBuffer: Buffer | undefined;
  if (videoUrl) {
    const download = await fetch(videoUrl);
    const arrayBuffer = await download.arrayBuffer();
    videoBuffer = Buffer.from(arrayBuffer);
  }

  return {
    provider: "did",
    videoBuffer,
    audioBuffer: undefined,
    videoUrl,
    traceId: payload.id ?? payload.trace_id ?? request.jobId,
  };
}
