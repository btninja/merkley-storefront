import useSWR from "swr";
import * as api from "@/lib/api";

export function useMyInvoices(params?: { status?: string; customer?: string | null; page?: number; page_length?: number }) {
  const key = params
    ? `invoices:${params.status || "all"}:${params.customer || "all"}:${params.page || 1}:${params.page_length || 20}`
    : "invoices:all:all:1:20";

  return useSWR(key, () =>
    api.getMyInvoices({
      status: params?.status,
      customer: params?.customer || undefined,
      page: params?.page,
      page_length: params?.page_length,
    }),
  );
}

// Stages that never change once reached — no point polling them.
const TERMINAL_INVOICE_STAGES = new Set(["Pagada", "Anulada"]);

export function useInvoiceDetail(name: string) {
  // Primary path is realtime push via useRealtimeDoc ("Sales Invoice", name)
  // + Frappe socket.io. This polling interval is a safety net for dropped
  // sockets / flaky wifi / missed broadcasts. 60s keeps the load trivial
  // while guaranteeing state eventually converges.
  return useSWR(
    name ? `invoice:${name}` : null,
    () => api.getInvoiceDetail(name),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
      refreshInterval: (latest) => {
        const stage = latest?.invoice?.stage ?? latest?.invoice?.invoice_stage;
        return stage && TERMINAL_INVOICE_STAGES.has(stage) ? 0 : 60_000;
      },
    }
  );
}
