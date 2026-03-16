"use client";

import useSWR from "swr";
import * as api from "@/lib/api";

export function useMyQuotations(stage?: string) {
  const key = stage ? `quotations:${stage}` : "quotations";
  return useSWR(key, () => api.getMyQuotations(stage));
}

export function useQuotationDetail(name: string | null) {
  return useSWR(name ? `quotation:${name}` : null, () =>
    name ? api.getQuotationDetail(name) : null
  );
}
