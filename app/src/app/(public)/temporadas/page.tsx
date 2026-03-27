import type { Metadata } from "next";
import TemporadasContent from "./temporadas-content";

export const metadata: Metadata = {
  title: "Temporadas",
  description:
    "Colecciones curadas de detalles corporativos para cada ocasión especial del año. Navidad, Día de las Madres, Día del Trabajador y más.",
  alternates: {
    canonical: "https://merkleydetails.com/temporadas",
  },
  openGraph: {
    title: "Temporadas | Merkley Details",
    description:
      "Colecciones de regalos corporativos para cada temporada. Ordena con anticipación y asegura disponibilidad.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Temporadas | Merkley Details",
    description:
      "Colecciones curadas de detalles corporativos para cada ocasión especial del año. Navidad, Día de las Madres, Día del Trabajador y más.",
    images: ["https://merkleydetails.com/og-image.jpg"],
  },
};

export default function Page() {
  return <TemporadasContent />;
}
