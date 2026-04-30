import { cache } from "react";
import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getProductDetail } from "@/lib/api";
import ProductDetailPage from "./product-detail-content";

// Deduplicate: generateMetadata + Page both call this — cache() ensures one request per slug
const getCachedProductDetail = cache(getProductDetail);

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const data = await getCachedProductDetail(slug);
    if (data && "redirect_to" in data && data.redirect_to) {
      permanentRedirect(`/catalogo/${data.redirect_to}`);
    }
    const product = data?.item;

    if (!product) {
      return {
        title: "Producto no encontrado",
        description: "El producto que buscas no existe o fue removido del catálogo.",
      };
    }

    const plainDescription =
      product.short_description ||
      product.description?.replace(/<[^>]*>/g, "").slice(0, 160) ||
      `${product.name} - Detalle corporativo disponible en Merkley Details.`;

    const ogImage = product.images?.[0]?.url || undefined;

    // Product-specific OG tags so Meta Pixel auto-event-enrichment (the
    // dashboard-side AI feature that backfills page/product context onto
    // Pixel events) can match price + availability + SKU back to our
    // catalog. Without og:type=product + product:price:* tags, Meta can
    // only enrich title/description.
    const priceAmount = product.price?.amount;
    const availability = product.availability?.label?.toLowerCase().includes("disponible")
      ? "instock"
      : product.availability?.label?.toLowerCase().includes("pedido")
        ? "preorder"
        : "outofstock";
    const productOg: Record<string, string> = {
      "og:type": "product",
      ...(priceAmount ? { "product:price:amount": String(priceAmount) } : {}),
      ...(priceAmount ? { "product:price:currency": "DOP" } : {}),
      "product:availability": availability,
      ...(product.sku ? { "product:retailer_item_id": product.sku } : {}),
      ...(product.category ? { "product:category": product.category } : {}),
      "product:brand": "Merkley Details",
    };

    return {
      title: product.name,
      description: plainDescription,
      alternates: {
        canonical: `https://merkleydetails.com/catalogo/${slug}`,
      },
      openGraph: {
        title: `${product.name} | Merkley Details`,
        description: plainDescription,
        ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      },
      // Next.js doesn't surface og:type=product directly, so we register the
      // product-specific tags via `other` which renders them as <meta>.
      other: productOg,
      twitter: {
        card: "summary_large_image",
        title: `${product.name} | Merkley Details`,
        description: plainDescription,
        images: ogImage ? [ogImage] : ["https://merkleydetails.com/og-image.jpg"],
      },
    };
  } catch (err) {
    // Re-throw Next.js's redirect signal so the framework can issue 308
    if (isRedirectError(err)) throw err;
    return {
      title: "Producto",
      description: "Detalle de producto en Merkley Details.",
    };
  }
}

function getAvailabilityUrl(label?: string): string {
  if (!label) return "https://schema.org/OutOfStock";
  if (label.toLowerCase().includes("disponible")) return "https://schema.org/InStock";
  if (label.toLowerCase().includes("pedido")) return "https://schema.org/PreOrder";
  return "https://schema.org/OutOfStock";
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  // Defense-in-depth: if generateMetadata's redirect didn't fire (cached at
  // build-time, etc.), fire from the Page component too.
  const data = await getCachedProductDetail(slug);
  if (data && "redirect_to" in data && data.redirect_to) {
    permanentRedirect(`/catalogo/${data.redirect_to}`);
  }

  let productJsonLd = null;
  let breadcrumbJsonLd = null;
  try {
    const product = data?.item;
    if (product) {
      const plainDesc =
        product.short_description ||
        product.description?.replace(/<[^>]*>/g, "").slice(0, 160) ||
        "";
      productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: plainDesc,
        image: product.images?.map((img: { url: string }) => img.url) || [],
        url: `https://merkleydetails.com/catalogo/${slug}`,
        sku: product.sku || slug,
        brand: {
          "@type": "Brand",
          name: "Merkley Details",
        },
        offers: {
          "@type": "Offer",
          price: product.price?.amount || 0,
          priceCurrency: "DOP",
          availability: getAvailabilityUrl(product.availability?.label),
          url: `https://merkleydetails.com/catalogo/${slug}`,
        },
      };

      // BreadcrumbList schema for rich snippets
      const breadcrumbItems = [
        {
          "@type": "ListItem",
          position: 1,
          name: "Inicio",
          item: "https://merkleydetails.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Catálogo",
          item: "https://merkleydetails.com/catalogo",
        },
      ];

      if (product.category) {
        breadcrumbItems.push({
          "@type": "ListItem",
          position: 3,
          name: product.category,
          item: `https://merkleydetails.com/catalogo?category=${encodeURIComponent(product.category)}`,
        });
        breadcrumbItems.push({
          "@type": "ListItem",
          position: 4,
          name: product.name,
          item: `https://merkleydetails.com/catalogo/${slug}`,
        });
      } else {
        breadcrumbItems.push({
          "@type": "ListItem",
          position: 3,
          name: product.name,
          item: `https://merkleydetails.com/catalogo/${slug}`,
        });
      }

      breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
      };
    }
  } catch {
    // JSON-LD is optional — page still renders
  }

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <ProductDetailPage />
    </>
  );
}
