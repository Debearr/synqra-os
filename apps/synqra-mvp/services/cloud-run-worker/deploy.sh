#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GCP_PROJECT_ID:-}" || -z "${GCP_REGION:-}" ]]; then
  echo "GCP_PROJECT_ID and GCP_REGION are required"
  exit 1
fi

if [[ -z "${INTERNAL_API_BASE_URL:-}" ]]; then
  echo "INTERNAL_API_BASE_URL is required"
  exit 1
fi

if [[ -z "${CLOUD_RUN_SERVICE_URL:-}" ]]; then
  echo "CLOUD_RUN_SERVICE_URL is required"
  exit 1
fi

SERVICE_NAME="synqra-automation-worker"
SERVICE_ACCOUNT="automation-worker@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --region "${GCP_REGION}" \
  --platform managed \
  --project "${GCP_PROJECT_ID}" \
  --no-allow-unauthenticated \
  --service-account "${SERVICE_ACCOUNT}" \
  --set-env-vars INTERNAL_API_BASE_URL="${INTERNAL_API_BASE_URL}",CLOUD_RUN_SERVICE_URL="${CLOUD_RUN_SERVICE_URL}" \
  --set-secrets SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest,INTERNAL_JOB_SIGNING_SECRET=internal-job-signing-secret:latest,GOOGLE_ENCRYPTION_KEY=google-encryption-key:latest,FIREBASE_PRIVATE_KEY=firebase-private-key:latest

echo "Cloud Run deployment complete."

