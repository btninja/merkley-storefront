/**
 * Centralized environment access with hard failure when required variables
 * are missing.
 *
 * Historically many files read `process.env.NEXT_PUBLIC_ERP_URL` with a
 * hardcoded `|| "https://erp.merkleydetails.com"` fallback. That made it
 * easy for a new deployment to accidentally hit the original brand's
 * backend if an operator forgot to set the env var. Now every consumer
 * imports from here; missing required vars raise at module evaluation
 * so the misconfiguration surfaces on the first request instead of
 * silently succeeding against the wrong host.
 *
 * IMPORTANT: Next.js only inlines `process.env.NEXT_PUBLIC_*` at build
 * time when it sees the access as a *literal* property expression. We
 * therefore can't use `process.env[name]` or any indirection — each
 * variable has to be read as `process.env.NEXT_PUBLIC_FOO` directly.
 */

function trimSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

function resolve(label: string, value: string | undefined, devFallback: string): string {
  if (value && value.trim()) return trimSlash(value);
  const msg =
    `Required environment variable missing: ${label}. ` +
    `Set it in .env.production before building, e.g. ${label.split(" / ")[0]}=https://erp.example.com`;
  if (process.env.NODE_ENV === "production") {
    throw new Error(msg);
  }
  console.warn(`[env] ${msg}`);
  return devFallback;
}

/**
 * The Frappe / ERPNext backend base URL. Used by every API call and by
 * SSR routes that fetch from the ERP.
 */
export const ERP_BASE_URL: string = resolve(
  "NEXT_PUBLIC_ERP_URL / FRAPPE_BASE_URL",
  process.env.NEXT_PUBLIC_ERP_URL || process.env.FRAPPE_BASE_URL,
  "http://localhost:8000"
);

/**
 * The storefront's own canonical URL. Used for SEO metadata, OpenGraph
 * URLs, and email CTA links.
 */
export const STOREFRONT_BASE_URL: string = resolve(
  "NEXT_PUBLIC_STOREFRONT_URL / NEXT_PUBLIC_SITE_URL",
  process.env.NEXT_PUBLIC_STOREFRONT_URL || process.env.NEXT_PUBLIC_SITE_URL,
  "http://localhost:3100"
);
