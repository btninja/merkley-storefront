import type { Metadata } from "next";
import ContactoPage from "./contacto-content";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contáctanos para cotizaciones de detalles corporativos y regalos personalizados. Atención personalizada para empresas en República Dominicana.",
  alternates: {
    canonical: "https://merkleydetails.com/contacto",
  },
  openGraph: {
    title: "Contacto | Merkley Details",
    description:
      "Contáctanos para cotizaciones de detalles corporativos y regalos personalizados. Atención personalizada para empresas en República Dominicana.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contacto | Merkley Details",
    description:
      "Contáctanos para cotizaciones de detalles corporativos y regalos personalizados. Atención personalizada para empresas en República Dominicana.",
    images: ["https://merkleydetails.com/og-image.jpg"],
  },
};

export default function Page() {
  return <ContactoPage />;
}
