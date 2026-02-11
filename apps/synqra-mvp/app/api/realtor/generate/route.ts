import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { TenantVertical } from "@/lib/verticals/tenant";
import { assertVertical, resolveTenantForUserId, verticalTag } from "@/lib/verticals/tenant";
import {
  getAuthenticatedUserIdentity,
  getRealtorProfile,
  markRealtorGenerationSuccess,
} from "../_account";
import {
  checkRealtorBillingAllowance,
  FREE_TIER_LIMIT_EXCEEDED_ERROR,
  recordRealtorGenerationUsage,
  resolveSubscriptionState,
} from "../_billing";
import { evaluatePilotAccess, PILOT_ACCESS_DENIED_ERROR } from "../_pilot";
import {
  buildRateLimitHeaders,
  consumeGenerateRateLimit,
  emitGenerationTelemetryEvent,
  logStructuredServerEvent,
  resolveRequestId,
} from "../_server";
import {
  assertNoBannedWords,
  BANNED_WORD_ERROR,
  BROKERAGE_REQUIRED_ERROR,
  GENERATION_FAILED_ERROR,
  INVALID_GTA_ADDRESS_ERROR,
  isRecognizedGtaAddress,
  NAME_TRUNCATION_WARNING,
  normalizeUtf8,
  parseIncludeEho,
  parseSignatureStyle,
  PHOTO_TOO_SMALL_ERROR,
  sanitizeAgentName,
  type SignatureStyle,
} from "./_compliance";
import { generateRealtorAssets } from "./_generator";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/realtor/generate";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);
const BUCKET_NAME = "synqra-media";
const SIGNED_URL_EXPIRY_SECONDS = 24 * 60 * 60;
const IMAGE_PROCESSING_TIMEOUT_MS = 7_500;
const EXPECTED_ASSETS_PER_GENERATION = 2;

const UNAUTHORIZED_ERROR = "Authentication required.";
const RATE_LIMIT_ERROR = "Too many generation requests. Please retry shortly.";
const IMAGE_PROCESSING_TIMEOUT_ERROR = "Image processing timed out. Please retry.";
const SIGNED_URL_EXPIRY_ERROR = "Asset link generation temporarily unavailable. Please retry.";
const STORAGE_QUOTA_EXCEEDED_ERROR = "Storage quota exceeded. Please contact support.";

type ParsedInput = {
  photo: File;
  price: number;
  beds: number;
  baths: number;
  address: string;
  brokerageName: string;
  agentName: string | null;
  agentLogoPath: string | null;
  includeEho: boolean;
  signatureStyleOverride: SignatureStyle | null;
  warnings: string[];
};

type UploadedAsset = {
  platform: "instagram" | "linkedin";
  url: string;
  width: number;
  height: number;
};

type ErrorLevel = "warn" | "error";

class GenerateRouteError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly level: ErrorLevel;
  public readonly retriable: boolean;

  constructor(params: {
    code: string;
    status: number;
    message: string;
    level?: ErrorLevel;
    retriable?: boolean;
  }) {
    super(params.message);
    this.name = "GenerateRouteError";
    this.code = params.code;
    this.status = params.status;
    this.level = params.level ?? (params.status >= 500 ? "error" : "warn");
    this.retriable = params.retriable ?? false;
  }
}

function getRequiredString(formData: FormData, field: string): string {
  const value = formData.get(field);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required field: ${field}`);
  }
  return normalizeUtf8(value);
}

function getRequiredNumber(formData: FormData, field: string): number {
  const raw = getRequiredString(formData, field);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric field: ${field}`);
  }
  return parsed;
}

