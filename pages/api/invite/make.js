import crypto from "crypto";
import { getSupabaseAdmin } from "../../../lib/supabaseClient.js";

function getBaseUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL;
  const proto = (req.headers["x-forwarded-proto"] || "http").toString();
  const host = req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!process.env.ADMIN_BEARER_TOKEN || token !== process.env.ADMIN_BEARER_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const inviter_id = body?.inviter_id;
  if (!inviter_id) {
    res.status(400).json({ error: "inviter_id is required" });
    return;
  }

  const inviteToken = crypto.randomBytes(16).toString("hex");
  const expires_at = new Date(Date.now() + 7*24*60*60*1000).toISOString();

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("invites")
      .insert({ inviter_id, token: inviteToken, expires_at })
      .select("*")
      .single();

    if (error) throw error;

    const base = getBaseUrl(req);
    const inviteLink = `${base}/invite/${inviteToken}`;
    const qrLink = `${base}/invite/qr/${inviteToken}`;
    res.status(200).json({ token: inviteToken, inviteLink, qrLink, record: data });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}
