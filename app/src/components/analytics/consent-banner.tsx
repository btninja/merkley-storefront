"use client";

/**
 * Lightweight cookie-consent banner.
 *
 * Gates non-essential tracker loads (Umami, GTM, Meta Pixel, TikTok,
 * Clarity) behind an explicit user choice. Sentry error tracking
 * continues unconditionally because it's a "legitimate interest"
 * operational signal, not marketing.
 *
 * Choice stored in localStorage (`mw_consent`) with 12-month TTL.
 * After 12 months the banner shows again — matches GDPR/LGPD
 * re-consent expectations.
 *
 * To keep bundle size down we don't use a heavyweight library like
 * OneTrust or Cookiebot. That's acceptable for the DR market today
 * (no GDPR jurisdiction) — upgrade when expanding to EU/BR traffic.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const CONSENT_KEY = "mw_consent";
const TTL_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

export type ConsentChoice = "accepted" | "rejected";

interface StoredConsent {
  choice: ConsentChoice;
  ts: number;
}

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return parsed.choice;
  } catch {
    return null;
  }
}

function writeConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ choice, ts: Date.now() }),
    );
  } catch {
    // ignore
  }
  // Dispatch a window event so the analytics gate components can
  // react without a full page reload.
  try {
    window.dispatchEvent(new CustomEvent("mw:consent-changed", { detail: choice }));
  } catch { /* ignore */ }
}

export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if no stored choice yet
    if (readConsent() === null) setShow(true);
  }, []);

  if (!show) return null;

  const decide = (choice: ConsentChoice) => {
    writeConsent(choice);
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentimiento de cookies"
      className={cn(
        "fixed inset-x-2 bottom-2 z-50 rounded-xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur",
        "sm:inset-x-auto sm:bottom-6 sm:left-6 sm:right-6 sm:max-w-2xl sm:mx-auto"
      )}
    >
      <p className="text-sm leading-relaxed text-foreground">
        Usamos cookies y herramientas de análisis (Umami, Google Analytics, Meta Pixel,
        Microsoft Clarity) para entender cómo usas el sitio y mejorar tu experiencia.
        Puedes aceptar o rechazar — los errores operativos siempre se registran.
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => decide("rejected")}
          className="text-sm font-medium text-muted hover:text-foreground px-3 py-1.5 rounded-md border border-transparent hover:border-border transition-colors"
        >
          Rechazar
        </button>
        <button
          type="button"
          onClick={() => decide("accepted")}
          className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

/**
 * Hook for analytics components to react to consent changes. Returns
 * true if tracking is permitted. Updates in response to the
 * mw:consent-changed event.
 */
export function useConsentGranted(): boolean {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    setGranted(readConsent() === "accepted");
    const handler = (e: Event) => {
      const choice = (e as CustomEvent<ConsentChoice>).detail;
      setGranted(choice === "accepted");
    };
    window.addEventListener("mw:consent-changed", handler as EventListener);
    return () => window.removeEventListener("mw:consent-changed", handler as EventListener);
  }, []);

  return granted;
}
