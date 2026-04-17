"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type UtmSnapshot = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
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

    // Capture UTM from URL on this page load (if any)
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

/** Convenience: get UTM params as a plain object ready for API payload. */
export function useUtmParams(): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_history_json?: string;
} {
  const { current, history } = useUtm();
  if (!current) return {};
  const out: Record<string, string> = {};
  for (const k of UTM_KEYS) {
    const v = (current as unknown as Record<string, string | undefined>)[k];
    if (v) out[k] = v;
  }
  if (history.length > 0) {
    out.utm_history_json = JSON.stringify(history);
  }
  return out;
}
