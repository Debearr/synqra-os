import { signPayload } from "../utils/job-signature.js";

type EnqueueRequest = {
  userId: string;
  jobType: string;
  payload: Record<string, unknown>;
  scheduledTime?: string;
  idempotencyKey: string;
};

type OutcomeRequest = {
  userId: string;
  jobId?: string;
  eventType: string;
  status: string;
  metadata?: Record<string, unknown>;
  platform?: string;
  outcomeClassification?: string;
};

type SchedulingRequest = {
  userId: string;
  contentId: string;
  platform: string;
  scheduledTime: string;
  metadata?: Record<string, unknown>;
};

type DraftRequest = {
  userId: string;
  type: "email" | "calendar";
  recipient: string;
  subject?: string;
  body?: string;
  sensitivityLevel?: "low" | "normal" | "high";
  approved?: boolean;
  metadata?: Record<string, unknown>;
};

type EmailDraftRequest = {
  userId: string;
  email_event_id: string;
  tone_preference?: "premium" | "direct" | "casual";
  context?: string;
  include_signature?: boolean;
};

type CouncilRequest = {
  userId?: string;
  prompt: string;
};

function getBaseUrl(): string {
  const raw = process.env.INTERNAL_API_BASE_URL?.trim();
  if (!raw) {
    throw new Error("INTERNAL_API_BASE_URL is required for router-client");
  }

  const normalized = raw.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/i.test(normalized)) {
    throw new Error("INTERNAL_API_BASE_URL must not point to localhost in production");
  }

  return normalized;
}

function getSecret(): string {
  const secret = process.env.INTERNAL_JOB_SIGNING_SECRET?.trim();
  if (!secret) {
    throw new Error("INTERNAL_JOB_SIGNING_SECRET is required for router-client");
  }
  return secret;
}

async function postSigned(path: string, payload: unknown): Promise<Response> {
  const signature = signPayload(payload, getSecret());
  return fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-job-signature": signature,
      "x-internal-signature": signature,
    },
    body: JSON.stringify(payload),
  });
}

async function parseOrThrow(response: Response): Promise<unknown> {
  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    const details = data && typeof data.error === "string" ? data.error : `HTTP ${response.status}`;
    throw new Error(`Internal API request failed: ${details}`);
  }
  return data;
}

export async function enqueueInternalJob(payload: EnqueueRequest): Promise<unknown> {
  const response = await postSigned("/api/internal/jobs/enqueue", payload);
  return parseOrThrow(response);
}

export async function recordInternalOutcome(payload: OutcomeRequest): Promise<unknown> {
  const response = await postSigned("/api/internal/outcomes/record", payload);
  return parseOrThrow(response);
}

export async function createInternalSchedulingRequest(payload: SchedulingRequest): Promise<unknown> {
  const response = await postSigned("/api/internal/scheduling/request", payload);
  return parseOrThrow(response);
}

export async function createInternalCommunicationDraft(payload: DraftRequest): Promise<unknown> {
  const response = await postSigned("/api/internal/communications/draft", payload);
  return parseOrThrow(response);
}

export async function generateEmailDraft(payload: EmailDraftRequest): Promise<unknown> {
  const response = await postSigned("/api/v1/email/draft", payload);
  return parseOrThrow(response);
}

export async function generateCouncilContent(payload: CouncilRequest): Promise<unknown> {
  const response = await postSigned("/api/council", payload);
  return parseOrThrow(response);
}
