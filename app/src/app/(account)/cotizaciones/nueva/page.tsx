"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Save,
  Send,
  Loader2,
  Package,
  Palette,
  AlertTriangle,
  Truck,
  MapPin,
  Info,
  Filter,
  ChevronDown,
  X,
  Building2,
  Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useProducts, useBootstrap } from "@/hooks/use-catalog";
import { useCart } from "@/context/cart-context";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { calculateDeliveryTier, SMALL_ORDER_QTY_THRESHOLD, SMALL_ORDER_SURCHARGE_PERCENT } from "@/lib/constants";
import { trackBeginCheckout, trackQuoteSubmitted } from "@/lib/analytics";
import { useUtmParams } from "@/context/utm-context";
import { useFormTracking } from "@/hooks/use-form-tracking";
import type { QuotationLineInput, Product, ShippingZone, ShippingCalculation, CategoryTreeNode } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Más recientes" },
  { value: "price_asc", label: "Precio ↑" },
  { value: "price_desc", label: "Precio ↓" },
  { value: "alpha", label: "A-Z" },
];

interface FlatCategory {
  name: string;
  depth: number;
  count: number;
  hasChildren: boolean;
  parentChain: string[]; // names of all ancestors (empty for depth 0)
}

function flattenCategoryTree(
  nodes: CategoryTreeNode[],
  depth = 0,
  parentChain: string[] = []
): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const node of nodes) {
    result.push({
      name: node.name,
      depth,
      count: node.product_count,
      hasChildren: node.children.length > 0,
      parentChain,
    });
    if (node.children.length > 0) {
      result.push(
        ...flattenCategoryTree(node.children, depth + 1, [...parentChain, node.name])
      );
    }
  }
  return result;
}

interface CartItem extends QuotationLineInput {
  item_name: string;
  rate: number;
  customization_options: string | null;
  is_personalizable: boolean;
  minimum_order_qty: number;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { items: cartItems, clearCart, replaceItems } = useCart();
  const utmParams = useUtmParams();
  const formTracking = useFormTracking("quote_builder");

  // Product search + filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [filterSort, setFilterSort] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: bootstrap } = useBootstrap();
  const tiers = bootstrap?.filters?.tiers ?? [];
  const flatCategories = useMemo(
    () => flattenCategoryTree(bootstrap?.filters?.category_tree ?? []),
    [bootstrap?.filters?.category_tree]
  );
  const visibleCategories = useMemo(() => {
    if (categorySearch) {
      // When searching, show all matching items (flat, no tree)
      return flatCategories.filter((c) =>
        c.name.toLowerCase().includes(categorySearch.toLowerCase())
      );
    }
    // When not searching, show only expanded tree nodes
    return flatCategories.filter(
      (c) =>
        c.depth === 0 ||
        c.parentChain.every((ancestor) => expandedCategories.has(ancestor))
    );
  }, [flatCategories, categorySearch, expandedCategories]);

  const toggleCategoryExpand = useCallback((name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const { data: productsData, isLoading: productsLoading } = useProducts({
    search: debouncedSearch || undefined,
    category: filterCategory || undefined,
    tier: filterTier || undefined,
    sort_by: filterSort || undefined,
    page: 1,
  });

  const QUOTE_STORAGE_KEY = "md_nueva_cotizacion";

  // Cart state — initialized from CartContext
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [generalNotes, setGeneralNotes] = useState<string>("");
  const [desiredDeliveryDate, setDesiredDeliveryDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shipping state
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "shipping">("pickup");
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [shippingEnabled, setShippingEnabled] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>("");

  // ── Multi-company: user picks which Customer(s) to file the
  //    quotation against. For single-company users, the one customer
  //    is auto-used and the selector stays hidden. For multi-company
  //    users, nothing is pre-checked — they explicitly pick every time.
  const { availableCustomers } = useAuth();
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [pricingPreviews, setPricingPreviews] = useState<Array<{
    customer: string;
    customer_name?: string | null;
    grand_total?: number;
    currency?: string;
    error?: string;
  }>>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const toggleCustomerSelection = useCallback((name: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }, []);

  // Restore persisted form fields from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(QUOTE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.generalNotes) setGeneralNotes(parsed.generalNotes);
        if (parsed.desiredDeliveryDate) setDesiredDeliveryDate(parsed.desiredDeliveryDate);
        if (parsed.deliveryMethod) setDeliveryMethod(parsed.deliveryMethod);
        if (parsed.selectedZone) setSelectedZone(parsed.selectedZone);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist quotation form fields to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify({
      generalNotes,
      desiredDeliveryDate,
      deliveryMethod,
      selectedZone,
    }));
  }, [generalNotes, desiredDeliveryDate, deliveryMethod, selectedZone]);
  const [shippingCalc, setShippingCalc] = useState<ShippingCalculation | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  // Auto-calculated delivery tier
  const deliveryInfo = calculateDeliveryTier(desiredDeliveryDate || null);

