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
};

export default function Page() {
  return <TemporadasContent />;
}
