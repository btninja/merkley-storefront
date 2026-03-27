import type { Metadata } from "next";
import ForgotPasswordContent from "./forgot-password-content";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Recupera el acceso a tu cuenta de Merkley Details.",
  openGraph: {
    title: "Recuperar contraseña | Merkley Details",
    description: "Recupera el acceso a tu cuenta de Merkley Details.",
  },
};

export default function Page() {
  return <ForgotPasswordContent />;
}
