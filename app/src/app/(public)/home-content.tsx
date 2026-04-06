"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Package,
  FileText,
  Shield,
  Sparkles,
  Calendar,
  Building2,
  Gift,
  Star,
  Users,
  TrendingUp,
  Heart,
  PartyPopper,
  Award,
  ShoppingCart,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { useBootstrap } from "@/hooks/use-catalog";
import { useSeasons } from "@/hooks/use-seasons";
import { useFeaturedClients } from "@/hooks/use-clients";
import { useRecentBlogPosts } from "@/hooks/use-blog";
import { trackCtaClick } from "@/lib/analytics";

/** Hook to defer rendering until element is near the viewport. */
function useLazySection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

const STEPS = [
  {
    icon: Package,
    step: "01",
    title: "Explora el Catálogo",
    description:
      "Navega nuestro catálogo con precios personalizados según tu perfil. Filtra por temporada, categoría o presupuesto.",
  },
  {
    icon: FileText,
    step: "02",
    title: "Solicita Cotización",
    description:
      "Agrega productos a tu cotización con cantidades y personalización. Recibe respuesta en menos de 24 horas.",
  },
  {
    icon: Shield,
    step: "03",
    title: "Aprueba y Paga",
    description:
      "Revisa tu cotización, sube tu orden de compra o carta de responsabilidad, y confirma el pedido.",
  },
  {
    icon: Sparkles,
    step: "04",
    title: "Recibe tu Pedido",
    description:
      "Seguimiento en tiempo real desde producción hasta entrega. Personalización con tu logo y colores.",
  },
];

const USE_CASES = [
  {
    icon: PartyPopper,
    title: "Eventos Corporativos",
    description: "Regalos para conferencias, lanzamientos y celebraciones de empresa.",
    categoryKey: "Regalos Corporativos",
    color: "from-pink-500/20 to-rose-500/10",
  },
  {
    icon: Gift,
    title: "Regalos de Fin de Año",
    description: "Canastas navideñas, sets gourmet y detalles para empleados y clientes.",
    categoryKey: "Navidad y Fin de Año",
    color: "from-amber-500/20 to-orange-500/10",
  },
  {
    icon: Award,
    title: "Reconocimientos",
    description: "Premios, trofeos personalizados y kits de bienvenida para nuevos empleados.",
    categoryKey: "Artículos Promocionales",
    color: "from-blue-500/20 to-cyan-500/10",
  },
  {
    icon: Heart,
    title: "Fechas Especiales",
    description: "Día de las Madres, San Valentín, aniversarios y celebraciones especiales.",
    categoryKey: "Ocasiones y Celebraciones",
    color: "from-purple-500/20 to-violet-500/10",
  },
];

const STATS = [
  { value: "500+", label: "Empresas atendidas", icon: Building2 },
  { value: "10,000+", label: "Productos entregados", icon: TrendingUp },
  { value: "98%", label: "Satisfacción del cliente", icon: Star },
  { value: "24h", label: "Tiempo de respuesta", icon: Users },
];

const MONTH_NAMES: Record<number, string> = {
  1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
  5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
  9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
};

