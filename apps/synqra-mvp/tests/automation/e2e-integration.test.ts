import assert from "assert";
import { createHmac } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type EnvMap = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  internalSigningSecret: string;
  baseUrl: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalize(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      out[key] = normalize(record[key]);
    }
    return out;
  }
  return String(value);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(normalize(value));
}

function signPayload(payload: unknown, secret: string): string {
  const timestampSeconds = Math.floor(Date.now() / 1000);
  const digest = createHmac("sha256", secret).update(`${timestampSeconds}.${stableStringify(payload)}`).digest("hex");
  return `${timestampSeconds}.${digest}`;
}

async function signedPost(baseUrl: string, path: string, body: Record<string, unknown>, secret: string): Promise<Response> {
  const signature = signPayload(body, secret);
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-signature": signature,
    },
    body: JSON.stringify(body),
  });
}

async function getTestUserId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) throw new Error(`Unable to list users: ${error.message}`);
  const userId = data?.users?.[0]?.id;
  if (!userId) throw new Error("No auth user found for integration test");
  return userId;
}

async function run() {
  const env: EnvMap = {
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    internalSigningSecret: requireEnv("INTERNAL_JOB_SIGNING_SECRET"),
    baseUrl: process.env.AUTOMATION_TEST_BASE_URL?.trim() || "http://localhost:3000",
  };

  const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const userId = await getTestUserId(supabase);
  const testRunId = `automation-e2e-${Date.now()}`;

  // 1) Job enqueue -> background_job_runs insert
  const enqueueBody = {
    userId,
    jobType: "test_enqueue",
    payload: { runId: testRunId, platform: "LinkedIn" },
    idempotencyKey: `${testRunId}-enqueue`,
    scheduledTime: new Date().toISOString(),
  };
  const enqueueResponse = await signedPost(env.baseUrl, "/api/internal/jobs/enqueue", enqueueBody, env.internalSigningSecret);
  assert.strictEqual(enqueueResponse.status, 202, "enqueue should return 202");
  const enqueueJson = (await enqueueResponse.json()) as { jobId?: string };
  assert.ok(enqueueJson.jobId, "enqueue response should include jobId");
  const jobId = enqueueJson.jobId!;

  const { data: queuedJob, error: queuedJobError } = await supabase
    .from("background_job_runs")
    .select("id,status,user_id")
    .eq("id", jobId)
    .maybeSingle();
  assert.ifError(queuedJobError);
  assert.ok(queuedJob, "queued job row should exist");
  assert.strictEqual(queuedJob!.status, "pending");
  assert.strictEqual(queuedJob!.user_id, userId);

  // 2) Outcome recording -> outcome_events insert
  const outcomeBody = {
    userId,
    jobId,
    eventType: "created",
    status: "success",
    platform: "LinkedIn",
    metadata: { runId: testRunId },
    outcomeClassification: "integration_test",
  };
  const outcomeResponse = await signedPost(
    env.baseUrl,
    "/api/internal/outcomes/record",
    outcomeBody,
    env.internalSigningSecret
  );
  assert.strictEqual(outcomeResponse.status, 202, "outcome recording should return 202");
  const outcomeJson = (await outcomeResponse.json()) as { outcomeEventId?: string };
  assert.ok(outcomeJson.outcomeEventId, "outcome response should include outcomeEventId");

  const { data: outcomeRow, error: outcomeRowError } = await supabase
    .from("outcome_events")
    .select("id,event_type,status,platform")
    .eq("id", outcomeJson.outcomeEventId!)
    .maybeSingle();
  assert.ifError(outcomeRowError);
  assert.ok(outcomeRow, "outcome row should exist");
  assert.strictEqual(outcomeRow!.event_type, "created");
  assert.strictEqual(outcomeRow!.status, "success");

  // 3) Scheduling request -> approval required (pending)
  const schedulingBody = {
    userId,
    contentId: `${testRunId}-content`,
    platform: "LinkedIn",
    scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    metadata: { runId: testRunId },
  };
  const schedulingResponse = await signedPost(
    env.baseUrl,
    "/api/internal/scheduling/request",
    schedulingBody,
    env.internalSigningSecret
  );
  assert.strictEqual(schedulingResponse.status, 202, "scheduling request should return 202");
  const schedulingJson = (await schedulingResponse.json()) as { requestId?: string; approvalStatus?: string };
  assert.ok(schedulingJson.requestId, "scheduling response should include requestId");
  assert.strictEqual(schedulingJson.approvalStatus, "pending");

  const { data: schedulingRow, error: schedulingError } = await supabase
    .from("scheduling_requests")
    .select("id,approval_status")
    .eq("id", schedulingJson.requestId!)
    .maybeSingle();
  assert.ifError(schedulingError);
  assert.ok(schedulingRow, "scheduling row should exist");
  assert.strictEqual(schedulingRow!.approval_status, "pending");

  // 4) Gmail draft creation -> high sensitivity blocked without approval
  const highSensitivityBody = {
    userId,
    type: "email",
    recipient: "security-test@example.com",
    subject: "High sensitivity",
    body: "Sensitive draft should require explicit approval.",
    sensitivityLevel: "high",
    metadata: { runId: testRunId },
  };
  const highSensitivityResponse = await signedPost(
    env.baseUrl,
    "/api/internal/communications/draft",
    highSensitivityBody,
    env.internalSigningSecret
  );
  assert.strictEqual(highSensitivityResponse.status, 403, "high sensitivity draft should be blocked without approval");

  const normalSensitivityBody = {
    userId,
    type: "email",
    recipient: "security-test@example.com",
    subject: "Normal sensitivity",
    body: "Normal draft should be accepted and queued.",
    sensitivityLevel: "normal",
    metadata: { runId: testRunId },
  };
  const normalSensitivityResponse = await signedPost(
    env.baseUrl,
    "/api/internal/communications/draft",
    normalSensitivityBody,
    env.internalSigningSecret
  );
  assert.strictEqual(normalSensitivityResponse.status, 202, "normal sensitivity draft should return 202");
  const normalSensitivityJson = (await normalSensitivityResponse.json()) as { queueId?: string; approvalStatus?: string };
  assert.ok(normalSensitivityJson.queueId, "normal sensitivity draft should include queueId");
  assert.strictEqual(normalSensitivityJson.approvalStatus, "pending");

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        runId: testRunId,
        userId,
        enqueueJobId: jobId,
        outcomeEventId: outcomeJson.outcomeEventId,
        schedulingRequestId: schedulingJson.requestId,
        communicationQueueId: normalSensitivityJson.queueId,
      },
      null,
      2
    ) + "\n"
  );
}

run().catch((error) => {
  process.stderr.write(`automation e2e failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});

