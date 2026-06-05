import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    // Filter out noise
    ignoreErrors: [
      // User cancelled actions
      "AbortError",
      // ResizeObserver loop limit — harmless
      "ResizeObserver loop limit exceeded",
    ],
    beforeSend(event) {
      // Don't send events with no message and no exception
      if (!event.message && !event.exception) return null;
      return event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
