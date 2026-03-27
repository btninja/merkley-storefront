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
  twitter: {
    card: "summary_large_image",
    title: "Nosotros | Merkley Details",
    description:
      "Conoce Merkley Details, tu aliado en detalles corporativos y regalos personalizados para empresas en República Dominicana.",
    images: ["https://merkleydetails.com/og-image.jpg"],
  },
};

export default function Page() {
  return <NosotrosPage />;
}
