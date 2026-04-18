"use client";

import useSWR from "swr";
import * as api from "@/lib/api";

export function useMyQuotations(stage?: string) {
  const key = stage ? `quotations:${stage}` : "quotations";
  return useSWR(key, () => api.getMyQuotations(stage));
}

// Stages that never change once reached — no point polling them.
const TERMINAL_QUOTE_STAGES = new Set(["Aceptada", "Rechazada", "Expirada"]);

export function useQuotationDetail(name: string | null) {
  // Staff actions (Confirmada transition, document review, etc.) happen on
  // the CRM. We want the customer's open tab to reflect those within ~10s
  // without a manual reload. Polling pauses automatically when the tab is
  // hidden (SWR's refreshWhenHidden default = false) and stops once the
  // quote reaches a terminal state.
  const result = useSWR(
    name ? `quotation:${name}` : null,
    () => (name ? api.getQuotationDetail(name) : null),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
      refreshInterval: (latest) =>
        latest?.quote?.stage && TERMINAL_QUOTE_STAGES.has(latest.quote.stage)
          ? 0
          : 10_000,
    },
  );
  return result;
}
