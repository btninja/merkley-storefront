import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enlaces",
  description:
    "Todos nuestros canales de contacto y redes sociales.",
  openGraph: {
    title: "Enlaces | Merkley Details",
    description:
      "Todos nuestros canales de contacto y redes sociales.",
  },
  robots: { index: false, follow: false },
};

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-primary-soft via-white to-surface-muted">
      {children}
    </div>
  );
}
