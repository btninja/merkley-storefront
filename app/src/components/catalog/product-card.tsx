"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, Plus, Palette } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/lib/types";

export function tierVariant(tier: string | null) {
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

export function availabilityVariant(label: string) {
  if (label === "Disponible") return "success" as const;
  if (label === "Bajo Pedido") return "warning" as const;
  return "secondary" as const;
}

export function ProductCard({ product }: { product: Product }) {
  const mainImage = product.images?.[0];
  const { addItem } = useCart();
  const { toast } = useToast();

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      item_code: product.sku,
      item_name: product.name,
      qty: Math.max(product.minimum_order_qty, 1),
      rate: product.price.amount ?? 0,
      customization_options: product.customization_options,
      is_personalizable: product.is_personalizable,
      image_url: product.images?.[0]?.url ?? null,
    });
    toast({
      title: "Producto agregado",
      description: `${product.name} se agregó a tu cotización.`,
    });
  }

  return (
    <Link href={`/catalogo/${product.slug}`} className="group">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-surface-muted">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={mainImage.label || product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {product.tier && (
              <Badge variant={tierVariant(product.tier)}>{product.tier}</Badge>
            )}
            {product.is_personalizable && (
              <Badge variant="info" className="gap-0.5 text-[10px]">
                <Palette className="h-2.5 w-2.5" />
                Personalizable
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          <div className="mb-1 flex items-center gap-2">
            {product.category && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {product.category}
              </p>
            )}
            {product.sku && (
              <p className="text-[10px] text-muted-foreground/60 font-mono">
                {product.sku}
              </p>
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
            {product.name}
          </h3>
          {product.short_description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
              {product.short_description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-base font-bold text-foreground">
              {product.price.amount != null
                ? formatCurrency(product.price.amount)
                : "Consultar"}
            </span>
            <Badge variant={availabilityVariant(product.availability.label)} className="text-[10px]">
              {product.availability.label}
            </Badge>
            <Button
              size="icon"
              className="ml-auto h-7 w-7 shrink-0 rounded-full shadow-sm transition-all sm:opacity-0 sm:group-hover:opacity-100"
              onClick={handleAddToCart}
              aria-label={`Agregar ${product.name} a cotización`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
