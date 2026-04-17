"use client";

import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { UtmProvider } from "@/context/utm-context";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UtmProvider>
      <AuthProvider>
        <CartProvider>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </UtmProvider>
  );
}
