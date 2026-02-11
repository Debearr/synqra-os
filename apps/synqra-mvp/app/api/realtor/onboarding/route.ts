import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUserIdentity, getRealtorProfile, updateRealtorProfile } from "../_account";
import { evaluatePilotAccess, PILOT_ACCESS_DENIED_ERROR } from "../_pilot";
import { logStructuredServerEvent, resolveRequestId } from "../_server";
import { parseSignatureStyle, SIGNATURE_STYLE_OPTIONS } from "../generate/_compliance";
import { assertVertical, resolveTenantForUserId, verticalTag, type TenantContext } from "@/lib/verticals/tenant";

export const runtime = "nodejs";

const BUCKET_NAME = "synqra-media";
const ROUTE_PATH = "/api/realtor/onboarding";
const LOGO_ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const MAX_LOGO_SIZE_BYTES = 8 * 1024 * 1024;

async function ensureBucketReady() {
  const admin = requireSupabaseAdmin();
  const { data: bucket } = await admin.storage.getBucket(BUCKET_NAME);
  if (!bucket) {
    const { error } = await admin.storage.createBucket(BUCKET_NAME, { public: false });
    if (error && !error.message.toLowerCase().includes("already exists")) {
      throw new Error(`Unable to initialize storage: ${error.message}`);
    }
  } else if (bucket.public) {
    const { error } = await admin.storage.updateBucket(BUCKET_NAME, { public: false });
    if (error) {
      throw new Error(`Unable to secure storage: ${error.message}`);
    }
  }
}

async function maybeUploadLogo(userId: string, logo: File | null): Promise<string | null> {
  if (!logo) return null;
  if (!LOGO_ALLOWED_TYPES.has(logo.type)) {
    throw new Error("Logo must be a PNG, JPG, WEBP, or SVG image.");
  }
  if (logo.size > MAX_LOGO_SIZE_BYTES) {
    throw new Error("Logo file is too large.");
  }

  await ensureBucketReady();
  const admin = requireSupabaseAdmin();
  const extension = logo.name.includes(".") ? logo.name.split(".").pop() ?? "png" : "png";
  const objectPath = `realtor/onboarding/${userId}/logo-${randomUUID()}.${extension.toLowerCase()}`;
  const payload = Buffer.from(await logo.arrayBuffer());
  const { error } = await admin.storage.from(BUCKET_NAME).upload(objectPath, payload, {
    contentType: logo.type,
    cacheControl: "3600",
    upsert: true,
  });
  if (error) {
    throw new Error(`Unable to upload logo: ${error.message}`);
  }

  return objectPath;
}

