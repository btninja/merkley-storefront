import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { UmamiScript } from "@/components/analytics/umami-script";
import { GtmScript, GtmNoScript } from "@/components/analytics/gtm-script";
import { WhatsAppFab } from "@/components/whatsapp-fab";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://merkleydetails.com"),
  title: {
    default: "Merkley Details | Detalles Corporativos",
    template: "%s | Merkley Details",
  },
  description:
    "Detalles corporativos y regalos personalizados para empresas en República Dominicana. Solicita tu cotización.",
  keywords: [
    "detalles corporativos",
    "regalos empresariales",
    "República Dominicana",
    "canastas navideñas",
    "regalos personalizados",
    "merchandising empresarial",
    "regalos corporativos",
    "kits empresariales",
    "regalos para empleados",
    "detalles personalizados",
    "regalos día del trabajador",
    "regalos día de las madres",
    "obsequios corporativos",
    "gifting empresarial",
  ],
  openGraph: {
    type: "website",
    locale: "es_DO",
    siteName: "Merkley Details",
    title: "Merkley Details | Detalles Corporativos",
    description:
      "Regalos personalizados, canastas y detalles para empresas en República Dominicana. Cotización sin compromiso.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Merkley Details | Detalles Corporativos",
    description:
      "Regalos personalizados, canastas y detalles para empresas en República Dominicana.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Merkley Details",
  url: "https://merkleydetails.com",
  logo: "https://merkleydetails.com/logo_merkley.svg",
  description:
    "Detalles corporativos y regalos personalizados para empresas en República Dominicana",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: "Spanish",
  },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Merkley Details",
  url: "https://merkleydetails.com",
  logo: "https://merkleydetails.com/logo_merkley.svg",
  image: "https://merkleydetails.com/logo_merkley.svg",
  description:
    "Detalles corporativos y regalos personalizados para empresas en República Dominicana",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Santo Domingo",
    addressRegion: "Distrito Nacional",
    addressCountry: "DO",
  },
  telephone: "+18093735131",
  areaServed: "DO",
  currenciesAccepted: "DOP",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Merkley Details",
  url: "https://merkleydetails.com",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate:
        "https://merkleydetails.com/catalogo?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Preconnect to critical origins for faster resource loading */}
        <link rel="preconnect" href="https://erp.merkleydetails.com" />
        <link rel="dns-prefetch" href="https://erp.merkleydetails.com" />
        {/* GTM preconnect removed — scripts use lazyOnload strategy */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
      </head>
      <body className={`${manrope.variable} antialiased`}>
        <GtmNoScript />
        <Providers>{children}</Providers>
        <WhatsAppFab />
        <UmamiScript />
        <GtmScript />
      </body>
    </html>
  );
}
