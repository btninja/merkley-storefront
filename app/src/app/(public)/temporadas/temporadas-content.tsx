"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowLeft, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeasons } from "@/hooks/use-seasons";

const MONTH_NAMES: Record<number, string> = {
  1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr",
  5: "May", 6: "Jun", 7: "Jul", 8: "Ago",
  9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic",
};

const MONTH_FULL: Record<number, string> = {
  1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
  5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
  9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
};

export default function TemporadasContent() {
  const { data, isLoading } = useSeasons();
  const allSeasons = data?.seasons || [];

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curDay = now.getDate();

  const activeSeasons = allSeasons.filter((s) => s.is_active);
  const upcomingSeasons = allSeasons.filter((s) => {
    if (s.is_active) return false;
    if (s.month < curMonth || (s.month === curMonth && s.end_day < curDay)) return false;
    return true;
  });
  const pastSeasons = allSeasons.filter((s) => {
    if (s.is_active) return false;
    return s.month < curMonth || (s.month === curMonth && s.end_day < curDay);
  });

  // Group upcoming by month for timeline
  const upcomingByMonth = upcomingSeasons.reduce<Record<number, typeof upcomingSeasons>>((acc, s) => {
    if (!acc[s.month]) acc[s.month] = [];
    acc[s.month].push(s);
    return acc;
  }, {});
  const upcomingMonths = Object.keys(upcomingByMonth).map(Number).sort((a, b) => a - b);

  return (
    <>
      {/* Hero header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-soft via-white to-surface-muted">
        <Container className="py-16 md:py-20">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Nuestras{" "}
              <span className="text-primary">Temporadas</span>
            </h1>
            <p className="mt-4 text-lg text-muted leading-relaxed">
              Colecciones curadas para cada ocasión especial del año.
              Ordena con anticipación para asegurar disponibilidad.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-12 md:py-16">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-2xl" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ── Active Seasons — Feature cards ── */}
            {activeSeasons.length > 0 && (
              <div className="mb-16">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-green-700">
                      Disponibles ahora
                    </span>
                  </div>
                </div>

                <div className={`grid gap-5 ${
                  activeSeasons.length === 1
                    ? "max-w-2xl"
                    : activeSeasons.length === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-2 lg:grid-cols-3"
                }`}>
                  {activeSeasons.map((s) => (
                    <Link key={s.name} href={`/temporada/${s.slug}`} className="group block">
                      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
                        {/* Image / gradient area */}
                        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary/20 via-primary/8 to-primary-soft">
                          {s.banner_image && (
                            <Image
                              src={s.banner_image}
                              alt={s.season_name}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-5">
                            <h3 className="text-xl font-bold text-white drop-shadow-sm">
                              {s.season_name}
                            </h3>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          <div className="flex items-center justify-between text-sm text-muted">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              Hasta el {s.end_day} de {MONTH_FULL[s.month]}
                            </span>
                            {s.product_count > 0 && (
                              <Badge variant="secondary" className="text-xs font-medium">
                                {s.product_count} producto{s.product_count !== 1 && "s"}
                              </Badge>
                            )}
                          </div>
                          {s.description && (
                            <p className="mt-3 line-clamp-2 text-sm text-muted leading-relaxed">
                              {s.description}
                            </p>
                          )}
                          <div className="mt-4 flex items-center text-sm font-semibold text-primary transition-transform group-hover:translate-x-1">
                            Ver colección
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Upcoming Seasons — Timeline ── */}
            {upcomingMonths.length > 0 && (
              <div className="mb-16">
                <h2 className="mb-8 text-xl font-bold tracking-tight">
                  Próximamente
                </h2>

                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[23px] top-2 bottom-2 hidden w-px bg-border md:block" />

                  <div className="space-y-8">
                    {upcomingMonths.map((month) => (
                      <div key={month} className="relative flex gap-6">
                        {/* Month marker */}
                        <div className="hidden flex-shrink-0 md:flex md:flex-col md:items-center">
                          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft border-2 border-primary/20">
                            <span className="text-xs font-bold text-primary uppercase">
                              {MONTH_NAMES[month]}
                            </span>
                          </div>
                        </div>

                        {/* Season cards for this month */}
                        <div className="flex-1">
                          <div className="mb-3 md:hidden">
                            <span className="text-sm font-bold text-primary">
                              {MONTH_FULL[month]}
                            </span>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {upcomingByMonth[month].map((s) => (
                              <Link key={s.name} href={`/temporada/${s.slug}`} className="group block">
                                <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-white p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
                                  {/* Date circle */}
                                  <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-surface-muted">
                                    <span className="text-lg font-bold leading-none text-foreground">
                                      {s.end_day}
                                    </span>
                                    <span className="text-[10px] font-medium uppercase text-muted">
                                      {MONTH_NAMES[s.month]}
                                    </span>
                                  </div>

                                  {/* Info */}
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                      {s.season_name}
                                    </h3>
                                    <div className="mt-0.5 flex items-center gap-2">
                                      {s.product_count > 0 && (
                                        <span className="text-xs text-muted">
                                          {s.product_count} producto{s.product_count !== 1 && "s"}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted transition-all group-hover:text-primary group-hover:translate-x-0.5" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Past Seasons — Compact list ── */}
            {pastSeasons.length > 0 && (
              <div className="rounded-2xl bg-surface-muted/40 p-6 md:p-8">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
                  Temporadas anteriores
                </h2>
                <div className="flex flex-wrap gap-2">
                  {pastSeasons.map((s) => (
                    <Link key={s.name} href={`/temporada/${s.slug}`}>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-white px-3.5 py-1.5 text-sm text-muted transition-all hover:border-primary/40 hover:text-primary hover:shadow-sm">
                        {s.season_name}
                        <span className="text-xs text-muted-foreground">
                          · {MONTH_NAMES[s.month]}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {allSeasons.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft">
                  <Sparkles className="h-8 w-8 text-primary/60" />
                </div>
                <h3 className="text-xl font-semibold">No hay temporadas disponibles</h3>
                <p className="mt-2 max-w-sm text-muted">
                  Las temporadas se actualizan periódicamente. Vuelve pronto para ver nuestras nuevas colecciones.
                </p>
                <Button variant="outline" size="lg" rounded="full" className="mt-6" asChild>
                  <Link href="/catalogo">
                    Explorar catálogo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
    </>
  );
}
