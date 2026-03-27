"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  X,
  ChevronLeft,
  ChevronRight,
  Images,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/layout/container";
import { useClientPortfolio } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PortfolioClient } from "@/lib/types";

// ── Loading Skeleton ──

function PortfolioSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Lightbox ──

function ImageLightbox({
  client,
  imageIndex,
  onClose,
  onPrev,
  onNext,
}: {
  client: PortfolioClient;
  imageIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const img = client.portfolio_images[imageIndex];
  if (!img) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
          <Image
            src={img.image}
            alt={img.caption || `${client.company_name} - Proyecto ${imageIndex + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 80vw"
          />
        </div>

        {/* Caption */}
        {img.caption && (
          <p className="mt-3 text-center text-sm text-white/80">{img.caption}</p>
        )}

        {/* Navigation */}
        {client.portfolio_images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <p className="mt-1 text-center text-xs text-white/50">
              {imageIndex + 1} / {client.portfolio_images.length}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──

export default function NuestrosClientesPage() {
  const { data, isLoading } = useClientPortfolio();
  const clients = data?.clients || [];
  const totalCount = data?.total_count || 0;

  const [lightbox, setLightbox] = useState<{
    client: PortfolioClient;
    imageIndex: number;
  } | null>(null);

  function openLightbox(client: PortfolioClient, imageIndex: number) {
    setLightbox({ client, imageIndex });
  }

  function closeLightbox() {
    setLightbox(null);
  }

  function prevImage() {
    if (!lightbox) return;
    const total = lightbox.client.portfolio_images.length;
    setLightbox({
      ...lightbox,
      imageIndex: (lightbox.imageIndex - 1 + total) % total,
    });
  }

  function nextImage() {
    if (!lightbox) return;
    const total = lightbox.client.portfolio_images.length;
    setLightbox({
      ...lightbox,
      imageIndex: (lightbox.imageIndex + 1) % total,
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nuestros Clientes"
        description={
          totalCount > 0
            ? `${totalCount} empresas confían en Merkley Details para sus detalles corporativos`
            : "Empresas que confían en Merkley Details"
        }
      />

      {isLoading ? (
        <PortfolioSkeleton />
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted">
              <Building2 className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              Aún no hay clientes en el portafolio
            </p>
            <p className="mt-1 text-sm text-muted">
              Pronto se añadirán empresas que confían en nosotros.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const hasImages = client.portfolio_images.length > 0;
            return (
              <Card
                key={client.name}
                className={cn(
                  "overflow-hidden transition-shadow hover:shadow-md",
                  hasImages && "cursor-pointer"
                )}
                onClick={
                  hasImages ? () => openLightbox(client, 0) : undefined
                }
              >
                <CardContent className="p-6">
                  {/* Logo + Name */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white p-2">
                      {client.logo ? (
                        <Image
                          src={client.logo}
                          alt={client.company_name}
                          width={48}
                          height={48}
                          className="max-h-10 w-auto object-contain"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold leading-tight">
                        {client.company_name}
                      </h3>
                      {client.industry && (
                        <Badge variant="secondary" className="mt-1 text-[10px]">
                          {client.industry}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {client.short_description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                      {client.short_description}
                    </p>
                  )}

                  {/* Portfolio Images Preview */}
                  {hasImages && (
                    <div className="mt-4">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
                        <Images className="h-3 w-3" />
                        {client.portfolio_images.length} trabajos realizados
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {client.portfolio_images.slice(0, 3).map((img, idx) => (
                          <div
                            key={idx}
                            className="group relative aspect-square overflow-hidden rounded-md bg-surface-muted"
                          >
                            <Image
                              src={img.image}
                              alt={img.caption || `Proyecto ${idx + 1}`}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              sizes="120px"
                            />
                            {/* Show count overlay on the 3rd image if there are more */}
                            {idx === 2 && client.portfolio_images.length > 3 && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                                +{client.portfolio_images.length - 3}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox
          client={lightbox.client}
          imageIndex={lightbox.imageIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}

      {/* CTA */}
      <section className="mt-8 rounded-xl border border-border bg-gradient-to-r from-primary-soft to-surface-muted py-16">
        <Container size="sm" className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            ¿Listo para unirte a nuestros clientes?
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
    </div>
  );
}