  // Hydrate items from CartContext on mount (one-time import)
  useEffect(() => {
    if (!cartHydrated && cartItems.length > 0) {
      const hydrated = cartItems.map((ci) => ({
        item_code: ci.item_code,
        item_name: ci.item_name,
        qty: ci.qty,
        rate: ci.rate,
        customization_notes: "",
        customization_options: ci.customization_options,
        is_personalizable: ci.is_personalizable ?? false,
        minimum_order_qty: ci.minimum_order_qty || 1,
      }));
      setItems(hydrated);
      setCartHydrated(true);

      // Track begin checkout with cart value
      const cartValue = hydrated.reduce((sum, i) => sum + i.rate * i.qty, 0);
      trackBeginCheckout(hydrated.length, cartValue);
    }
  }, [cartItems, cartHydrated]);

  // Sync local items → CartContext (persists to localStorage)
  useEffect(() => {
    if (!cartHydrated) return;
    replaceItems(
      items.map(({ item_code, item_name, qty, rate, customization_options, is_personalizable, minimum_order_qty }) => ({
        item_code,
        item_name,
        qty,
        rate,
        customization_options,
        is_personalizable,
        image_url: null,
        minimum_order_qty: minimum_order_qty || 1,
      }))
    );
  }, [items, cartHydrated, replaceItems]);

  // Fetch shipping zones on mount
  useEffect(() => {
    api.getShippingZones().then((res) => {
      setShippingEnabled(res.shipping_enabled);
      setShippingZones(res.zones);
    }).catch(() => {
      // Shipping not available — leave disabled
    });
  }, []);

  // Calculate shipping cost when zone or items change
  useEffect(() => {
    if (deliveryMethod !== "shipping" || !selectedZone || items.length === 0) {
      setShippingCalc(null);
      return;
    }

    const timeout = setTimeout(() => {
      setShippingLoading(true);
      api.calculateShippingCost(
        items.map((i) => ({ item_code: i.item_code, qty: i.qty })),
        selectedZone
      )
        .then((result) => setShippingCalc(result))
        .catch(() => setShippingCalc(null))
        .finally(() => setShippingLoading(false));
    }, 500);

    return () => clearTimeout(timeout);
  }, [deliveryMethod, selectedZone, items]);

  // Search is live-debounced via useDebounce hook

  const products = productsData?.items ?? [];

  // Add item to cart
  const addItem = useCallback((product: Product) => {
    formTracking.markDirty();
    setItems((prev) => {
      const existing = prev.find((item) => item.item_code === product.sku);
      if (existing) {
        return prev.map((item) =>
          item.item_code === product.sku
            ? { ...item, qty: item.qty + Math.max(product.minimum_order_qty, 1) }
            : item
        );
      }
      return [
        ...prev,
        {
          item_code: product.sku,
          item_name: product.name,
          qty: Math.max(product.minimum_order_qty, 1),
          rate: product.price.amount ?? 0,
          customization_notes: "",
          customization_options: product.customization_options,
          is_personalizable: product.is_personalizable,
          minimum_order_qty: product.minimum_order_qty || 1,
        },
      ];
    });
  }, []);

