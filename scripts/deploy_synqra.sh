#!/usr/bin/env bash
set -euo pipefail

# Import safeguard
source "$(dirname "$0")/safeguard.sh"
safeguard_check

echo "[deploy] Starting Synqra deployment..."

# existing deploy logic continues here

