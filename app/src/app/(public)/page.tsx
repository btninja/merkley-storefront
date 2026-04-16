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

// LocalBusiness JSON-LD is already in the root layout — not duplicated here.

export default function Page() {
  return <HomePage />;
}
