// Idempotency guard: DROP if key seen, else STORE and PROCESS
const key = $json.idempotency_key;
if (!key) {
  return [{ json: { idempotency: "MISSING" } }];
}
// Simple in-flow memory (for illustration; replace with persistent store)
$flow.set("_idempotency_keys", $flow.get("_idempotency_keys") || {});
const store = $flow.get("_idempotency_keys");
if (store[key]) {
  return [{ json: { idempotency: "DROP" } }];
}
store[key] = Date.now();
$flow.set("_idempotency_keys", store);
return [{ json: { idempotency: "PROCESS" } }];
