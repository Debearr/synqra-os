import 'dotenv/config';
import fetch from "node-fetch";
import fs from "fs";

const isMock = String(process.env.MOCK || '').toLowerCase() === '1' || String(process.env.MOCK || '').toLowerCase() === 'true';
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_ORG_ID = process.env.LINKEDIN_ORG_ID || 'YOUR_ORG_ID';

async function getLinkedInAnalytics() {
  if (isMock) {
    const mock = {
      mock: true,
      organization: LINKEDIN_ORG_ID,
      generatedAt: new Date().toISOString(),
      impressions: Math.floor(Math.random() * 10000),
      comments: Math.floor(Math.random() * 200),
      shares: Math.floor(Math.random() * 150),
      likes: Math.floor(Math.random() * 800),
      items: [
        { id: 1, impressions: 1200, comments: 4, shares: 2, likes: 40 },
        { id: 2, impressions: 3400, comments: 12, shares: 6, likes: 120 },
      ],
    };
    fs.writeFileSync("synqra-analytics.json", JSON.stringify(mock, null, 2));
    console.log("✅ (MOCK) LinkedIn analytics saved to synqra-analytics.json");
    return;
  }

  if (!LINKEDIN_ACCESS_TOKEN) {
    console.error("Missing LINKEDIN_ACCESS_TOKEN env var");
    process.exit(1);
  }

  const res = await fetch(
    `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${LINKEDIN_ORG_ID}`,
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
