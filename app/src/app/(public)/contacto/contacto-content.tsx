"use client";

import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBootstrap } from "@/hooks/use-catalog";
import { trackContactClick, trackWhatsAppClick } from "@/lib/analytics";

/** Format a raw digit string like "8093735131" into "(809) 373-5131" */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

export default function ContactoPage() {
  const { data: bootstrap, isLoading } = useBootstrap();
  const contact = bootstrap?.contact;

  const phone = contact?.phone || "";
  const email = contact?.email || "";
  const whatsapp = contact?.whatsapp || "";
  const address = contact?.address || [];
  const schedule = contact?.schedule || [];

  // Build tel: link (just digits with country code)
  const phoneDigits = phone.replace(/\D/g, "");
  const telHref = phoneDigits ? `tel:+1${phoneDigits}` : "";
  const waHref = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : "";

  const contactCards = [
    {
      icon: MapPin,
      title: "Ubicación",
      lines: address,
      href: "",
    },
    {
      icon: Phone,
      title: "Teléfono",
      lines: [formatPhone(phone)],
      href: telHref,
    },
    {
      icon: Mail,
      title: "Correo electrónico",
      lines: [email],
      href: email ? `mailto:${email}` : "",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      lines: [formatPhone(phone)],
      href: waHref,
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-soft via-white to-surface-muted">
        <Container className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary">
              <Building2 className="h-3.5 w-3.5" />
              Estamos para ti
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Contacto
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted">
              Estamos aquí para ayudarte con tu próximo pedido corporativo.
              Contáctanos por el canal que prefieras y te responderemos a la
              brevedad.
            </p>
          </div>
        </Container>
      </section>

      {/* Contact Cards */}
      <section className="py-20">
        <Container>
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {contactCards.map((info) => {
                const Icon = info.icon;
                const content = (
                  <Card
                    className={`h-full border-0 bg-surface-muted/50 transition-shadow ${
                      info.href ? "cursor-pointer hover:shadow-md" : ""
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold">{info.title}</h3>
                      <div className="mt-2 space-y-0.5">
                        {info.lines.map((line) => (
                          <p key={line} className="text-sm text-muted">
                            {line}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );

                if (info.href) {
                  return (
                    <a
                      key={info.title}
                      href={info.href}
                      target={info.href.startsWith("http") ? "_blank" : undefined}
                      rel={info.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      onClick={() => {
                        const method = info.title.toLowerCase();
                        trackContactClick(method);
                        if (method === "whatsapp") trackWhatsAppClick("contact_page");
                      }}
                    >
                      {content}
                    </a>
                  );
                }

                return <div key={info.title}>{content}</div>;
              })}
            </div>
          )}
        </Container>
      </section>

      {/* Schedule + How to order */}
      <section className="border-t border-border bg-surface-muted/30 py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Schedule */}
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Horario de Atención
                </h2>
              </div>
              <Card>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="space-y-2 p-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-6 rounded" />
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {schedule.map((item) => (
                        <div
                          key={item.day}
                          className="flex items-center justify-between px-6 py-4"
                        >
                          <span className="text-sm font-medium">{item.day}</span>
                          <span
                            className={`text-sm ${
                              item.hours === "Cerrado"
                                ? "font-medium text-destructive"
                                : "text-muted"
                            }`}
                          >
                            {item.hours}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* How to order */}
            <div>
              <h2 className="mb-6 text-2xl font-bold tracking-tight">
                ¿Cómo hacer tu pedido?
              </h2>
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Crea tu cuenta",
                    description:
                      "Registra tu empresa en nuestra plataforma para acceder a precios exclusivos y cotizaciones personalizadas.",
                  },
                  {
                    step: "2",
                    title: "Explora el catálogo",
                    description:
                      "Navega por nuestras categorías y encuentra los productos ideales para tu ocasión. Filtra por nivel, temporada o tipo.",
                  },
                  {
                    step: "3",
                    title: "Solicita cotización",
                    description:
                      "Agrega productos a tu cotización, indica cantidades y opciones de personalización. Recibe tu presupuesto al instante.",
                  },
                  {
                    step: "4",
                    title: "Recibe tu pedido",
                    description:
                      "Una vez aprobada tu cotización, coordinamos la producción y entrega directamente en tu empresa.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-gradient-to-r from-primary-soft to-surface-muted py-20">
        <Container size="sm" className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            ¿Listo para empezar?
          </h2>
          <p className="mt-4 text-lg text-muted">
            Crea tu cuenta y comienza a explorar nuestro catálogo con precios
            exclusivos para tu empresa.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" rounded="full" asChild>
              <Link href="/auth/registro">
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" rounded="full" asChild>
              <Link href="/catalogo">Ver Catálogo</Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
