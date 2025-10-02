#!/usr/bin/env bash
set -euo pipefail

# Import safeguard
source "$(dirname "$0")/safeguard.sh"
safeguard_check

# Usage:
#   ./deploy_any_repo.sh <repo_name>

