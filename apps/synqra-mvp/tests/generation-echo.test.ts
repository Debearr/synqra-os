import assert from "assert";
import { requestHomepageCouncilDraft } from "@/lib/homepage/council-request";

type FetchType = typeof globalThis.fetch;

const originalFetch: FetchType = globalThis.fetch;

async function run() {
  try {
    let capturedRequestBody: Record<string, unknown> | null = null;

    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const rawBody = typeof init?.body === "string" ? init.body : "";
      capturedRequestBody = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : null;
      return new Response(JSON.stringify({ content: "Launch this now" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as FetchType;

    await assert.rejects(
      async () => requestHomepageCouncilDraft("Launch this now"),
      /provider returned echoed input/i,
      "Echo output should be rejected for homepage generation"
    );

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          error: "Creation provider unavailable",
          userError: {
            message: "AI provider temporarily unavailable.",
            action: "Retry in 60 seconds or contact support@synqra.com.",
            retryAfter: 60,
            supportEmail: "support@synqra.com",
          },
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      )) as FetchType;

    await assert.rejects(
      async () => requestHomepageCouncilDraft("Launch this now"),
      /support@synqra\.com/i,
      "Council errors must provide explicit user action and support path"
    );

    assert.deepStrictEqual(
      capturedRequestBody,
      {
        prompt: "Launch this now",
        intent: "executive-draft",
        channel: "homepage",
        tone: "calm, confident, understated",
        platform: "linkedin",
      },
      "Homepage council request contract must match expected payload"
    );

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ content: "Roll out in three phases, anchor to one clear KPI, and publish with an executive CTA." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as FetchType;

    const generated = await requestHomepageCouncilDraft("Launch this now");
    assert.notStrictEqual(
      generated.trim().toLowerCase(),
      "launch this now",
      "Generated output must not equal input prompt"
    );

    process.stdout.write(JSON.stringify({ ok: true }) + "\n");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

run().catch((error) => {
  process.stderr.write(`generation echo regression failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
