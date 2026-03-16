import type { Metadata } from "next";
import CatalogoPage from "./catalogo-content";

export const metadata: Metadata = {
  title: "Catálogo de Productos",
  description:
    "Explora nuestro catálogo de detalles corporativos, canastas navideñas, regalos personalizados y más. Cotización sin compromiso.",
  alternates: {
    canonical: "https://merkleydetails.com/catalogo",
  },
  openGraph: {
    title: "Catálogo de Productos | Merkley Details",
    description:
      "Explora nuestro catálogo de detalles corporativos, canastas navideñas, regalos personalizados y más. Cotización sin compromiso.",
  },
};

export default function Page() {
  return <CatalogoPage />;
}
