"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type UtmSnapshot = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  // Click IDs — platform-specific first-click identifiers that Meta /
  // Google / Microsoft use to match offline conversions back to ads.
  // Captured alongside UTMs because they have the same TTL semantics.
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  // First landing context — captured once per snapshot, survives
  // internal navigation so conversion submits can report original
  // entry even when the user is 10 pages deep.
  referrer?: string;
  landing_page?: string;
  captured_at: number; // epoch ms
};

type UtmHistory = UtmSnapshot[];

type UtmContextValue = {
  current: UtmSnapshot | null;
  history: UtmHistory;
  clear: () => void;
};

const DEFAULT_CTX: UtmContextValue = { current: null, history: [], clear: () => {} };
const UtmCtx = createContext<UtmContextValue>(DEFAULT_CTX);

const CURRENT_KEY = "mw_utm_current";
const HISTORY_KEY = "mw_utm_history";
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const HISTORY_CAP = 20;

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const CLICK_ID_KEYS = ["gclid", "fbclid", "msclkid"] as const;

function readSnapshot(): UtmSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UtmSnapshot;
    if (Date.now() - parsed.captured_at > TTL_MS) {
      window.localStorage.removeItem(CURRENT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readHistory(): UtmHistory {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UtmHistory;
    // Drop anything older than TTL
    return parsed.filter((e) => Date.now() - e.captured_at <= TTL_MS);
  } catch {
    return [];
  }
}

export function UtmProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<UtmSnapshot | null>(null);
  const [history, setHistory] = useState<UtmHistory>([]);

  useEffect(() => {
    // Restore previous snapshot
    setCurrent(readSnapshot());
    setHistory(readHistory());

    // Capture UTMs + click IDs + referrer/landing from URL on this page load
    try {
      const params = new URLSearchParams(window.location.search);
      const fresh: UtmSnapshot = { captured_at: Date.now() };
      let anyPresent = false;

      for (const k of UTM_KEYS) {
        const v = params.get(k);
        if (v) {
          (fresh as unknown as Record<string, string | number>)[k] = v;
          anyPresent = true;
        }
      }
      for (const k of CLICK_ID_KEYS) {
        const v = params.get(k);
        if (v) {
          (fresh as unknown as Record<string, string | number>)[k] = v;
          anyPresent = true;
        }
      }

      // Capture document.referrer + landing URL whenever we're creating a
      // fresh snapshot. An external-origin referrer is the only way to
      // tell organic Google from direct when there are no UTMs present.
      if (anyPresent || !readSnapshot()) {
        const ref = document.referrer || "";
        if (ref && !ref.startsWith(window.location.origin)) {
          fresh.referrer = ref;
          anyPresent = true;
        }
        fresh.landing_page = window.location.pathname + window.location.search;
      }

      if (anyPresent) {
        window.localStorage.setItem(CURRENT_KEY, JSON.stringify(fresh));
        const nextHistory = [fresh, ...readHistory()].slice(0, HISTORY_CAP);
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
        setCurrent(fresh);
        setHistory(nextHistory);
      }
    } catch {
      // localStorage may be unavailable (private browsing, etc.) — fail silently
    }
  }, []);

  const clear = () => {
    try {
      window.localStorage.removeItem(CURRENT_KEY);
      window.localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
    setCurrent(null);
    setHistory([]);
  };

  return <UtmCtx.Provider value={{ current, history, clear }}>{children}</UtmCtx.Provider>;
}

export function useUtm(): UtmContextValue {
  return useContext(UtmCtx);
}

/** Convenience: get UTM params + click IDs + referrer as a plain object
 *  ready for API payload. Every conversion endpoint (access request,
 *  quotation create, checkout, registration) should attach this so the
 *  Lead is enriched before it's persisted. */
export function useUtmParams(): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  referrer?: string;
  landing_page?: string;
  utm_history_json?: string;
} {
  const { current, history } = useUtm();
  if (!current) return {};
  const out: Record<string, string> = {};
  for (const k of [...UTM_KEYS, ...CLICK_ID_KEYS] as const) {
    const v = (current as unknown as Record<string, string | undefined>)[k];
    if (v) out[k] = v;
  }
  if (current.referrer) out.referrer = current.referrer;
  if (current.landing_page) out.landing_page = current.landing_page;
  if (history.length > 0) {
    out.utm_history_json = JSON.stringify(history);
  }
  return out;
}
