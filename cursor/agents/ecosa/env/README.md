Place a `.env` file in this directory with:

- SHARED_HMAC_SECRET: HMAC secret shared between webhook client and n8n
- RATE_LIMIT_RPM: Requests per minute threshold for in-flow rate limiting

Never commit real secrets. Use `.env.example` as a template.