import type { Metadata } from "next";
import VerificarPage from "./verificar-content";

export const metadata: Metadata = {
  title: "Verificar Cuenta",
  description:
    "Verifica tu cuenta de Merkley Details para completar el registro.",
  robots: { index: false, follow: false },
  // The verification code is in the URL query string. Suppress Referer to
  // prevent leaking the code to any third-party origin (analytics, fonts, CDN)
  // loaded by the success/error redirect pages.
  referrer: "no-referrer",
};

export default function Page() {
  return <VerificarPage />;
}
