# GCP Setup Runbook (Cloud Run + Scheduler + Secrets)

Use this runbook in Google Cloud Shell or any machine with `gcloud` installed and authenticated.

## 0) Prerequisites

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"
export SUPABASE_URL="https://your-project-ref.supabase.co"

gcloud config set project "$GCP_PROJECT_ID"
gcloud services enable run.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com iam.googleapis.com
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
```

## 5) Post-Deploy Verification

```bash
curl -s "$SERVICE_URL/health"
gcloud scheduler jobs describe cron-dispatch --location="$GCP_REGION"
gcloud scheduler jobs describe cron-retry --location="$GCP_REGION"
gcloud scheduler jobs describe cron-schedule --location="$GCP_REGION"
gcloud scheduler jobs describe outcome-audit --location="$GCP_REGION"
```

Expected:
- Cloud Run service returns `200` on `/health`
- Scheduler jobs are `ENABLED`
- No unauthenticated access is allowed

