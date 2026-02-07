# Synqra Verification Scripts

## Overview

This directory contains testing and verification scripts for the Synqra posting pipeline.

## Scripts

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
