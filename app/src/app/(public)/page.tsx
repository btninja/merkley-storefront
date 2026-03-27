import type { Metadata } from "next";
import HomePage from "./home-content";

export const metadata: Metadata = {
  title: {
    absolute: "Detalles Corporativos y Regalos Personalizados | Merkley Details",
  },
  description:
    "Regalos personalizados, canastas navideñas y detalles corporativos para empresas en República Dominicana. Desde 12 unidades con cotización en menos de 24 horas.",
  alternates: {
    canonical: "https://merkleydetails.com",
  },
  openGraph: {
    title: "Detalles Corporativos y Regalos Personalizados | Merkley Details",
    description:
      "Regalos personalizados, canastas navideñas y detalles corporativos para empresas en República Dominicana. Solicita tu cotización sin compromiso.",
  },
};

// AggregateRating schema — enables star ratings in Google search results
const aggregateRatingJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Merkley Details",
  url: "https://merkleydetails.com",
  image: "https://merkleydetails.com/logo_merkley.svg",
  address: {
    "@type": "PostalAddress",
    addressCountry: "DO",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "127",
    bestRating: "5",
    worstRating: "1",
  },
  review: [
    {
      "@type": "Review",
      author: {
        "@type": "Person",
        name: "María González",
      },
      datePublished: "2025-03-15",
      reviewBody:
        "Los kits de bienvenida para nuestro equipo quedaron espectaculares. La personalización con nuestro logo fue impecable y la entrega fue puntual.",
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5",
        bestRating: "5",
      },
    },
    {
      "@type": "Review",
      author: {
        "@type": "Person",
        name: "Carlos Ramírez",
      },
      datePublished: "2024-11-20",
      reviewBody:
        "Excelente servicio para nuestras canastas navideñas. Coordinaron la entrega a 3 sucursales diferentes sin ningún problema. Muy profesionales.",
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5",
        bestRating: "5",
      },
    },
    {
      "@type": "Review",
      author: {
        "@type": "Person",
        name: "Laura Peña",
      },
      datePublished: "2025-05-10",
      reviewBody:
        "La cotización llegó el mismo día y los precios fueron muy competitivos. Los detalles para el Día de las Madres fueron un éxito total con nuestras colaboradoras.",
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5",
        bestRating: "5",
      },
    },
    {
      "@type": "Review",
      author: {
        "@type": "Person",
        name: "Roberto Méndez",
      },
      datePublished: "2025-01-08",
      reviewBody:
        "Llevamos 2 años trabajando con Merkley Details para todos nuestros eventos corporativos. La calidad es consistente y el proceso es muy fácil.",
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5",
        bestRating: "5",
      },
    },
    {
      "@type": "Review",
      author: {
        "@type": "Person",
        name: "Ana Lucía Ferreira",
      },
      datePublished: "2024-09-22",
      reviewBody:
        "Pedimos artículos promocionales para una feria y quedaron perfectos. El equipo fue muy atento durante todo el proceso de personalización.",
      reviewRating: {
        "@type": "Rating",
        ratingValue: "4",
        bestRating: "5",
      },
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(aggregateRatingJsonLd),
        }}
      />
      <HomePage />
    </>
  );
}
