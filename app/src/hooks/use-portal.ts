import useSWR from "swr";
import * as api from "@/lib/api";

export function useOrderPipeline(customer?: string | null) {
  const key = customer ? `portal:order-pipeline:${customer}` : "portal:order-pipeline:all";
  return useSWR(key, () => api.getOrderPipeline(customer || undefined));
}

export function usePurchaseHistory(params?: {
  year?: number;
  page?: number;
  customer?: string | null;
}) {
  const key = params
    ? `portal:purchase-history:${params.year || "all"}:${params.page || 1}:${params.customer || "all"}`
    : "portal:purchase-history:all:1:all";

  return useSWR(key, () =>
    api.getPurchaseHistory({
      year: params?.year,
      page: params?.page,
      customer: params?.customer || undefined,
    }),
  );
}

export function useDownloadCenter(year?: number, customer?: string | null) {
  const parts = ["portal:downloads", year ? String(year) : "all", customer || "all"];
  return useSWR(parts.join(":"), () => api.getDownloadCenter(year, customer || undefined));
}

