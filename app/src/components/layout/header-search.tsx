"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useSWR from "swr";
import { Search, X, Loader2, Package, ArrowRight } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { getProducts } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { tierVariant, availabilityVariant } from "@/components/catalog/product-card";
import type { Product } from "@/lib/types";

/* ── HeaderSearch ─────────────────────────────────────────── */

export function HeaderSearch({ autoFocus }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch products matching the debounced query
  const { data, isLoading } = useSWR(
    debouncedQuery.trim().length >= 2
      ? `header-search:${debouncedQuery.trim()}`
      : null,
    () =>
      getProducts({
        search: debouncedQuery.trim(),
        page: 1,
        page_length: 8,
      }),
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const results: Product[] = data?.items ?? [];
  const totalCount = data?.total_count ?? 0;
  const hasQuery = debouncedQuery.trim().length >= 2;
  const showDropdown = open && (hasQuery || query.trim().length >= 2);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Navigate to catalog with search query
  const goToCatalog = useCallback(() => {
    const q = query.trim();
    if (q) {
      router.push(`/catalogo?q=${encodeURIComponent(q)}`);
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  }, [query, router]);

  const handleSelect = useCallback(
    (slug: string) => {
      setOpen(false);
      setQuery("");
      router.push(`/catalogo/${slug}`);
    },
    [router]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              goToCatalog();
            }
          }}
          placeholder="Buscar productos..."
          autoFocus={autoFocus}
          className="h-9 w-full rounded-full border border-border bg-surface-muted pl-9 pr-9 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-surface transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {isLoading && hasQuery && (
          <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>

      {/* Results dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-border bg-surface shadow-xl overflow-hidden">
          {/* Loading state */}
          {isLoading && results.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
          )}

          {/* No results */}
          {!isLoading && hasQuery && results.length === 0 && (
            <div className="py-8 text-center">
              <Package className="mx-auto h-8 w-8 text-muted/40" />
              <p className="mt-2 text-sm text-muted">
                No se encontraron productos para &ldquo;{debouncedQuery}&rdquo;
              </p>
            </div>
          )}

          {/* Results list */}
          {results.length > 0 && (
            <>
              <div className="max-h-[380px] overflow-y-auto">
                {results.map((product) => (
                  <SearchResultItem
                    key={product.sku}
                    product={product}
                    onSelect={handleSelect}
                  />
                ))}
              </div>

              {/* Footer — go to full catalog */}
              {totalCount > results.length && (
                <div className="border-t border-border">
                  <button
                    onClick={goToCatalog}
                    className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-primary hover:bg-primary-soft transition-colors"
                  >
                    Ver los {totalCount} resultados en el catálogo
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Individual result row ────────────────────────────────── */

function SearchResultItem({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: (slug: string) => void;
}) {
  const mainImage = product.images?.[0];

  return (
    <button
      onClick={() => onSelect(product.slug)}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-muted"
    >
      {/* Thumbnail */}
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-surface-muted">
        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-5 w-5 text-muted/40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {product.name}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          {product.category && (
            <span className="text-[11px] text-muted truncate">
              {product.category}
            </span>
          )}
          {product.tier && (
            <Badge variant={tierVariant(product.tier)} className="text-[9px] px-1.5 py-0">
              {product.tier}
            </Badge>
          )}
          <Badge
            variant={availabilityVariant(product.availability.label)}
            className="text-[9px] px-1.5 py-0"
          >
            {product.availability.label}
          </Badge>
        </div>
      </div>

      {/* Price */}
      <span className="flex-shrink-0 text-sm font-semibold text-foreground">
        {product.price.amount != null
          ? formatCurrency(product.price.amount)
          : "Consultar"}
      </span>
    </button>
  );
}

/* ── Compact trigger for mobile ───────────────────────────── */

export function MobileSearchToggle({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
      aria-label="Buscar"
    >
      <Search className="h-5 w-5" />
    </button>
  );
}
