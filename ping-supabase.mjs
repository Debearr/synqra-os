import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import fetch from "node-fetch";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

(async () => {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: SUPABASE_SERVICE_KEY }
    });
    if (res.ok) {
      console.log("✅ Connected to Supabase successfully");
    } else {
      console.error("⚠️ Supabase connection failed:", res.statusText);
    }
  } catch (err) {
    console.error("🔥 Error:", err.message);
  }
})();