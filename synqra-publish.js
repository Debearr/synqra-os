import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

function getEnv(name, options = {}) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    if (options.required) {
      console.error(`Missing required environment variable: ${name}`);
      process.exit(1);
    }
    return undefined;
  }
  return value.trim();
}

function normalizeUrn(raw, kind) {
  if (!raw) return raw;
  if (raw.startsWith("urn:li:")) return raw;
  const prefix = kind === "organization" ? "urn:li:organization:" : "urn:li:person:";
  return `${prefix}${raw}`;
}

async function publishLinkedInUpdate() {
  const accessToken = getEnv("LINKEDIN_ACCESS_TOKEN", { required: true });
  const postAs = (getEnv("POST_AS") || "person").toLowerCase();

  const personUrnRaw = getEnv("LINKEDIN_PERSON_URN", { required: postAs !== "organization" });
  const orgUrnRaw = getEnv("LINKEDIN_ORG_URN", { required: postAs === "organization" });

  const authorUrn = postAs === "organization"
    ? normalizeUrn(orgUrnRaw, "organization")
    : normalizeUrn(personUrnRaw, "person");

  const postText = getEnv("POST_TEXT") || "🚀 Synqra test post — automation setup complete!";

  const payload = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: postText },
        shareMediaCategory: "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  try {
    const response = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        timeout: 20000,
      }
    );

    console.log("✅ Post published successfully");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error("❌ Error publishing post");
    if (status) console.error(`Status: ${status}`);
    if (data) {
      console.error(typeof data === "string" ? data : JSON.stringify(data, null, 2));
    } else {
      console.error(error?.message || String(error));
    }
    process.exit(1);
  }
}

publishLinkedInUpdate();
