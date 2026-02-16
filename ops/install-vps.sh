#!/usr/bin/env bash
set -euo pipefail

PASS=()
FAIL=()

ok() { PASS+=("$1"); echo "PASS: $1"; }
bad() { FAIL+=("$1"); echo "FAIL: $1"; }

summary() {
  echo
  echo "========== INSTALL SUMMARY =========="
  for i in "${PASS[@]:-}"; do echo "✅ $i"; done
  for i in "${FAIL[@]:-}"; do echo "❌ $i"; done
  echo "====================================="
  echo
}

on_err() {
  local code=$?
  bad "Install aborted (exit $code)"
  summary
  exit "$code"
}
trap on_err ERR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

[[ "$EUID" -ne 0 ]] || { echo "Run as a non-root sudo-capable user."; exit 1; }
command -v sudo >/dev/null
command -v systemctl >/dev/null
ok "sudo + systemctl available"

sudo mkdir -p /opt/synqra/ops
sudo mkdir -p /opt/synqra/synqra-os/ops
sudo chown -R "$USER":"$USER" /opt/synqra/synqra-os/ops
ok "Ops directories ensured"

if [[ ! -f /opt/synqra/ops/synqra.deploy.env ]]; then
  sudo tee /opt/synqra/ops/synqra.deploy.env >/dev/null <"$SCRIPT_DIR/synqra.deploy.env.example"
  sudo chmod 600 /opt/synqra/ops/synqra.deploy.env
  ok "Created /opt/synqra/ops/synqra.deploy.env"
else
  ok "Existing /opt/synqra/ops/synqra.deploy.env kept"
fi

cp "$SCRIPT_DIR/telegram.sh" /opt/synqra/synqra-os/ops/telegram.sh
cp "$SCRIPT_DIR/healthcheck.sh" /opt/synqra/synqra-os/ops/healthcheck.sh
cp "$SCRIPT_DIR/deploy.sh" /opt/synqra/synqra-os/ops/deploy.sh
chmod +x /opt/synqra/synqra-os/ops/telegram.sh /opt/synqra/synqra-os/ops/healthcheck.sh /opt/synqra/synqra-os/ops/deploy.sh
ok "Ops scripts installed"

sudo cp "$SCRIPT_DIR/systemd/synqra-mvp.service" /etc/systemd/system/synqra-mvp.service
sudo cp "$SCRIPT_DIR/systemd/synqra-healthcheck.service" /etc/systemd/system/synqra-healthcheck.service
sudo cp "$SCRIPT_DIR/systemd/synqra-healthcheck.timer" /etc/systemd/system/synqra-healthcheck.timer
ok "systemd units installed"

sudo systemctl daemon-reload
sudo systemctl enable --now synqra-mvp
sudo systemctl enable --now synqra-healthcheck.timer
ok "Services enabled and started"

summary
echo "Next:"
echo "1) Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in /opt/synqra/ops/synqra.deploy.env"
echo "2) Run: cd /opt/synqra/synqra-os && ./ops/deploy.sh"
