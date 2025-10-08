// Mirrors Supabase "asset_logs" table entries into Google Sheets
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import fetch from "node-fetch";

// Ensure WebSocket exists in Node for Supabase Realtime
// @ts-ignore
(globalThis as any).WebSocket = WebSocket as any;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const sheetWebhook = process.env.SHEETS_WEBHOOK_URL; // Google Apps Script Web App URL

if (!supabaseUrl || !supabaseKey || !sheetWebhook) {
  console.error("Missing required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or *_SERVICE_KEY/ANON_KEY), SHEETS_WEBHOOK_URL");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("🔌 Connecting to Supabase Realtime for 'asset_logs' INSERT events...");

supabase
  .channel("asset_log_channel")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "asset_logs" },
    async (payload: any) => {
      const record = payload.new;
      const logData = {
        filename: record.file_name,
        type: record.file_type,
        timestamp: record.created_at,
        validation: record.validation_status,
        checksum: record.checksum,
        version: record.version_tag,
      };

      try {
        const res = await fetch(sheetWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logData),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("❌ Mirror failed (HTTP)", res.status, text);
          return;
        }
        console.log("✅ Mirrored to Google Sheets:", logData.filename);
      } catch (err) {
        console.error("❌ Mirror failed:", err);
      }
    }
  )
  .subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.log("👂 Listening for new asset_logs inserts...");
    } else {
      console.log("Realtime status:", status);
    }
  });

// Keep process alive (in case nothing else holds the event loop)
setInterval(() => {}, 1 << 30);
