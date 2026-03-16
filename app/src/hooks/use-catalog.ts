"use client";

import useSWR from "swr";
import * as api from "@/lib/api";

export function useBootstrap() {
  return useSWR("bootstrap", () => api.getBootstrap(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}

export function useProducts(params: {
  page?: number;
  category?: string;
  tier?: string;
  search?: string;
  season?: string;
  sort_by?: string;
  availability?: string;
}) {
  const key = [
    "products",
    params.page,
    params.category,
    params.tier,
    params.search,
    params.season,
    params.sort_by,
    params.availability,
  ]
    .filter(Boolean)
    .join(":");

  return useSWR(key, () =>
    api.getProducts({
      page: params.page || 1,
      page_length: 12,
      category: params.category,
      tier: params.tier,
      search: params.search,
      season: params.season,
      sort_by: params.sort_by,
      availability: params.availability,
    })
  );
}

export function useProductDetail(slug: string | null) {
  return useSWR(slug ? `product:${slug}` : null, () =>
    slug ? api.getProductDetail(slug) : null
  );
}
