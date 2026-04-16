import useSWR from "swr";
import * as api from "@/lib/api";

export function useMyInvoices(params?: { status?: string; page?: number; page_length?: number }) {
  const key = params
    ? `invoices:${params.status || "all"}:${params.page || 1}:${params.page_length || 20}`
    : "invoices:all:1:20";

  return useSWR(key, () => api.getMyInvoices(params));
}

export function useInvoiceDetail(name: string) {
  return useSWR(name ? `invoice:${name}` : null, () =>
    api.getInvoiceDetail(name)
  );
}
