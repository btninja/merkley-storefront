import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordContent from "./reset-password-content";
import { Card, CardContent } from "@/components/ui/card";
import { KeyRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  description: "Establece una nueva contraseña para tu cuenta de Merkley Details.",
  openGraph: {
    title: "Nueva contraseña | Merkley Details",
    description: "Establece una nueva contraseña para tu cuenta de Merkley Details.",
  },
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <section className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-gradient-to-br from-primary-soft via-white to-surface-muted py-12">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Cargando...</h1>
            </CardContent>
          </Card>
        </section>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
