import assert from "assert";
import { generatePerfectDraft } from "@/lib/draftEngine";

type FetchType = typeof globalThis.fetch;

const originalFetch: FetchType = globalThis.fetch;

async function run() {
  try {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ content: "Launch this now" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as FetchType;

    await assert.rejects(
      async () => generatePerfectDraft("Launch this now"),
      /provider returned echoed input/i,
      "Echo output should be rejected"
    );

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ content: "Launch this with a three-point rollout and executive CTA." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as FetchType;

    const generated = await generatePerfectDraft("Launch this now");
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
  process.stderr.write(`no-echo regression failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});