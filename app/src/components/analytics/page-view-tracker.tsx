"use client";

/**
 * Auto-emits a `page_view` event on every Next App Router navigation.
 *
 * Umami's `data-auto-track` handler only fires once per full-page
 * load, so without this component SPA navigations silently go
 * unrecorded. Mount once in the root layout, after <UmamiScript />.
 *
 * We deliberately fire into Umami only — GA4 via GTM receives its
 * page_view via the GTM container's own History-Change trigger, so
 * duplicating here would double-count.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    // Don't emit while Umami is still bootstrapping; the initial
    // auto-track handles the very first view. The queue logic in
    // trackUmami will buffer regardless, so this is belt-and-braces.
    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname;
    trackPageView(path, typeof document !== "undefined" ? document.title : undefined);
  }, [pathname, searchParams]);

  return null;
}