export default function HomePage() {
  const { data: bootstrap } = useBootstrap();

  // Defer rendering of heavy below-fold sections until near viewport
  const categoriesSection = useLazySection();

  const { data: seasonsData } = useSeasons();
  const { data: clientsData } = useFeaturedClients();
  const { data: blogData } = useRecentBlogPosts(3);
  const recentPosts = blogData?.posts || [];
  const allSeasons = seasonsData?.seasons || [];
  const activeSeasons = allSeasons.filter((s) => s.is_active);
  const featuredClients = (clientsData?.clients || []).filter((c) => c.logo);

  // Build a map of category name → image from category tree
  const categoryImageMap = new Map<string, string>();
  for (const cat of bootstrap?.filters?.category_tree || []) {
    if (cat.image) categoryImageMap.set(cat.name, cat.image);
    for (const child of cat.children || []) {
      if (child.image) categoryImageMap.set(child.name, child.image);
    }
  }

  return (
    <>
      {/* ── Hero with Lifestyle Photo ── */}
      <section className="relative min-h-[60vh] overflow-hidden">
        {/* Background: lifestyle photo placeholder with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-soft via-white to-surface-muted" />
        {/*
          Lifestyle photo placeholder — replace src with your actual hero image.
          Ideal: corporate gift boxes on a polished desk, team celebration, or
          beautifully arranged canastas with branded packaging.
        */}
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_40%,rgba(255,168,183,0.4),transparent_60%),radial-gradient(circle_at_70%_60%,rgba(255,168,183,0.3),transparent_50%)]" />
        </div>

        <Container className="relative py-20 md:py-32 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Proveedor B2B · República Dominicana
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Precios transparentes.{" "}
              <span className="text-primary">Cotizaciones al instante.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted">
              Regalos corporativos desde 12 unidades, precios por volumen visibles al instante. Sin llamadas ni esperas largas.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                rounded="full"
                className="w-full sm:w-auto text-base"
                asChild
                onClick={() => trackCtaClick("ver_catalogo", "hero")}
              >
                <Link href="/catalogo">
                  Ver Catálogo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                rounded="full"
                className="w-full sm:w-auto text-base bg-white/80 backdrop-blur-sm"
                asChild
                onClick={() => trackCtaClick("crear_cuenta", "hero")}
              >
                <Link href="/auth/registro">
                  Crear Cuenta Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted">
              <span>Sin compromiso</span>
              <span className="hidden sm:inline">&middot;</span>
              <span>Desde 12 unidades</span>
              <span className="hidden sm:inline">&middot;</span>
              <span>Cotización al instante</span>
            </p>
          </div>
        </Container>
      </section>

      {/* ── Testimonials (moved up for early trust) ── */}
      <section className="border-t border-border bg-white py-20">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Lo que dicen nuestros clientes
            </h2>
            <p className="mt-3 text-muted">
              Empresas de toda República Dominicana confían en nosotros para sus detalles corporativos.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                role: "Coordinadora de Compras",
                company: "Firma de Abogados",
                text: "Llegó el pedido y todo está hermoso. El tiempo de espera fue excelente.",
                rating: 5,
              },
              {
                role: "Encargada de Eventos",
                company: "Club Social",
                text: "Excelente, les encantó el detalle, mil gracias por su buen trabajo.",
                rating: 5,
              },
              {
                role: "Asistente Administrativa",
                company: "Zona Franca",
                text: "Por eso es que pongo en las manos de ustedes mis regalos. Ustedes son los mejores.",
                rating: 5,
              },
              {
                role: "Gerente de RRHH",
                company: "Empresa de Seguros",
                text: "Hermoso! Tú hermosa orden, estamos encantados.",
                rating: 5,
              },
              {
                role: "Encargada de Compras",
                company: "Empresa de Servicios",
                text: "Ya recibí, muchas gracias, están hermosos.",
                rating: 5,
              },
              {
                role: "Coordinadora de Finanzas",
                company: "Firma Legal",
                text: "Muchísimas gracias. Todo bello.",
                rating: 5,
              },
            ].map((t, idx) => (
              <Card key={idx} className="border-border/60">
                <CardContent className="p-6">
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-muted">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="mt-4 border-t border-border/40 pt-4">
                    <p className="text-sm font-semibold">{t.role}</p>
                    <p className="text-xs text-muted">{t.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Social Proof Bar ── */}
      <section className="border-y border-border bg-white py-8">
        <Container>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 min-h-[88px]">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center text-center">
                  <Icon className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── How it Works ── */}
      <section className="py-20">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              ¿Cómo funciona?
            </h2>
            <p className="mt-3 text-muted">
              Un proceso simple y transparente para tus pedidos corporativos.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.title} className="relative border-0 bg-surface-muted/50">
                  <CardContent className="p-6">
                    <span className="absolute right-4 top-4 text-3xl font-bold text-primary/10">
                      {step.step}
                    </span>
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" rounded="full" asChild>
              <Link href="/cotizaciones/nueva">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Empezar cotización
              </Link>
            </Button>
            <a
              href={`https://wa.me/18093735131?text=${encodeURIComponent("Hola, me gustaría cotizar regalos corporativos.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-base font-medium transition-colors hover:bg-surface-muted"
            >
              <MessageCircle className="h-4 w-4" />
              Hablar con un asesor
            </a>
          </div>
        </Container>
      </section>

      {/* ── Use Case Gallery: "Soluciones para cada ocasión" ── */}
      <section className="border-t border-border bg-surface-muted/30 py-20">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Soluciones para cada ocasión
            </h2>
            <p className="mt-3 text-muted">
              Desde eventos corporativos hasta fechas especiales, tenemos el detalle perfecto.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {USE_CASES.map((uc) => {
              const Icon = uc.icon;
              const ucImage = categoryImageMap.get(uc.categoryKey) || null;
              return (
                <Link
                  key={uc.title}
                  href={`/catalogo?category=${encodeURIComponent(uc.categoryKey)}`}
                  onClick={() => trackCtaClick("use_case", uc.title)}
                  className="group"
                >
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                    <CardContent className="p-0">
                      <div className={`relative flex h-48 items-center justify-center bg-gradient-to-br ${uc.color}`}>
                        {ucImage ? (
                          <Image
                            src={ucImage}
                            alt={uc.title}
                            fill
                            loading="lazy"
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <Icon className="h-16 w-16 text-foreground/20 transition-transform group-hover:scale-110" />
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-semibold group-hover:text-primary">
                          {uc.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted">{uc.description}</p>
                        <span className="mt-3 inline-flex items-center text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
                          Ver productos <ArrowRight className="ml-1 h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── Browse by Category (lazy) ── */}
      <div ref={categoriesSection.ref} />
      {categoriesSection.visible && bootstrap?.filters?.category_tree && bootstrap.filters.category_tree.length > 0 && (
        <section className="border-t border-border bg-white py-20">
          <Container>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Explora por Categoría
              </h2>
              <p className="mt-3 text-muted">
                Encuentra el detalle perfecto navegando nuestras categorías principales.
              </p>
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {bootstrap.filters.category_tree.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/catalogo?category=${encodeURIComponent(cat.name)}`}
                  onClick={() => trackCtaClick("category_browse", cat.name)}
                  className="group"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-muted">
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <Package className="h-10 w-10 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">
                        {cat.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-white/70">
                        {cat.product_count} producto{cat.product_count !== 1 && "s"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" rounded="full" asChild>
                <Link
                  href="/catalogo"
                  onClick={() => trackCtaClick("ver_catalogo", "categories")}
                >
                  Ver catálogo completo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Container>
        </section>
      )}

      {/* ── Client Logos Auto-Slider ── (hidden until logos are uploaded) */}
      {false && (<section className="overflow-hidden py-16">
        <Container>
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted">
              Confían en nosotros
            </p>
          </div>

          {featuredClients.length > 0 ? (
            <>
              {/* Infinite scroll wrapper — duplicated logos for seamless loop */}
              <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />
                <div className="flex animate-marquee items-center gap-12">
                  {/* First set */}
                  {featuredClients.map((client) => (
                    <div
                      key={client.company_name}
                      className="flex h-16 w-36 shrink-0 items-center justify-center opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
                      title={client.company_name}
                    >
                      <Image
                        src={client.logo!}
                        alt={client.company_name}
                        width={144}
                        height={64}
                        className="max-h-12 w-auto object-contain"
                      />
                    </div>
                  ))}
                  {/* Duplicate for seamless infinite scroll */}
                  {featuredClients.map((client) => (
                    <div
                      key={`dup-${client.company_name}`}
                      className="flex h-16 w-36 shrink-0 items-center justify-center opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
                      title={client.company_name}
                      aria-hidden="true"
                    >
                      <Image
                        src={client.logo!}
                        alt={client.company_name}
                        width={144}
                        height={64}
                        className="max-h-12 w-auto object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  rounded="full"
                  asChild
                  onClick={() => trackCtaClick("ver_clientes", "logo_strip")}
                >
                  <Link href="/nuestros-clientes">
                    Ver nuestros clientes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 items-center gap-8 opacity-40 grayscale sm:grid-cols-4 md:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex h-12 items-center justify-center rounded-lg bg-surface-muted"
                  >
                    <Building2 className="h-6 w-6 text-muted" />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-muted">
                Empresas de todos los sectores confían en nosotros para sus detalles corporativos
              </p>
            </>
          )}
        </Container>
      </section>)}

      {/* ── Active Seasons ── */}
      {activeSeasons.length > 0 && (
        <section className="border-t border-border py-20">
          <Container>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Temporadas Activas
              </h2>
              <p className="mt-3 text-muted">
                Colecciones disponibles para pedidos ahora mismo.
              </p>
            </div>

            <div className={`grid gap-6 ${activeSeasons.length === 1 ? "max-w-xl mx-auto" : activeSeasons.length === 2 ? "sm:grid-cols-2 max-w-3xl mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {activeSeasons.map((s) => (
                <Link key={s.name} href={`/temporada/${s.slug}`}>
                  <Card className="group cursor-pointer overflow-hidden border-primary/30 transition-shadow hover:shadow-lg">
                    <CardContent className="p-0">
                      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
                        {s.banner_image && (
                          <Image
                            src={s.banner_image}
                            alt={s.season_name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <Badge variant="default" className="mb-1.5">
                            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                            Temporada Activa
                          </Badge>
                          <h3 className="text-xl font-bold text-white">{s.season_name}</h3>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs text-muted mb-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {s.end_day} de {MONTH_NAMES[s.month]}
                          {s.product_count > 0 && (
                            <span className="ml-auto text-xs font-medium text-primary">
                              {s.product_count} producto{s.product_count !== 1 && "s"}
                            </span>
                          )}
                        </div>
                        {s.description && (
                          <p className="line-clamp-2 text-sm text-muted">{s.description}</p>
                        )}
                        <span className="mt-3 inline-flex items-center text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
                          Ver colección <ArrowRight className="ml-1 h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" rounded="full" asChild>
                <Link href="/temporadas">
                  Ver todas las temporadas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Container>
        </section>
      )}

      {/* ── Recent Blog Posts ── */}
      {recentPosts.length > 0 && (
        <section className="border-t border-border bg-surface-muted/30 py-20">
          <Container>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Desde nuestro blog
              </h2>
              <p className="mt-3 text-muted">
                Ideas y tendencias para tus próximos detalles corporativos.
              </p>
            </div>
            <div className={`grid gap-6 ${recentPosts.length === 1 ? "max-w-md mx-auto" : recentPosts.length === 2 ? "sm:grid-cols-2 max-w-3xl mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {recentPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                    <CardContent className="p-0">
                      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary/10 to-surface-muted">
                        {post.cover_image ? (
                          <Image
                            src={post.cover_image}
                            alt={post.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="text-4xl font-bold text-primary/20">MD</span>
                          </div>
                        )}
                        {post.category && (
                          <div className="absolute left-3 top-3">
                            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-xs">
                              {post.category}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        {post.published_on && (
                          <p className="mb-1.5 flex items-center gap-1 text-xs text-muted">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.published_on + "T00:00:00").toLocaleDateString("es-DO", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                        )}
                        <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        {post.summary && (
                          <p className="mt-1.5 text-sm text-muted line-clamp-2">{post.summary}</p>
                        )}
                        <span className="mt-3 inline-flex items-center text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
                          Leer más <ArrowRight className="ml-1 h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" rounded="full" asChild>
                <Link href="/blog">
                  Ver todos los artículos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Container>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="border-t border-border bg-gradient-to-r from-primary-soft to-surface-muted py-20">
        <Container size="sm" className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            ¿Listo para tu próximo pedido?
          </h2>
          <p className="mt-4 text-lg text-muted">
            Crea tu cuenta y accede a precios exclusivos, catálogos personalizados con tu logo
            y un proceso de cotización sin complicaciones.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-primary" /> Proceso seguro</span>
            <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-primary" /> Precios exclusivos</span>
            <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-primary" /> Personalización total</span>
          </div>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              rounded="full"
              asChild
              onClick={() => trackCtaClick("crear_cuenta", "bottom_cta")}
            >
              <Link href="/auth/registro">
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              rounded="full"
              asChild
              onClick={() => trackCtaClick("ver_catalogo", "bottom_cta")}
            >
              <Link href="/catalogo">
                Ver Catálogo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted">
            Registro gratuito &middot; Sin tarjeta de crédito &middot; Cancela cuando quieras
          </p>
        </Container>
      </section>
    </>
  );
}