#!/usr/bin/env bash
set -euo pipefail

# Import shared safeguard
source "$(dirname "$0")/safeguard.sh"
safeguard_check

# Usage:
#   ./deploy_any_repo.sh <repo_name>

