# Security Remediation Note

## Incident
- Credential-like material was found in repository file history/content.

## Required Actions
1. Rotate and reissue any potentially exposed secrets immediately.
2. Update runtime environments (local, CI, staging, production) with new secrets.
3. Invalidate old keys and verify they can no longer access services.
4. Review git history and perform history rewrite only if required by security policy.
5. Run secret scanning across the repository and CI artifacts before the next release.

## Verification
- Confirm all services start with rotated secrets.
- Confirm authentication failures for old credentials.
- Confirm deployment runbooks reference environment variables, not inline credentials.
