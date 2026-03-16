import type { Metadata } from "next";
import RegistroPage from "./registro-content";

export const metadata: Metadata = {
  title: "Crear Cuenta",
  description:
    "Registra tu empresa en Merkley Details y accede a precios exclusivos, cotizaciones personalizadas y catálogos corporativos.",
  openGraph: {
    title: "Crear Cuenta | Merkley Details",
    description:
      "Registra tu empresa en Merkley Details y accede a precios exclusivos, cotizaciones personalizadas y catálogos corporativos.",
  },
};

export default function Page() {
  return <RegistroPage />;
}
