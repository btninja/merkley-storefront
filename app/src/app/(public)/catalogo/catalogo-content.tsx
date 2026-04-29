"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, SlidersHorizontal, Package } from "lucide-react";
import { useProducts, useBootstrap } from "@/hooks/use-catalog";
import { useDebounce } from "@/hooks/use-debounce";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ProductCard, CatalogSkeleton, ProductCardSkeleton } from "@/components/catalog/product-card";
import { CatalogBreadcrumb } from "@/components/catalog/breadcrumb";
import { FilterSidebar } from "@/components/catalog/filter-sidebar";
import { CatalogCtaBar } from "@/components/catalog/catalog-cta-bar";
import { trackViewItemList, trackSearch, trackFilterUsed } from "@/lib/analytics";
import type { Product, SortOption } from "@/lib/types";

const SORT_OPTIONS: { value: SortOption | ""; label: string }[] = [
  { value: "newest", label: "Más recientes" },
  { value: "price_asc", label: "Precio ↑" },
  { value: "price_desc", label: "Precio ↓" },
  { value: "alpha", label: "A-Z" },
];

export default function CatalogoPage() {
  return (
    <Suspense
      fallback={
        <section className="py-8">
          <Container>
            <CatalogSkeleton />
          </Container>
        </section>
      }
    >
      <CatalogoContent />
    </Suspense>
  );
}

function CatalogoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [tier, setTier] = useState(searchParams.get("tier") || "");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "");
  const [availability, setAvailability] = useState(searchParams.get("availability") || "");
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: bootstrap } = useBootstrap();
  const { data, isLoading } = useProducts({
    page,
    category,
    tier,
    search: debouncedSearch || undefined,
    sort_by: sortBy || undefined,
    availability: availability || undefined,
  });

  const categoryTree = bootstrap?.filters?.category_tree || [];
  const tiers = bootstrap?.filters?.tiers || [];
  const totalCount = data?.total_count ?? 0;

  // Reset accumulated products when filters change
  useEffect(() => {
    setAllProducts([]);
    setPage(1);
  }, [category, tier, debouncedSearch, sortBy, availability]);

  // Accumulate products for "load more"
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

  // Track catalog views and search queries
  useEffect(() => {
    if (data && page === 1) {
      trackViewItemList(category || "all", data.total_count);
      if (debouncedSearch) {
        trackSearch(debouncedSearch, data.total_count);
      }
    }
  }, [data, page, category, debouncedSearch]);

  // Sync filters to URL when debounced search changes
  useEffect(() => {
    const sp = new URLSearchParams();
    if (category) sp.set("category", category);
    if (tier) sp.set("tier", tier);
    if (debouncedSearch) sp.set("q", debouncedSearch);
    if (sortBy) sp.set("sort", sortBy);
    if (availability) sp.set("availability", availability);
    const qs = sp.toString();
    router.replace(`/catalogo${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router, category, tier, debouncedSearch, sortBy, availability]);

  // Sync filters to URL (immediate, for non-search filters)
  const updateUrl = useCallback(
    (params: { cat?: string; t?: string; sort?: string; avail?: string }) => {
      const sp = new URLSearchParams();
      const cat = params.cat ?? category;
      const t = params.t ?? tier;
      const sort = params.sort ?? sortBy;
      const avail = params.avail ?? availability;
      if (cat) sp.set("category", cat);
      if (t) sp.set("tier", t);
      if (debouncedSearch) sp.set("q", debouncedSearch);
      if (sort) sp.set("sort", sort);
      if (avail) sp.set("availability", avail);
      const qs = sp.toString();
      router.replace(`/catalogo${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, category, tier, debouncedSearch, sortBy, availability]
  );

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    updateUrl({ cat });
    if (cat) trackFilterUsed("category", cat);
  }

  function handleTierChange(t: string) {
    setTier(t);
    updateUrl({ t });
    if (t) trackFilterUsed("tier", t);
  }

  function handleAvailabilityChange(avail: string) {
    setAvailability(avail);
    updateUrl({ avail });
    if (avail) trackFilterUsed("availability", avail);
  }

  function handleSortChange(sort: string) {
    setSortBy(sort);
    updateUrl({ sort });
    if (sort) trackFilterUsed("sort", sort);
  }

  function clearSearch() {
    setSearchInput("");
  }

  function clearAll() {
    setCategory("");
    setTier("");
    setSearchInput("");
    setSortBy("");
    setAvailability("");
    router.replace("/catalogo", { scroll: false });
  }

  const hasMore = data?.pagination?.has_more ?? false;
  const hasActiveFilters = !!category || !!tier || !!debouncedSearch || !!availability;

  const sidebarContent = (
    <FilterSidebar
      categoryTree={categoryTree}
      tiers={tiers}
      activeCategory={category}
      activeTier={tier}
      activeAvailability={availability}
      onCategoryChange={(cat) => {
        handleCategoryChange(cat);
        setMobileOpen(false);
      }}
      onTierChange={(t) => {
        handleTierChange(t);
        setMobileOpen(false);
      }}
      onAvailabilityChange={(a) => {
        handleAvailabilityChange(a);
        setMobileOpen(false);
      }}
    />
  );

  return (
    <>
      {/* Hero header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-soft via-white to-surface-muted">
        {(() => {
          const bannerSeason = bootstrap?.seasons?.find(s => s.banner_image);
          return bannerSeason?.banner_image ? (
            <Image
              src={bannerSeason.banner_image}
              alt="Catálogo"
              fill
              className="object-cover opacity-10"
              sizes="100vw"
            />
          ) : null;
        })()}
        <Container className="relative z-10 py-12 md:py-16">
          {category ? (
            <div>
              <CatalogBreadcrumb
                category={category}
                categoryTree={categoryTree}
                onCategoryChange={handleCategoryChange}
              />
              <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                {category}
              </h1>
              {totalCount > 0 && (
                <p className="mt-2 text-muted">
                  {totalCount} producto{totalCount !== 1 ? "s" : ""} disponibles
                </p>
              )}
            </div>
          ) : (
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Nuestro <span className="text-primary">Catálogo</span>
              </h1>
              <p className="mt-3 text-lg text-muted leading-relaxed">
                Explora nuestra selección de detalles corporativos personalizados para cada ocasión.
              </p>
            </div>
          )}
        </Container>
      </section>

      <section className="py-6 pb-20 sm:pb-6">
      <Container>
        {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Sort toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted">
            {totalCount > 0
              ? `${totalCount} producto${totalCount !== 1 ? "s" : ""}`
              : ""}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SORT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={(sortBy || "newest") === opt.value ? "default" : "outline"}
                size="sm"
                rounded="full"
                onClick={() => handleSortChange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {category && (
              <Badge variant="default" className="gap-1 pr-1">
                {category}
                <button
                  onClick={() => handleCategoryChange("")}
                  className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {tier && (
              <Badge variant="info" className="gap-1 pr-1">
                {tier}
                <button
                  onClick={() => handleTierChange("")}
                  className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-info/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {availability && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {availability}
                <button
                  onClick={() => handleAvailabilityChange("")}
                  className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-surface-hover"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {debouncedSearch && (
              <Badge variant="secondary" className="gap-1 pr-1">
                &ldquo;{debouncedSearch}&rdquo;
                <button
                  onClick={clearSearch}
                  className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-surface-hover"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={clearAll}
              className="cursor-pointer text-xs font-medium text-muted hover:text-foreground"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        <div className="mt-6 flex gap-8">
          {/* Desktop sidebar */}
          <div className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-20 space-y-6">
              <FilterSidebar
                categoryTree={categoryTree}
                tiers={tiers}
                activeCategory={category}
                activeTier={tier}
                activeAvailability={availability}
                onCategoryChange={handleCategoryChange}
                onTierChange={handleTierChange}
                onAvailabilityChange={handleAvailabilityChange}
              />
              <CatalogCtaBar />
            </div>
          </div>

          {/* Mobile Sheet */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-80 overflow-y-auto p-6">
              <SheetHeader className="p-0 pb-4">
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription className="sr-only">
                  Filtrar productos
                </SheetDescription>
              </SheetHeader>
              {sidebarContent}
            </SheetContent>
          </Sheet>

          {/* Product grid */}
          <div className="min-w-0 flex-1">
            {isLoading && allProducts.length === 0 ? (
              <CatalogSkeleton />
            ) : allProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
                <Package className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold">No se encontraron productos</h3>
                <p className="mt-1 max-w-sm text-sm text-muted">
                  Intenta ajustar los filtros o el término de búsqueda para encontrar
                  lo que necesitas.
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={clearAll}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-6">
                  {allProducts.map((product) => (
                    <ProductCard key={product.sku} product={product} />
                  ))}
                </div>

                {hasMore && (
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
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <ProductCardSkeleton key={`loading-${i}`} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
      </section>

      {/* Mobile CTA bar — desktop version lives in the sidebar above */}
      <div className="lg:hidden">
        <CatalogCtaBar />
      </div>
    </>
  );
}
