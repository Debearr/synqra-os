#!/usr/bin/env bash
set -euo pipefail

log_deploy() {
	local service="$1"
	local url="${2:-}"
	{
		echo "[$(date -u +%FT%TZ)] service=${service} url=${url}"
	} >> DEPLOY_LOG.md
}
