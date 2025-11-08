import { callN8nHook } from "../integrations/n8n";
import { getDeepSeekConfig, getKieAiKey } from "../config";
import { readCacheEntry, writeCacheEntry, logSalesEvent } from "../db/client";
import type { SelfHealingReport } from "../types";

async function checkN8nHealth() {
  const result = await callN8nHook("activation", { ping: true });
  return result.ok
    ? { component: "n8n", status: "ok", message: "n8n responsive" }
    : { component: "n8n", status: "warning", message: result.reason ?? "n8n unavailable" };
}

async function checkAiLimits() {
  const hasKieAi = Boolean(getKieAiKey());
  const deepSeek = getDeepSeekConfig();

  return [
    {
      component: "kie.ai",
      status: hasKieAi ? "ok" : "warning",
      message: hasKieAi ? "API key present" : "Missing Kie.AI credentials",
    },
    {
      component: "deepseek",
      status: deepSeek.url && deepSeek.token ? "ok" : "warning",
      message: deepSeek.url && deepSeek.token ? "Router configured" : "DeepSeek Router incomplete",
    },
  ];
}

async function checkSupabaseLogs() {
  const logs = await readCacheEntry("sales-engine:latest-log");
  if (logs.error) {
    return { component: "supabase", status: "warning", message: logs.error };
  }

  return { component: "supabase", status: "ok", message: "Log cache accessible" };
}

async function buildReport(): Promise<SelfHealingReport> {
  const incidents: SelfHealingReport["incidents"] = [];
  const n8nHealth = await checkN8nHealth();
  incidents.push(n8nHealth);

  const ai = await checkAiLimits();
  incidents.push(...ai);

  incidents.push(await checkSupabaseLogs());

  const degraded = incidents.some((i) => i.status !== "ok");

  return {
    checkedAt: new Date().toISOString(),
    status: degraded ? "degraded" : "ok",
    incidents,
  };
}

export async function runSelfHealing() {
  const report = await buildReport();
  await writeCacheEntry({
    key: "sales-engine:self-healing",
    value: report,
    scope: "system",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  });

  await logSalesEvent({
    type: "system_notification",
    payload: { self_healing_report: report },
  });

  if (report.status !== "ok") {
    await callN8nHook("churn-prevention", {
      incident: "sales_engine_degraded",
      report,
    });
  }

  return report;
}

if (require.main === module) {
  runSelfHealing()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error("[sales-engine] Self-healing loop failed", error);
      process.exit(1);
    });
}
