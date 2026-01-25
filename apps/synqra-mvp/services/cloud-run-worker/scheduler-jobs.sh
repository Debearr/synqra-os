#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GCP_PROJECT_ID:-}" || -z "${GCP_REGION:-}" || -z "${WORKER_URL:-}" ]]; then
  echo "GCP_PROJECT_ID, GCP_REGION, and WORKER_URL are required"
  exit 1
fi

SERVICE_ACCOUNT="automation-worker@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

gcloud scheduler jobs create http synqra-cron-dispatch \
  --project "${GCP_PROJECT_ID}" \
  --location "${GCP_REGION}" \
  --schedule "*/5 * * * *" \
  --uri "${WORKER_URL}/jobs/dispatch" \
  --http-method POST \
  --oidc-service-account-email "${SERVICE_ACCOUNT}" \
  --oidc-token-audience "${WORKER_URL}"

gcloud scheduler jobs create http synqra-outcome-audit \
  --project "${GCP_PROJECT_ID}" \
  --location "${GCP_REGION}" \
  --schedule "0 2 * * *" \
  --uri "${WORKER_URL}/jobs/audit" \
  --http-method POST \
  --oidc-service-account-email "${SERVICE_ACCOUNT}" \
  --oidc-token-audience "${WORKER_URL}"

gcloud scheduler jobs create http synqra-email-poll-and-classify \
  --project "${GCP_PROJECT_ID}" \
  --location "${GCP_REGION}" \
  --schedule "*/5 * * * *" \
  --uri "${WORKER_URL}/jobs/email-poll-and-classify" \
  --http-method POST \
  --oidc-service-account-email "${SERVICE_ACCOUNT}" \
  --oidc-token-audience "${WORKER_URL}"

gcloud scheduler jobs create http synqra-high-priority-drafts \
  --project "${GCP_PROJECT_ID}" \
  --location "${GCP_REGION}" \
  --schedule "*/5 * * * *" \
  --uri "${WORKER_URL}/jobs/high-priority-drafts" \
  --http-method POST \
  --oidc-service-account-email "${SERVICE_ACCOUNT}" \
  --oidc-token-audience "${WORKER_URL}"

gcloud scheduler jobs create http synqra-daily-normal-digest \
  --project "${GCP_PROJECT_ID}" \
  --location "${GCP_REGION}" \
  --schedule "0 20 * * *" \
  --time-zone "America/New_York" \
  --uri "${WORKER_URL}/jobs/daily-normal-digest" \
  --http-method POST \
  --oidc-service-account-email "${SERVICE_ACCOUNT}" \
  --oidc-token-audience "${WORKER_URL}"

echo "Scheduler jobs created."
