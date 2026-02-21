export const REDIRECT_PATHS = {
  ROOT: "/",
  APPLY_STATUS: "/apply/status",
  DASHBOARD: "/dashboard",
  PRICING: "/pricing",
  ENTER: "/enter",
  AUTH_SIGN_IN: "/auth/sign-in",
  STUDIO: "/studio",
  ADMIN_INTEGRATIONS: "/admin/integrations",
  GOOGLE_OAUTH_CALLBACK: "/api/google/oauth/callback",
} as const;

type GoogleAuthRedirectState = "error" | "config_error";
type LinkedInCallbackState =
  | "linkedin_denied"
  | "linkedin_state"
  | "linkedin_token_failed"
  | "linkedin_profile_failed"
  | "database_failed"
  | "unexpected"
  | "linkedin";

function buildQueryPath(pathname: string, query: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    params.set(key, value);
  }
  const encoded = params.toString();
  return encoded ? `${pathname}?${encoded}` : pathname;
}

export function buildAbsoluteRedirectUrl(origin: string, pathname: string): string {
  const normalizedOrigin = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  return `${normalizedOrigin}${pathname}`;
}

export function getGoogleAuthRedirectPath(state: GoogleAuthRedirectState): string {
  return buildQueryPath(REDIRECT_PATHS.ENTER, { auth: state });
}

export function getLinkedInCallbackRedirectPath(state: LinkedInCallbackState): string {
  if (state === "linkedin") {
    return buildQueryPath(REDIRECT_PATHS.ADMIN_INTEGRATIONS, { success: "linkedin" });
  }
  return buildQueryPath(REDIRECT_PATHS.ADMIN_INTEGRATIONS, { error: state });
}

export function getRedirectForRole(role: string): string {
  const map: Record<string, string> = {
    visitor: REDIRECT_PATHS.ROOT,
    applicant: REDIRECT_PATHS.APPLY_STATUS,
    approved_pilot: REDIRECT_PATHS.DASHBOARD,
    subscriber: REDIRECT_PATHS.DASHBOARD,
    lapsed: REDIRECT_PATHS.PRICING,
    denied: REDIRECT_PATHS.APPLY_STATUS,
  };
  return map[role] ?? REDIRECT_PATHS.ROOT;
}
