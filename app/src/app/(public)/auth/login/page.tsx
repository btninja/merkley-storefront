import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPage from "./login-content";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description:
    "Inicia sesión en tu cuenta de Merkley Details para acceder a cotizaciones, pedidos y precios exclusivos.",
  openGraph: {
    title: "Iniciar Sesión | Merkley Details",
    description:
      "Inicia sesión en tu cuenta de Merkley Details para acceder a cotizaciones, pedidos y precios exclusivos.",
  },
};

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