function parseInput(formData: FormData): ParsedInput {
  const photo = formData.get("photo");
  if (!(photo instanceof File)) {
    throw new Error("Missing required file: photo");
  }
  if (!ALLOWED_TYPES.has(photo.type)) {
    throw new Error("photo must be JPG or PNG");
  }

  const brokerageRaw = formData.get("brokerage_name");
  if (typeof brokerageRaw !== "string" || !brokerageRaw.trim()) {
    throw new Error(BROKERAGE_REQUIRED_ERROR);
  }

  const brokerageName = normalizeUtf8(brokerageRaw);
  const address = getRequiredString(formData, "address");
  if (!isRecognizedGtaAddress(address)) {
    throw new Error(INVALID_GTA_ADDRESS_ERROR);
  }

  const agentRaw = formData.get("agent_name");
  const { value: agentName, warning } = sanitizeAgentName(typeof agentRaw === "string" ? agentRaw : null);
  const agentLogoRaw = formData.get("agent_logo");
  const agentLogoPath =
    typeof agentLogoRaw === "string" && agentLogoRaw.trim().length > 0 ? normalizeUtf8(agentLogoRaw) : null;

  const textValues = Array.from(formData.values())
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => normalizeUtf8(entry));
  assertNoBannedWords([address, brokerageName, ...(agentName ? [agentName] : []), ...textValues]);

  return {
    photo,
    price: getRequiredNumber(formData, "price"),
    beds: getRequiredNumber(formData, "beds"),
    baths: getRequiredNumber(formData, "baths"),
    address,
    brokerageName,
    agentName,
    agentLogoPath,
    includeEho: parseIncludeEho(formData.get("include_eho")),
    signatureStyleOverride: parseSignatureStyle(formData.get("signature_style")),
    warnings: warning ? [NAME_TRUNCATION_WARNING] : [],
  };
}

function isValidationError(message: string): boolean {
  return (
    message === UNAUTHORIZED_ERROR ||
    message === PILOT_ACCESS_DENIED_ERROR ||
    message === FREE_TIER_LIMIT_EXCEEDED_ERROR ||
    message === BROKERAGE_REQUIRED_ERROR ||
    message === BANNED_WORD_ERROR ||
    message === INVALID_GTA_ADDRESS_ERROR ||
    message === PHOTO_TOO_SMALL_ERROR ||
    message.startsWith("Missing required") ||
    message.startsWith("Invalid") ||
    message.includes("JPG")
  );
}

function isStorageQuotaError(message: string): boolean {
  const text = message.toLowerCase();
  return (
    text.includes("quota") ||
    text.includes("insufficient_storage") ||
    text.includes("insufficient storage") ||
    text.includes("storage limit")
  );
}

function isSignedUrlExpiryError(message: string): boolean {
  const text = message.toLowerCase();
  return text.includes("expire") || text.includes("expiry") || text.includes("expires");
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutError: GenerateRouteError): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(timeoutError), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function ensureBucketReady() {
  const admin = requireSupabaseAdmin();
  const { data: bucket } = await admin.storage.getBucket(BUCKET_NAME);
  if (!bucket) {
    const { error } = await admin.storage.createBucket(BUCKET_NAME, { public: false });
    if (error && !error.message.toLowerCase().includes("already exists")) {
      throw new Error(`Failed to initialize storage bucket: ${error.message}`);
    }
  } else if (bucket.public) {
    const { error } = await admin.storage.updateBucket(BUCKET_NAME, { public: false });
    if (error) {
      throw new Error(`Failed to secure storage bucket: ${error.message}`);
    }
  }
}

async function readLogoBuffer(logoPath: string | null): Promise<Buffer | null> {
  if (!logoPath) return null;
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin.storage.from(BUCKET_NAME).download(logoPath);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

function assertAgentLogoPathOwnership(userId: string, logoPath: string | null): void {
  if (!logoPath) return;
  const expectedPrefix = `realtor/onboarding/${userId}/`;
  if (!logoPath.startsWith(expectedPrefix)) {
    throw new Error("Invalid agent_logo path.");
  }
}

async function executeGeneration(input: ParsedInput, userId: string): Promise<UploadedAsset[]> {
  const profile = await getRealtorProfile(userId);
  assertAgentLogoPathOwnership(userId, input.agentLogoPath);
  const signatureStyle = profile.signatureStyle ?? input.signatureStyleOverride ?? "gold_underline";
  const logoBuffer = await readLogoBuffer(input.agentLogoPath ?? profile.logoPath);

  const photoBuffer = Buffer.from(await input.photo.arrayBuffer());
  const assets = await withTimeout(
    generateRealtorAssets({
      photoBuffer,
      price: input.price,
      beds: input.beds,
      baths: input.baths,
      address: input.address,
      brokerageName: input.brokerageName,
      agentName: input.agentName,
      includeEho: input.includeEho,
      signatureStyle,
      logoBuffer,
    }),
    IMAGE_PROCESSING_TIMEOUT_MS,
    new GenerateRouteError({
      code: "IMAGE_PROCESSING_TIMEOUT",
      status: 503,
      message: IMAGE_PROCESSING_TIMEOUT_ERROR,
      level: "warn",
      retriable: true,
    })
  );

  await ensureBucketReady();
  const admin = requireSupabaseAdmin();
  const jobId = randomUUID();

  return Promise.all(
    assets.map(async (asset) => {
      const filename = `realtor/users/${userId}/assets/${jobId}/${asset.platform}-${asset.width}x${asset.height}.png`;
      const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(filename, asset.buffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true,
      });
      if (uploadError) {
        if (isStorageQuotaError(uploadError.message)) {
          throw new GenerateRouteError({
            code: "STORAGE_QUOTA_EXCEEDED",
            status: 503,
            message: STORAGE_QUOTA_EXCEEDED_ERROR,
            level: "warn",
          });
        }
        throw new Error(`Upload failed for ${asset.platform}: ${uploadError.message}`);
      }

      const { data: signed, error: signedError } = await admin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filename, SIGNED_URL_EXPIRY_SECONDS);
      if (signedError || !signed?.signedUrl) {
        const message = signedError?.message ?? "Signed URL token missing.";
        if (isSignedUrlExpiryError(message) || !signed?.signedUrl) {
          throw new GenerateRouteError({
            code: "SIGNED_URL_EXPIRY",
            status: 503,
            message: SIGNED_URL_EXPIRY_ERROR,
            level: "warn",
          });
        }
        throw new Error(`Signed URL failed for ${asset.platform}: ${message}`);
      }

      return {
        platform: asset.platform,
        url: signed.signedUrl,
        width: asset.width,
        height: asset.height,
      };
    })
  );
}