  // Update item quantity directly
  const setDirectQty = useCallback((itemCode: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.item_code === itemCode ? { ...item, qty: Math.max(item.minimum_order_qty || 1, qty) } : item
      )
    );
  }, []);

  // Update item quantity by delta
  const updateQty = useCallback((itemCode: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.item_code === itemCode
          ? { ...item, qty: Math.max(item.minimum_order_qty || 1, item.qty + delta) }
          : item
      )
    );
  }, []);

  // Update customization notes
  const updateCustomizationNotes = useCallback((itemCode: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.item_code === itemCode
          ? { ...item, customization_notes: notes }
          : item
      )
    );
  }, []);

  // Remove item
  const removeItem = useCallback((itemCode: string) => {
    setItems((prev) => prev.filter((item) => item.item_code !== itemCode));
  }, []);

  // Calculate subtotal and surcharges
  const { subtotal, smallOrderSurcharge, deliverySurcharge, totalEstimado } = useMemo(() => {
    const base = items.reduce((sum, item) => sum + item.rate * item.qty, 0);
    const smallOrder = items.reduce((sum, item) => {
      if (item.qty < SMALL_ORDER_QTY_THRESHOLD) {
        return sum + item.rate * item.qty * (SMALL_ORDER_SURCHARGE_PERCENT / 100);
      }
      return sum;
    }, 0);
    const deliveryPct = deliveryInfo.surchargePercent;
    const deliverySurch = base * (deliveryPct / 100);
    return {
      subtotal: base,
      smallOrderSurcharge: smallOrder,
      deliverySurcharge: deliverySurch,
      totalEstimado: base + smallOrder + deliverySurch,
    };
  }, [items, deliveryInfo.surchargePercent]);

  // Which customers the user can submit to. Single-company users have
  // their one customer implicitly selected; multi-company users must
  // tick at least one in the selector.
  const effectiveCustomers = useMemo(() => {
    if (availableCustomers.length <= 1) {
      return availableCustomers.length === 1 ? [availableCustomers[0].name] : [];
    }
    return selectedCustomers;
  }, [availableCustomers, selectedCustomers]);

  const isMultiCompany = availableCustomers.length > 1;

  // Debounced preview fetch — fires when selected customers or cart
  // changes (2+ customers only, single is trivial). Shows per-company
  // totals so users see the pricing delta before committing.
  useEffect(() => {
    if (!isMultiCompany) {
      setPricingPreviews([]);
      return;
    }
    if (selectedCustomers.length < 2 || items.length === 0) {
      setPricingPreviews([]);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await api.quotePreviewMulti({
          customers: selectedCustomers,
          items: items.map(({ item_code, qty, customization_notes }) => ({
            item_code,
            qty,
            customization_notes: customization_notes || undefined,
          })),
          delivery_method: deliveryMethod === "shipping" ? "Envio estandar" : "Recoger en local",
          shipping_zone: deliveryMethod === "shipping" ? selectedZone || undefined : undefined,
        });
        if (!cancelled) setPricingPreviews(res.previews);
      } catch {
        if (!cancelled) setPricingPreviews([]);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [isMultiCompany, selectedCustomers, items, deliveryMethod, selectedZone]);

  // Submit handler — atomic multi-company create.
  const handleSubmit = useCallback(
    async (submit: boolean) => {
      if (items.length === 0) {
        toast({
          title: "Sin productos",
          description: "Agrega al menos un producto a la cotización.",
          variant: "destructive",
        });
        return;
      }
      if (isMultiCompany && selectedCustomers.length === 0) {
        toast({
          title: "Selecciona una empresa",
          description: "Marca al menos una empresa para la cotización.",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = {
          customers: effectiveCustomers,
          items: items.map(({ item_code, qty, customization_notes }) => ({
            item_code,
            qty,
            customization_notes: customization_notes || undefined,
          })),
          general_notes: generalNotes || undefined,
          desired_delivery_date: desiredDeliveryDate || undefined,
          submit,
          delivery_method: deliveryMethod === "shipping" ? "Envio estandar" : "Recoger en local",
          shipping_zone: deliveryMethod === "shipping" ? selectedZone || undefined : undefined,
          // Attribution — captured on landing, preserved via localStorage,
          // attached here so every Quotation is enriched with the original
          // marketing source. Without this, the backend has no way to link
          // revenue back to the campaign that produced the lead.
          ...utmParams,
        };

        const result = await api.createQuotationsForCustomers(payload);
        const created = result.quotations || [];

        if (submit && created.length > 0) {
          // Track once per successful create — amount is sum across
          // all quotations so the conversion event reflects total value.
          const totalValue = created.reduce((s, q) => s + (q.grand_total || 0), 0);
          trackQuoteSubmitted(created[0].name, totalValue, items.length);
          formTracking.markSubmitted();
        }

        clearCart();
        sessionStorage.removeItem(QUOTE_STORAGE_KEY);

        if (created.length > 1) {
          toast({
            title: submit ? "Cotizaciones enviadas" : "Borradores guardados",
            description: `Se crearon ${created.length} cotizaciones (una por empresa).`,
            variant: "success",
          });
        } else {
          toast({
            title: submit ? "Cotización enviada" : "Borrador guardado",
            description: submit
              ? "Tu cotización ha sido enviada para revisión."
              : "Tu cotización se ha guardado como borrador.",
            variant: "success",
          });
        }

        // Land the user on the FIRST quotation; the detail page will
        // show sibling links to the others if this was a multi-create.
        if (created.length > 0) {
          router.push(`/cotizaciones/${created[0].name}`);
        } else {
          router.push("/cotizaciones");
        }
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "No se pudo procesar la cotización. Intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [items, effectiveCustomers, isMultiCompany, selectedCustomers, generalNotes, desiredDeliveryDate, deliveryMethod, selectedZone, toast, router, clearCart]
  );

  const isInCart = useCallback(
    (sku: string) => items.some((item) => item.item_code === sku),
    [items]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nueva Cotización"
        description="Selecciona productos y configura tu cotización"
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Product selection */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Productos</CardTitle>
              <CardDescription>
                Busca y agrega productos a tu cotización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category dropdown */}
                <DropdownMenu onOpenChange={(open) => { if (!open) setCategorySearch(""); }}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                      <Filter className="h-3.5 w-3.5" />
                      {filterCategory || "Categoría"}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <div className="px-2 pb-1.5">
                      <Input
                        placeholder="Buscar categoría..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="h-8 text-xs"
                        autoFocus
                      />
                    </div>
                    <DropdownMenuSeparator />
                    <div className="max-h-52 overflow-y-auto">
                      {!categorySearch && (
                        <DropdownMenuItem onClick={() => setFilterCategory("")}>
                          <span className="font-medium">Todas las categorías</span>
                        </DropdownMenuItem>
                      )}
                      {visibleCategories.length === 0 ? (
                        <p className="py-3 text-center text-xs text-muted">
                          Sin resultados
                        </p>
                      ) : (
                        visibleCategories.map((cat) => (
                          <DropdownMenuItem
                            key={cat.name}
                            onClick={() => setFilterCategory(cat.name)}
                            className={filterCategory === cat.name ? "bg-accent" : ""}
                          >
                            <span
                              className="flex flex-1 items-center min-w-0"
                              style={{ paddingLeft: categorySearch ? 0 : `${cat.depth * 14}px` }}
                            >
                              {/* Expand/collapse toggle for parents */}
                              {!categorySearch && cat.hasChildren && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleCategoryExpand(cat.name);
                                  }}
                                  className="mr-1 flex h-4 w-4 shrink-0 items-center justify-center rounded hover:bg-foreground/10"
                                >
                                  <ChevronDown
                                    className={`h-3 w-3 text-muted transition-transform ${
                                      expandedCategories.has(cat.name) ? "" : "-rotate-90"
                                    }`}
                                  />
                                </button>
                              )}
                              {/* Spacer for leaf nodes to align with siblings that have toggles */}
                              {!categorySearch && !cat.hasChildren && cat.depth > 0 && (
                                <span className="mr-1 w-4 shrink-0" />
                              )}
                              <span className={`truncate ${cat.depth === 0 && !categorySearch ? "font-medium" : ""}`}>
                                {cat.name}
                              </span>
                            </span>
                            <span className="ml-auto shrink-0 pl-2 text-xs text-muted">{cat.count}</span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Tier toggle chips */}
                {tiers.map((t) => (
                  <Button
                    key={t.tier}
                    variant={filterTier === t.tier ? "default" : "outline"}
                    size="sm"
                    className="h-8 rounded-full text-xs"
                    onClick={() => setFilterTier(filterTier === t.tier ? "" : t.tier)}
                  >
                    {t.tier}
                  </Button>
                ))}

                {/* Sort dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs ml-auto">
                      {SORT_OPTIONS.find((o) => o.value === filterSort)?.label || "Ordenar"}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {SORT_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setFilterSort(filterSort === opt.value ? "" : opt.value)}
                        className={filterSort === opt.value ? "bg-accent" : ""}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Active filter pills */}
              {(filterCategory || filterTier || filterSort) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {filterCategory && (
                    <Badge variant="secondary" className="gap-1 pr-1">
                      {filterCategory}
                      <button
                        onClick={() => setFilterCategory("")}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filterTier && (
                    <Badge variant="secondary" className="gap-1 pr-1">
                      {filterTier}
                      <button
                        onClick={() => setFilterTier("")}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filterSort && (
                    <Badge variant="secondary" className="gap-1 pr-1">
                      {SORT_OPTIONS.find((o) => o.value === filterSort)?.label}
                      <button
                        onClick={() => setFilterSort("")}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  <button
                    onClick={() => {
                      setFilterCategory("");
                      setFilterTier("");
                      setFilterSort("");
                    }}
                    className="text-xs text-muted hover:text-foreground transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}

              {/* Product list */}
              <div className="max-h-[500px] space-y-2 overflow-y-auto">
                {productsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))
                ) : products.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="mx-auto h-10 w-10 text-muted" />
                    <p className="mt-3 text-sm text-muted">
                      {searchQuery
                        ? "No se encontraron productos"
                        : "No hay productos disponibles"}
                    </p>
                  </div>
                ) : (
                  products.map((product) => {
                    const thumb = product.images?.[0]?.url;
                    return (
                    <div
                      key={product.sku}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted"
                    >
                      {/* Product thumbnail */}
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-surface-muted">
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-4 w-4 text-muted" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {product.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-primary">
                            {formatCurrency(product.price.amount)}
                          </span>
                          {product.tier && (
                            <Badge variant="outline" className="text-[10px]">
                              {product.tier}
                            </Badge>
                          )}
                          {product.is_personalizable && (
                            <Badge variant="outline" className="text-[10px] gap-0.5">
                              <Palette className="h-2.5 w-2.5" />
                              Personalizable
                            </Badge>
                          )}
                          {product.minimum_order_qty > 1 && (
                            <span className="text-[10px] text-muted">
                              Mín: {product.minimum_order_qty}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isInCart(product.sku) ? "secondary" : "default"}
                        onClick={() => addItem(product)}
                        className="shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {isInCart(product.sku) ? "Agregar más" : "Agregar"}
                      </Button>
                    </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Cart / Quote summary */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Resumen
                {items.length > 0 && (
                  <Badge variant="secondary">{items.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 ? (
                <div className="py-8 text-center">
                  <ShoppingBag className="mx-auto h-8 w-8 text-muted" />
                  <p className="mt-2 text-sm text-muted">
                    Tu cotización está vacía
                  </p>
                  <p className="text-xs text-muted">
                    Agrega productos de la lista
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.item_code} className="space-y-3 rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-tight">
                            {item.item_name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {formatCurrency(item.rate)} c/u
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted hover:text-destructive"
                          onClick={() => removeItem(item.item_code)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Quantity controls with direct input */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQty(item.item_code, -1)}
                          disabled={item.qty <= (item.minimum_order_qty || 1)}
                          title={item.qty <= (item.minimum_order_qty || 1) ? `Mínimo: ${item.minimum_order_qty || 1} unidades` : undefined}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="relative group">
                          <Input
                            type="number"
                            min={item.minimum_order_qty || 1}
                            value={item.qty}
                            onChange={(e) =>
                              setDirectQty(item.item_code, parseInt(e.target.value) || (item.minimum_order_qty || 1))
                            }
                            className={`h-7 w-16 text-center text-sm ${
                              item.qty <= (item.minimum_order_qty || 1) ? "border-destructive ring-destructive/20" : ""
                            }`}
                          />
                          {item.qty <= (item.minimum_order_qty || 1) && (
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] text-background opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              Min: {item.minimum_order_qty || 1} uds
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQty(item.item_code, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="ml-auto text-sm font-semibold">
                          {formatCurrency(item.rate * item.qty)}
                        </span>
                      </div>
                      {/* Small order surcharge note */}
                      {item.qty < SMALL_ORDER_QTY_THRESHOLD && (
                        <p className="text-[10px] text-amber-600 font-medium">
                          +{SMALL_ORDER_SURCHARGE_PERCENT}% por pedido menor a {SMALL_ORDER_QTY_THRESHOLD} unidades
                        </p>
                      )}

                      {/* Personalization indicator + notes (only for personalizable items) */}
                      {item.is_personalizable && (
                        <>
                          {item.customization_options && (
                            <div className="flex items-start gap-1.5 rounded bg-info-soft px-2 py-1.5">
                              <Palette className="h-3.5 w-3.5 mt-0.5 shrink-0 text-info" />
                              <p className="text-xs text-info">
                                <span className="font-medium">Personalizable:</span>{" "}
                                {item.customization_options}
                              </p>
                            </div>
                          )}
                          <Textarea
                            placeholder="Notas de personalización (opcional)"
                            value={item.customization_notes || ""}
                            onChange={(e) =>
                              updateCustomizationNotes(item.item_code, e.target.value)
                            }
                            className="min-h-[60px] text-xs"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            {items.length > 0 && (
              <>
                <Separator />
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Subtotal</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {smallOrderSurcharge > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-amber-600">Recargo pequeño pedido</span>
                      <span className="text-sm font-medium text-amber-600">
                        +{formatCurrency(smallOrderSurcharge)}
                      </span>
                    </div>
                  )}
                  {deliverySurcharge > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-amber-600">
                        Recargo entrega ({deliveryInfo.tier} +{deliveryInfo.surchargePercent}%)
                      </span>
                      <span className="text-sm font-medium text-amber-600">
                        +{formatCurrency(deliverySurcharge)}
                      </span>
                    </div>
                  )}
                  {deliveryMethod === "shipping" && shippingCalc && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">Envío</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(shippingCalc.cost)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total estimado</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(
                        totalEstimado + (deliveryMethod === "shipping" && shippingCalc ? shippingCalc.cost : 0)
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Impuestos se calcularán al procesar
                  </p>
                </CardContent>
              </>
            )}
          </Card>

          {/* General options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Opciones Generales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delivery-date">Fecha de Entrega Deseada</Label>
                <Input
                  id="delivery-date"
                  type="date"
                  value={desiredDeliveryDate}
                  onChange={(e) => setDesiredDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Auto-calculated delivery tier */}
              {desiredDeliveryDate && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        deliveryInfo.isEmergency
                          ? "destructive"
                          : deliveryInfo.tier === "Express"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {deliveryInfo.tier}
                    </Badge>
                    {deliveryInfo.surchargePercent > 0 && (
                      <span className="text-xs text-muted">
                        +{deliveryInfo.surchargePercent}% recargo
                      </span>
                    )}
                  </div>
                  {deliveryInfo.isEmergency && (
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
                      <p className="text-xs text-destructive font-medium">
                        No garantizamos aceptar la orden con esta fecha de entrega.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Method */}
              {shippingEnabled && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="flex items-center gap-1.5">
                      <Truck className="h-4 w-4" />
                      Método de Entrega
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setDeliveryMethod("pickup"); setSelectedZone(""); setShippingCalc(null); }}
                        className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                          deliveryMethod === "pickup"
                            ? "border-primary bg-primary-soft text-foreground"
                            : "border-border hover:bg-surface-muted"
                        }`}
                      >
                        <Package className="h-4 w-4 mb-1" />
                        <span className="font-medium block">Recoger en local</span>
                        <span className="text-xs text-muted">Sin costo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("shipping")}
                        className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                          deliveryMethod === "shipping"
                            ? "border-primary bg-primary-soft text-foreground"
                            : "border-border hover:bg-surface-muted"
                        }`}
                      >
                        <Truck className="h-4 w-4 mb-1" />
                        <span className="font-medium block">Envío estándar</span>
                        <span className="text-xs text-muted">A domicilio</span>
                      </button>
                    </div>
                  </div>

                  {/* Zone selector */}
                  {deliveryMethod === "shipping" && (
                    <div className="space-y-3">
                      <Label htmlFor="shipping-zone" className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        Zona de Envío
                      </Label>
                      <select
                        id="shipping-zone"
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Selecciona una zona...</option>
                        {shippingZones.map((zone) => (
                          <option key={zone.zone_name} value={zone.zone_name}>
                            {zone.zone_name}
                            {" — "}
                            {formatCurrency(zone.level_1_price)}
                          </option>
                        ))}
                      </select>

                      {/* Shipping cost display */}
                      {selectedZone && (
                        <div className="rounded-lg border border-border p-3 space-y-2">
                          {shippingLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted" />
                              <span className="text-sm text-muted">Calculando envío...</span>
                            </div>
                          ) : shippingCalc ? (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Costo de envío</span>
                                <span className="text-sm font-bold">
                                  {formatCurrency(shippingCalc.cost)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">
                                  {shippingCalc.tier_label}
                                </Badge>
                                {shippingCalc.delivery_method && (
                                  <span className="text-xs text-muted">
                                    {shippingCalc.delivery_method}
                                  </span>
                                )}
                              </div>
                              {shippingCalc.may_vary && (
                                <div className="flex items-start gap-1.5">
                                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                                  <p className="text-xs text-amber-600">
                                    El costo de envío puede variar ya que algunos productos no tienen dimensiones registradas.
                                  </p>
                                </div>
                              )}
                            </>
                          ) : items.length === 0 ? (
                            <p className="text-xs text-muted">
                              Agrega productos para calcular el envío.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="general-notes">Notas Generales</Label>
                <Textarea
                  id="general-notes"
                  placeholder="Instrucciones especiales, comentarios adicionales..."
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                />
              </div>

              {/* Single-company case: read-only display of the active
                  company plus a link to /cuenta/empresas so users can
                  discover the "Solicitar otra empresa" flow even when
                  they currently have just one linked Customer. */}
              {!isMultiCompany && availableCustomers.length === 1 && (
                <div className="space-y-2 rounded-lg border border-border p-3 bg-surface-muted/40">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted" />
                    <Label className="m-0 text-sm font-semibold">Empresa</Label>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium truncate">
                      {availableCustomers[0].customer_name || availableCustomers[0].name}
                    </span>
                    <Link
                      href="/cuenta/empresas"
                      className="text-xs text-primary hover:underline whitespace-nowrap"
                    >
                      Solicitar acceso a otra empresa →
                    </Link>
                  </div>
                </div>
              )}

              {/* Multi-company selector — only shown for users with 2+
                  linked Customers. Nothing pre-selected; user must tick
                  every time (per UX decision). Picking 2+ triggers a
                  pricing preview so the user sees per-company totals
                  before submitting (different price lists / tax
                  regimes can produce different totals for the same cart). */}
              {isMultiCompany && (
                <div className="space-y-3 rounded-lg border border-border p-3 bg-surface-muted/40">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted" />
                    <Label className="m-0 text-sm font-semibold">
                      ¿Para cuál(es) empresa(s)?
                    </Label>
                  </div>
                  <p className="text-xs text-muted">
                    Marca una o varias. Si marcas varias se crearán N cotizaciones (una por empresa) en la misma transacción — todas o ninguna.
                  </p>
                  <div className="space-y-1.5">
                    {availableCustomers.map((c) => {
                      const checked = selectedCustomers.includes(c.name);
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => toggleCustomerSelection(c.name)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                            checked
                              ? "border-primary bg-primary-soft"
                              : "border-border bg-surface hover:bg-surface-muted/50"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                              checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                            )}
                          >
                            {checked && <Check className="h-3 w-3" />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium truncate">
                              {c.customer_name || c.name}
                            </span>
                            {c.tax_id && (
                              <span className="block text-xs text-muted">RNC {c.tax_id}</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Per-company pricing preview (2+ selected) */}
                  {selectedCustomers.length >= 2 && items.length > 0 && (
                    <div className="space-y-2 rounded-md border border-dashed border-border bg-surface p-2.5">
                      <div className="flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-info" />
                        <span className="text-xs font-medium">Totales por empresa</span>
                        {previewLoading && <Loader2 className="h-3 w-3 animate-spin text-muted" />}
                      </div>
                      {pricingPreviews.length === 0 && !previewLoading && (
                        <p className="text-[11px] text-muted">Calculando totales...</p>
                      )}
                      {pricingPreviews.map((p) => (
                        <div
                          key={p.customer}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="truncate">{p.customer_name || p.customer}</span>
                          {p.error ? (
                            <span className="text-destructive text-[11px]">{p.error}</span>
                          ) : (
                            <span className="font-semibold tabular-nums">
                              {formatCurrency(p.grand_total || 0)}
                            </span>
                          )}
                        </div>
                      ))}
                      {pricingPreviews.length >= 2 && (() => {
                        const totals = pricingPreviews
                          .filter((p) => !p.error)
                          .map((p) => p.grand_total || 0);
                        if (totals.length < 2) return null;
                        const min = Math.min(...totals);
                        const max = Math.max(...totals);
                        if (max - min <= 0.01) return null;
                        return (
                          <p className="text-[11px] text-muted pt-1 border-t border-dashed">
                            Las diferencias se deben a las listas de precios o impuestos de cada empresa.
                          </p>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || items.length === 0 || (isMultiCompany && selectedCustomers.length === 0)}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isMultiCompany && selectedCustomers.length > 1
                ? `Guardar ${selectedCustomers.length} borradores`
                : "Guardar Borrador"}
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting || items.length === 0 || (isMultiCompany && selectedCustomers.length === 0)}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isMultiCompany && selectedCustomers.length > 1
                ? `Enviar ${selectedCustomers.length} cotizaciones`
                : "Enviar Cotización"}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile sticky submit bar — shows above bottom nav so users
          don't have to scroll past the entire cart to find the submit
          button. Only renders on small screens when items exist. */}
      {items.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-3 sm:hidden">
          <div className="min-w-0">
            <p className="text-xs text-muted">
              {items.length} {items.length === 1 ? "producto" : "productos"} · {items.reduce((s, i) => s + i.qty, 0)} uds
            </p>
            <p className="text-sm font-bold">
              {formatCurrency(items.reduce((s, i) => s + i.qty * i.rate, 0))}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="shrink-0"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Enviar
          </Button>
        </div>
      )}
    </div>
  );
}
