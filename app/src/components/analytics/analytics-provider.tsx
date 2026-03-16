"use client";

import { useEffect } from "react";
import { useBootstrap } from "@/hooks/use-catalog";
import { initAnalytics } from "@/lib/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: bootstrap } = useBootstrap();

  useEffect(() => {
    if (bootstrap?.analytics) {
      initAnalytics(bootstrap.analytics);
    }
  }, [bootstrap?.analytics]);

  return <>{children}</>;
}