export async function GET(request: NextRequest) {
  const requestId = resolveRequestId(request);
  const identity = await getAuthenticatedUserIdentity(request);
  if (!identity) {
    return NextResponse.json(
      {
        authenticated: false,
        profile: null,
      },
      { status: 200, headers: { "X-Request-Id": requestId } }
    );
  }
  const tenant = await resolveTenantForUserId(identity.id);
  try {
    assertVertical(tenant, "realtor");
  } catch (error) {
    return NextResponse.json(
      {
        error: "Route restricted to realtor vertical.",
        error_code: "VERTICAL_MISMATCH",
        request_id: requestId,
        details: error instanceof Error ? error.message : "Unknown mismatch",
      },
      { status: 403, headers: { "X-Request-Id": requestId } }
    );
  }
  const pilotAccess = evaluatePilotAccess(identity, tenant.vertical);
  if (!pilotAccess.allowed) {
    logStructuredServerEvent({
      level: "warn",
      vertical: tenant.vertical,
      requestId,
      userId: identity.id,
      route: ROUTE_PATH,
      errorCode: "PILOT_NOT_ALLOWLISTED",
      message: `${verticalTag(tenant.vertical)} pilot access denied`,
      status: 403,
    });
    return NextResponse.json(
      { error: PILOT_ACCESS_DENIED_ERROR, error_code: "PILOT_NOT_ALLOWLISTED", request_id: requestId },
      { status: 403, headers: { "X-Request-Id": requestId } }
    );
  }

  const profile = await getRealtorProfile(identity.id);
  logStructuredServerEvent({
    level: "info",
    vertical: tenant.vertical,
    requestId,
    userId: identity.id,
    route: ROUTE_PATH,
    errorCode: null,
    message: `${verticalTag(tenant.vertical)} onboarding profile loaded`,
    status: 200,
  });
  return NextResponse.json({
    authenticated: true,
    profile,
  }, { headers: { "X-Request-Id": requestId } });
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = resolveRequestId(request);
  let userId: string | null = null;
  let tenant: TenantContext = { tenantId: "realtor", vertical: "realtor", source: "default" };
  try {
    const identity = await getAuthenticatedUserIdentity(request);
    userId = identity?.id ?? null;
    if (!identity) {
      logStructuredServerEvent({
        level: "warn",
        vertical: tenant.vertical,
        requestId,
        userId,
        route: ROUTE_PATH,
        errorCode: "AUTH_REQUIRED",
        message: `${verticalTag(tenant.vertical)} authentication required`,
        status: 401,
        elapsedMs: Date.now() - startedAt,
      });
      return NextResponse.json({ error: "Authentication required.", error_code: "AUTH_REQUIRED", request_id: requestId }, { status: 401, headers: { "X-Request-Id": requestId } });
    }
    tenant = await resolveTenantForUserId(identity.id);
    try {
      assertVertical(tenant, "realtor");
    } catch (error) {
      return NextResponse.json(
        {
          error: "Route restricted to realtor vertical.",
          error_code: "VERTICAL_MISMATCH",
          request_id: requestId,
          details: error instanceof Error ? error.message : "Unknown mismatch",
        },
        { status: 403, headers: { "X-Request-Id": requestId } }
      );
    }
    const pilotAccess = evaluatePilotAccess(identity, tenant.vertical);
    if (!pilotAccess.allowed) {
      logStructuredServerEvent({
        level: "warn",
        vertical: tenant.vertical,
        requestId,
        userId,
        route: ROUTE_PATH,
        errorCode: "PILOT_NOT_ALLOWLISTED",
        message: `${verticalTag(tenant.vertical)} pilot access denied`,
        status: 403,
        elapsedMs: Date.now() - startedAt,
      });
      return NextResponse.json(
        { error: PILOT_ACCESS_DENIED_ERROR, error_code: "PILOT_NOT_ALLOWLISTED", request_id: requestId },
        { status: 403, headers: { "X-Request-Id": requestId } }
      );
    }

    const formData = await request.formData();
    const signatureStyle = parseSignatureStyle(formData.get("signature_style"));
    if (!signatureStyle) {
      logStructuredServerEvent({
        level: "warn",
        vertical: tenant.vertical,
        requestId,
        userId,
        route: ROUTE_PATH,
        errorCode: "INVALID_SIGNATURE_STYLE",
        message: `${verticalTag(tenant.vertical)} invalid signature style`,
        status: 400,
        elapsedMs: Date.now() - startedAt,
      });
      return NextResponse.json(
        {
          error: `Invalid signature style. Allowed: ${SIGNATURE_STYLE_OPTIONS.join(", ")}`,
          error_code: "INVALID_SIGNATURE_STYLE",
          request_id: requestId,
        },
        { status: 400, headers: { "X-Request-Id": requestId } }
      );
    }

    const logoEntry = formData.get("logo");
    const logo = logoEntry instanceof File ? logoEntry : null;

    const existing = await getRealtorProfile(identity.id);
    const logoPath = (await maybeUploadLogo(identity.id, logo)) ?? existing.logoPath;
    const updated = await updateRealtorProfile(identity.id, {
      signatureStyle,
      logoPath,
      onboardingCompleted: true,
    });
    logStructuredServerEvent({
      level: "info",
      vertical: tenant.vertical,
      requestId,
      userId,
      route: ROUTE_PATH,
      errorCode: null,
      message: `${verticalTag(tenant.vertical)} onboarding settings saved`,
      status: 200,
      elapsedMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      profile: updated,
    }, { headers: { "X-Request-Id": requestId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save onboarding settings.";
    logStructuredServerEvent({
      level: "error",
      vertical: tenant.vertical,
      requestId,
      userId,
      route: ROUTE_PATH,
      errorCode: "ONBOARDING_SAVE_FAILED",
      message: `${verticalTag(tenant.vertical)} ${message}`,
      status: 500,
      elapsedMs: Date.now() - startedAt,
      details: {
        raw_error: error instanceof Error ? error.message : String(error),
      },
    });
    return NextResponse.json(
      { error: message, error_code: "ONBOARDING_SAVE_FAILED", request_id: requestId },
      { status: 500, headers: { "X-Request-Id": requestId } }
    );
  }
}
