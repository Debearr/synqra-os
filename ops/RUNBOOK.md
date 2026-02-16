# Synqra Ops Runbook

## Daily Deploy
- Run: `cd /opt/synqra/synqra-os && ./ops/deploy.sh`
- Behavior: stop-on-first-failure, PASS/FAIL summary, Telegram notify

## Service Controls
- Status: `sudo systemctl status synqra-mvp --no-pager -l`
- Logs: `journalctl -u synqra-mvp -n 200 --no-pager`
- Restart: `sudo systemctl restart synqra-mvp`

## Monitoring
- Timer status: `sudo systemctl status synqra-healthcheck.timer --no-pager -l`
- Health logs: `journalctl -u synqra-healthcheck.service -n 50 --no-pager`
- Manual health run: `sudo DEPLOY_ENV_FILE=/opt/synqra/ops/synqra.deploy.env bash /opt/synqra/synqra-os/ops/healthcheck.sh`

## Install / Reconcile
- From repo root on VPS: `cd /opt/synqra/synqra-os && ./ops/install-vps.sh`

## Telegram Setup (No nano)
- Token: `sudo sed -i "s/^TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=PUT_TOKEN_HERE/" /opt/synqra/ops/synqra.deploy.env`
- Chat ID: `sudo sed -i "s/^TELEGRAM_CHAT_ID=.*/TELEGRAM_CHAT_ID=PUT_CHAT_ID_HERE/" /opt/synqra/ops/synqra.deploy.env`
- Secure file: `sudo chmod 600 /opt/synqra/ops/synqra.deploy.env`
