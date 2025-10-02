#!/usr/bin/env bash

# Utilities for deploy agents

log_deploy() {
  local service_name="$1"
  local deploy_url="${2:-}"
  local timestamp
  timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  if [ ! -f DEPLOY_LOG.md ]; then
    {
      echo "# Deploy Log"
      echo ""
    } >> DEPLOY_LOG.md
  fi

  {
    echo "- ${timestamp} | ${service_name} | ${deploy_url}"
  } >> DEPLOY_LOG.md

  echo "Logged deploy: ${service_name} -> ${deploy_url}"
}

