// Rate limiter: if requests per minute exceeds threshold, queue
const threshold = Number($env.RATE_LIMIT_RPM || 60);
const nowMinute = Math.floor(Date.now() / 60000);
const windowKey = `_rpm_${nowMinute}`;
const current = Number($flow.get(windowKey) || 0) + 1;
$flow.set(windowKey, current);
if (current > threshold) {
  return [{ json: { rate_limit: "QUEUE", defer_seconds: 60 } }];
}
return [{ json: { rate_limit: "OK" } }];
