"use client";

import useSWR from "swr";
import * as api from "@/lib/api";

export function useMyQuotations(stage?: string, customer?: string | null) {
  // Cache key encodes both filters so switching them refetches cleanly.
  const parts = ["quotations"];
  if (stage) parts.push(`s:${stage}`);
  if (customer) parts.push(`c:${customer}`);
  const key = parts.join("|");
  return useSWR(key, () => api.getMyQuotations(stage, customer || undefined));
}

// Stages that never change once reached — no point polling them.
const TERMINAL_QUOTE_STAGES = new Set(["Aceptada", "Rechazada", "Expirada"]);

export function useQuotationDetail(name: string | null) {
  // Primary path is realtime push via useRealtimeDoc ("Quotation", name)
  // + Frappe socket.io. This polling interval is a safety net — catches
  // state changes if the socket is dropped, the user is on flaky wifi,
  // or the backend's publish_realtime fails for any reason. 60s keeps
  // load trivial while guaranteeing state eventually converges.
  const result = useSWR(
    name ? `quotation:${name}` : null,
    () => (name ? api.getQuotationDetail(name) : null),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
      refreshInterval: (latest) =>
        latest?.quote?.stage && TERMINAL_QUOTE_STAGES.has(latest.quote.stage)
          ? 0
          : 60_000,
    },
  );
  return result;
}
