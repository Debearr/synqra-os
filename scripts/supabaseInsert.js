import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const { SUPABASE_URL, SUPABASE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let raw;
try {
  raw = JSON.parse(fs.readFileSync("synqra-analytics.json", "utf8"));
} catch (e) {
  console.error("Could not read synqra-analytics.json. Run fetchLinkedInData first.");
  process.exit(1);
}

async function uploadAnalytics() {
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
