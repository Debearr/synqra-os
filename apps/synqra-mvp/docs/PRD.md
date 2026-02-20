# Synqra MVP PRD

## Regression Prevention

- Keep `/api/council` in middleware protected prefixes, but do not apply council-specific role rejection there.
- Middleware role resolution must use `supabase.auth.getUser(token)`; never trust decoded JWT payloads for role decisions.
- Support both `Authorization: Bearer <token>` and Supabase cookie token extraction in middleware auth resolution.
- `.env.example` must only contain placeholders for secrets (for example `YOUR_TOKEN_HERE`), never live credentials.
- Cloud Run worker deploy secrets must use `supabase-service-role-key` consistently across deploy scripts and runbooks.
- `/api/ready` must perform a real Supabase dependency check and return `503` when the dependency is unavailable.
- CI lint must fail on:
  - hardcoded redirect path strings outside `lib/redirects.ts`
  - direct `user.role = ...` assignments outside `lib/user-role-state.ts`
