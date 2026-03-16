"use client";

import Script from "next/script";
import { useBootstrap } from "@/hooks/use-catalog";

export function UmamiScript() {
  const { data: bootstrap } = useBootstrap();
  const analyticsConfig = bootstrap?.analytics;

  if (!analyticsConfig?.umami_website_id || !analyticsConfig?.umami_script_url) {
    return null;
  }

  return (
    <Script
      src={analyticsConfig.umami_script_url}
      data-website-id={analyticsConfig.umami_website_id}
      strategy="afterInteractive"
    />
  );
}
