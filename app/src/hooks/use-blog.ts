"use client";

import useSWR from "swr";
import * as api from "@/lib/api";

export function useBlogPosts(params: {
  page?: number;
  category?: string;
}) {
  const key = ["blog-posts", params.page, params.category]
    .filter(Boolean)
    .join(":");

  return useSWR(key, () =>
    api.getBlogPosts({
      page: params.page || 1,
      page_length: 9,
      category: params.category,
    })
  );
}

export function useBlogPost(slug: string | null) {
  return useSWR(slug ? `blog-post:${slug}` : null, () =>
    slug ? api.getBlogPost(slug) : null
  );
}

export function useBlogCategories() {
  return useSWR("blog-categories", () => api.getBlogCategories(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}

export function useRecentBlogPosts(limit?: number) {
  return useSWR(
    `recent-blog-posts:${limit || 3}`,
    () => api.getRecentBlogPosts(limit),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
}
