import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || "development",
    release: process.env.SENTRY_RELEASE || undefined,
    tracesSampleRate: 0,
  });
}

