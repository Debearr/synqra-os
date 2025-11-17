# 🏛️ NØID Labs – Deployment & Infrastructure Guardrails

**Version:** 1.0.0  
**Last Updated:** 2025-11-17  
**Status:** ✅ ACTIVE & ENFORCED

---

## 🎯 PURPOSE

This document defines the **global deployment and infrastructure standards** for all NØID Labs applications. These guardrails are **automatically enforced** by Cursor AI to ensure:

- ✅ Consistent deployment configurations across all apps
- ✅ Zero preventable deployment failures
- ✅ Correct domain mappings and DNS integrations
- ✅ Proper environment variable management
- ✅ Monorepo path correctness
- ✅ Node 20 and Nixpacks enforcement
- ✅ PORT binding correctness
- ✅ Branch protection and build consistency

---

## 📍 DOMAIN MAP

All NØID Labs applications are mapped to their respective domains:

| Application | Domain | DNS Provider | Deployment | Path |
|------------|--------|--------------|------------|------|
| **Synqra** | synqra.co | Porkbun | Railway | `apps/synqra-mvp` |
| **NØID** | noidlux.com | Namecheap | Railway/Vercel | `apps/noid` |
| **AuraFX** | aurafx.trade | Namecheap | Railway/Vercel | `apps/aurafx` |
| **LuxGrid** | getluxgrid.com | Namecheap | Static/Next.js | `apps/luxgrid` |
| **NY7 Coffee** | ny7coffee.com | Namecheap | TBD | `apps/ny7coffee` |

**Source of Truth:** `.cursor/domain-map.json`

### 🤖 Automatic Domain Awareness

When you edit code in an app folder, Cursor will:
- ✅ Automatically remind you of the correct domain
- ⚠️ Warn if environment variables don't match
- ⚠️ Warn if deployment configs are mismatched

---

## 🔒 DEPLOYMENT RULES (ALWAYS ENFORCED)

### 1️⃣ Deployment Config Standardization

**RULE:** Use **Nixpacks ONLY** – no Docker, no legacy configs.

**Auto-Actions:**
```bash
# Cursor will automatically:
DELETE railway.json (if exists)
DELETE Dockerfile (if exists)
DELETE .dockerignore (if exists)
ENSURE nixpacks.toml exists
```

**Rationale:** Nixpacks provides better detection, faster builds, and native Node.js support.

---

### 2️⃣ Node 20 Enforcement

**RULE:** All apps MUST use Node.js 20.x

**Auto-Fix:**
```toml
# Cursor replaces ANY Node 18 references with:
[phases.setup]
nixPkgs = ['nodejs_20']
```

**Check Locations:**
- `nixpacks.toml`
- `package.json` engines
- `.nvmrc`
- `railway.toml`

---

### 3️⃣ PORT Binding Enforcement

**RULE:** `package.json` must always use correct PORT binding.

**Required Start Script:**
```json
{
  "scripts": {
    "start": "next start -p ${PORT:-3000} --hostname 0.0.0.0"
  }
}
```

**Rationale:**
- Railway injects `$PORT` dynamically
- `0.0.0.0` hostname is required for container networking
- Fallback to `3000` for local development

**Auto-Fix:** Cursor will correct this automatically if missing or incorrect.

---

### 4️⃣ Monorepo Context Warning

**RULE:** Always confirm you're in the correct directory before builds.

**Triggered On:**
```bash
npm run build
npm run dev
pnpm build
pnpm dev
next build
next dev
```

**Warning Message:**
```
⚠️  Are you in the correct app directory?
📂 Expected: apps/[app-name]
```

---

### 5️⃣ Main Branch Protection

**RULE:** Never commit directly to `main` without explicit confirmation.

**Behavior:**
- Cursor will **block** direct commits to `main`
- Requires user confirmation before proceeding
- Encourages feature branch workflow

---

### 6️⃣ Domain Awareness Rule

**RULE:** Auto-suggest domain when editing mapped app folders.

**Triggers:**
- Editing files in `apps/synqra-mvp`, `apps/noid`, etc.
- Modifying environment variables
- Changing deployment configs

**Actions:**
```
✅ Suggest correct domain for current app
⚠️ Warn on environment variable mismatch
⚠️ Warn on deployment config mismatch
```

---

## 🚂 RAILWAY DEPLOYMENT CHECKLIST

For **every** Railway service deployment:

### Required Environment Variables

```bash
RAILWAY_DOMAIN=<domain from domain-map.json>
APP_DOMAIN=<domain>
NEXT_PUBLIC_APP_DOMAIN=<domain>
SUPABASE_URL=<existing user secret>
SUPABASE_SERVICE_ROLE=<existing user secret>
SUPABASE_ANON_KEY=<existing user secret>
```

