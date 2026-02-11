import assert from "assert";
import sharp from "sharp";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { signJobPayload } from "@/lib/jobs/job-signature";

type GenerateResponse = {
  error?: string;
  error_code?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function loadEnv() {
  return {
    baseUrl: process.env.REALTOR_E2E_BASE_URL?.trim() || "http://localhost:3000",
    supabaseUrl: process.env.SUPABASE_URL?.trim() || requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY?.trim() || requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || requireEnv("SUPABASE_SERVICE_KEY"),
    internalSigningSecret: requireEnv("INTERNAL_JOB_SIGNING_SECRET"),
  };
}

async function createSamplePhotoBuffer(): Promise<Buffer> {
  const width = 1600;
  const height = 1600;
  const rgba = Buffer.alloc(width * height * 4, 255);
  return sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function createTravelUser(env: ReturnType<typeof loadEnv>): Promise<{
  admin: SupabaseClient;
  userId: string;
  accessToken: string;
}> {
  const admin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const email = `travel-e2e-${Date.now()}@example.com`;
  const password = "PwSynqraTravelE2Eaa11";

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      advisor_type: "travel_advisor",
      tenant_id: "travel-advisor",
    },
  });
  if (createError || !created.user) {
    throw new Error(`Unable to create travel test user: ${createError?.message ?? "unknown"}`);
  }

  const { data: sessionData, error: signInError } = await anon.auth.signInWithPassword({ email, password });
  if (signInError || !sessionData.session?.access_token) {
    throw new Error(`Unable to sign in travel test user: ${signInError?.message ?? "missing session"}`);
  }

  return {
    admin,
    userId: created.user.id,
    accessToken: sessionData.session.access_token,
  };
}

async function run() {
  const env = loadEnv();
  const photo = await createSamplePhotoBuffer();
  const { admin, userId, accessToken } = await createTravelUser(env);

  try {
    const form = new FormData();
    form.append("photo", new Blob([photo], { type: "image/png" }), "sample.png");
    form.append("price", "2450000");
    form.append("beds", "4");
    form.append("baths", "3");
    form.append("address", "888 Forest Hill Road, Toronto, ON M5P 2N7");
    form.append("brokerage_name", "Synqra Realty");

    const blockedResponse = await fetch(`${env.baseUrl}/api/realtor/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });
    const blockedBody = (await blockedResponse.json()) as GenerateResponse;
    assert.strictEqual(blockedResponse.status, 403, "Travel user must be blocked from realtor generation route");
    assert.strictEqual(blockedBody.error_code, "VERTICAL_MISMATCH", "Expected VERTICAL_MISMATCH guard");

    const travelPayload = {
      userId,
      tenant_id: "travel-advisor",
      vertical: "travel_advisor",
      request_type: "travel_campaign",
      prompt: "Need wire transfer details for this itinerary",
      platform: "instagram",
      metadata: {
        source: "vertical-isolation-e2e",
      },
    };
    const travelSignature = signJobPayload(travelPayload, env.internalSigningSecret);
    const travelResponse = await fetch(`${env.baseUrl}/api/v1/content/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-signature": travelSignature,
      },
      body: JSON.stringify(travelPayload),
    });
    const travelText = await travelResponse.text();
    assert.strictEqual(
      travelResponse.status,
      403,
      "Travel content request should execute vertical path and fail only on compliance guard"
    );
    assert.strictEqual(
      travelText.includes("travel_advisor"),
      true,
      "Travel content response should include travel_advisor context"
    );

    const mismatchPayload = {
      ...travelPayload,
      vertical: "realtor",
    };
    const mismatchSignature = signJobPayload(mismatchPayload, env.internalSigningSecret);
    const mismatchResponse = await fetch(`${env.baseUrl}/api/v1/content/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-signature": mismatchSignature,
      },
      body: JSON.stringify(mismatchPayload),
    });
    assert.strictEqual(mismatchResponse.status, 400, "Mismatched vertical should fail before generation");

    process.stdout.write(
      JSON.stringify(
        {
          ok: true,
          blocked_status: blockedResponse.status,
          travel_content_status: travelResponse.status,
          mismatch_status: mismatchResponse.status,
        },
        null,
        2
      ) + "\n"
    );
  } finally {
    await admin.auth.admin.deleteUser(userId);
  }
}

run().catch((error) => {
  process.stderr.write(
    `vertical isolation e2e failed: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exit(1);
});

