// Verify webhook HMAC signature using Node crypto and n8n env
const crypto = require("crypto");

const signatureHeader = ($headers && ($headers["x-signature"] || $headers["X-Signature"])) || "";
const secret = ($env && $env.SHARED_HMAC_SECRET) || "";
const bodyString = JSON.stringify($json);

const computed = crypto.createHmac("sha256", secret).update(bodyString).digest("hex");
const auth = signatureHeader === computed ? "OK" : "FAIL";
return [{ json: { auth } }];
