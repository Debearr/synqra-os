# 🔒 Security Patches Directory

This directory contains all scripts and configurations for securing the Synqra repository.

## 📁 Files

| File | Purpose | Usage |
|------|---------|-------|
| `.env.template` | Safe environment variable template | Copy to `.env.local` and fill with real values |
| `ENVIRONMENT_SETUP.md.patch` | Sanitized environment setup guide | Reference for deployment |
| `SAFE-MODE-ENV-VARS.txt.patch` | Sanitized Railway safe mode vars | Reference for Railway setup |
| `github-secrets-setup.sh` | GitHub Secrets configuration script | Run: `./github-secrets-setup.sh` |
| `railway-secrets-setup.sh` | Railway environment variables script | Run: `./railway-secrets-setup.sh` |
| `clean-git-history.sh` | Git history cleaning script | ⚠️ DANGER: Run: `./clean-git-history.sh` |
| `sanitize-docs.sh` | Documentation sanitization script | Run: `./sanitize-docs.sh` |

## 🚀 Quick Start

Follow this order:

1. **Read** `../SECURITY_APPLY.md` for complete instructions
2. **Run** `./sanitize-docs.sh` to clean documentation
3. **Run** `./github-secrets-setup.sh` to configure GitHub
4. **Run** `./railway-secrets-setup.sh` to configure Railway
5. **Optional** `./clean-git-history.sh` to remove secrets from history

## ⚠️ Security Notes

- Never commit files with actual credentials
- All scripts use safe placeholders by default
- Review each script before running
- Keep this directory in `.gitignore` if it contains sensitive data

## 📚 Documentation

See `../SECURITY_APPLY.md` for the complete security patch application guide.
