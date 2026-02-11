import assert from "assert";
import { createClient } from "@supabase/supabase-js";
import { assertSupabaseConfigured, getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

type ChecklistItem = {
  name: string;
  passed: boolean;
  details: string;
};

const BUCKET_NAME = "synqra-media";
const PILOT_MIN_ALLOWLIST_SIZE = 5;
const PILOT_MAX_ALLOWLIST_SIZE = 10;
const SUPPORTED_VERTICALS = ["realtor", "travel_advisor"] as const;

function normalizeVertical(value: unknown): (typeof SUPPORTED_VERTICALS)[number] | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "travel_advisor" || normalized === "traveladvisor") return "travel_advisor";
  if (normalized === "realtor") return "realtor";
  return null;
}

function inferVerticalFromConfig(row: { tenant_id?: string | null; brand_voice?: unknown }): (typeof SUPPORTED_VERTICALS)[number] {
  const tenantId = row.tenant_id?.trim().toLowerCase() ?? "";
  const brandVoice = row.brand_voice && typeof row.brand_voice === "object"
    ? (row.brand_voice as Record<string, unknown>)
    : {};
  const configured = normalizeVertical(brandVoice.advisor_type ?? brandVoice.vertical);
  if (configured) return configured;
  if (tenantId.includes("travel")) return "travel_advisor";
  return "realtor";
}

