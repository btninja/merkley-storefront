"use client";

import useSWR from "swr";
import * as api from "@/lib/api";

export function useSeasons() {
  return useSWR("seasons", () => api.getSeasons(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}

export function useActiveSeasons() {
  return useSWR("active-seasons", () => api.getActiveSeasons(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}

export function useSeasonProducts(params: {
  season: string | null;
  page?: number;
  tier?: string;
  search?: string;
  sort_by?: string;
}) {
  const key = params.season
    ? ["season-products", params.season, params.page, params.tier, params.search, params.sort_by]
        .filter(Boolean)
        .join(":")
    : null;

  return useSWR(key, () =>
    params.season
      ? api.getSeasonProducts({
          season: params.season,
          page: params.page || 1,
          page_length: 12,
          tier: params.tier,
          search: params.search,
          sort_by: params.sort_by,
        })
      : null
  );
}
