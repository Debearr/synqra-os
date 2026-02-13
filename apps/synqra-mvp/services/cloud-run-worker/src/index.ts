import express, { NextFunction, Request, Response } from "express";
import { runCronDispatch } from "./jobs/cron-dispatch.js";
import { runRetryHandler } from "./jobs/retry-handler.js";
import { runOutcomeAuditRunner } from "./jobs/outcome-audit-runner.js";
import { runScheduleRunner } from "./jobs/schedule-runner.js";
import { runEmailPollAndClassify } from "./jobs/email-poll-and-classify.js";
import { runHighPriorityDraftRunner } from "./jobs/high-priority-draft-runner.js";
import { runDailyNormalDigest } from "./jobs/daily-normal-digest.js";

function validateRequiredEnv(): void {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "INTERNAL_JOB_SIGNING_SECRET",
    "INTERNAL_API_BASE_URL",
    "CLOUD_RUN_SERVICE_URL",
  ];

  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    console.error(`[worker] Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/i.test(process.env.INTERNAL_API_BASE_URL || "")) {
    console.error("[worker] INTERNAL_API_BASE_URL must not reference localhost in production");
    process.exit(1);
  }
}

validateRequiredEnv();

const app = express();
app.use(express.json({ limit: "1mb" }));

function requireAuthenticatedInvoker(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ ok: false, error: "Missing bearer token" });
    return;
  }
  next();
}

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    service: "synqra-cloud-run-worker",
    timestamp: new Date().toISOString(),
  });
});

app.post("/jobs/dispatch", requireAuthenticatedInvoker, async (_req: Request, res: Response) => {
  try {
    const result = await runCronDispatch();
    res.status(200).json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown dispatch error",
    });
  }
});

app.post("/jobs/retry", requireAuthenticatedInvoker, async (_req: Request, res: Response) => {
  try {
    const result = await runRetryHandler();
    res.status(200).json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown retry error",
    });
  }
});

app.post("/jobs/audit", requireAuthenticatedInvoker, async (_req: Request, res: Response) => {
  try {
    const result = await runOutcomeAuditRunner();
    res.status(200).json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown audit error",
    });
  }
});

app.post("/jobs/schedule", requireAuthenticatedInvoker, async (_req: Request, res: Response) => {
  try {
    const result = await runScheduleRunner();
    res.status(200).json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown schedule error",
    });
  }
});

app.post("/jobs/email-poll-and-classify", requireAuthenticatedInvoker, async (_req: Request, res: Response) => {
  try {
    const result = await runEmailPollAndClassify();
    res.status(200).json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown email poll error",
    });
  }
});

app.post("/jobs/high-priority-drafts", requireAuthenticatedInvoker, async (_req: Request, res: Response) => {
  try {
    const result = await runHighPriorityDraftRunner();
    res.status(200).json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown high-priority draft error",
    });
  }
});

app.post("/jobs/daily-normal-digest", requireAuthenticatedInvoker, async (_req: Request, res: Response) => {
  try {
    const result = await runDailyNormalDigest();
    res.status(200).json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown daily digest error",
    });
  }
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`synqra-cloud-run-worker listening on :${port}`);
});