async function executeWithRetry(input: ParsedInput, userId: string, retries: number): Promise<UploadedAsset[]> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await executeGeneration(input, userId);
    } catch (error) {
      lastError = error;
      if (error instanceof GenerateRouteError && !error.retriable) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      if (isValidationError(message)) {
        throw error;
      }
    }
  }
  throw lastError;
}

function normalizeError(error: unknown): GenerateRouteError {
  if (error instanceof GenerateRouteError) {
    return error;
  }

  const message = error instanceof Error ? error.message : GENERATION_FAILED_ERROR;
  if (message === FREE_TIER_LIMIT_EXCEEDED_ERROR) {
    return new GenerateRouteError({
      code: "FREE_TIER_LIMIT_EXCEEDED",
      status: 402,
      message,
      level: "warn",
    });
  }
  if (isValidationError(message)) {
    return new GenerateRouteError({
      code: message === UNAUTHORIZED_ERROR ? "AUTH_REQUIRED" : "VALIDATION_ERROR",
      status: message === UNAUTHORIZED_ERROR ? 401 : 400,
      message,
      level: "warn",
    });
  }

  if (isStorageQuotaError(message)) {
    return new GenerateRouteError({
      code: "STORAGE_QUOTA_EXCEEDED",
      status: 503,
      message: STORAGE_QUOTA_EXCEEDED_ERROR,
      level: "warn",
    });
  }

  if (isSignedUrlExpiryError(message)) {
    return new GenerateRouteError({
      code: "SIGNED_URL_EXPIRY",
      status: 503,
      message: SIGNED_URL_EXPIRY_ERROR,
      level: "warn",
    });
  }

  return new GenerateRouteError({
    code: "GENERATION_FAILED",
    status: 500,
    message: GENERATION_FAILED_ERROR,
    level: "error",
  });
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = resolveRequestId(request);
  let userId: string | null = null;
  let vertical: TenantVertical = "realtor";
  let subscriptionState: "free" | "pro" | null = null;

  try {
    const identity = await getAuthenticatedUserIdentity(request);
    if (!identity) {
      throw new GenerateRouteError({
        code: "AUTH_REQUIRED",
        status: 401,
        message: UNAUTHORIZED_ERROR,
        level: "warn",
      });
    }
    userId = identity.id;
    const tenant = await resolveTenantForUserId(userId);
    try {
      assertVertical(tenant, "realtor");
    } catch (error) {
      throw new GenerateRouteError({
        code: "VERTICAL_MISMATCH",
        status: 403,
        message: error instanceof Error ? error.message : "Vertical mismatch for route.",
        level: "warn",
      });
    }
    vertical = tenant.vertical;

    const pilotAccess = evaluatePilotAccess(identity, vertical);
    if (!pilotAccess.allowed) {
      throw new GenerateRouteError({
        code: "PILOT_NOT_ALLOWLISTED",
        status: 403,
        message: PILOT_ACCESS_DENIED_ERROR,
        level: "warn",
      });
    }

    const rateLimit = consumeGenerateRateLimit(userId);
    if (!rateLimit.allowed) {
      emitGenerationTelemetryEvent({
        event: "generation_failed",
        vertical,
        requestId,
        userId,
        route: ROUTE_PATH,
        errorCode: "RATE_LIMIT_EXCEEDED",
      });
      logStructuredServerEvent({
        level: "warn",
        vertical,
        requestId,
        userId,
        route: ROUTE_PATH,
        errorCode: "RATE_LIMIT_EXCEEDED",
        message: `${verticalTag(vertical)} generation rate limit exceeded`,
        status: 429,
        elapsedMs: Date.now() - startedAt,
      });
      return NextResponse.json(
        {
          error: RATE_LIMIT_ERROR,
          error_code: "RATE_LIMIT_EXCEEDED",
          request_id: requestId,
        },
        {
          status: 429,
          headers: {
            ...buildRateLimitHeaders(rateLimit),
            "X-Request-Id": requestId,
          },
        }
      );
    }

    const formData = await request.formData();
    const input = parseInput(formData);
    const billingAllowance = await checkRealtorBillingAllowance(userId, EXPECTED_ASSETS_PER_GENERATION, new Date(), vertical);
    subscriptionState = billingAllowance.state;
    if (!billingAllowance.allowed) {
      throw new GenerateRouteError({
        code: "FREE_TIER_LIMIT_EXCEEDED",
        status: 402,
        message: FREE_TIER_LIMIT_EXCEEDED_ERROR,
        level: "warn",
      });
    }

    emitGenerationTelemetryEvent({
      event: "generation_attempted",
      vertical,
      requestId,
      userId,
      route: ROUTE_PATH,
      details: {
        subscription_state: subscriptionState,
      },
    });

    const uploadedAssets = await executeWithRetry(input, userId, 2);
    const generatedAtIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000).toISOString();
    const elapsedMs = Date.now() - startedAt;
    await recordRealtorGenerationUsage(userId, uploadedAssets.length, generatedAtIso, vertical);
    subscriptionState = await resolveSubscriptionState(userId, vertical);

    try {
      await markRealtorGenerationSuccess(userId, uploadedAssets.length, generatedAtIso);
    } catch (markerError) {
      logStructuredServerEvent({
        level: "warn",
        vertical,
        requestId,
        userId,
        route: ROUTE_PATH,
        errorCode: "GENERATION_SUCCESS_MARKER_FAILED",
        message: `${verticalTag(vertical)} generation completed but success marker persistence failed`,
        status: 200,
        elapsedMs,
        details: {
          raw_error: markerError instanceof Error ? markerError.message : String(markerError),
        },
      });
    }

    emitGenerationTelemetryEvent({
      event: "generation_succeeded",
      vertical,
      requestId,
      userId,
      route: ROUTE_PATH,
      details: {
        timestamp: generatedAtIso,
        asset_count: uploadedAssets.length,
        subscription_state: subscriptionState,
      },
    });

    logStructuredServerEvent({
      level: "info",
      vertical,
      requestId,
      userId,
      route: ROUTE_PATH,
      errorCode: null,
      message: `${verticalTag(vertical)} generation completed`,
      status: 200,
      elapsedMs,
      details: {
        asset_count: uploadedAssets.length,
        subscription_state: subscriptionState,
      },
    });

    return NextResponse.json(
      input.warnings.length > 0
        ? { assets: uploadedAssets, expires_at: expiresAt, warnings: input.warnings }
        : { assets: uploadedAssets, expires_at: expiresAt },
      {
        headers: {
          ...buildRateLimitHeaders(rateLimit),
          "X-Request-Id": requestId,
        },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error);
    const elapsedMs = Date.now() - startedAt;

    if (userId) {
      emitGenerationTelemetryEvent({
        event: "generation_failed",
        vertical,
        requestId,
        userId,
        route: ROUTE_PATH,
        errorCode: normalized.code,
        details: {
          subscription_state: subscriptionState,
        },
      });
    }

    logStructuredServerEvent({
      level: normalized.level,
      vertical,
      requestId,
      userId,
      route: ROUTE_PATH,
      errorCode: normalized.code,
      message: normalized.message,
      status: normalized.status,
      elapsedMs,
      details: {
        raw_error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      {
        error: normalized.message,
        error_code: normalized.code,
        request_id: requestId,
      },
      {
        status: normalized.status,
        headers: { "X-Request-Id": requestId },
      }
    );
  }
}
