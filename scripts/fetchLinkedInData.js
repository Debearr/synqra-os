import fetch from "node-fetch";
import fs from "fs";

const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

if (!LINKEDIN_ACCESS_TOKEN) {
  console.error("Missing LINKEDIN_ACCESS_TOKEN env var");
  process.exit(1);
}

async function getLinkedInAnalytics() {
  const res = await fetch(
    "https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:YOUR_ORG_ID",
    {
      headers: { Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  fs.writeFileSync("synqra-analytics.json", JSON.stringify(data, null, 2));
  console.log("✅ LinkedIn analytics saved to synqra-analytics.json");
}

getLinkedInAnalytics().catch((err) => {
  console.error(err);
  process.exit(1);
});
