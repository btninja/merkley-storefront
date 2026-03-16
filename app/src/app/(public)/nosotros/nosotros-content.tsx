"use client";

import Link from "next/link";
import {
  Heart,
  Shield,
  Sparkles,
  Users,
  ArrowRight,
  Award,
  Handshake,
  Target,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const VALUES = [
  {
    icon: Heart,
    title: "Dedicación",
    description:
      "Cada detalle que creamos refleja cuidado y atención. Nos apasiona superar las expectativas de nuestros clientes en cada pedido.",
  },
  {
    icon: Sparkles,
    title: "Calidad",
    description:
      "Seleccionamos los mejores materiales y proveedores. Nuestros productos pasan por controles de calidad rigurosos antes de la entrega.",
  },
  {
    icon: Handshake,
    title: "Compromiso",
    description:
      "Cumplimos con los tiempos de entrega y respetamos los acuerdos. Tu confianza es nuestro activo más valioso.",
  },
  {
    icon: Target,
    title: "Personalización",
    description:
      "Entendemos que cada empresa es única. Adaptamos cada producto para reflejar tu marca, cultura y mensaje corporativo.",
  },
];

const STATS = [
  { value: "500+", label: "Empresas atendidas" },
  { value: "10,000+", label: "Productos entregados" },
  { value: "9", label: "Categorías disponibles" },
  { value: "98%", label: "Satisfacción del cliente" },
];

export default function NosotrosPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-soft via-white to-surface-muted">
        <Container className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary">
              <Award className="h-3.5 w-3.5" />
              Nuestra Historia
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Sobre <span className="text-primary">Merkley Details</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted">
              Somos una empresa dominicana especializada en detalles corporativos y
              regalos personalizados para empresas. Desde Santo Domingo, ayudamos a
              organizaciones de toda la República Dominicana a expresar
              agradecimiento, celebrar logros y fortalecer relaciones con sus equipos
              y clientes.
            </p>
          </div>
        </Container>
      </section>

      {/* About */}
      <section className="border-t border-border py-20">
        <Container>
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Detalles que conectan personas
            </h2>
            <p className="text-lg leading-relaxed text-muted">
              En Merkley Details creemos que un detalle bien pensado puede
              transformar la cultura de una empresa. Ya sea una canasta de
              bienvenida para un nuevo empleado, un reconocimiento para el empleado
              del mes, o un regalo ejecutivo para un cliente especial, cada producto
              que creamos está diseñado para generar una conexión auténtica.
            </p>
            <p className="text-lg leading-relaxed text-muted">
              Trabajamos con empresas de todos los tamaños, desde startups hasta
              corporaciones multinacionales con operaciones en República Dominicana.
              Nuestro proceso de cotización es transparente y eficiente, permitiendo
              a los equipos de Recursos Humanos, Marketing y Compras gestionar sus
              pedidos sin complicaciones.
            </p>
            <p className="text-lg leading-relaxed text-muted">
              Con opciones que van desde detalles esenciales hasta productos de lujo,
              nos adaptamos a cualquier presupuesto y ocasión. Ofrecemos
              personalización completa, incluyendo grabado, bordado, impresión de
              logos y empaque corporativo.
            </p>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="bg-surface-muted/50 py-16">
        <Container>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-20">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Nuestros Valores
            </h2>
            <p className="mt-3 text-lg text-muted">
              Los principios que guían cada aspecto de nuestro trabajo.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="border-0 bg-surface-muted/50">
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{value.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Who we serve */}
      <section className="border-t border-border py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary">
              <Users className="h-3.5 w-3.5" />
              Nuestros Clientes
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              ¿A quiénes servimos?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Atendemos a empresas de diversas industrias en República Dominicana,
              incluyendo servicios financieros, salud, hotelería, logística,
              educación y sector gobierno. Nuestro modelo B2B está diseñado para
              gestionar volúmenes desde 12 unidades hasta pedidos de miles de piezas.
            </p>
          </div>

          {/* Industry tags */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              "Servicios Financieros",
              "Salud",
              "Logística",
              "Hotelería",
              "Educación",
              "Gobierno",
              "Tecnología",
              "Telecomunicaciones",
            ].map((industry) => (
              <span
                key={industry}
                className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-foreground"
              >
                {industry}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-gradient-to-r from-primary-soft to-surface-muted py-20">
        <Container size="sm" className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            ¿Listo para trabajar con nosotros?
          </h2>
          <p className="mt-4 text-lg text-muted">
            Crea tu cuenta y comienza a explorar nuestro catálogo con precios
            exclusivos para tu empresa.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" rounded="full" asChild>
              <Link href="/catalogo">
                Ver Catálogo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" rounded="full" asChild>
              <Link href="/contacto">Contáctanos</Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
