import crypto from "crypto";

/**
 * Safeguards smoke script (no new deps).
 * Simulates user-like requests against key API routes.
 *
 * Run while the Next server is up (e.g., PORT=3000 pnpm dev:3004).
 * Example cap-hit simulation:
 *   SAFEGUARDS_MAX_REQ_COST_USD=0.00001 SAFEGUARDS_FAIL_CLOSED=true pnpm dev:3004
 *   BASE_URL=http://localhost:3004 pnpm dlx tsx apps/synqra-mvp/scripts/safeguards-smoke.ts
 */

type SmokeCase = {
  name: string;
  path: string;
  init: RequestInit;
};

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const correlationId =
  process.env.SMOKE_CORRELATION_ID || crypto.randomUUID();

const cases: SmokeCase[] = [
  {
    name: "Publish (dry-run expected)",
    path: "/api/publish",
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        jobId: "demo-job",
        platforms: ["LinkedIn"],
        payloads: { LinkedIn: { text: "Hello safeguards" } },
        confirmed: true,
      }),
    },
  },
  {
    name: "Approve (admin token, likely fails gracefully without Supabase)",
    path: "/api/approve",
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        jobId: "demo-job",
        platforms: ["LinkedIn"],
        adminToken: process.env.ADMIN_TOKEN || "change-me",
        confirmed: true,
      }),
    },
  },
  {
    name: "Onboard Extract (mock text input)",
    path: "/api/onboard/extract",
    init: (() => {
      const form = new FormData();
      form.append(
        "file",
        new Blob(["demo profile text"], { type: "text/plain" }),
        "profile.txt"
      );
      return {
        method: "POST",
        headers: {
          "x-correlation-id": correlationId,
        },
        body: form,
      };
    })(),
  },
  {
    name: "Retention Note (confirmation required)",
    path: "/api/retention/notes",
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        platform: "demo",
        videoId: "vid-123",
        notes: "Retention smoke test",
        confirmed: true,
      }),
    },
  },
  {
    name: "Driver Intel (score offer)",
    path: "/api/driver-intel",
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify({
        action: "scoreOffer",
        offer: {
          id: "offer-1",
          durationMinutes: 10,
          distanceMiles: 3,
          payout: 12,
        },
      }),
    },
  },
];

async function runCase(test: SmokeCase) {
  const url = `${baseUrl}${test.path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, test.init);
    const duration = Date.now() - start;
    let body: any = {};
    try {
      body = await res.json();
    } catch {
      body = { raw: await res.text() };
    }

    const safeMessage = body.message || body.error || body.safeMessage || "n/a";
    const cid = body.correlationId || correlationId;
    const safeguardTriggered =
      res.status >= 400 ||
      ["budget", "kill", "confirmation"].some((kw) =>
        String(safeMessage).toLowerCase().includes(kw)
      );

    console.log(
      JSON.stringify(
        {
          name: test.name,
          url,
          status: res.status,
          correlationId: cid,
          safeMessage,
          safeguardTriggered,
          durationMs: duration,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          name: test.name,
          url,
          error: (error as Error).message,
          correlationId,
        },
        null,
        2
      )
    );
  }
}

async function main() {
  console.log(
    `Starting safeguards smoke (baseUrl=${baseUrl}, correlationId=${correlationId})`
  );
  if (process.env.SAFEGUARDS_MAX_REQ_COST_USD) {
    console.log(
      `Cap-hit simulation enabled: SAFEGUARDS_MAX_REQ_COST_USD=${process.env.SAFEGUARDS_MAX_REQ_COST_USD}, SAFEGUARDS_FAIL_CLOSED=${process.env.SAFEGUARDS_FAIL_CLOSED}`
    );
  }
  for (const test of cases) {
    await runCase(test);
  }
}

main();
