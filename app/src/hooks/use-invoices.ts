import useSWR from "swr";
import * as api from "@/lib/api";

export function useMyInvoices(params?: { status?: string; page?: number }) {
  const key = params
    ? `invoices:${params.status || "all"}:${params.page || 1}`
    : "invoices:all:1";

  return useSWR(key, () => api.getMyInvoices(params));
}

export function useInvoiceDetail(name: string) {
  return useSWR(name ? `invoice:${name}` : null, () =>
    api.getInvoiceDetail(name)
  );
}
