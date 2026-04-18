import useSWR from "swr";
import * as api from "@/lib/api";

export function useMyInvoices(params?: { status?: string; page?: number; page_length?: number }) {
  const key = params
    ? `invoices:${params.status || "all"}:${params.page || 1}:${params.page_length || 20}`
    : "invoices:all:1:20";

  return useSWR(key, () => api.getMyInvoices(params));
}

// Stages that never change once reached — no point polling them.
const TERMINAL_INVOICE_STAGES = new Set(["Pagada", "Anulada"]);

export function useInvoiceDetail(name: string) {
  // Staff actions (payment review, NCF assignment, annulment review) happen
  // on the CRM. Poll every 10s so the customer's open tab reflects those
  // changes within ~10s without a manual reload. SWR auto-pauses polling
  // when the tab is hidden and we stop entirely once the invoice is in a
  // terminal state.
  return useSWR(
    name ? `invoice:${name}` : null,
    () => api.getInvoiceDetail(name),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
      refreshInterval: (latest) => {
        const stage = latest?.stage ?? latest?.invoice_stage;
        return stage && TERMINAL_INVOICE_STAGES.has(stage) ? 0 : 10_000;
      },
    }
  );
}
