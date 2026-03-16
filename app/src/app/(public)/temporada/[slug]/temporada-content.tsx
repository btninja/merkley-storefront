"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Package, Calendar, ArrowLeft } from "lucide-react";
import { useSeasonProducts } from "@/hooks/use-seasons";
import { useBootstrap } from "@/hooks/use-catalog";
import { useDebounce } from "@/hooks/use-debounce";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard, ProductCardSkeleton, CatalogSkeleton } from "@/components/catalog/product-card";
import type { Product, SortOption } from "@/lib/types";

const SORT_OPTIONS: { value: SortOption | ""; label: string }[] = [
  { value: "newest", label: "Más recientes" },
  { value: "price_asc", label: "Precio ↑" },
  { value: "price_desc", label: "Precio ↓" },
  { value: "alpha", label: "A-Z" },
];

const MONTH_NAMES: Record<number, string> = {
  1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
  5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
  9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
};

export default function TemporadaContent() {
  return (
    <Suspense
      fallback={
        <section className="py-8">
          <Container>
            <Skeleton className="h-52 w-full rounded-xl" />
            <div className="mt-8">
              <CatalogSkeleton />
            </div>
          </Container>
        </section>
      }
    >
      <TemporadaInner />
    </Suspense>
  );
}

function TemporadaInner() {
  const params = useParams();
  const slug = params.slug as string;

  const [tier, setTier] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const { data: bootstrap } = useBootstrap();
  const { data, isLoading } = useSeasonProducts({ season: slug, page, tier, search: debouncedSearch || undefined });

  const tiers = bootstrap?.filters?.tiers || [];
  const season = data?.season;

  useEffect(() => {
    setAllProducts([]);
    setPage(1);
  }, [tier, debouncedSearch, category, sortBy]);

  useEffect(() => {
    if (data?.items) {
      setAllProducts((prev) => {
        if (page === 1) return data.items;
        const existingSkus = new Set(prev.map((p) => p.sku));
        const newItems = data.items.filter((p) => !existingSkus.has(p.sku));
        return [...prev, ...newItems];
      });
    }
  }, [data, page]);

  function clearSearch() {
    setSearchInput("");
  }

  const hasMore = data?.pagination?.has_more ?? false;
  const hasFilters = !!tier || !!debouncedSearch || !!category;

  // Collect unique categories from loaded products
  const productCategories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))] as string[];

  return (
    <>
      {/* Hero header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-soft via-white to-surface-muted">
        {season?.banner_image && (
          <Image
            src={season.banner_image}
            alt={season.season_name}
            fill
            className="object-cover opacity-10"
            sizes="100vw"
          />
        )}
        <Container className="relative z-10 py-12 md:py-16">
          <Link
            href="/temporadas"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Todas las temporadas
          </Link>

          {season && (
            <div className="max-w-2xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant={season.is_active ? "success" : "secondary"} className="text-xs">
                  {season.is_active ? "Temporada Activa" : "Temporada Anterior"}
                </Badge>
                {season.month && (
                  <span className="flex items-center gap-1.5 text-sm text-muted">
                    <Calendar className="h-3.5 w-3.5" />
                    Hasta el {season.end_day} de {MONTH_NAMES[season.month] || `Mes ${season.month}`}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {season.season_name}
              </h1>
              {season.description && (
                <p className="mt-3 text-lg text-muted leading-relaxed">
                  {season.description}
                </p>
              )}
              {!season.is_active && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm font-medium text-warning">
                  Los productos de esta temporada pueden tener tiempos de entrega extendidos.
                </p>
              )}
            </div>
          )}
        </Container>
      </section>

      <section className="py-6">
      <Container>
        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                type="text"
                placeholder="Buscar en esta temporada..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort pills */}
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={(sortBy || "newest") === opt.value ? "default" : "outline"}
                  size="sm"
                  rounded="full"
                  onClick={() => setSortBy(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Tier pills */}
          <div className="flex flex-wrap gap-2">
            <span className="self-center text-xs font-semibold uppercase tracking-wide text-muted mr-1">
              Nivel:
            </span>
            <Button
              variant={!tier ? "default" : "outline"}
              size="sm"
              rounded="full"
              onClick={() => setTier("")}
            >
              Todos
            </Button>
            {tiers.map((t) => (
              <Button
                key={t.tier}
                variant={tier === t.tier ? "default" : "outline"}
                size="sm"
                rounded="full"
                onClick={() => setTier(t.tier)}
              >
                {t.tier}
              </Button>
            ))}
          </div>

          {/* Category pills from loaded products */}
          {productCategories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <span className="self-center text-xs font-semibold uppercase tracking-wide text-muted mr-1">
                Categoría:
              </span>
              <Button
                variant={!category ? "default" : "outline"}
                size="sm"
                rounded="full"
                onClick={() => setCategory("")}
              >
                Todas
              </Button>
              {productCategories.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  rounded="full"
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Product grid */}
        <div className="mt-8">
          {isLoading && allProducts.length === 0 ? (
            <CatalogSkeleton />
          ) : filteredProducts(allProducts, category).length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">No se encontraron productos</h3>
              <p className="mt-1 max-w-sm text-sm text-muted">
                No hay productos disponibles en esta temporada con los filtros seleccionados.
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setTier("");
                    setCategory("");
                    setSearchInput("");
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                {filteredProducts(allProducts, category).map((product) => (
                  <ProductCard key={product.sku} product={product} />
                ))}
              </div>

              {hasMore && !category && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    rounded="full"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Cargando..." : "Cargar más"}
                  </Button>
                </div>
              )}

              {isLoading && allProducts.length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ProductCardSkeleton key={`loading-${i}`} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Container>
      </section>
    </>
  );
}

/** Client-side category filter on already loaded products. */
function filteredProducts(products: Product[], category: string): Product[] {
  if (!category) return products;
  return products.filter((p) => p.category === category);
}
