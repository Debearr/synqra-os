import { requireSupabase } from "../supabaseClient";
import { AuthError } from "./errors";
import type { SessionResult, SessionUser } from "./types";

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function getSessionUser(req: Request): Promise<SessionResult> {
  const token = extractBearerToken(req);
  if (!token) {
    return { user: null };
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, token };
  }

  const user: SessionUser = {
    id: data.user.id,
    email: data.user.email,
  };

  return { user, token };
}

export async function requireSessionUser(req: Request): Promise<SessionUser> {
  const { user } = await getSessionUser(req);
  if (!user) {
    throw new AuthError("Authentication required.");
  }
  return user;
}
