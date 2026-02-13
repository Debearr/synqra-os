#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GCP_PROJECT_ID:-}" || -z "${GCP_REGION:-}" || -z "${WORKER_URL:-}" ]]; then
  echo "GCP_PROJECT_ID, GCP_REGION, and WORKER_URL are required"
  exit 1
fi

SERVICE_ACCOUNT="automation-worker@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

RETRY_ARGS=(
  --max-retry-attempts 5
  --min-backoff 30s
  --max-backoff 600s
  --max-doublings 5
  --attempt-deadline 180s
)

upsert_job() {
  local name="$1"
  local schedule="$2"
  local uri="$3"
  local timezone="${4:-}"

  local base_args=(
    --project "${GCP_PROJECT_ID}"
    --location "${GCP_REGION}"
    --schedule "${schedule}"
    --uri "${uri}"
    --http-method POST
    --oidc-service-account-email "${SERVICE_ACCOUNT}"
    --oidc-token-audience "${WORKER_URL}"
  )

  if [[ -n "${timezone}" ]]; then
    base_args+=(--time-zone "${timezone}")
  fi

  if gcloud scheduler jobs describe "${name}" --project "${GCP_PROJECT_ID}" --location "${GCP_REGION}" >/dev/null 2>&1; then
    gcloud scheduler jobs update http "${name}" "${base_args[@]}" "${RETRY_ARGS[@]}"
  else
    gcloud scheduler jobs create http "${name}" "${base_args[@]}" "${RETRY_ARGS[@]}"
  fi
}

delete_job_if_exists() {
  local name="$1"
  if gcloud scheduler jobs describe "${name}" --project "${GCP_PROJECT_ID}" --location "${GCP_REGION}" >/dev/null 2>&1; then
    gcloud scheduler jobs delete "${name}" --project "${GCP_PROJECT_ID}" --location "${GCP_REGION}" --quiet
  fi
}

# Canonical names to prevent duplicate cron triggers for the same endpoint.
upsert_job "synqra-dispatch" "*/5 * * * *" "${WORKER_URL}/jobs/dispatch"
upsert_job "synqra-retry" "*/5 * * * *" "${WORKER_URL}/jobs/retry"
upsert_job "synqra-schedule" "*/5 * * * *" "${WORKER_URL}/jobs/schedule"
upsert_job "synqra-outcome-audit" "0 2 * * *" "${WORKER_URL}/jobs/audit"
upsert_job "synqra-email-poll-and-classify" "*/5 * * * *" "${WORKER_URL}/jobs/email-poll-and-classify"
upsert_job "synqra-high-priority-drafts" "*/5 * * * *" "${WORKER_URL}/jobs/high-priority-drafts"
upsert_job "synqra-daily-normal-digest" "0 20 * * *" "${WORKER_URL}/jobs/daily-normal-digest" "America/New_York"

# Cleanup legacy aliases that can cause duplicate runs.
delete_job_if_exists "synqra-cron-dispatch"
delete_job_if_exists "synqra-cron-retry"
delete_job_if_exists "synqra-cron-schedule"

echo "Scheduler jobs upserted."