### Pre-Deployment Verification

Cursor verifies **before** every deploy:

1. ✅ Builder is set to **Nixpacks**
2. ✅ Node 20 is detected
3. ✅ PORT binding is correct
4. ✅ No Docker fallback
5. ✅ Monorepo root directory is correct
6. ✅ Domain matches `domain-map.json`

**If ANY check fails:**
```
🛑 DEPLOYMENT ABORTED
📋 Suggested fix: [specific action]
```

---

## 🗄️ SUPABASE GUARDRAILS

For **every** app using Supabase:

### Required `.env` Variables

```bash
NEXT_PUBLIC_APP_DOMAIN=<domain>
SUPABASE_URL=<project-url>
SUPABASE_ANON_KEY=<anon-key>
SERVICE_ROLE=<service-role-key>
```

### Automatic Warnings

Cursor warns if:
- ⚠️ Domain mismatch between `.env` and `domain-map.json`
- ⚠️ App origin is incorrect in Supabase dashboard
- ⚠️ OAuth redirect URIs don't match domain

---

## 📁 REQUIRED FILES

Cursor **automatically ensures** these files exist and are up-to-date:

| File | Purpose | Auto-Action |
|------|---------|-------------|
| `.cursor/domain-map.json` | Domain mappings | Create if missing |
| `.cursor/rules.json` | Guardrail rules | Update if outdated |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR standards | Create if missing |
| `templates/nixpacks.toml` | Deployment template | Create if missing |
| `DEPLOYMENT_GUARDRAILS.md` | This document | Update if outdated |
| `cursor-agent-instructions.md` | AI instructions | Create if missing |

**File Management Rules:**
- **If missing:** Create automatically
- **If outdated:** Update automatically
- **If conflicting:** Ask approval before overwriting

---

## 🛠️ AUTO-FIX HEURISTICS

Cursor **proactively fixes** common issues:

| Issue Detected | Auto-Fix Action |
|----------------|-----------------|
| Node 18 detected | Replace with Node 20 |
| Wrong app directory | Warn user |
| Wrong domain | Warn + auto-correct |
| Missing PORT binding | Fix in `package.json` |
| Missing `nixpacks.toml` | Create from template |
| Dockerfile present | Delete Dockerfile |
| Wrong Railway root directory | Fix root directory |
| Legacy configs present | Remove legacy files |

**Goal:** Ensure deployments **NEVER** fail due to preventable configuration errors.

---

## 📊 END-OF-TASK REPORTING

At the end of **every** task, Cursor provides:

```markdown
✓ What you changed
✓ Why it was necessary
✓ What Cursor guardrails applied
✓ What the user should check (if anything)
```

**Example Output:**
```
✅ CHANGES MADE:
- Updated nixpacks.toml to use Node 20
- Fixed PORT binding in package.json
- Removed legacy Dockerfile

✅ WHY NECESSARY:
- Railway requires Node 20 for latest Next.js builds
- PORT binding ensures proper container networking
- Nixpacks is now the standard builder

✅ GUARDRAILS APPLIED:
- Node 20 Enforcement
- PORT Binding Enforcement
- Deployment Config Standardization

✅ USER ACTION REQUIRED:
- Verify Railway environment variables match domain-map.json
```

---

## 🎯 BEHAVIOR & TONE

Cursor AI follows these principles:

- ✅ **Decisive** – Takes action, doesn't wait for permission
- ✅ **Complete** – Never leaves steps incomplete
- ✅ **Quality** – Never pushes broken configs
- ✅ **Proactive** – Fixes issues before they become problems
- ✅ **Communicative** – Warns early and clearly
- ✅ **Preventive** – Stops all preventable errors
- ✅ **Consistent** – Maintains standards across all NØID Labs apps

---

## 🚀 ACTIVATION STATUS

```
🧩 Cursor Infrastructure Guardrails: ✅ ACTIVE
📍 Domain Map: ✅ INSTALLED
🔒 Rules Engine: ✅ ENFORCED
🛠️ Auto-Fix: ✅ ENABLED
📊 Reporting: ✅ ACTIVE
```

**Last Verified:** 2025-11-17

---

## 📞 SUPPORT

If you encounter issues with these guardrails:

1. Check `.cursor/rules.json` for current configuration
2. Verify `.cursor/domain-map.json` is up-to-date
3. Review this document for expected behavior
4. Contact NØID Labs infrastructure team

**Remember:** These guardrails exist to **protect** you and ensure **zero preventable deployment failures**.

---

**🏛️ NØID Labs – Built to Last**
