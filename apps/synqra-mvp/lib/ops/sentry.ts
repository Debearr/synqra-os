import "server-only";

import * as Sentry from "@sentry/nextjs";

export type RecentSentryIssue = {
  id: string;
  title: string;
  culprit: string;
  timestamp: string;
  status: string;
};

type LoadRecentSentryIssuesResult =
  | { configured: true; issues: RecentSentryIssue[] }
  | { configured: false; reason: string; issues: [] };

let _initialized = false;

export function captureOpsError(error: Error, context?: Record<string, string>): void {
  try {
    initializeSentryForServer();
    if (!isSentryConfigured()) {
      return;
    }

    Sentry.withScope((scope) => {
      scope.setTag("service", "ops");
      scope.setTag("environment", process.env.SYNQRA_ENV || "development");
      if (context) {
        for (const [key, value] of Object.entries(context)) {
          scope.setTag(key, value);
        }
      }
      Sentry.captureException(error);
    });
  } catch {
    // Fail silently by design.
  }
}

export function captureOpsException(
  error: unknown,
  tags: { job_name: string; service: "ops_worker" | "synqra-mvp"; vertical?: string; run_id?: string }
): void {
  const normalized = error instanceof Error ? error : new Error(String(error));
  captureOpsError(normalized, {
    job_name: tags.job_name,
    service: tags.service,
    vertical: tags.vertical ?? "unknown",
    run_id: tags.run_id ?? "unknown",
  });
}

export async function loadRecentSentryIssues(limit = 5): Promise<LoadRecentSentryIssuesResult> {
  const org = process.env.SENTRY_ORG?.trim();
  const project = process.env.SENTRY_PROJECT?.trim();
  const token = process.env.SENTRY_AUTH_TOKEN?.trim();

  if (!org || !project || !token) {
    return { configured: false, reason: "Sentry not configured", issues: [] };
  }

  const url = `https://sentry.io/api/0/projects/${encodeURIComponent(org)}/${encodeURIComponent(project)}/issues/?limit=${Math.max(
    1,
    Math.min(20, limit)
  )}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { configured: false, reason: "Unable to load issues", issues: [] };
    }

    const payload = (await response.json()) as Array<Record<string, unknown>>;
    const issues: RecentSentryIssue[] = Array.isArray(payload)
      ? payload.slice(0, limit).map((item) => ({
          id: String(item.id ?? ""),
          title: String(item.title ?? "Untitled"),
          culprit: String(item.culprit ?? "n/a"),
          timestamp: String(item.lastSeen ?? item.firstSeen ?? ""),
          status: String(item.status ?? "unknown"),
        }))
      : [];

    return { configured: true, issues };
  } catch {
    return { configured: false, reason: "Unable to load issues", issues: [] };
  }
}

function initializeSentryForServer(): void {
  if (_initialized) return;

  const dsn = process.env.SENTRY_DSN?.trim();
  try {
    if (dsn) {
      Sentry.init({
        dsn,
        environment: process.env.SENTRY_ENVIRONMENT || process.env.SYNQRA_ENV || "development",
        release: process.env.SENTRY_RELEASE || undefined,
        tracesSampleRate: 0,
      });
    }
  } catch {
    // Fail silently by design.
  }
  _initialized = true;
}

function isSentryConfigured(): boolean {
  return Boolean(process.env.SENTRY_DSN?.trim());
}
