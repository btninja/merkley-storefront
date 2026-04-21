import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://00075e7c1e1cf0087c67bc729de81514@o4511005651435520.ingest.us.sentry.io/4511048421933057",
  environment: "production",

  // Performance Monitoring
  tracesSampleRate: 0.1,

  // Profiling
  profilesSampleRate: 0.1,

  // Session Replay — sample 5% of sessions proactively so we can
  // diagnose UX friction (rage clicks, silent dead ends) even when
  // no exception fires. 100% of error-adjacent sessions still captured.
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Filter out third-party/extension noise that's not actionable for us.
  // Patterns are documented next to each rule so new noise can be added.
  ignoreErrors: [
    // Microsoft Outlook for Web addin posts unsolicited messages to
    // random tabs. Hundreds of teams hit this, no fix on our end.
    "Object Not Found Matching Id:",
    // Browser extension noise (wrapped Java bridges, autofill helpers)
    "isAllowAutoFill",
    "Java bridge",
    "Java object",
    "xbrowser",
    "swbrowser",
    // ResizeObserver harmless warnings
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
  ],

  // Filter Sentry events whose stacktrace originates entirely in third-
  // party scripts we don't control (Microsoft Clarity, ad scripts, etc.).
  denyUrls: [
    /clarity\.ms/i,
    /\bclarity\.js$/i,
    // Common analytics / chat / extension hosts
    /chrome-extension:\/\//i,
    /moz-extension:\/\//i,
    /^safari-extension:\/\//i,
    /extensions\//i,
    /^webkit-masked-url:\/\//i,
  ],

  beforeSend(event) {
    const msg = event.exception?.values?.[0]?.value || "";
    const stacktrace = event.exception?.values?.[0]?.stacktrace?.frames || [];

    // Filter "Maximum call stack size exceeded" from Sentry's automatic
    // browser API instrumentation — these come from third-party scripts
    // (extensions, ad blockers, embedded widgets) that recursively
    // re-attach event listeners. Our own code never has a visibilitychange
    // recursion; this is exclusively external noise.
    if (
      msg.includes("Maximum call stack size exceeded") &&
      event.exception?.values?.[0]?.mechanism?.type?.startsWith("auto.browser")
    ) {
      return null;
    }

    // Filter any error whose top stack frame is from a third-party script
    // hosted off our domain (Clarity, ads, extensions).
    const topFrame = stacktrace[stacktrace.length - 1];
    const topFile = topFrame?.filename || "";
    if (
      /clarity/i.test(topFile) ||
      /chrome-extension:/i.test(topFile) ||
      /moz-extension:/i.test(topFile)
    ) {
      return null;
    }

    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
