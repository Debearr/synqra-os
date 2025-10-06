// Enforce: JSON only, no secrets, no drift keywords, low-temp expectation.
const text = ($json.raw || $json.text || "");
if (typeof text !== "string") {
  return [{ json: { status: "REJECT", reason: "not_string" } }];
}
const trimmed = text.trim();
if (!trimmed.startsWith("{")) {
  return [{ json: { status: "REJECT", reason: "not_json" } }];
}
if (/(sk-|aws_secret|BEGIN PRIVATE KEY)/i.test(trimmed)) {
  return [{ json: { status: "REJECT", reason: "secret_leak" } }];
}
if (/disclaimer:|as an ai|i cannot/i.test(trimmed)) {
  return [{ json: { status: "REJECT", reason: "drift" } }];
}
return [{ json: { status: "OK" } }];
