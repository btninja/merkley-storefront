"use client";

import { MessageCircle, ExternalLink } from "lucide-react";
import { useBootstrap } from "@/hooks/use-catalog";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SoportePage() {
  const { data: bootstrap } = useBootstrap();
  const whatsapp = bootstrap?.contact?.whatsapp || "";
  const supportEmail = bootstrap?.contact?.support_email || "";
  const brandName = bootstrap?.contact?.brand_name || "nuestro equipo";
  const digits = whatsapp.replace(/\D/g, "");
  const whatsappUrl = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(
        `Hola, necesito ayuda con mi cuenta en ${brandName}.`
      )}`
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Soporte"
        description="Estamos aquí para ayudarte"
      />

      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <MessageCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="mt-4">Escríbenos por WhatsApp</CardTitle>
          <CardDescription className="mt-2 leading-relaxed">
            Nuestro equipo está disponible de lunes a viernes de 9:00 AM a 6:00
            PM y sábados de 9:00 AM a 2:00 PM.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {whatsappUrl ? (
            <Button size="lg" className="bg-green-600 hover:bg-green-700 gap-2" asChild>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                Abrir WhatsApp
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted">
              Número de soporte no disponible.
              {supportEmail ? (
                <>
                  {" "}
                  Contacta a{" "}
                  <a
                    href={`mailto:${supportEmail}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {supportEmail}
                  </a>
                  .
                </>
              ) : null}
            </p>
          )}
          <p className="text-xs text-muted text-center">
            También puedes escribirnos directamente al{" "}
            <a href={`tel:+${digits}`} className="font-medium text-foreground hover:underline">
              {whatsapp || "soporte"}
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
