import type { Metadata } from "next";
import TemporadaContent from "./temporada-content";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // Convert slug to readable name (e.g., "dia-de-las-madres" -> "Día de las Madres")
  const readableName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: readableName,
    description: `Colección de detalles y regalos corporativos para ${readableName}. Encuentra el regalo perfecto para tu equipo y clientes en Merkley Details.`,
    alternates: {
      canonical: `https://merkleydetails.com/temporada/${slug}`,
    },
    openGraph: {
      title: `${readableName} | Merkley Details`,
      description: `Explora nuestra colección de ${readableName}. Regalos corporativos personalizados con entrega en toda República Dominicana.`,
    },
  };
}

export default function Page() {
  return <TemporadaContent />;
}
