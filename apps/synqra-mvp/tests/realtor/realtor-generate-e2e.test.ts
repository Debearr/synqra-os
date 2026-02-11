import assert from "assert";
import { createHash, randomUUID } from "crypto";
import sharp from "sharp";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type GenerateAsset = {
  platform: "instagram" | "linkedin";
  url: string;
  width: number;
  height: number;
};

type GenerateResponse = {
  assets: GenerateAsset[];
  expires_at: string;
  warnings?: string[];
  error?: string;
  error_code?: string;
};

type Env = {
  baseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  e2eUserEmail: string | null;
  e2eUserPassword: string | null;
};

const GOLD = { r: 0xd4, g: 0xaf, b: 0x37 };
const FREE_TIER_MONTHLY_ASSET_LIMIT = 5;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function loadEnv(): Env {
  return {
    baseUrl: process.env.REALTOR_E2E_BASE_URL?.trim() || "http://localhost:3000",
    supabaseUrl: process.env.SUPABASE_URL?.trim() || requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY?.trim() || requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    e2eUserEmail: process.env.REALTOR_E2E_USER_EMAIL?.trim() || null,
    e2eUserPassword: process.env.REALTOR_E2E_USER_PASSWORD?.trim() || null,
  };
}

function toHexDigest(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

async function createSamplePhotoBuffer(): Promise<Buffer> {
  const width = 1600;
  const height = 1600;
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      rgba[idx] = Math.round((x / width) * 255);
      rgba[idx + 1] = Math.round((y / height) * 255);
      rgba[idx + 2] = 160;
      rgba[idx + 3] = 255;
    }
  }
  return sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function fetchAssetBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  assert.strictEqual(response.ok, true, `Asset URL failed: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function readPixel(buffer: Buffer, x: number, y: number): Promise<{ r: number; g: number; b: number }> {
  const pixel = await sharp(buffer)
    .extract({ left: x, top: y, width: 1, height: 1 })
    .raw()
    .toBuffer();
  return { r: pixel[0], g: pixel[1], b: pixel[2] };
}

function isNearGold(pixel: { r: number; g: number; b: number }, tolerance = 24): boolean {
  return (
    Math.abs(pixel.r - GOLD.r) <= tolerance &&
    Math.abs(pixel.g - GOLD.g) <= tolerance &&
    Math.abs(pixel.b - GOLD.b) <= tolerance
  );
}

function buildGenerateForm(photo: Buffer, fields: Record<string, string>): FormData {
  const form = new FormData();
  form.append("photo", new Blob([photo], { type: "image/png" }), "sample.png");
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  return form;
}

async function postGenerate(
  baseUrl: string,
  photo: Buffer,
  token: string | null,
  fields: Record<string, string>
): Promise<{ status: number; body: GenerateResponse }> {
  const response = await fetch(`${baseUrl}/api/realtor/generate`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: buildGenerateForm(photo, fields),
  });

  const body = (await response.json()) as GenerateResponse;
  return { status: response.status, body };
}

async function createAndSignInUser(
  env: Env
): Promise<{ userId: string; accessToken: string; admin: SupabaseClient; email: string }> {
  const admin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const email = env.e2eUserEmail ?? `realtor-e2e-${Date.now()}-${randomUUID().slice(0, 6)}@example.com`;
  const password = env.e2eUserPassword ?? `Pw!${randomUUID()}Aa1`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw new Error(`Unable to create test user: ${createError?.message ?? "Unknown error"}`);
  }

  const { data: sessionData, error: signInError } = await anon.auth.signInWithPassword({ email, password });
  if (signInError || !sessionData.session?.access_token) {
    throw new Error(`Unable to sign in test user: ${signInError?.message ?? "Missing session"}`);
  }

  return {
    userId: created.user.id,
    accessToken: sessionData.session.access_token,
    admin,
    email,
  };
}

function currentMonthString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function updateUserBillingMetadata(
  admin: SupabaseClient,
  userId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const existing = await admin.auth.admin.getUserById(userId);
  if (existing.error || !existing.data.user) {
    throw new Error(`Unable to load user metadata for billing patch: ${existing.error?.message ?? "unknown"}`);
  }
  const userMetadata =
    typeof existing.data.user.user_metadata === "object" && existing.data.user.user_metadata !== null
      ? (existing.data.user.user_metadata as Record<string, unknown>)
      : {};
  const currentBilling =
    typeof userMetadata.realtor_billing === "object" && userMetadata.realtor_billing !== null
      ? (userMetadata.realtor_billing as Record<string, unknown>)
      : {};

  const updated = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...userMetadata,
      realtor_billing: {
        ...currentBilling,
        ...patch,
      },
    },
  });
  if (updated.error) {
    throw new Error(`Unable to patch billing metadata: ${updated.error.message}`);
  }
}

async function run() {
  const env = loadEnv();
  const samplePhoto = await createSamplePhotoBuffer();
  const auth = await createAndSignInUser(env);

  try {
    const unauthorized = await postGenerate(env.baseUrl, samplePhoto, null, {
      price: "2450000",
      beds: "4",
      baths: "3",
      address: "888 Forest Hill Road, Toronto, ON M5P 2N7",
      brokerage_name: "Synqra Realty",
    });
    assert.strictEqual(unauthorized.status, 401, "Generate should require an authenticated session");

    const baseFields = {
      price: "2450000",
      beds: "4",
      baths: "3",
      address: "888 Forest Hill Road, Toronto, ON M5P 2N7",
      brokerage_name: "Synqra Realty Prime",
      agent_name: "Agent Alpha",
      signature_style: "thin_gold_border",
      include_eho: "false",
    };

    await updateUserBillingMetadata(auth.admin, auth.userId, {
      tier: "free",
      usage_month: currentMonthString(),
      assets_generated_this_month: FREE_TIER_MONTHLY_ASSET_LIMIT,
      updated_at: new Date().toISOString(),
    });
    const freeBlocked = await postGenerate(env.baseUrl, samplePhoto, auth.accessToken, baseFields);
    assert.strictEqual(freeBlocked.status, 402, "Free tier should be blocked after monthly asset limit");
    assert.strictEqual(
      freeBlocked.body.error_code,
      "FREE_TIER_LIMIT_EXCEEDED",
      "Free tier block should return FREE_TIER_LIMIT_EXCEEDED"
    );

    await updateUserBillingMetadata(auth.admin, auth.userId, {
      tier: "pro",
      stripe_subscription_status: "active",
      assets_generated_this_month: FREE_TIER_MONTHLY_ASSET_LIMIT,
      updated_at: new Date().toISOString(),
    });

    const firstRun = await postGenerate(env.baseUrl, samplePhoto, auth.accessToken, baseFields);
    assert.strictEqual(firstRun.status, 200, "Authenticated generate should succeed");
    assert.strictEqual(Array.isArray(firstRun.body.assets), true, "Response should include assets array");
    assert.strictEqual(firstRun.body.assets.length, 2, "Response should include two assets");
    assert.ok(firstRun.body.expires_at, "Response should include expires_at");

    const { data: markerUser, error: markerError } = await auth.admin.auth.admin.getUserById(auth.userId);
    assert.ifError(markerError);
    const markerEntry =
      markerUser.user && typeof markerUser.user.user_metadata === "object" && markerUser.user.user_metadata
        ? (markerUser.user.user_metadata as Record<string, unknown>).realtor_mvp
        : null;
    assert.ok(markerEntry && typeof markerEntry === "object", "Realtor metadata should exist after generation");
    const markerRecord = markerEntry as Record<string, unknown>;
    assert.strictEqual(
      typeof markerRecord.last_generation_success_at,
      "string",
      "Success marker should include timestamp"
    );
    assert.strictEqual(
      markerRecord.last_generation_asset_count,
      2,
      "Success marker should include generated asset count"
    );

    const expiresMs = Date.parse(firstRun.body.expires_at);
    assert.ok(Number.isFinite(expiresMs), "expires_at must be a valid ISO timestamp");
    const deltaSeconds = Math.round((expiresMs - Date.now()) / 1000);
    assert.ok(deltaSeconds >= 23 * 60 * 60 && deltaSeconds <= 24 * 60 * 60 + 120, "expires_at should be ~24h");

    const instagram = firstRun.body.assets.find((asset) => asset.platform === "instagram");
    const linkedin = firstRun.body.assets.find((asset) => asset.platform === "linkedin");
    assert.ok(instagram, "Instagram asset must be returned");
    assert.ok(linkedin, "LinkedIn asset must be returned");
    assert.deepStrictEqual(
      firstRun.body.assets.map((asset) => `${asset.platform}:${asset.width}x${asset.height}`).sort(),
      ["instagram:1080x1080", "linkedin:1200x627"]
    );

    const instagramUrl = instagram!.url;
    const linkedinUrl = linkedin!.url;
    assert.ok(instagramUrl.includes("/object/sign/synqra-media/realtor/users/"), "Instagram URL should be signed");
    assert.ok(linkedinUrl.includes("/object/sign/synqra-media/realtor/users/"), "LinkedIn URL should be signed");
    assert.ok(instagramUrl.includes(`/users/${auth.userId}/assets/`), "Instagram asset should be associated to user id");
    assert.ok(linkedinUrl.includes(`/users/${auth.userId}/assets/`), "LinkedIn asset should be associated to user id");

    const [instagramBuffer, linkedinBuffer] = await Promise.all([
      fetchAssetBuffer(instagramUrl),
      fetchAssetBuffer(linkedinUrl),
    ]);

    const [instagramMeta, linkedinMeta] = await Promise.all([
      sharp(instagramBuffer).metadata(),
      sharp(linkedinBuffer).metadata(),
    ]);
    assert.strictEqual(instagramMeta.width, 1080, "Instagram width should be 1080");
    assert.strictEqual(instagramMeta.height, 1080, "Instagram height should be 1080");
    assert.strictEqual(linkedinMeta.width, 1200, "LinkedIn width should be 1200");
    assert.strictEqual(linkedinMeta.height, 627, "LinkedIn height should be 627");

    const borderPixel = await readPixel(instagramBuffer, 100, 8);
    assert.strictEqual(isNearGold(borderPixel), true, "thin_gold_border style should render gold top border");

    const brokerageVariant = await postGenerate(env.baseUrl, samplePhoto, auth.accessToken, {
      ...baseFields,
      brokerage_name: "Synqra Realty Skyline",
    });
    assert.strictEqual(brokerageVariant.status, 200, "Brokerage variant generation should succeed");
    const variantInstagramUrl = brokerageVariant.body.assets.find((asset) => asset.platform === "instagram")?.url;
    assert.ok(variantInstagramUrl, "Variant Instagram asset should exist");
    const variantInstagramBuffer = await fetchAssetBuffer(variantInstagramUrl!);
    assert.notStrictEqual(
      toHexDigest(instagramBuffer),
      toHexDigest(variantInstagramBuffer),
      "Brokerage name should affect rendered output"
    );

    const utf8Run = await postGenerate(env.baseUrl, samplePhoto, auth.accessToken, {
      ...baseFields,
      address: "繁體中文 ਪੰਜਾਬੀ العربية 888 Forest Hill Road, Toronto, ON M5P 2N7",
      brokerage_name: "繁體中文 ਪੰਜਾਬੀ العربية Realty",
      agent_name: "繁體中文 ਪੰਜਾਬੀ العربية Agent",
    });
    assert.strictEqual(utf8Run.status, 200, "UTF-8 generation should succeed");
    const utf8InstagramUrl = utf8Run.body.assets.find((asset) => asset.platform === "instagram")?.url;
    assert.ok(utf8InstagramUrl, "UTF-8 Instagram asset should exist");
    const utf8InstagramBuffer = await fetchAssetBuffer(utf8InstagramUrl!);
    assert.notStrictEqual(
      toHexDigest(instagramBuffer),
      toHexDigest(utf8InstagramBuffer),
      "UTF-8 text input should be reflected in rendered output"
    );

    process.stdout.write(
      JSON.stringify(
        {
          ok: true,
          userId: auth.userId,
          instagram: instagramUrl,
          linkedin: linkedinUrl,
          expiresAt: firstRun.body.expires_at,
        },
        null,
        2
      ) + "\n"
    );
  } finally {
    await auth.admin.auth.admin.deleteUser(auth.userId);
  }
}

run().catch((error) => {
  process.stderr.write(`realtor e2e failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
