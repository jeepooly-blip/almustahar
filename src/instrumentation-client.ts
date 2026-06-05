// For Sentry to work on the client (browser) side, the SDK needs to be
// imported and initialised from a "use client" entry point. We use a
// minimal shim so the SDK is only initialised when the DSN is present.
"use client";
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn && typeof window !== "undefined") {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    environment: process.env.NODE_ENV,
  });
}

export {};
