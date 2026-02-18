import { NextResponse } from "next/server";
import { getGroqUsageSnapshot, hasGroqApiKey, requestGroq } from "@/lib/council/groq-client";

type GroqTestBody = {
  prompt?: string;
};

const GROQ_TEST_MODEL_ALLOWLIST = new Set([
  "llama-3.1-8b-instant",
  "qwen/qwen3-32b",
  "openai/gpt-oss-120b",
]);

const resolveGroqTestModel = (): string => {
  const candidate = process.env.GROQ_MODEL?.trim();
  if (candidate && GROQ_TEST_MODEL_ALLOWLIST.has(candidate)) {
    return candidate;
  }
  return "llama-3.1-8b-instant";
};

function isBodyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  if (!hasGroqApiKey()) {
    return NextResponse.json(
      {
        ok: false,
        error: "groq_unavailable",
        message: "GROQ_API_KEY is missing.",
      },
      { status: 503 }
    );
  }

  const parsed = (await request.json().catch(() => null)) as unknown;
  if (!isBodyObject(parsed)) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_request_payload",
        message: "Body must be a JSON object.",
      },
      { status: 400 }
    );
  }

  const body = parsed as GroqTestBody;
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_prompt",
        message: "prompt is required.",
      },
      { status: 400 }
    );
  }

  const result = await requestGroq({
    prompt,
    systemPrompt: "You are a connectivity tester. Respond in concise plain text.",
    temperature: 0.1,
    maxTokens: 220,
    model: resolveGroqTestModel(),
  });

  if (!result.success || !result.content) {
    const errorCode = result.error?.code ?? "groq_failed";
    const status =
      errorCode === "groq_unavailable" ? 503 : errorCode === "groq_prompt_too_large" ? 413 : 502;
    return NextResponse.json(
      {
        ok: false,
        error: errorCode,
        message: result.error?.message ?? "Groq call failed.",
      },
      { status }
    );
  }

  const usage = getGroqUsageSnapshot();
  return NextResponse.json(
    {
      ok: true,
      provider: "groq",
      model: result.model,
      content: result.content,
      usage: result.usage,
      usageCount: usage.calls,
    },
    {
      status: 200,
      headers: {
        "x-groq-usage-count": String(usage.calls),
      },
    }
  );
}
