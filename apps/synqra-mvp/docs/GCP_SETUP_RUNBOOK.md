# GCP Setup Runbook (Cloud Run + Scheduler + Secrets)

Use this runbook in Google Cloud Shell or any machine with `gcloud` installed and authenticated.

## 0) Prerequisites

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"
export SUPABASE_URL="https://your-project-ref.supabase.co"

gcloud config set project "$GCP_PROJECT_ID"
gcloud services enable run.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com iam.googleapis.com monitoring.googleapis.com logging.googleapis.com
```

## 1) Secret Manager Setup

```bash
# Internal HMAC signing secret for internal API calls
gcloud secrets create internal-job-signing-secret \
  --data-file=<(openssl rand -base64 32) \
  --replication-policy="automatic"

# AES key for Google token encryption/decryption
gcloud secrets create google-encryption-key \
  --data-file=<(openssl rand -base64 32) \
  --replication-policy="automatic"

# Firebase private key (paste your real key material)
echo -n "YOUR_FIREBASE_PRIVATE_KEY" | gcloud secrets create firebase-private-key \
  --data-file=- \
  --replication-policy="automatic"

# Supabase service key (if not already created)
echo -n "YOUR_SUPABASE_SERVICE_ROLE_KEY" | gcloud secrets create supabase-service-role-key \
  --data-file=- \
  --replication-policy="automatic"
```

## 2) Service Account + IAM Bindings

```bash
gcloud iam service-accounts create automation-worker \
  --display-name="Synqra Automation Worker"

gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
  --member="serviceAccount:automation-worker@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
  --member="serviceAccount:automation-worker@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker"
```

## 3) Cloud Run Deployment

```bash
cd apps/synqra-mvp/services/cloud-run-worker

gcloud run deploy synqra-automation-worker \
  --source . \
  --region "$GCP_REGION" \
  --platform managed \
  --no-allow-unauthenticated \
  --service-account "automation-worker@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --set-secrets="SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest,INTERNAL_JOB_SIGNING_SECRET=internal-job-signing-secret:latest,GOOGLE_ENCRYPTION_KEY=google-encryption-key:latest,FIREBASE_PRIVATE_KEY=firebase-private-key:latest" \
  --set-env-vars="SUPABASE_URL=$SUPABASE_URL,GCP_PROJECT_ID=$GCP_PROJECT_ID,GCP_REGION=$GCP_REGION,INTERNAL_API_BASE_URL=https://synqra.co,CLOUD_RUN_SERVICE_URL=https://YOUR_CLOUD_RUN_SERVICE_URL,SCHEDULING_ENABLED=false,AUTO_PUBLISH_ENABLED=false,PLATFORM_CONNECTORS_ENABLED=false,SENSITIVE_ACTION_APPROVAL_REQUIRED=true"
```

## 4) Cloud Scheduler Jobs

```bash
SERVICE_URL=$(gcloud run services describe synqra-automation-worker \
  --region "$GCP_REGION" \
  --format 'value(status.url)')

# Recommended: use the repo scheduler script (idempotent upsert + retry/backoff policy)
cd apps/synqra-mvp/services/cloud-run-worker
GCP_PROJECT_ID="$GCP_PROJECT_ID" GCP_REGION="$GCP_REGION" WORKER_URL="$SERVICE_URL" ./scheduler-jobs.sh
```

If you need direct manual commands, the examples below are valid and should include retry policy flags:

```bash

# Every 5 minutes
gcloud scheduler jobs create http cron-dispatch \
  --schedule="*/5 * * * *" \
  --uri="$SERVICE_URL/jobs/dispatch" \
  --http-method=POST \
  --oidc-service-account-email="automation-worker@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$SERVICE_URL" \
  --location="$GCP_REGION"

