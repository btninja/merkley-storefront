import type { MetadataRoute } from "next";
import { STOREFRONT_BASE_URL } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/nuestros-clientes",
        "/cuenta",
        "/cotizaciones",
        "/facturas",
        "/catalogo-pdf",
      ],
    },
    sitemap: `${STOREFRONT_BASE_URL}/sitemap.xml`,
  };
}
