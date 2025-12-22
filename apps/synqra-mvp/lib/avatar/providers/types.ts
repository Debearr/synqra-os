import { AvatarPlan, AvatarProviderName, AvatarVoiceProfile } from "../types";

export interface AvatarProviderRequest {
  jobId: string;
  script: string;
  voice: AvatarVoiceProfile;
  plan: AvatarPlan;
}

export interface AvatarProviderResponse {
  provider: AvatarProviderName;
  videoBuffer?: Buffer;
  audioBuffer?: Buffer;
  videoUrl?: string;
  audioUrl?: string;
  traceId?: string;
}

export type AvatarProvider = (request: AvatarProviderRequest) => Promise<AvatarProviderResponse>;
