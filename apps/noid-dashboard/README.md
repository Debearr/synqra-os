This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Railway

This repository includes a `railway.json` configuration that tells Railway how to build and start the app inside the `noid-dashboard` workspace:

- **Install:** `cd noid-dashboard && npm install`
- **Build:** `cd noid-dashboard && npm run build`
- **Start:** `cd noid-dashboard && npm start`

### Environment variables

Create these variables in your Railway service (values below are examples?replace them with your real credentials):

- `LINKEDIN_ACCESS_TOKEN`
- `LINKEDIN_PERSON_URN`
- `POST_AS`
- `TIMEZONE`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `N8N_WEBHOOK_URL`
- (optional) `NODE_ENV=production`
- (optional) `NEXT_TELEMETRY_DISABLED=1`

### Deploy steps

1. Push the latest changes (including `railway.json`) to GitHub.
2. Link the GitHub repo to your Railway project.
3. Trigger a deploy; Railway will run the commands above and expose the app on the assigned port.
4. After the deploy, confirm the health check (`/`) returns `200 OK` and smoke-test the dashboard.
