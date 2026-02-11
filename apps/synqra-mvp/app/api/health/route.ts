import { NextResponse } from "next/server";

const BUILD_TIMESTAMP = process.env.VERCEL_GIT_COMMIT_TIMESTAMP?.trim() || process.env.BUILD_TIMESTAMP?.trim() || new Date().toISOString();

function isConfigured(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes("your_") || trimmed.endsWith("_here")) return false;
  return true;
}

function resolveCommit(): string {
  return process.env.VERCEL_GIT_COMMIT_SHA?.trim() || process.env.GIT_COMMIT_SHA?.trim() || "unknown";
}

function resolveBuildTimestamp(): string {
  return BUILD_TIMESTAMP;
}

export async function GET() {
  const openRouterConfigured = isConfigured(process.env.OPENROUTER_API_KEY);
  const geminiConfigured = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
  ].some(isConfigured);

  return NextResponse.json({
    status: "ok",
    commit: resolveCommit(),
    version: resolveCommit(),
    buildTimestamp: resolveBuildTimestamp(),
    aiProviderConfigured: openRouterConfigured || geminiConfigured,
    checks: {
      providerConfigured: openRouterConfigured || geminiConfigured,
    },
  });
}
