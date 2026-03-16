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
};

export default function Page() {
  return <ContactoPage />;
}
