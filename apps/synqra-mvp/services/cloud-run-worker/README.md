# Synqra Cloud Run Worker

Background automation worker for scheduled jobs, retries, and outcome audits.

## Endpoints

- `GET /health`
- `POST /jobs/dispatch`
- `POST /jobs/retry`
- `POST /jobs/audit`
- `POST /jobs/schedule`
- `POST /jobs/email-poll-and-classify`
- `POST /jobs/high-priority-drafts`
- `POST /jobs/daily-normal-digest`

## Local run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Deploy

```bash
chmod +x deploy.sh scheduler-jobs.sh
./deploy.sh
WORKER_URL=https://your-worker-url ./scheduler-jobs.sh
```
