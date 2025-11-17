# 🔄 Pull Request – NØID Labs

## 📋 PR Checklist

Before submitting, ensure:

- [ ] **Domain verified** – Matches `.cursor/domain-map.json`
- [ ] **Node 20** – No Node 18 references
- [ ] **Nixpacks only** – No Dockerfile or railway.json
- [ ] **PORT binding** – Correct in `package.json`
- [ ] **Environment variables** – Match domain requirements
- [ ] **Linting passed** – No ESLint/TypeScript errors
- [ ] **Local build successful** – `npm run build` passes
- [ ] **Monorepo path correct** – In correct `apps/` directory
- [ ] **Documentation updated** – If adding new features
- [ ] **Tests pass** – If applicable

---

## 🎯 What does this PR do?

<!-- Describe the purpose of this PR in 1-2 sentences -->

---

## 🏗️ App(s) Affected

<!-- Check all that apply -->

- [ ] **Synqra** (`apps/synqra-mvp`) → synqra.co
- [ ] **NØID** (`apps/noid`) → noidlux.com
- [ ] **AuraFX** (`apps/aurafx`) → aurafx.trade
- [ ] **LuxGrid** (`apps/luxgrid`) → getluxgrid.com
- [ ] **NY7 Coffee** (`apps/ny7coffee`) → ny7coffee.com
- [ ] **Infrastructure** (monorepo root)
- [ ] **Documentation**

---

## 🔧 Changes Made

<!-- List the key changes in this PR -->

- 
- 
- 

---

## 🛡️ Guardrails Verified

<!-- Confirm which deployment guardrails were checked -->

- [ ] **Deployment config** – Uses nixpacks.toml
- [ ] **Node version** – Set to Node 20
- [ ] **PORT binding** – Includes `${PORT:-3000}` and `0.0.0.0`
- [ ] **Domain mapping** – Correct for affected app(s)
- [ ] **Environment variables** – All required vars present
- [ ] **Railway settings** – Builder set to Nixpacks
- [ ] **Supabase config** – OAuth/domains match

---

## 🧪 Testing

<!-- How did you test these changes? -->

### Local Testing
- [ ] Ran `npm run dev` successfully
- [ ] Ran `npm run build` successfully
- [ ] Tested in browser at `localhost:3000`

### Deployment Testing
- [ ] Verified Railway preview build passes
- [ ] Checked Railway logs for errors
- [ ] Tested production domain (if applicable)

### Test Results
<!-- Paste relevant test output or screenshots -->

```
[Paste test output here]
```

---

## 📸 Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

---

## 🚀 Deployment Notes

<!-- Any special deployment considerations? -->

### Environment Variables Required
<!-- List any new env vars that need to be set in Railway -->

```bash
# Example:
# NEW_FEATURE_FLAG=true
# API_ENDPOINT=https://api.example.com
```

### Post-Deployment Steps
<!-- Any manual steps needed after merge? -->

1. 
2. 
3. 

---

## 🔗 Related Issues/PRs

<!-- Link related issues or PRs -->

- Closes #
- Related to #
- Depends on #

---

## 📝 Additional Context

<!-- Any other context reviewers should know? -->

---

## ✅ Reviewer Checklist

**For reviewers:**

- [ ] Code follows NØID Labs standards
- [ ] All guardrails verified
- [ ] No hardcoded secrets or sensitive data
- [ ] Changes are backward compatible
- [ ] Documentation is clear and complete
- [ ] Tests cover new functionality
- [ ] Ready to merge and deploy

---

## 🏛️ NØID Labs – Deployment Excellence

**Guardrails Version:** 1.0.0  
**Last Updated:** 2025-11-17
