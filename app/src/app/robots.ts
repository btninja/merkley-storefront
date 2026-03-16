import type { MetadataRoute } from "next";

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
    sitemap: "https://merkleydetails.com/sitemap.xml",
  };
}
