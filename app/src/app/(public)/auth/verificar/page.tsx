import type { Metadata } from "next";
import VerificarPage from "./verificar-content";

export const metadata: Metadata = {
  title: "Verificar Cuenta",
  description:
    "Verifica tu cuenta de Merkley Details para completar el registro.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <VerificarPage />;
}
