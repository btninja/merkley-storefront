import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { UmamiScript } from "@/components/analytics/umami-script";
import { GtmScript } from "@/components/analytics/gtm-script";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { ConsentBanner } from "@/components/analytics/consent-banner";
import { Suspense } from "react";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { ERP_BASE_URL, STOREFRONT_BASE_URL } from "@/lib/env";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffa8b7",
};

/**
 * Fetch tenant branding (name, description, OG image, etc.) from the
 * Frappe backend so a new deployment gets its own SEO metadata without
 * editing this file. Cached 1h server-side; invalidation requires a
 * rebuild OR an explicit `revalidateTag` call from the admin page.
 */
async function fetchBrandConfig() {
  try {
    const res = await fetch(
      `${ERP_BASE_URL}/api/method/merkley_web.brand.get_storefront_config`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.message ?? null;
  } catch {
    return null;
  }
}

// ── Fallback values used when the backend is unreachable during build ──
const FALLBACK = {
  brand_name: "Storefront",
  brand_tagline: "",
  meta_description: "",
  meta_title_template: "",
  og_image_url: "",
  twitter_handle: "",
  contact_phone: "",
  contact_address: "",
  storefront_url: STOREFRONT_BASE_URL,
};

export async function generateMetadata(): Promise<Metadata> {
  const cfg = (await fetchBrandConfig()) || FALLBACK;
  const brand = cfg.brand_name || FALLBACK.brand_name;
  const tagline = cfg.brand_tagline || "";
  const description =
    cfg.meta_description ||
    (tagline ? tagline : `${brand} — catálogo y cotizaciones online.`);
  const template = cfg.meta_title_template || `{brand} | ${tagline || brand}`;
  const defaultTitle = template.replaceAll("{brand}", brand);
  const ogImages = cfg.og_image_url ? [{ url: cfg.og_image_url }] : undefined;

  return {
    metadataBase: new URL(STOREFRONT_BASE_URL),
    title: {
      default: defaultTitle,
      template: `%s | ${brand}`,
    },
    description,
    openGraph: {
      type: "website",
      locale: "es_DO",
      siteName: brand,
      title: defaultTitle,
      description,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description,
      images: ogImages,
      ...(cfg.twitter_handle ? { site: `@${cfg.twitter_handle}` } : {}),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Build the JSON-LD schema blocks from the brand config. Kept minimal
 * intentionally — tenants with richer schema needs should override the
 * layout in their own repo. This is a TEMPLATE starting point.
 */
function buildSchemaBlocks(cfg: Record<string, string>) {
  const brand = cfg.brand_name || FALLBACK.brand_name;
  const storefrontUrl = cfg.storefront_url || STOREFRONT_BASE_URL;
  const logo = cfg.brand_logo_url || "";
  const description = cfg.meta_description || "";
  const phone = cfg.contact_phone ? `+${cfg.contact_phone.replace(/\D/g, "")}` : "";

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: brand,
      url: storefrontUrl,
      ...(logo ? { logo } : {}),
      ...(description ? { description } : {}),
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: "Spanish",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: brand,
      url: storefrontUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${storefrontUrl}/catalogo?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    // LocalBusiness is DR-specific; remove or edit this block if your
    // tenant isn't a physical business in the Dominican Republic.
    ...(phone
      ? [
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: brand,
            url: storefrontUrl,
            ...(logo ? { logo, image: logo } : {}),
            ...(description ? { description } : {}),
            telephone: phone,
            areaServed: "DO",
            currenciesAccepted: "DOP",
          },
        ]
      : []),
  ];
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cfg = (await fetchBrandConfig()) || FALLBACK;
  const schemaBlocks = buildSchemaBlocks(cfg);

  return (
    <html lang="es">
      <head>
        {/* Preconnect to critical origins for faster resource loading */}
        <link rel="preconnect" href={ERP_BASE_URL} />
        <link rel="dns-prefetch" href={ERP_BASE_URL} />
        {/* GTM preconnect removed — scripts use lazyOnload strategy */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {schemaBlocks.map((block, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
          />
        ))}
      </head>
      <body className={`${manrope.variable} antialiased`}>
        <Providers>{children}</Providers>
        <WhatsAppFab />
        <UmamiScript />
        <GtmScript />
        {/*
          Cookie consent banner suppressed — DR market doesn't require it
          (no GDPR/LGPD). Analytics default-on via useConsentGranted().
          To restore: uncomment <ConsentBanner /> below and flip
          DEFAULT_CONSENT in consent-banner.tsx back to "rejected".
        */}
        {/* <ConsentBanner /> */}
        {/* Suspense required because PageViewTracker reads useSearchParams
            which forces a suspense boundary under App Router. */}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
      </body>
    </html>
  );
}
