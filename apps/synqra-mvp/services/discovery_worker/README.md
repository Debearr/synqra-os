# Ops Discovery Worker

## Error Monitoring (Sentry)

- Env vars:
  - `SENTRY_DSN`
  - `SENTRY_ENVIRONMENT` (default: `development`)
  - `SENTRY_RELEASE` (optional)
- Python entrypoints use a shared Sentry guard wrapper and return sanitized error responses.
- `ALERT_EMAIL` is not wired to a new mail pipeline in this worker. Configure Sentry alert rules in Sentry UI for error notifications.

## Rollback

Cloud Run rollback command:

```bash
gcloud run services update-traffic <SERVICE_NAME> --to-revisions <REVISION>=100
```

## Secrets Rotation

- Rotate `APPROVAL_ENDPOINT_SECRET` at least quarterly.
- Rotate `SENTRY_AUTH_TOKEN` regularly and keep it server-only:
  - do not expose to browser/client bundles
  - keep in Cloud Run/hosting secret manager
  - update deployment env vars and invalidate old token

