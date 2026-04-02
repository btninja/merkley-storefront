import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://00075e7c1e1cf0087c67bc729de81514@o4511005651435520.ingest.us.sentry.io/4511048421933057",
  environment: "production",

  // Performance Monitoring
  tracesSampleRate: 0.1,

  // Profiling
  profilesSampleRate: 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
