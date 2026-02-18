# Synqra AI Routing - 4 Block Deployment Runbook

> Note: retained for backward compatibility. Use `docs/AI_ROUTING_DEPLOYMENT_4_BLOCK_RUNBOOK.md` as canonical.

This runbook follows strict execution order:

1. Block 1 (C): capacity and Ollama verification
2. Block 2 (B): routing and runway protection validation
3. Block 3 (A): production deployment
4. Block 4: monitoring and rollback discipline

Order is mandatory: `C -> B -> A -> Monitor`.

## Block 1 - Capacity + Ollama Verification (C)

### Command

```bash
chmod +x scripts/block1_capacity_readiness.sh
bash scripts/block1_capacity_readiness.sh
```

### Expected pass criteria

- Models pull successfully (`llama3.1:8b`, `qwen2.5:14b`)
- Inference returns output for both models
- Memory remains stable without hard swap thrash
- `systemctl status ollama` is active

### Fail conditions

- Hardware below minimum (RAM/CPU constraints)
- Ollama unavailable or inactive
- Model pull/inference failures
- Hard swap thrashing during inference

If Block 1 fails: stop and upgrade VPS before continuing.

## Block 2 - Routing + Cost Discipline Validation (B)

### Command

```bash
BASE_URL=http://localhost:3004 \
INTERNAL_ROUTING_TOKEN="$INTERNAL_ROUTING_TOKEN" \
FORCE_GROQ_FAILURE=1 \
SERVICE_NAME=synqra-mvp \
APP_ENV_FILE=/etc/synqra/synqra-mvp.env \
bash scripts/block2_routing_stress.sh
```

### Expected pass criteria

- Fast default: `200`, `x-council-provider=groq`, `x-council-model-tier=fast`
- Premium route: `200`, `x-council-model-tier=premium`
- Internal without token: `403`
- Forced Groq failure: fallback provider becomes OpenRouter
- `x-council-fallback-count` increments during forced failure
- `x-council-token-cap` is present on successful routed responses

### Fail conditions

- Route, tier, or provider mismatch
- Internal gate bypasses or blocks incorrectly
- Fallback path fails under forced provider failure
- Missing cap/fallback headers

If Block 2 fails: do not go live.

## Block 3 - Production Deployment (A)

### Command

```bash
sudo DOMAIN=<your-domain> \
LETSENCRYPT_EMAIL=<ops-email> \
SERVICE_NAME=synqra-mvp \
APP_PORT=3004 \
APP_ENV_FILE=/etc/synqra/synqra-mvp.env \
DNS_EXPECTED_IP=<vps-ip> \
INTERNAL_ROUTING_TOKEN="$INTERNAL_ROUTING_TOKEN" \
bash scripts/block3_production_deploy.sh
```

### Expected pass criteria

- `systemctl status synqra-mvp` active
- `systemctl status ollama` active
- HTTPS endpoint live
- Public smoke tests pass:
  - fast route
  - premium route
  - internal without token (`403`)
  - internal with token (`200`)
  - forced fallback route (Groq failure -> OpenRouter)

### Fail conditions

- Nginx/certbot failure
- Missing required env keys
- Service not healthy
- Any smoke test mismatch

If Block 3 fails: run rollback immediately.

## Block 4 - Monitoring + Rollback Discipline

### Command

```bash
SERVICE_NAME=synqra-mvp \
APP_DIR=/opt/synqra/apps/synqra-mvp \
LAST_KNOWN_GOOD_SHA=<commit_sha> \
bash scripts/block4_monitoring_rollback.sh
```

### What to monitor continuously

- Frequent non-zero `fallbackCount`
- `premiumRequested=true` spikes
- Token cap anomalies

### Quick rollback (manual)

```bash
git checkout <LAST_KNOWN_GOOD_SHA>
pnpm install --frozen-lockfile
pnpm --filter synqra-mvp build
sudo systemctl restart synqra-mvp
```

### Scripted rollback helper

Block 4 generates an executable rollback helper under `/var/log/synqra/`.
