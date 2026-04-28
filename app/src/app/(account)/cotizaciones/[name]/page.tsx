"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import {
  Building2,
  Calendar,
  CalendarCheck,
  Download,
  FileText,
  Info,
  Landmark,
  Loader2,
  MapPin,
  Package,
  Pencil,
  ScrollText,
  StickyNote,
  Truck,
  XCircle,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useQuotationDetail } from "@/hooks/use-quotations";
import { useRealtimeDoc } from "@/hooks/use-realtime-doc";
import { DocHeader } from "@/components/shared/doc-header";
import { StateBanner } from "@/components/shared/state-banner";
import { ActionRail, type Action } from "@/components/shared/action-rail";
import {
  HistoryTimeline,
  type HistoryEntry,
} from "@/components/shared/history-timeline";
import { DocTabs, type DocTabValue } from "@/components/shared/doc-tabs";
import { ApprovalUpload } from "@/components/documents/acceptance-upload";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { fetchStateMetadata, type StateMeta } from "@/lib/state-metadata";
import { formatCurrency, formatDate } from "@/lib/format";
import { PAYMENT_INFO, calculateDeliveryTier } from "@/lib/constants";
import { TERMS_SECTIONS, TERMS_FOOTER } from "@/lib/terms";
import { ERP_BASE_URL as ERP_BASE } from "@/lib/env";

// PDF can only be downloaded once the quote is confirmed or beyond.
// Shipping/pricing are still mutable while in draft/sent; we don't let
// the client download an unvetted PDF.
const PDF_ALLOWED_STAGES = new Set(["Confirmada", "En Revisión", "Aceptada"]);

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-32" />
    </div>
  );
}

function fileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${ERP_BASE}${path}`;
}

const DELIVERY_TIER_STYLES: Record<string, string> = {
  Estandar: "bg-success-soft text-success",
  Express: "bg-warning-soft text-warning",
  Emergencia: "bg-destructive-soft text-destructive",
};

// Fallback metadata used when the state-machine endpoint has not yet
// responded or returns an unknown stage. Keeps the banner well-behaved
// during the first render pass.
const FALLBACK_META: StateMeta = {
  label: "Estado",
  hint: "",
  color: "gray",
  actor: "system",
};

export default function QuotationDetailPage() {
  const params = useParams();
  const name = params.name as string;
  const cartContext = useCart();
  const { customer } = useAuth();
  const { toast } = useToast();

  // Quote detail — refresh on window focus and keep data fresh within 30s
  // so that staff-side transitions (Enviada → Confirmada, document approval,
  // etc.) are picked up quickly when the user returns to the tab.
  const {
    data,
    isLoading,
    error,
    mutate,
  } = useQuotationDetail(name);

  // Real-time push: when staff saves the Quotation on the CRM, the backend
  // fires mw_doc_update via Frappe socket.io scoped to this user. Receiving
  // it triggers SWR to refetch — ~100ms end-to-end vs 60s polling. Falls
  // back silently if the socket can't connect.
  useRealtimeDoc("Quotation", name, name ? `quotation:${name}` : null);

  // State metadata — fetched once per doctype and cached for 5 minutes so
  // every page that composes StateBanner gets consistent labels/hints/colors
  // without refetching.
  const { data: stateMetaData } = useSWR(
    ["state-metadata", "Quotation"],
    () => fetchStateMetadata("Quotation"),
    {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isDeclining, setIsDeclining] = useState(false);
  const [activeTab, setActiveTab] = useState<DocTabValue>("details");

  const quote = data?.quote;

  const canDownloadPdf = !!quote && PDF_ALLOWED_STAGES.has(quote.stage);
  const isDraft = quote?.stage === "Borrador";
  const isTerminal = quote?.stage === "Rechazada" || quote?.stage === "Expirada";

  const handleSubmit = async () => {
    if (!quote) return;
    setIsSubmitting(true);
    try {
      await api.submitQuotation(quote.name);
      toast({
        title: "Cotización enviada",
        description: "Tu cotización ha sido enviada para revisión.",
        variant: "success",
      });
      mutate();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudo enviar la cotización.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!quote) return;
    setIsDownloading(true);
    try {
      await api.downloadQuotationPdf(quote.name);
      toast({
        title: "PDF descargado",
        description: "El archivo PDF se ha descargado correctamente.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudo descargar el PDF.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAccept = async () => {
    if (!quote) return;
    setIsAccepting(true);
    try {
      const res = await api.acceptQuotationWithoutDocs(quote.name);
      toast({
        title: "Cotización aceptada",
        description: res.sales_order
          ? `Orden de venta creada: ${res.sales_order}`
          : "La cotización fue aceptada.",
        variant: "success",
      });
      mutate();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudo aceptar la cotización.",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!quote) return;
    if (!declineReason.trim()) {
      toast({
        title: "Motivo requerido",
        description: "Por favor indícanos el motivo del rechazo.",
        variant: "destructive",
      });
      return;
    }
    setIsDeclining(true);
    try {
      await api.declineQuotation(quote.name, declineReason.trim());
      toast({
        title: "Cotización rechazada",
        description: "Hemos registrado tu decisión.",
        variant: "success",
      });
      setDeclineReason("");
      setDeclineOpen(false);
      mutate();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudo rechazar la cotización.",
        variant: "destructive",
      });
    } finally {
      setIsDeclining(false);
    }
  };

  const handleEdit = () => {
    if (!quote) return;
    const { replaceItems } = cartContext;
    const cartItems = quote.items.map((item) => ({
      item_code: item.item_code,
      item_name: item.item_name,
      qty: item.qty,
      rate: item.rate,
      customization_notes: item.customization_notes,
      customization_options: item.customization_notes || null,
      is_personalizable: item.is_personalizable ?? false,
      image_url: null,
      minimum_order_qty: item.minimum_order_qty ?? 1,
    }));
    replaceItems(cartItems);
    window.location.href = "/cotizaciones/nueva";
  };

  const handleReorder = () => {
    if (!quote) return;
    const cartItems = quote.items.map((item) => ({
      item_code: item.item_code,
      item_name: item.item_name,
      qty: item.qty,
      rate: item.rate,
      customization_notes: item.customization_notes,
      customization_options: item.customization_notes || null,
      is_personalizable: item.is_personalizable ?? false,
      image_url: null,
      minimum_order_qty: item.minimum_order_qty ?? 1,
    }));
    cartContext.replaceItems(cartItems);
    window.location.href = "/cotizaciones/nueva";
  };

  // Build the action rail based on (stage, approval_doc_required, canDownloadPdf).
  // Declared before the early returns so it is unconditionally part of the
  // render graph — React hooks rule.
  const actions = useMemo<Action[]>(() => {
    if (!quote) return [];
    const list: Action[] = [];

    if (quote.stage === "Borrador") {
      list.push({
        key: "submit",
        label: isSubmitting ? "Enviando..." : "Enviar cotización",
        onClick: handleSubmit,
        primary: true,
        disabled: isSubmitting,
      });
      list.push({
        key: "edit",
        label: "Editar",
        onClick: handleEdit,
      });
    }

    if (quote.stage === "Confirmada") {
      list.push({
        key: "upload",
        label: "Subir documentos",
        onClick: () => {
          // Switch to the Documentos tab first — Radix unmounts inactive
          // tab content, so #approval-upload-section doesn't exist in the
          // DOM until that tab is active. Scroll on the next paint after
          // the tab content has mounted.
          setActiveTab("documents");
          if (typeof window !== "undefined") {
            window.requestAnimationFrame(() => {
              window.requestAnimationFrame(() => {
                document
                  .getElementById("approval-upload-section")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            });
          }
        },
        primary: true,
      });
      if (!quote.mw_approval_doc_required) {
        list.push({
          key: "accept",
          label: isAccepting ? "Aceptando..." : "Aceptar cotización",
          onClick: handleAccept,
          disabled: isAccepting,
        });
      }
      list.push({
        key: "decline",
        label: "Rechazar",
        variant: "destructive",
        onClick: () => setDeclineOpen(true),
      });
    }

    // PDF intentionally NOT pushed onto the rail — the prominent top-of-page
    // button covers this action in both desktop and mobile layouts. Listing
    // it twice (the rail is a sticky bottom bar on mobile) confused users.

    if (!isDraft && quote.items && quote.items.length > 0) {
      list.push({
        key: "reorder",
        label: "Repetir cotización",
        onClick: handleReorder,
      });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    quote?.stage,
    quote?.mw_approval_doc_required,
    canDownloadPdf,
    isSubmitting,
    isAccepting,
    isDownloading,
    isDraft,
  ]);

  // History timeline derived from the fields we already serialize.
  // TODO: replace with a real Communication/audit log once the backend
  // exposes one. For now, surface what we have: creation, document upload,
  // document review, and the current stage as a final entry.
  const historyEntries = useMemo<HistoryEntry[]>(() => {
    if (!quote) return [];
    const entries: HistoryEntry[] = [];

    if (quote.transaction_date) {
      entries.push({
        timestamp: quote.transaction_date,
        actor: "Cliente",
        action: "Cotización creada",
      });
    }

    const docs = quote.documents;
    if (docs?.uploaded_at) {
      entries.push({
        timestamp: docs.uploaded_at,
        actor: "Cliente",
        action: "Documentos de aprobación enviados",
        note: docs.approval_method || undefined,
      });
    }
    if (docs?.reviewed_at) {
      entries.push({
        timestamp: docs.reviewed_at,
        actor: docs.reviewed_by || "Equipo Merkley",
        action: "Documentos revisados",
        note: docs.rejection_notes || undefined,
      });
    }

    return entries;
  }, [quote]);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !data || !quote) {
    return (
      <Card className="mx-auto max-w-lg mt-8">
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-3 font-medium">Error al cargar cotizacion</p>
          <p className="mt-1 text-sm text-muted">
            No se pudo cargar la cotizacion. Verifica el enlace o intenta de nuevo.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Defensive: accept both pre- and post-migration state names when looking up
  // metadata. Post-migration is the norm, but older records / mid-rollout docs
  // may still surface old names in some edge paths (see C2 regression notes).
  const stageAliases: Record<string, string> = {
    Aprobada: "En Revisión",
    "Aceptada por Cliente": "Aceptada",
    "En Revision": "En Revisión",
  };
  const metaKey = stateMetaData?.states?.[quote.stage]
    ? quote.stage
    : stageAliases[quote.stage] ?? quote.stage;
  const meta: StateMeta = stateMetaData?.states?.[metaKey] ?? FALLBACK_META;

  const deliveryInfo = quote.desired_delivery_date
    ? calculateDeliveryTier(quote.desired_delivery_date)
    : null;

  // Display the CURRENT quotation's customer if present (multi-company
  // portal: each quotation belongs to one of the user's companies),
  // falling back to the session's primary customer for legacy quotations
  // that predate the customer field on the serializer.
  const customerName = quote.customer_name || customer?.company_name || "";

  const detailsContent = (
    <div className="space-y-6">
      {/* Multi-company sibling link — shown when this quotation was
          created together with others ("same cart, different companies").
          The backend stamps mw_quotation_group on every sibling so we
          can cross-link them here for quick navigation. */}
      {quote.group_siblings && quote.group_siblings.length > 0 && (
        <Card className="border-primary/30 bg-primary-soft/40">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs font-semibold text-primary">
              Parte de un grupo multi-empresa
            </p>
            <p className="mt-1 text-xs text-muted">
              Esta cotización se creó junto con {quote.group_siblings.length} otra{quote.group_siblings.length === 1 ? "" : "s"} para distintas empresas desde el mismo carrito.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {quote.group_siblings.map((sib) => (
                <Link
                  key={sib.name}
                  href={`/cotizaciones/${sib.name}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-surface px-2 py-1 text-xs hover:bg-surface-muted transition-colors"
                >
                  <span className="font-medium">{sib.customer_name || sib.customer}</span>
                  <span className="text-muted">·</span>
                  <span className="tabular-nums">{sib.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quote info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quote.customer_name && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted" />
                <div className="min-w-0">
                  <p className="text-xs text-muted">Empresa</p>
                  <p className="text-sm font-medium truncate">
                    {quote.customer_name}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted" />
              <div>
                <p className="text-xs text-muted">Fecha de Cotización</p>
                <p className="text-sm font-medium">
                  {formatDate(quote.transaction_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-4 w-4 text-muted" />
              <div>
                <p className="text-xs text-muted">Válida Hasta</p>
                <p className="text-sm font-medium">
                  {formatDate(quote.valid_till)}
                </p>
              </div>
            </div>
            {quote.desired_delivery_date && (
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Fecha de Entrega Deseada</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {formatDate(quote.desired_delivery_date)}
                    </p>
                    {deliveryInfo && (
                      <Badge
                        className={`text-[10px] ${
                          DELIVERY_TIER_STYLES[deliveryInfo.tier] || ""
                        }`}
                      >
                        {deliveryInfo.tier}
                        {deliveryInfo.surchargePercent > 0 &&
                          ` (+${deliveryInfo.surchargePercent}%)`}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {quote.general_notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Notas Generales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted whitespace-pre-wrap">
                {quote.general_notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Shipping info */}
      {quote.shipping && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {quote.shipping.delivery_method === "Recoger en local" ? (
                <Package className="h-4 w-4 text-muted" />
              ) : (
                <Truck className="h-4 w-4 text-muted" />
              )}
              Método de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted">Método</p>
                <p className="text-sm font-medium">
                  {quote.shipping.delivery_method}
                </p>
              </div>
              {quote.shipping.zone && (
                <div>
                  <p className="text-xs text-muted">Zona</p>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted" />
                    <p className="text-sm font-medium">{quote.shipping.zone}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-muted">Costo de Envío</p>
                <div className="flex items-center gap-2">
                  {quote.shipping.delivery_method === "Recoger en local" ? (
                    <p className="text-sm font-medium text-muted">
                      Recoger en local
                    </p>
                  ) : quote.shipping.cost > 0 ? (
                    <>
                      <p className="text-sm font-bold">
                        {formatCurrency(quote.shipping.cost)}
                      </p>
                      {quote.shipping.tier && (
                        <Badge variant="outline" className="text-[10px]">
                          {quote.shipping.tier}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <p className="text-sm font-medium text-muted">—</p>
                  )}
                </div>
              </div>
            </div>
            {quote.shipping.may_vary && (
              <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-warning-soft p-2">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-warning" />
                <p className="text-xs text-warning">
                  El costo de envío puede variar ya que algunos productos no tienen
                  dimensiones registradas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment info card — shown when stage is past acceptance boundary */}
      {(quote.stage === "Confirmada" ||
        quote.stage === "En Revisión" ||
        quote.stage === "Aceptada") && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Información de Pago</CardTitle>
            </div>
            <CardDescription>
              Datos bancarios para realizar pagos o anticipos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-surface-muted p-4">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted">Banco</p>
                  <p className="font-medium">{PAYMENT_INFO.bank}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Tipo de Cuenta</p>
                  <p className="font-medium">{PAYMENT_INFO.accountType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Número de Cuenta</p>
                  <p className="font-medium font-mono">
                    {PAYMENT_INFO.accountNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Cédula</p>
                  <p className="font-medium font-mono">{PAYMENT_INFO.cedula}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted">Titular</p>
                  <p className="font-medium">{PAYMENT_INFO.accountHolder}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items table */}
      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          <CardDescription>{quote.items.length} artículo(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-4 font-medium text-muted">Producto</th>
                  <th className="pb-3 pr-4 text-center font-medium text-muted">
                    Cant.
                  </th>
                  <th className="pb-3 pr-4 text-right font-medium text-muted">
                    Precio
                  </th>
                  <th className="pb-3 pr-4 text-center font-medium text-muted">
                    Entrega
                  </th>
                  <th className="pb-3 text-right font-medium text-muted">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quote.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{item.item_name}</p>
                      {item.customization_notes && (
                        <p className="mt-0.5 text-xs text-muted">
                          {item.customization_notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-center">{item.qty}</td>
                    <td className="py-3 pr-4 text-right whitespace-nowrap">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          DELIVERY_TIER_STYLES[item.delivery_tier] || ""
                        }`}
                      >
                        {item.delivery_tier}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-medium whitespace-nowrap">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {quote.items.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-border p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{item.item_name}</p>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] ${
                      DELIVERY_TIER_STYLES[item.delivery_tier] || ""
                    }`}
                  >
                    {item.delivery_tier}
                  </Badge>
                </div>
                {item.customization_notes && (
                  <p className="text-xs text-muted">{item.customization_notes}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    {item.qty} x {formatCurrency(item.rate)}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        {/* Totals */}
        <Separator />
        <CardContent className="pt-4">
          <div className="ml-auto max-w-xs space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span>{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.shipping && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  Envío
                  {quote.shipping.zone &&
                    quote.shipping.delivery_method === "Envio estandar" && (
                      <span className="text-xs"> · {quote.shipping.zone}</span>
                    )}
                </span>
                <span>
                  {quote.shipping.delivery_method === "Recoger en local" ? (
                    <span className="text-muted">Recoger en local</span>
                  ) : quote.shipping.cost > 0 ? (
                    formatCurrency(quote.shipping.cost)
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </span>
              </div>
            )}
            {quote.taxes
              .filter(
                (tax) =>
                  !(tax.description || "").toLowerCase().startsWith("env")
              )
              .map((tax, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted">
                    {tax.description}
                    {tax.rate > 0 && ` (${tax.rate}%)`}
                  </span>
                  <span>{formatCurrency(tax.tax_amount)}</span>
                </div>
              ))}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(quote.grand_total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardContent className="py-0">
          <Accordion type="single" collapsible>
            <AccordionItem value="terms" className="border-b-0">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-muted" />
                  <span className="text-base font-semibold">
                    Términos y Condiciones
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-sm leading-relaxed">
                  {TERMS_SECTIONS.map((section) => (
                    <div key={section.title}>
                      <h4 className="mb-1.5 text-sm font-semibold text-foreground">
                        {section.title}
                      </h4>
                      <div className="space-y-1 text-muted">
                        {section.paragraphs.map((p, i) => (
                          <p key={i} className="whitespace-pre-wrap">
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="mt-4 text-xs font-medium text-foreground/70 border-t border-border pt-3">
                    {TERMS_FOOTER}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );

  const documentsContent = (
    <div className="space-y-6">
      {/* Approval upload — shown when the quote is waiting on customer action
          (Confirmada) OR has documents under review / been returned (En Revisión). */}
      {(quote.stage === "Confirmada" || quote.can_approve) && (
        <div id="approval-upload-section">
          <ApprovalUpload
            quotationName={quote.name}
            documents={quote.documents}
            hasPersonalizableItems={quote.has_personalizable_items}
            onSuccess={() => mutate()}
          />
        </div>
      )}

      {/* En Revisión — documents submitted, under review */}
      {quote.stage === "En Revisión" && quote.documents && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-info" />
              <CardTitle className="text-lg">En revisión</CardTitle>
            </div>
            <CardDescription>
              Recibimos tus documentos y están siendo revisados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quote.documents.approval_method && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">Método:</span>
                <Badge variant="outline">
                  {quote.documents.approval_method}
                </Badge>
              </div>
            )}
            {quote.documents.approval_document_file && (
              <a
                href={fileUrl(quote.documents.approval_document_file) || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted"
              >
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Documento de aprobación</p>
                </div>
              </a>
            )}
            {quote.documents.logo_file && (
              <a
                href={fileUrl(quote.documents.logo_file) || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted"
              >
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Logo de empresa</p>
                </div>
              </a>
            )}
            {quote.documents.uploaded_at && (
              <p className="text-xs text-muted">
                Enviado el {formatDate(quote.documents.uploaded_at)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Nothing uploaded yet and no action available */}
      {quote.stage !== "Confirmada" &&
        quote.stage !== "En Revisión" &&
        quote.stage !== "Aceptada" &&
        !quote.documents?.uploaded_at && (
          <p className="text-sm text-muted">Aún no hay documentos asociados.</p>
        )}

      {/* Accepted — show the final documents on file */}
      {quote.stage === "Aceptada" && quote.documents && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documentos de aprobación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quote.documents.approval_method && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">Método:</span>
                <Badge variant="outline">
                  {quote.documents.approval_method}
                </Badge>
              </div>
            )}
            {quote.documents.approval_document_file && (
              <a
                href={fileUrl(quote.documents.approval_document_file) || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted"
              >
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Documento de aprobación</p>
                </div>
              </a>
            )}
            {quote.documents.logo_file && (
              <a
                href={fileUrl(quote.documents.logo_file) || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted"
              >
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Logo de empresa</p>
                </div>
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const historyContent = <HistoryTimeline entries={historyEntries} />;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_260px]">
      <div className="space-y-6">
        <DocHeader
          title={quote.name}
          customerName={customerName}
          issuedLabel="Emitida"
          issuedDate={quote.transaction_date}
          dueLabel="Válida hasta"
          dueDate={quote.valid_till}
          subtotal={quote.subtotal}
          taxes={quote.tax_total}
          total={quote.grand_total}
        />

        <StateBanner stage={quote.stage} meta={meta} />

        {/* Prominent PDF download CTA — the action rail is easy to miss on
            mobile (sticky bottom) and on desktop (right column). Duplicating
            it here at the top of the page puts the single most-requested
            action in the customer's primary scan path. */}
        {canDownloadPdf && (
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isDownloading ? "Descargando..." : "Descargar PDF"}
          </Button>
        )}

        {/* PDF-not-yet-available hint — surfaced inline for early stages so the
            user understands why the "Descargar PDF" action isn't on the rail. */}
        {!isDraft && !canDownloadPdf && !isTerminal && (
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-warning">PDF no disponible</p>
              <p className="mt-0.5 text-xs text-muted">
                La cotización está en revisión. Podrás descargar el PDF una vez
                que sea confirmada por nuestro equipo — el envío y otros costos
                pueden ajustarse.
              </p>
            </div>
          </div>
        )}

        <DocTabs
          details={detailsContent}
          documents={documentsContent}
          history={historyContent}
          value={activeTab}
          onValueChange={setActiveTab}
        />

        <div className="flex justify-start">
          <Button variant="outline" asChild>
            <Link href="/cotizaciones">
              <Pencil className="h-4 w-4" />
              Volver al listado
            </Link>
          </Button>
        </div>
      </div>

      <ActionRail actions={actions} />

      {/* Decline dialog */}
      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Rechazar cotización
            </DialogTitle>
            <DialogDescription>
              Cuéntanos brevemente por qué deseas rechazar la cotización{" "}
              <strong>{quote.name}</strong>. Esta decisión se registra y no
              puede revertirse.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="decline-reason">Motivo del rechazo</Label>
              <Textarea
                id="decline-reason"
                placeholder="Ej: cambio de prioridades, presupuesto, precio..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeclineOpen(false)}
              disabled={isDeclining}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={isDeclining || !declineReason.trim()}
            >
              {isDeclining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
