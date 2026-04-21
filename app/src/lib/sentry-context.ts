/**
 * Business-context tagging for Sentry events.
 *
 * Without these tags, every exception is just a stack trace. With them
 * you can answer "does this error hit Google Ads leads more often than
 * organic" and "which funnel stage does this break" — which is what
 * marketing actually cares about when triaging.
 *
 * Safe to call before Sentry has loaded — import is a no-op if
 * @sentry/nextjs isn't initialized yet.
 */

import * as Sentry from "@sentry/nextjs";

export interface BusinessUserContext {
  email: string | null;
  customerName?: string | null;
  customerNames?: string[]; // multi-company users
}

export function setSentryUser(ctx: BusinessUserContext) {
  try {
    if (!ctx.email) {
      Sentry.setUser(null);
      return;
    }
    Sentry.setUser({
      id: ctx.email,
      email: ctx.email,
      // Segment-like extra fields — show up in the Sentry issue UI.
      ...(ctx.customerName ? { username: ctx.customerName } : {}),
    });
    if (ctx.customerNames && ctx.customerNames.length > 0) {
      Sentry.setTag("customer_count", String(ctx.customerNames.length));
    }
  } catch {
    // Sentry not available yet — acceptable, tags apply next error
  }
}

export function setSentryAttribution(params: {
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  gclid?: string;
  fbclid?: string;
}) {
  try {
    if (params.utm_source) Sentry.setTag("utm_source", params.utm_source);
    if (params.utm_medium) Sentry.setTag("utm_medium", params.utm_medium);
    if (params.utm_campaign) Sentry.setTag("utm_campaign", params.utm_campaign);
    // Click IDs go in context rather than tags — high cardinality, not
    // useful for grouping but helpful when you open a specific issue.
    if (params.gclid || params.fbclid) {
      Sentry.setContext("click_ids", {
        gclid: params.gclid || null,
        fbclid: params.fbclid || null,
      });
    }
  } catch {
    // ignore
  }
}

export function setSentryFunnelStage(stage: string) {
  try {
    Sentry.setTag("funnel_stage", stage);
  } catch {
    // ignore
  }
}
