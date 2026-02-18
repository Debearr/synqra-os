# Synqra Verification Scripts

## Overview

This directory contains testing and verification scripts for Synqra deployment and runtime checks.

Primary runbook: `docs/AI_ROUTING_DEPLOYMENT_4_BLOCK_RUNBOOK.md`

## Scripts

### block1_capacity_readiness.sh

Capacity and Ollama readiness check for Linux VPS.

**Usage:**

```bash
bash scripts/block1_capacity_readiness.sh
```

**What it tests:**

- RAM/CPU/filesystem snapshot (`free -h`, `lscpu`, `df -h`)
- Ollama service/API readiness
- Required model pull (`llama3.1:8b`, `qwen2.5:14b`)
- Inference on both models
- Memory headroom + swap-thrash detection
- Final `PASS/FAIL` decision

### block2_routing_stress.sh

Stress test for `/api/council` routing policy and fallback behavior.

**Usage:**

```bash
BASE_URL=http://localhost:3004 \
INTERNAL_ROUTING_TOKEN="$INTERNAL_ROUTING_TOKEN" \
bash scripts/block2_routing_stress.sh
```

**Optional forced Groq failure simulation:**

```bash
BASE_URL=http://localhost:3004 \
INTERNAL_ROUTING_TOKEN="$INTERNAL_ROUTING_TOKEN" \
FORCE_GROQ_FAILURE=1 \
SERVICE_NAME=synqra-mvp \
APP_ENV_FILE=/etc/synqra/synqra-mvp.env \
bash scripts/block2_routing_stress.sh
```

**What it tests:**

- Groq default route
- Premium route (`premiumIntent=true`)
- Internal route token guard
- Optional forced fallback from Groq to OpenRouter
- Token-cap and fallback headers
- Routing logs

### block3_production_deploy.sh

Production deployment script for domain, Nginx, HTTPS, systemd, smoke tests, and rollback.

**Usage:**

```bash
sudo DOMAIN=your-domain.com \
LETSENCRYPT_EMAIL=ops@your-domain.com \
SERVICE_NAME=synqra-mvp \
APP_PORT=3004 \
APP_ENV_FILE=/etc/synqra/synqra-mvp.env \
DNS_EXPECTED_IP=YOUR_VPS_IP \
INTERNAL_ROUTING_TOKEN="$INTERNAL_ROUTING_TOKEN" \
bash scripts/block3_production_deploy.sh
```

**What it does:**

- Optional app build (`npm run build`)
- Configures Nginx reverse proxy
- Provisions SSL via certbot
- Restarts/verifies systemd service
- Runs public smoke tests (fast, premium, internal gate, internal token, forced fallback)
- Writes rollback script under `/var/backups/...`

### block4_monitoring_rollback.sh

Post-go-live monitoring and rollback readiness checks.

**Usage:**

```bash
SERVICE_NAME=synqra-mvp \
APP_DIR=/opt/synqra/apps/synqra-mvp \
LAST_KNOWN_GOOD_SHA=<commit_sha> \
bash scripts/block4_monitoring_rollback.sh
```

**What it does:**

- Captures recent `journalctl` logs
- Reports fallback and premium usage counts
- Checks token-cap visibility in logs
- Creates rollback helper script with:
  - `git checkout <sha>`
  - `pnpm install --frozen-lockfile`
  - `pnpm --filter synqra-mvp build`
  - `systemctl restart synqra-mvp`

### run_4block_console.sh

Single runner for strict deployment order on VPS console:
`Block1(C) -> Block2(B) -> Block3(A) -> Block4(Monitor)`.

**Usage (run as root on VPS):**

```bash
APP_DIR=/opt/synqra/apps/synqra-mvp \
BASE_URL=http://localhost:3004 \
SERVICE_NAME=synqra-mvp \
APP_ENV_FILE=/etc/synqra/synqra-mvp.env \
DOMAIN=your-domain.com \
LETSENCRYPT_EMAIL=ops@your-domain.com \
DNS_EXPECTED_IP=YOUR_VPS_IP \
INTERNAL_ROUTING_TOKEN="$INTERNAL_ROUTING_TOKEN" \
LAST_KNOWN_GOOD_SHA=<sha> \
bash scripts/run_4block_console.sh
```

**Output:**

- Block logs: `/var/log/synqra/deploy_runs/<timestamp>/block*.log`
- Summary: `/var/log/synqra/deploy_runs/<timestamp>/summary.txt`

### verify-deployment.sh

Comprehensive deployment verification suite that tests all endpoints.

**Usage:**

```bash
# Test local deployment
./scripts/verify-deployment.sh

# Test production deployment
./scripts/verify-deployment.sh https://your-app.railway.app

# With custom admin token
ADMIN_TOKEN=your-token ./scripts/verify-deployment.sh
```

**What it tests:**

- ✅ Health and ready endpoints
- ✅ System status endpoint
- ✅ Content generation
- ✅ Publishing API (dry run)
- ✅ OAuth endpoints
- ✅ Admin dashboard
- ✅ Upload endpoint
- ✅ Approval workflow

### test-api.sh

Quick API testing script for development.

**Usage:**

```bash
# Test local API
./scripts/test-api.sh

# Test production API
./scripts/test-api.sh https://your-app.railway.app
```

**What it tests:**

- Content generation
- System status
- Publishing workflow
- Health check

## Requirements

- `curl` - HTTP client
- `jq` - JSON processor (optional but recommended)

Install jq:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

## Exit Codes

- `0` - All tests passed
- `1` - Some tests failed

## Integration with CI/CD

These scripts can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Verify Deployment
  run: |
    chmod +x scripts/verify-deployment.sh
    ADMIN_TOKEN=${{ secrets.ADMIN_TOKEN }} \
      ./scripts/verify-deployment.sh ${{ env.RAILWAY_URL }}
```

## Manual Testing

For interactive testing, use the test-api.sh script during development:

```bash
# Start dev server
npm run dev:3004

# In another terminal
./scripts/test-api.sh
```

## Troubleshooting

### Permission Denied

```bash
chmod +x scripts/*.sh
```

### jq not found

The scripts will still work but won't pretty-print JSON. Install jq for better output.

### Connection Refused

Ensure the server is running:
```bash
npm run dev:3004
```

### Test Failures

Check the output for specific error messages. Common issues:

- Missing environment variables
- Database not configured
- OAuth credentials not set (expected for some tests)
