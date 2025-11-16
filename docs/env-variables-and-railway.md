# 🔐 ENVIRONMENT VARIABLES & RAILWAY GUIDE

**Purpose**: Ensure all required env vars are set correctly and safely

---

## 📋 REQUIRED VARIABLES (PRODUCTION)

### Core Services (All Apps)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Railway
RAILWAY_WEBHOOK_SECRET=[generate with: openssl rand -hex 32]
RAILWAY_API_TOKEN=[get from Railway dashboard]
RAILWAY_PROJECT_ID=[your railway project ID]
RAILWAY_ENVIRONMENT=production

# Node
NODE_ENV=production
PORT=3000  # or 3001, 3002 depending on service
```

---

## 🔧 OPTIONAL VARIABLES

### Health Check URLs (Internal)

```bash
SYNQRA_HEALTH_URL=http://synqra-mvp.railway.internal:3000/api/health
NOID_HEALTH_URL=http://noid-dashboard.railway.internal:3001/api/health
AURAFX_HEALTH_URL=http://aurafx.railway.internal:3002/api/health
```

### Notifications

```bash
# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=-100...

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### n8n Integration

```bash
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/...
N8N_API_KEY=your-n8n-api-key
```

### Feature Flags

```bash
ENABLE_AUTO_REPAIR=true
ENABLE_HEALTH_WEBHOOKS=true
ENABLE_MARKET_INTELLIGENCE=true
```

---

## 🚂 RAILWAY CONFIGURATION

### Project-Level Shared Variables

**Path**: Railway Dashboard → Project → Settings → Shared Variables

**Set these at project level** (applies to all services):

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
RAILWAY_WEBHOOK_SECRET
RAILWAY_PROJECT_ID
```

### Service-Level Variables

**Path**: Railway Dashboard → [Service] → Variables

**Set these per service**:

```bash
PORT=3000  # Synqra MVP
PORT=3001  # NØID Dashboard
PORT=3002  # NØID Digital Cards

RAILWAY_ENVIRONMENT=production  # or staging, pr
```

---

## ✅ VALIDATION

### At Startup

Add to your app's root layout or startup file:

```typescript
import { validateEnvOrThrow } from "@/config/env-schema";

// This will throw an error if any required env vars are missing
validateEnvOrThrow();
```

### Manual Check

```bash
# Check if all required vars are present
node -e "
  const { validateEnv } = require('./config/env-schema.ts');
  const result = validateEnv('production');
  console.log(result);
"
```

---

## 🔒 SECURITY BEST PRACTICES

### Never Commit Secrets

- ✅ Use `.env.example` for reference
- ✅ Keep `.env` in `.gitignore`
- ❌ Never commit `.env` files
- ❌ Never hardcode API keys in code

### Use Railway's Secret Management

- ✅ Store all secrets in Railway dashboard
- ✅ Use shared variables for common secrets
- ✅ Use service-specific variables for unique secrets
- ✅ Railway automatically encrypts all variables

### Rotate Secrets Regularly

- Webhook secrets: Every 6 months
- API keys: When suspicious activity detected
- Service role keys: Every year

---

## 🚨 TROUBLESHOOTING

### Missing Env Vars

**Symptom**: App crashes at startup with "Missing required env var" error

**Fix**:
1. Run `validateEnv()` to see which vars are missing
2. Add missing vars to Railway dashboard
3. Redeploy service

### Invalid Env Vars

**Symptom**: Validation warnings or errors

**Common Issues**:
- Supabase URL is not a valid URL
- API key contains placeholder text ("your-api-key")
- Port is not a number

**Fix**: Correct the value in Railway dashboard and redeploy

### Env Vars Not Loading

**Symptom**: `process.env.VAR_NAME` returns `undefined`

**Check**:
1. Var is set in Railway dashboard
2. Var name matches exactly (case-sensitive)
3. Service was redeployed after adding var
4. No typos in code when accessing var

---

## 📚 REFERENCE

### Environment Tiers

| Tier | Required Vars | Optional Vars | Purpose |
|------|---------------|---------------|---------|
| **Production** | All core + Railway webhook | All optional | Live app |
| **Staging** | All core (minus webhook) | Some optional | Testing |
| **Development** | Supabase URLs only | None | Local dev |
| **PR** | Supabase URLs only | None | PR previews |

### Railway's Env Var Features (From Changelog)

- ✅ **Safer diffs** for project shared variables
- ✅ **Raw editor** shows decrypted existing vars
- ✅ **No accidental blanks** overwriting secrets
- ✅ **Better UI** for managing large sets of vars

---

**Version**: 1.0  
**Last Updated**: 2025-11-15  
**Owner**: NØID Labs
