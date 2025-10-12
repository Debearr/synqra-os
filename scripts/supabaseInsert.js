import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const isMock = String(process.env.MOCK || '').toLowerCase() === '1' || String(process.env.MOCK || '').toLowerCase() === 'true';
const { SUPABASE_URL, SUPABASE_KEY } = process.env;

if (!isMock) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_KEY env vars");
    process.exit(1);
  }
}

const supabase = !isMock ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let raw;
try {
  raw = JSON.parse(fs.readFileSync("synqra-analytics.json", "utf8"));
} catch (e) {
  console.error("Could not read synqra-analytics.json. Run fetchLinkedInData first.");
  process.exit(1);
}

async function uploadAnalytics() {
  if (isMock) {
    fs.mkdirSync('reports/mock', { recursive: true });
    fs.writeFileSync('reports/mock/supabase-insert.json', JSON.stringify({ inserted: true, at: new Date().toISOString(), preview: raw ? Object.keys(raw).slice(0, 5) : null }, null, 2));
    console.log("✅ (MOCK) Saved Supabase insert payload to reports/mock/supabase-insert.json");
    return;
  }

  const { data, error } = await supabase
    .from("linkedin_analytics")
    .insert([{ report_date: new Date().toISOString(), metrics: raw }]);

  if (error) throw error;
  console.log("✅ Analytics data uploaded to Supabase.");
}

uploadAnalytics().catch((err) => {
  console.error(err);
  process.exit(1);
});