function checkPilotAllowlist(): ChecklistItem {
  const maxRaw = process.env.PILOT_ALLOWLIST_MAX_USERS?.trim();
  const maxParsed = maxRaw ? Number.parseInt(maxRaw, 10) : 10;
  if (!Number.isFinite(maxParsed) || maxParsed < PILOT_MIN_ALLOWLIST_SIZE || maxParsed > PILOT_MAX_ALLOWLIST_SIZE) {
    return {
      name: "pilot.allowlist_size",
      passed: false,
      details: `PILOT_ALLOWLIST_MAX_USERS must be between ${PILOT_MIN_ALLOWLIST_SIZE} and ${PILOT_MAX_ALLOWLIST_SIZE}.`,
    };
  }

  const userIds = (process.env.PILOT_ALLOWLIST_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const emails = (process.env.PILOT_ALLOWLIST_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const realtorUserIds = (process.env.PILOT_ALLOWLIST_USER_IDS_REALTOR ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const realtorEmails = (process.env.PILOT_ALLOWLIST_EMAILS_REALTOR ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const travelUserIds = (process.env.PILOT_ALLOWLIST_USER_IDS_TRAVEL_ADVISOR ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const travelEmails = (process.env.PILOT_ALLOWLIST_EMAILS_TRAVEL_ADVISOR ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const configuredCount =
    userIds.length +
    emails.length +
    realtorUserIds.length +
    realtorEmails.length +
    travelUserIds.length +
    travelEmails.length;
  if (configuredCount === 0) {
    return {
      name: "pilot.allowlist_configured",
      passed: false,
      details:
        "Set global or vertical pilot allowlist env vars (PILOT_ALLOWLIST_* and/or PILOT_ALLOWLIST_*_REALTOR/TRAVEL_ADVISOR).",
    };
  }
  if (configuredCount > maxParsed) {
    return {
      name: "pilot.allowlist_capacity",
      passed: false,
      details: `Configured allowlist entries (${configuredCount}) exceed PILOT_ALLOWLIST_MAX_USERS (${maxParsed}).`,
    };
  }

  return {
    name: "pilot.allowlist_ready",
    passed: true,
    details: `Allowlist configured with ${configuredCount} entry(ies), max ${maxParsed}.`,
  };
}

function checkStripeBillingEnv(): ChecklistItem {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID?.trim() ?? "";

  const missing: string[] = [];
  if (!secretKey) missing.push("STRIPE_SECRET_KEY");
  if (!webhookSecret) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!proPriceId) missing.push("STRIPE_PRO_PRICE_ID");
  if (missing.length > 0) {
    return {
      name: "billing.stripe_keys",
      passed: false,
      details: `Missing required billing env vars: ${missing.join(", ")}`,
    };
  }

  if (!secretKey.startsWith("sk_")) {
    return {
      name: "billing.stripe_secret_format",
      passed: false,
      details: "STRIPE_SECRET_KEY must start with sk_.",
    };
  }
  if (!webhookSecret.startsWith("whsec_")) {
    return {
      name: "billing.webhook_secret_format",
      passed: false,
      details: "STRIPE_WEBHOOK_SECRET must start with whsec_.",
    };
  }
  if (!proPriceId.startsWith("price_")) {
    return {
      name: "billing.pro_price_format",
      passed: false,
      details: "STRIPE_PRO_PRICE_ID must start with price_.",
    };
  }

  return {
    name: "billing.stripe_ready",
    passed: true,
    details: "Stripe key, webhook secret, and pro price ID are configured.",
  };
}

function requiredPublicEnvStatus(): ChecklistItem {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const missing = required.filter((key) => {
    const value = process.env[key]?.trim();
    return !value || /your[_-]|_here$|example/i.test(value);
  });

  return {
    name: "env.public_keys",
    passed: missing.length === 0,
    details: missing.length === 0 ? "Public Supabase keys are configured." : `Missing or placeholder: ${missing.join(", ")}`,
  };
}

async function checkStorageBucket(): Promise<ChecklistItem> {
  const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: bucket, error } = await admin.storage.getBucket(BUCKET_NAME);
  if (error) {
    return {
      name: "storage.bucket_presence",
      passed: false,
      details: `Unable to load bucket ${BUCKET_NAME}: ${error.message}`,
    };
  }
  if (!bucket) {
    return {
      name: "storage.bucket_presence",
      passed: false,
      details: `Bucket ${BUCKET_NAME} does not exist.`,
    };
  }
  if (bucket.public) {
    return {
      name: "storage.bucket_private",
      passed: false,
      details: `Bucket ${BUCKET_NAME} is public and must be private.`,
    };
  }

  return {
    name: "storage.bucket_ready",
    passed: true,
    details: `Bucket ${BUCKET_NAME} exists and is private.`,
  };
}

async function checkVerticalConfigs(): Promise<ChecklistItem> {
  const admin = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin
    .from("product_configs")
    .select("tenant_id, brand_voice, active")
    .eq("active", true);

  if (error) {
    return {
      name: "vertical.configs",
      passed: false,
      details: `Unable to verify vertical configs: ${error.message}`,
    };
  }

  const rows = Array.isArray(data) ? data : [];
  const mapped = rows.map((row) => ({
    tenant_id: row.tenant_id,
    vertical: inferVerticalFromConfig(row),
  }));
  const hasRealtor = mapped.some((row) => row.vertical === "realtor");
  const hasTravel = mapped.some((row) => row.vertical === "travel_advisor");
  if (!hasRealtor || !hasTravel) {
    return {
      name: "vertical.configs",
      passed: false,
      details: `Expected active configs for realtor and travel_advisor. Found: ${mapped
        .map((row) => `${row.tenant_id}:${row.vertical}`)
        .join(", ")}`,
    };
  }

  return {
    name: "vertical.configs",
    passed: true,
    details: `Active vertical configs found for realtor and travel_advisor (${rows.length} row(s)).`,
  };
}

async function checkAuthProviderReady(): Promise<ChecklistItem> {
  const supabaseUrl = getSupabaseUrl();
  const callbackUrl =
    process.env.REALTOR_OAUTH_REDIRECT_URL?.trim() || "http://localhost:3000/api/google/oauth/callback";
  const authorizeUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callbackUrl)}`;

  const response = await fetch(authorizeUrl, {
    method: "GET",
    redirect: "manual",
    headers: {
      apikey: getSupabaseAnonKey(),
      Authorization: `Bearer ${getSupabaseAnonKey()}`,
    },
  });

  const redirectLocation = response.headers.get("location") ?? "";
  const redirectStatus = [302, 303, 307, 308].includes(response.status);
  const locationLooksOAuth = redirectLocation.length > 0;

  return {
    name: "auth.google_provider",
    passed: redirectStatus && locationLooksOAuth,
    details: redirectStatus
      ? `Authorize endpoint returns redirect (${response.status}).`
      : `Authorize endpoint returned ${response.status}. Response did not confirm OAuth redirect.`,
  };
}

async function run() {
  const results: ChecklistItem[] = [];

  try {
    assertSupabaseConfigured();
    results.push({
      name: "env.server_keys",
      passed: true,
      details: "Supabase URL, anon key, and service role key resolved.",
    });
  } catch (error) {
    results.push({
      name: "env.server_keys",
      passed: false,
      details: error instanceof Error ? error.message : String(error),
    });
  }

  results.push(requiredPublicEnvStatus());
  results.push(checkPilotAllowlist());
  results.push(checkStripeBillingEnv());
  results.push(await checkStorageBucket());
  results.push(await checkVerticalConfigs());
  results.push(await checkAuthProviderReady());

  const failed = results.filter((item) => !item.passed);

  process.stdout.write(
    JSON.stringify(
      {
        ok: failed.length === 0,
        checklist: results,
      },
      null,
      2
    ) + "\n"
  );

  assert.strictEqual(failed.length, 0, `Preflight failed: ${failed.map((item) => item.name).join(", ")}`);
}

run().catch((error) => {
  process.stderr.write(`realtor preflight failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