# Every 5 minutes
gcloud scheduler jobs create http cron-retry \
  --schedule="*/5 * * * *" \
  --uri="$SERVICE_URL/jobs/retry" \
  --http-method=POST \
  --oidc-service-account-email="automation-worker@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$SERVICE_URL" \
  --max-retry-attempts=5 \
  --min-backoff=30s \
  --max-backoff=600s \
  --max-doublings=5 \
  --attempt-deadline=180s \
  --location="$GCP_REGION"

# Every 5 minutes
gcloud scheduler jobs create http cron-schedule \
  --schedule="*/5 * * * *" \
  --uri="$SERVICE_URL/jobs/schedule" \
  --http-method=POST \
  --oidc-service-account-email="automation-worker@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$SERVICE_URL" \
  --location="$GCP_REGION"

# Daily 2am EST (07:00 UTC)
gcloud scheduler jobs create http outcome-audit \
  --schedule="0 7 * * *" \
  --time-zone="America/New_York" \
  --uri="$SERVICE_URL/jobs/audit" \
  --http-method=POST \
  --oidc-service-account-email="automation-worker@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$SERVICE_URL" \
  --location="$GCP_REGION"

# Every 5 minutes
gcloud scheduler jobs create http email-poll-and-classify \
  --schedule="*/5 * * * *" \
  --uri="$SERVICE_URL/jobs/email-poll-and-classify" \
  --http-method=POST \
  --oidc-service-account-email="automation-worker@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$SERVICE_URL" \
  --location="$GCP_REGION"

# Every 5 minutes
gcloud scheduler jobs create http high-priority-drafts \
  --schedule="*/5 * * * *" \
  --uri="$SERVICE_URL/jobs/high-priority-drafts" \
  --http-method=POST \
  --oidc-service-account-email="automation-worker@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$SERVICE_URL" \
  --location="$GCP_REGION"

# Daily at 20:00 America/New_York
gcloud scheduler jobs create http daily-normal-digest \
  --schedule="0 20 * * *" \
  --time-zone="America/New_York" \
  --uri="$SERVICE_URL/jobs/daily-normal-digest" \
  --http-method=POST \
  --oidc-service-account-email="automation-worker@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$SERVICE_URL" \
  --location="$GCP_REGION"
```

## 5) Post-Deploy Verification

```bash
curl -s "$SERVICE_URL/health"
gcloud scheduler jobs describe cron-dispatch --location="$GCP_REGION"
gcloud scheduler jobs describe cron-retry --location="$GCP_REGION"
gcloud scheduler jobs describe cron-schedule --location="$GCP_REGION"
gcloud scheduler jobs describe outcome-audit --location="$GCP_REGION"
gcloud scheduler jobs describe email-poll-and-classify --location="$GCP_REGION"
gcloud scheduler jobs describe high-priority-drafts --location="$GCP_REGION"
gcloud scheduler jobs describe daily-normal-digest --location="$GCP_REGION"
```

Expected:
- Cloud Run service returns `200` on `/health`
- Scheduler jobs are `ENABLED`
- No unauthenticated access is allowed

## 6) Security and Secret Rotation

- Do not store secrets in repository files.
- Keep worker credentials in Secret Manager and rotate regularly.
- If a credential leak is suspected:
  1. rotate and reissue all impacted keys
  2. invalidate old secrets
  3. update Cloud Run and CI secrets
  4. review whether git history rewrite is required by policy

## 7) Monitoring Alerts (Worker + Queue + Hop Guardrails)

```bash
cd apps/synqra-mvp/services/cloud-run-worker

# Optional: set a notification channel from Cloud Monitoring
export GCP_NOTIFICATION_CHANNEL="projects/$GCP_PROJECT_ID/notificationChannels/1234567890"
export CLOUD_RUN_SERVICE_NAME="synqra-automation-worker"

GCP_PROJECT_ID="$GCP_PROJECT_ID" GCP_REGION="$GCP_REGION" ./monitoring-alerts.sh
```

This configures:
- Worker restart alert (>3 in 10 minutes)
- Worker request p95 latency alert (>10 seconds)
- Scheduler backlog threshold breach alert
- Agent hop count breach alert (>3)

