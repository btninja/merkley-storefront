"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  Clock,
  Layers,
  ShoppingCart,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Palette,
  Check,
} from "lucide-react";
import { useProductDetail, useBootstrap } from "@/hooks/use-catalog";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { trackViewItem } from "@/lib/analytics";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductBreadcrumb } from "@/components/catalog/breadcrumb";

// ── Helpers ──

function tierVariant(tier: string | null) {
  switch (tier) {
    case "Esencial":
      return "secondary" as const;
    case "Premium":
      return "info" as const;
    case "Lujo":
      return "warning" as const;
    default:
      return "outline" as const;
  }
}

function availabilityVariant(label: string) {
  if (label === "Disponible") return "success" as const;
  if (label === "Bajo Pedido") return "warning" as const;
  return "secondary" as const;
}

function availabilityIcon(label: string) {
  if (label === "Disponible") return CheckCircle2;
  return AlertCircle;
}

// ── Loading Skeleton ──

function DetailSkeleton() {
  return (
    <section className="py-8">
      <Container>
        <Skeleton className="mb-6 h-5 w-32" />
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image skeleton */}
          <div>
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="mt-3 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-16 rounded-lg" />
              ))}
            </div>
          </div>
          {/* Info skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
            <Skeleton className="h-12 w-52 rounded-lg" />
          </div>
        </div>
      </Container>
    </section>
  );
}

// ── Main Page ──

export default function ProductDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : null;
  const { data, isLoading, error } = useProductDetail(slug);
  const { data: bootstrap } = useBootstrap();
  const { addItem, items } = useCart();
  const { toast } = useToast();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const categoryTree = bootstrap?.filters?.category_tree || [];

  // Track product view
  const itemForTracking = data?.item;
  useEffect(() => {
    if (itemForTracking) {
      trackViewItem(itemForTracking.sku, itemForTracking.name, itemForTracking.price?.amount ?? 0, itemForTracking.category);
    }
  }, [itemForTracking?.sku]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <DetailSkeleton />;

  if (error || !data?.item) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center bg-gradient-to-br from-primary-soft via-white to-surface-muted py-20">
        <Container size="sm" className="text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground/40" />
          <h1 className="text-2xl font-bold">Producto no encontrado</h1>
          <p className="mt-2 text-muted">
            El producto que buscas no existe o fue removido del catálogo.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/catalogo">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al catálogo
            </Link>
          </Button>
        </Container>
      </section>
    );
  }

  // After the guard above, data.item is guaranteed to be defined
  const product = data.item;
  const images = product.images || [];
  const activeImage = images[activeImageIdx] || null;
  const AvailIcon = availabilityIcon(product.availability.label);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description || product.description?.replace(/<[^>]*>/g, "") || undefined,
    image: images.length > 0 ? images.map((img) => img.url) : undefined,
    url: `https://merkleydetails.com/catalogo/${product.slug}`,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: "Merkley Details",
    },
    offers: {
      "@type": "Offer",
      url: `https://merkleydetails.com/catalogo/${product.slug}`,
      priceCurrency: "DOP",
      price: product.price.amount ?? undefined,
      availability:
        product.availability.label === "Disponible"
          ? "https://schema.org/InStock"
          : product.availability.label === "Bajo Pedido"
            ? "https://schema.org/PreOrder"
            : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
    />
    {/* Breadcrumb hero strip */}
    <section className="bg-gradient-to-br from-primary-soft via-white to-surface-muted">
      <Container className="py-4">
        <ProductBreadcrumb
          category={product.category}
          productName={product.name}
          categoryTree={categoryTree}
        />
      </Container>
    </section>

    <section className="py-8">
      <Container>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ── Image Gallery ── */}
          <div>
            {/* Main image */}
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-muted">
              {activeImage ? (
                <Image
                  src={activeImage.url}
                  alt={activeImage.label || product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-20 w-20 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      idx === activeImageIdx
                        ? "border-primary"
                        : "border-border hover:border-muted"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.label || `Imagen ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div>
            {/* Category + Tier */}
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {product.category}
                </span>
              )}
              {product.tier && (
                <Badge variant={tierVariant(product.tier)}>{product.tier}</Badge>
              )}
            </div>

            {/* Name */}
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {product.name}
            </h1>

            {/* Availability */}
            <div className="mt-3 flex items-center gap-2">
              <Badge variant={availabilityVariant(product.availability.label)} className="gap-1">
                <AvailIcon className="h-3 w-3" />
                {product.availability.label}
              </Badge>
              {product.availability.stock_qty != null && product.availability.stock_qty > 0 && (
                <span className="text-xs text-muted">
                  {product.availability.stock_qty} unidades en stock
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mt-4">
              {product.price.amount != null ? (
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(product.price.amount)}
                </p>
              ) : (
                <p className="text-lg font-medium text-muted">
                  Precio disponible al iniciar sesión
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted">
                Precio unitario &middot; {product.price.currency} &middot; ITBIS no incluido
              </p>
            </div>

            <Separator className="my-5" />

            {/* Description */}
            {product.description && (
              <div className="prose prose-sm max-w-none text-foreground">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                  Descripción
                </h3>
                <div
                  className="text-sm leading-relaxed text-muted [&_p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {/* Components */}
            {product.components.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
                  <Layers className="h-4 w-4" />
                  Componentes
                </h3>
                <ul className="space-y-2">
                  {product.components.map((comp, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm"
                    >
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <div>
                        <span className="font-medium">{comp.label}</span>
                        {comp.description && (
                          <span className="ml-1 text-muted">&mdash; {comp.description}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Order details — only show when values are meaningful */}
            {(product.minimum_order_qty > 1 || product.lead_time_days > 0) && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {product.minimum_order_qty > 1 && (
              <Card className="border-0 bg-surface-muted">
                <CardContent className="flex items-center gap-3 p-4">
                  <ShoppingCart className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted">Pedido mínimo</p>
                    <p className="text-sm font-semibold">
                      {product.minimum_order_qty} unidades
                    </p>
                  </div>
                </CardContent>
              </Card>
              )}
              {product.lead_time_days > 0 && (
              <Card className="border-0 bg-surface-muted">
                <CardContent className="flex items-center gap-3 p-4">
                  <Clock className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted">Tiempo de entrega</p>
                    <p className="text-sm font-semibold">
                      {product.lead_time_days} {product.lead_time_days === 1 ? "día" : "días"}
                    </p>
                  </div>
                </CardContent>
              </Card>
              )}
            </div>
            )}

            {/* Customization */}
            {product.is_personalizable && (
              <div className="mt-5">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
                  <Palette className="h-4 w-4" />
                  Personalización
                </h3>
                <p className="rounded-lg bg-surface-muted px-4 py-3 text-sm leading-relaxed text-foreground">
                  {product.customization_options}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                rounded="full"
                onClick={() => {
                  addItem({
                    item_code: product.sku,
                    item_name: product.name,
                    qty: Math.max(product.minimum_order_qty, 1),
                    rate: product.price.amount ?? 0,
                    customization_options: product.customization_options,
                    is_personalizable: product.is_personalizable,
                    image_url: product.images[0]?.url || null,
                  });
                  setJustAdded(true);
                  toast({
                    title: "Producto agregado",
                    description: `${product.name} fue agregado a tu cotización.`,
                    variant: "success",
                  });
                  setTimeout(() => setJustAdded(false), 2000);
                }}
              >
                {justAdded ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
                {justAdded
                  ? "Agregado"
                  : items.some((i) => i.item_code === product.sku)
                    ? "Agregar Más"
                    : "Agregar a Cotización"}
              </Button>
              {items.length > 0 && (
                <Button variant="outline" size="lg" rounded="full" asChild>
                  <Link href="/cotizaciones/nueva">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Ver Cotización ({items.reduce((s, i) => s + i.qty, 0)})
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="lg" rounded="full" asChild>
                <Link href="/catalogo">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Catálogo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
    </>
  );
}
