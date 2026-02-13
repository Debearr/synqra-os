#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GCP_PROJECT_ID:-}" || -z "${GCP_REGION:-}" ]]; then
  echo "GCP_PROJECT_ID and GCP_REGION are required"
  exit 1
fi

CLOUD_RUN_SERVICE_NAME="${CLOUD_RUN_SERVICE_NAME:-synqra-automation-worker}"
NOTIFICATION_CHANNEL="${GCP_NOTIFICATION_CHANNEL:-}"

create_or_update_log_metric() {
  local metric_name="$1"
  local metric_filter="$2"
  local description="$3"

  if gcloud logging metrics describe "${metric_name}" --project "${GCP_PROJECT_ID}" >/dev/null 2>&1; then
    gcloud logging metrics update "${metric_name}" \
      --project "${GCP_PROJECT_ID}" \
      --description "${description}" \
      --log-filter "${metric_filter}"
  else
    gcloud logging metrics create "${metric_name}" \
      --project "${GCP_PROJECT_ID}" \
      --description "${description}" \
      --log-filter "${metric_filter}"
  fi
}

create_or_replace_alert_policy() {
  local display_name="$1"
  local policy_file="$2"
  local existing
  existing="$(
    gcloud monitoring policies list \
      --project "${GCP_PROJECT_ID}" \
      --filter "displayName=\"${display_name}\"" \
      --format "value(name)"
  )"

  if [[ -n "${existing}" ]]; then
    gcloud monitoring policies delete "${existing}" --project "${GCP_PROJECT_ID}" --quiet
  fi

  gcloud monitoring policies create \
    --project "${GCP_PROJECT_ID}" \
    --policy-from-file "${policy_file}"
}

tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}"' EXIT

create_or_update_log_metric \
  "synqra_scheduler_backlog_exceeded" \
  "resource.type=\"cloud_run_revision\" AND jsonPayload.message=\"scheduler.queue.backlog_exceeded\"" \
  "Counts scheduler backlog threshold breaches emitted by Cloud Run worker."

create_or_update_log_metric \
  "synqra_agent_hop_exceeded" \
  "resource.type=\"cloud_run_revision\" AND jsonPayload.message=\"council.agent_hop_exceeded\"" \
  "Counts council requests where agent hop count exceeded policy limit."

restart_policy="${tmp_dir}/worker-restarts.json"
cat >"${restart_policy}" <<EOF
{
  "displayName": "Synqra Worker Restarts > 3 (10m)",
  "combiner": "OR",
  "conditions": [
    {
      "displayName": "Cloud Run worker restart count",
      "conditionThreshold": {
        "filter": "resource.type=\\"cloud_run_revision\\" AND resource.labels.service_name=\\"${CLOUD_RUN_SERVICE_NAME}\\" AND metric.type=\\"run.googleapis.com/container/restart_count\\"",
        "comparison": "COMPARISON_GT",
        "thresholdValue": 3,
        "duration": "0s",
        "aggregations": [
          {
            "alignmentPeriod": "600s",
            "perSeriesAligner": "ALIGN_MAX"
          }
        ],
        "trigger": {
          "count": 1
        }
      }
    }
  ],
  "notificationChannels": [
    ${NOTIFICATION_CHANNEL:+"\"${NOTIFICATION_CHANNEL}\""}
  ],
  "enabled": true
}
EOF

latency_policy="${tmp_dir}/worker-p95-latency.json"
cat >"${latency_policy}" <<EOF
{
  "displayName": "Synqra Worker p95 Latency > 10s",
  "combiner": "OR",
  "conditions": [
    {
      "displayName": "Cloud Run request p95 latency",
      "conditionThreshold": {
        "filter": "resource.type=\\"cloud_run_revision\\" AND resource.labels.service_name=\\"${CLOUD_RUN_SERVICE_NAME}\\" AND metric.type=\\"run.googleapis.com/request_latencies\\"",
        "comparison": "COMPARISON_GT",
        "thresholdValue": 10000,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "300s",
            "perSeriesAligner": "ALIGN_PERCENTILE_95"
          }
        ],
        "trigger": {
          "count": 1
        }
      }
    }
  ],
  "notificationChannels": [
    ${NOTIFICATION_CHANNEL:+"\"${NOTIFICATION_CHANNEL}\""}
  ],
  "enabled": true
}
EOF

backlog_policy="${tmp_dir}/scheduler-backlog.json"
cat >"${backlog_policy}" <<EOF
{
  "displayName": "Synqra Scheduler Backlog Threshold Breach",
  "combiner": "OR",
  "conditions": [
    {
      "displayName": "Scheduler backlog exceeded events",
      "conditionThreshold": {
        "filter": "metric.type=\\"logging.googleapis.com/user/synqra_scheduler_backlog_exceeded\\"",
        "comparison": "COMPARISON_GT",
        "thresholdValue": 0,
        "duration": "0s",
        "aggregations": [
          {
            "alignmentPeriod": "300s",
            "perSeriesAligner": "ALIGN_RATE"
          }
        ],
        "trigger": {
          "count": 1
        }
      }
    }
  ],
  "notificationChannels": [
    ${NOTIFICATION_CHANNEL:+"\"${NOTIFICATION_CHANNEL}\""}
  ],
  "enabled": true
}
EOF

hop_policy="${tmp_dir}/agent-hop.json"
cat >"${hop_policy}" <<EOF
{
  "displayName": "Synqra Agent Hop Count > 3",
  "combiner": "OR",
  "conditions": [
    {
      "displayName": "Council hop policy breaches",
      "conditionThreshold": {
        "filter": "metric.type=\\"logging.googleapis.com/user/synqra_agent_hop_exceeded\\"",
        "comparison": "COMPARISON_GT",
        "thresholdValue": 0,
        "duration": "0s",
        "aggregations": [
          {
            "alignmentPeriod": "300s",
            "perSeriesAligner": "ALIGN_RATE"
          }
        ],
        "trigger": {
          "count": 1
        }
      }
    }
  ],
  "notificationChannels": [
    ${NOTIFICATION_CHANNEL:+"\"${NOTIFICATION_CHANNEL}\""}
  ],
  "enabled": true
}
EOF

if [[ -z "${NOTIFICATION_CHANNEL}" ]]; then
  # Remove empty notificationChannels arrays when channel isn't provided.
  sed -i.bak '/"notificationChannels": \[/,/\],/d' "${restart_policy}" "${latency_policy}" "${backlog_policy}" "${hop_policy}"
  rm -f "${restart_policy}.bak" "${latency_policy}.bak" "${backlog_policy}.bak" "${hop_policy}.bak"
fi

create_or_replace_alert_policy "Synqra Worker Restarts > 3 (10m)" "${restart_policy}"
create_or_replace_alert_policy "Synqra Worker p95 Latency > 10s" "${latency_policy}"
create_or_replace_alert_policy "Synqra Scheduler Backlog Threshold Breach" "${backlog_policy}"
create_or_replace_alert_policy "Synqra Agent Hop Count > 3" "${hop_policy}"

echo "Monitoring metrics and alert policies are configured."
