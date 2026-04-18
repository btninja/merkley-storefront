"use client";

import useSWR from "swr";
import * as api from "@/lib/api";

export function useMyQuotations(stage?: string) {
  const key = stage ? `quotations:${stage}` : "quotations";
  return useSWR(key, () => api.getMyQuotations(stage));
}

export function useQuotationDetail(name: string | null) {
  // Staff actions (Confirmada transition, document review, etc.) are made
  // against the CRM and should be reflected in the storefront quickly when
  // the user returns to the tab. SWR defaults to `revalidateOnFocus: true`
  // already; we set it explicitly for clarity and raise the dedupe interval
  // to 30s so rapid re-focuses don't hammer the backend.
  return useSWR(
    name ? `quotation:${name}` : null,
    () => (name ? api.getQuotationDetail(name) : null),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30_000,
    },
  );
}
