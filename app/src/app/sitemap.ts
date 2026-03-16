import type { MetadataRoute } from "next";

const BASE_URL = "https://merkleydetails.com";

const ERP_BASE =
  process.env.NEXT_PUBLIC_ERP_URL ||
  process.env.FRAPPE_BASE_URL ||
  "https://erp.merkleydetails.com";

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

  // Dynamic product pages
  const products = await fetchAllProducts();

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/catalogo/${product.slug}`,
    lastModified: product.modified ? new Date(product.modified) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
