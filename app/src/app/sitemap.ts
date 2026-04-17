import type { MetadataRoute } from "next";
import { ERP_BASE_URL as ERP_BASE, STOREFRONT_BASE_URL as BASE_URL } from "@/lib/env";

interface SitemapProduct {
  slug: string;
  modified?: string;
}

interface ProductListResponse {
  items: SitemapProduct[];
  total_count: number;
  pagination: {
    page: number;
    page_length: number;
    has_more: boolean;
  };
}

interface SitemapBlogPost {
  slug: string;
  published_on?: string | null;
}

interface BlogListResponse {
  posts: SitemapBlogPost[];
  total_count: number;
  pagination: {
    page: number;
    page_length: number;
    has_more: boolean;
  };
}

interface SitemapSeason {
  slug: string;
  season_name: string;
}

interface SeasonsResponse {
  seasons: SitemapSeason[];
}

async function fetchAllProducts(): Promise<SitemapProduct[]> {
  const allProducts: SitemapProduct[] = [];
  let page = 1;
  const pageLength = 100;

  try {
    while (true) {
      const url = new URL(
        `${ERP_BASE}/api/method/merkley_web.api.catalog.get_website_products`
      );
      url.searchParams.set("page", String(page));
      url.searchParams.set("page_length", String(pageLength));

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        console.error(`Sitemap: failed to fetch products page ${page}:`, response.status);
        break;
      }

      const data = await response.json();
      const result: ProductListResponse = data.message;

      if (!result?.items?.length) break;

      allProducts.push(
        ...result.items.map((item) => ({
          slug: item.slug,
          modified: item.modified,
        }))
      );

      if (!result.pagination.has_more) break;
      page++;
    }
  } catch (error) {
    console.error("Sitemap: error fetching products:", error);
  }

  return allProducts;
}

async function fetchAllBlogPosts(): Promise<SitemapBlogPost[]> {
  const allPosts: SitemapBlogPost[] = [];
  let page = 1;
  const pageLength = 100;

  try {
    while (true) {
      const url = new URL(
        `${ERP_BASE}/api/method/merkley_web.api.blog.get_blog_posts`
      );
      url.searchParams.set("page", String(page));
      url.searchParams.set("page_length", String(pageLength));

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        console.error(`Sitemap: failed to fetch blog posts page ${page}:`, response.status);
        break;
      }

      const data = await response.json();
      const result: BlogListResponse = data.message;

      if (!result?.posts?.length) break;

      allPosts.push(
        ...result.posts.map((post) => ({
          slug: post.slug,
          published_on: post.published_on,
        }))
      );

      if (!result.pagination.has_more) break;
      page++;
    }
  } catch (error) {
    console.error("Sitemap: error fetching blog posts:", error);
  }

  return allPosts;
}

async function fetchAllSeasons(): Promise<SitemapSeason[]> {
  try {
    const url = new URL(
      `${ERP_BASE}/api/method/merkley_web.api.seasons.get_seasons`
    );

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error("Sitemap: failed to fetch seasons:", response.status);
      return [];
    }

    const data = await response.json();
    const result: SeasonsResponse = data.message;

    if (!result?.seasons?.length) return [];

    return result.seasons.map((season) => ({
      slug: season.slug,
      season_name: season.season_name,
    }));
  } catch (error) {
    console.error("Sitemap: error fetching seasons:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/catalogo`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contacto`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/nosotros`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/preguntas-frecuentes`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/temporadas`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/links`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/politica-de-privacidad`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/politica-de-devolucion`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terminos-y-condiciones`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  // Dynamic pages (fetch in parallel)
  const [products, blogPosts, seasons] = await Promise.all([
    fetchAllProducts(),
    fetchAllBlogPosts(),
    fetchAllSeasons(),
  ]);

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/catalogo/${product.slug}`,
    lastModified: product.modified ? new Date(product.modified) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.published_on ? new Date(post.published_on) : now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const seasonPages: MetadataRoute.Sitemap = seasons.map((season) => ({
    url: `${BASE_URL}/temporada/${season.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...blogPages, ...seasonPages];
}
