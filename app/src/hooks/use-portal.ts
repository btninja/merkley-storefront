import useSWR from "swr";
import * as api from "@/lib/api";

export function useOrderPipeline() {
  return useSWR("portal:order-pipeline", () => api.getOrderPipeline());
}

export function usePurchaseHistory(params?: {
  year?: number;
  page?: number;
}) {
  const key = params
    ? `portal:purchase-history:${params.year || "all"}:${params.page || 1}`
    : "portal:purchase-history:all:1";

  return useSWR(key, () => api.getPurchaseHistory(params));
}

export function useDownloadCenter(year?: number) {
  const key = year
    ? `portal:downloads:${year}`
    : "portal:downloads:all";

  return useSWR(key, () => api.getDownloadCenter(year));
}

