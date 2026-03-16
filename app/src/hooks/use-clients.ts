"use client";

import useSWR from "swr";
import * as api from "@/lib/api";

export function useFeaturedClients() {
  return useSWR("featured-clients", () => api.getFeaturedClients(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}

export function useClientPortfolio() {
  return useSWR("client-portfolio", () => api.getClientPortfolio(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}
