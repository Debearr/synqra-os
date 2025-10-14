#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Run all guardians; record failures but continue
GUARDIANS=(
  "guardian-dns.sh"
  "guardian-ssl.sh"
  "guardian-canonical.sh"
  "guardian-sitemap.sh"
  "guardian-robots.sh"
  "guardian-health.sh"
  "auto-homepage-guardian.yaml"
)

fail=0
for g in "${GUARDIANS[@]}"; do
  echo "==== Running $g ===="
  if bash "$g"; then
    echo "PASS: $g"
  else
    echo "FAIL: $g"
    fail=1
  fi
  echo

done

exit "$fail"
