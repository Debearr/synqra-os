import fs from "node:fs/promises";
import path from "node:path";

async function readPrompt() {
  if (process.env.CLAUDE_PROMPT && process.env.CLAUDE_PROMPT.trim().length > 0) {
    return process.env.CLAUDE_PROMPT;
  }
  const promptFilePath = path.resolve(process.cwd(), "scripts", "prompt.txt");
  try {
    const file = await fs.readFile(promptFilePath, "utf8");
    if (file && file.trim().length > 0) return file.trim();
  } catch {}
  return "<PASTE THE FULL CHAT PROMPT FROM SECTION A HERE>";
}

async function callAnthropic(promptText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("Skipping Anthropic call: missing ANTHROPIC_API_KEY");
    return null;
  }

  const payload = {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    system: "JSON-only output. No secrets. If uncertain, return NEED_EVIDENCE.",
    messages: [{ role: "user", content: promptText }]
  };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data;
}

function normalizeBaseUrl(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

async function updateSubscriptionsFreeView() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("Skipping Supabase update: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return [];
  }

  const baseUrl = normalizeBaseUrl(supabaseUrl);
  const endpoint = `${baseUrl}/rest/v1/subscriptions`;
  const nowIso = new Date().toISOString();

  const searchParams = new URLSearchParams();
  searchParams.set("trial_ends_at", `lt.${nowIso}`);
  searchParams.set("converted", "is.false");
  searchParams.set("status", "neq.free_view");

  const response = await fetch(`${endpoint}?${searchParams.toString()}`, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({ status: "free_view" })
  });

  if (response.status === 204) return [];
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase update ${response.status}: ${errorText}`);
  }

  const updatedRows = await response.json();
  return Array.isArray(updatedRows) ? updatedRows : [];
}

async function notifyUpgradeCta(updatedRows) {
  const webhookUrl = process.env.UPGRADE_CTA_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const userIds = (updatedRows || [])
    .map((row) => row.user_id ?? row.userId)
    .filter(Boolean);

  const payload = {
    type: "free_view_upgrade_cta",
    user_ids: userIds,
    message: "Your trial has ended. Upgrade to continue with full features.",
    cta_label: "Upgrade",
    cta_url: process.env.UPGRADE_CTA_URL || ""
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res.ok;
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const promptText = await readPrompt();

  try {
    if (isDryRun) {
      console.log("[dry-run] Skipping Anthropic call.");
    } else {
      const claude = await callAnthropic(promptText);
      console.log("✅ Claude eval received.");
      console.log(JSON.stringify(claude, null, 2));
    }
  } catch (err) {
    console.error("Anthropic error:", err?.message || err);
  }

  try {
    const updatedRows = isDryRun ? [] : await updateSubscriptionsFreeView();
    if (!isDryRun) {
      if (updatedRows.length > 0) {
        console.log(`✅ Subscriptions updated to free_view: ${updatedRows.length}`);
      } else {
        console.log("No subscriptions required status update.");
      }
      const notified = await notifyUpgradeCta(updatedRows);
      if (notified) console.log("✅ Users notified with Upgrade CTA.");
    } else {
      console.log("[dry-run] Skipping Supabase updates and notifications.");
    }
  } catch (err) {
    console.error("Supabase/notification error:", err?.message || err);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
