import useSWR from "swr";
import * as api from "@/lib/api";

export function useMyInvoices(params?: { status?: string; page?: number; page_length?: number }) {
  const key = params
    ? `invoices:${params.status || "all"}:${params.page || 1}:${params.page_length || 20}`
    : "invoices:all:1:20";

  return useSWR(key, () => api.getMyInvoices(params));
}

export function useInvoiceDetail(name: string) {
  // Staff actions (payment review, NCF assignment, annulment review) happen
  // against the CRM. The storefront should pick those changes up promptly
  // when the customer returns to the tab, so we revalidate on focus. 30s
  // dedupe keeps rapid re-focuses from hammering the backend.
  return useSWR(
    name ? `invoice:${name}` : null,
    () => api.getInvoiceDetail(name),
    {
      revalidateOnFocus: true,
      dedupingInterval: 30_000,
    }
  );
}
