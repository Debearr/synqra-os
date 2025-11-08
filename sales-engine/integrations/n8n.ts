import { getN8nConfig } from "../config";
import { logSalesEvent } from "../db/client";

type N8nHook =
  | "qualification"
  | "nurturing"
  | "closure"
  | "activation"
  | "churn-prevention";

const HOOK_PATHS: Record<N8nHook, string> = {
  qualification: "/webhook/sales-qualification",
  nurturing: "/webhook/sales-nurture",
  closure: "/webhook/sales-close",
  activation: "/webhook/sales-activate",
  "churn-prevention": "/webhook/sales-retain",
};

export async function callN8nHook(hook: N8nHook, payload: Record<string, unknown>) {
  const config = getN8nConfig();
  if (!config.baseUrl) {
    console.warn("[sales-engine] n8n base URL missing; hook skipped.");
    return { ok: false, reason: "config_missing" };
  }

  try {
    const response = await fetch(new URL(HOOK_PATHS[hook], config.baseUrl).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.authToken ? { Authorization: `Bearer ${config.authToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn("[sales-engine] n8n hook failed", hook, error);
      return { ok: false, reason: error };
    }

    await logSalesEvent({
      type: "system_notification",
      payload: { n8n_hook: hook, response: await response.json().catch(() => ({})) },
    });

    return { ok: true };
  } catch (error) {
    console.warn("[sales-engine] n8n hook error", hook, error);
    return { ok: false, reason: (error as Error).message };
  }
}
