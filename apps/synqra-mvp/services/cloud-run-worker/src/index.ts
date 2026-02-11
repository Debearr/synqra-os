import express, { Request, Response } from "express";
import { runCronDispatch } from "./jobs/cron-dispatch.js";
import { runRetryHandler } from "./jobs/retry-handler.js";
import { runOutcomeAuditRunner } from "./jobs/outcome-audit-runner.js";
import { runScheduleRunner } from "./jobs/schedule-runner.js";
import { runEmailPollAndClassify } from "./jobs/email-poll-and-classify.js";
import { runHighPriorityDraftRunner } from "./jobs/high-priority-draft-runner.js";
import { runDailyNormalDigest } from "./jobs/daily-normal-digest.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    service: "synqra-cloud-run-worker",
    timestamp: new Date().toISOString(),
  });
});

app.post("/jobs/dispatch", async (_req: Request, res: Response) => {
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

app.post("/jobs/retry", async (_req: Request, res: Response) => {
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

app.post("/jobs/audit", async (_req: Request, res: Response) => {
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

app.post("/jobs/schedule", async (_req: Request, res: Response) => {
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

app.post("/jobs/email-poll-and-classify", async (_req: Request, res: Response) => {
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

app.post("/jobs/high-priority-drafts", async (_req: Request, res: Response) => {
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

app.post("/jobs/daily-normal-digest", async (_req: Request, res: Response) => {
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
