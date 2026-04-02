import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://00075e7c1e1cf0087c67bc729de81514@o4511005651435520.ingest.us.sentry.io/4511048421933057",
  environment: "production",

  // Performance Monitoring
  tracesSampleRate: 0.1,

  // Profiling
  profilesSampleRate: 0.1,

  // Session Replay
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  beforeSend(event) {
    const msg = event.exception?.values?.[0]?.value || "";
    // Filter browser extension noise
    if (/xbrowser|swbrowser|isAllowAutoFill|Java bridge|Java object/i.test(msg)) {
      return null;
    }
    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
