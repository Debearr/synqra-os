// 🧠 GOOGLE SHEETS MIRROR LOGGER v1.0
import fetch from "node-fetch";

export async function mirrorToSheets(data: any) {
  const WEBHOOK = process.env.G_SHEETS_WEBHOOK_URL;
  if (!WEBHOOK) {
    console.warn("⚠️ G_SHEETS_WEBHOOK_URL not set; skipping Sheets mirror");
    return;
  }
  try {
    const res = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) console.log(`🟢 Mirrored to Sheets: ${data.file_name}`);
    else console.error(`🔴 Sheets sync failed: ${res.status} ${res.statusText}`);
  } catch (err) {
    console.error("⚠️ Sheets mirror error:", err);
  }
}
