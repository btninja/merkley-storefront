import type { Metadata } from "next";
import NosotrosPage from "./nosotros-content";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Conoce Merkley Details, tu aliado en detalles corporativos y regalos personalizados para empresas en República Dominicana.",
  alternates: {
    canonical: "https://merkleydetails.com/nosotros",
  },
  openGraph: {
    title: "Nosotros | Merkley Details",
    description:
      "Conoce Merkley Details, tu aliado en detalles corporativos y regalos personalizados para empresas en República Dominicana.",
  },
};

export default function Page() {
  return <NosotrosPage />;
}
