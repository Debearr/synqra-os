import { createHmac } from "crypto";
import { stableStringify } from "./stable-stringify.js";

export function signPayload(payload: unknown, secret: string): string {
  const timestampSeconds = Math.floor(Date.now() / 1000);
  const normalized = stableStringify(payload);
  const digest = createHmac("sha256", secret).update(`${timestampSeconds}.${normalized}`).digest("hex");
  return `${timestampSeconds}.${digest}`;
}

