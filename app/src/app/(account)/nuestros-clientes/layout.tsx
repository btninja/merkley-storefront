import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuestros Clientes | Merkley Details",
  robots: { index: false, follow: false },
};

export default function NuestrosClientesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
