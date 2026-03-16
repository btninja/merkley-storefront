import type { Metadata } from "next";
import VerificarCorreoPage from "./verificar-correo-content";

export const metadata: Metadata = {
  title: "Verificar Correo Electrónico",
  description:
    "Verifica tu correo electrónico para activar tu cuenta de Merkley Details.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <VerificarCorreoPage />;
}
