"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Receipt,
} from "lucide-react";
import { useInvoiceDetail } from "@/hooks/use-invoices";
import { useRealtimeDoc } from "@/hooks/use-realtime-doc";
import { DocHeader } from "@/components/shared/doc-header";
import { StateBanner } from "@/components/shared/state-banner";
import { ActionRail, type Action } from "@/components/shared/action-rail";
import {
  HistoryTimeline,
  type HistoryEntry,
} from "@/components/shared/history-timeline";
import { DocTabs } from "@/components/shared/doc-tabs";
import { PaymentForm } from "@/components/invoices/payment-form";
import { RetentionForm } from "@/components/invoices/retention-form";
import { AnnulmentDialog } from "@/components/invoices/annulment-dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import * as api from "@/lib/api";
import { fetchStateMetadata, type StateMeta } from "@/lib/state-metadata";
import { formatCurrency, formatDate } from "@/lib/format";

// Fallback metadata used while the state-machine endpoint is loading or if
// the backend returns an unknown stage. Keeps the banner well-behaved during
// the first render pass.
const FALLBACK_META: StateMeta = {
  label: "Estado",
  hint: "",
  color: "gray",
  actor: "system",
};

// Pre-migration → post-migration alias map. Older invoices may still surface
// the legacy state name in some edge paths; this lets the banner resolve.
const STAGE_ALIASES: Record<string, string> = {
  "Pago Sometido": "Comprobante en Revisión",
  "Pago en Revisión": "Comprobante en Revisión",
  "Recargo Aplicado": "Vencida",
};

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-20" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-32" />
    </div>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const name = params.name as string;
  const { customer } = useAuth();
  const { data, isLoading, error, mutate } = useInvoiceDetail(name);
  const { toast } = useToast();

  // Real-time push: when staff reviews payment / assigns NCF / marks
  // annulment on the CRM, the backend fires mw_doc_update via Frappe
  // socket.io scoped to this user. Receiving it triggers SWR to refetch
  // — ~100ms end-to-end vs 60s polling. Silently no-ops if the socket
  // fails to connect.
  useRealtimeDoc("Sales Invoice", name, name ? `invoice:${name}` : null);

  // State metadata — fetched once per doctype and cached for 5 minutes so
  // every page that composes StateBanner uses the same labels/hints/colors.
  const { data: stateMetaData } = useSWR(
    ["state-metadata", "Sales Invoice"],
    () => fetchStateMetadata("Sales Invoice"),
    {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
    }
  );

  const [isDownloading, setIsDownloading] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [retentionOpen, setRetentionOpen] = useState(false);
  const [annulOpen, setAnnulOpen] = useState(false);

  const invoice = data?.invoice;

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setIsDownloading(true);
    try {
      await api.downloadInvoicePdf(invoice.name);
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

  // Action rail — declared before early returns so it is unconditionally
  // part of the render graph (React hooks rule).
  const actions = useMemo<Action[]>(() => {
    if (!invoice) return [];
    const list: Action[] = [];

    // `invoice.stage` is the canonical post-migration field; fall back to the
    // deprecated `invoice_stage` during the rollout window.
    const stage = invoice.stage ?? invoice.invoice_stage ?? "";

    const canUploadProof = [
      "Pendiente de Pago",
      "Vencida",
      "Pago Parcial",
    ].includes(stage);
    if (canUploadProof) {
      list.push({
        key: "upload-proof",
        label: "Subir comprobante",
        onClick: () => setProofOpen(true),
        primary: true,
      });
    }

    if (stage === "Pago Aprobado" && !invoice.retention_letter_file) {
      list.push({
        key: "upload-retention",
        label: "Subir carta de retención",
        onClick: () => setRetentionOpen(true),
      });
    }

    const canRequestAnnulment = ["Pendiente de Pago", "Vencida"].includes(stage);
    if (canRequestAnnulment) {
      list.push({
        key: "annul",
        label: "Solicitar anulación",
        variant: "outline",
        onClick: () => setAnnulOpen(true),
      });
    }

    list.push({
      key: "pdf",
      label: isDownloading ? "Descargando..." : "Descargar factura",
      onClick: handleDownloadPdf,
      disabled: isDownloading,
    });

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.stage, invoice?.invoice_stage, invoice?.retention_letter_file, isDownloading]);

  // History timeline — pseudo-history derived from the timestamps we already
  // serialize (creation, proof upload, review, retention submission, annulment).
  // TODO: replace with a real Communication/audit log once the backend
  // exposes one, analogous to the quote detail page.
  const historyEntries = useMemo<HistoryEntry[]>(() => {
    if (!invoice) return [];
    const entries: HistoryEntry[] = [];

    if (invoice.posting_date) {
      entries.push({
        timestamp: invoice.posting_date,
        actor: "Sistema",
        action: "Factura emitida",
      });
    }
    if (invoice.payment_proof_uploaded_at) {
      entries.push({
        timestamp: invoice.payment_proof_uploaded_at,
        actor: "Cliente",
        action: "Comprobante de pago enviado",
      });
    }
    if (invoice.payment_rejection_reason) {
      entries.push({
        timestamp: invoice.modified,
        actor: "Equipo Merkley",
        action: "Comprobante rechazado",
        note: invoice.payment_rejection_reason,
      });
    }
    if (invoice.ncf) {
      entries.push({
        timestamp: invoice.modified,
        actor: "Equipo Merkley",
        action: `NCF asignado: ${invoice.ncf}`,
      });
    }
    if (invoice.retention_letter_uploaded_at) {
      entries.push({
        timestamp: invoice.retention_letter_uploaded_at,
        actor: "Cliente",
        action: "Carta de retención enviada",
      });
    }
    if (invoice.retention_reviewed_at) {
      entries.push({
        timestamp: invoice.retention_reviewed_at,
        actor: "Equipo Merkley",
        action: "Carta de retención revisada",
      });
    }
    if (invoice.annulment_requested_at) {
      entries.push({
        timestamp: invoice.annulment_requested_at,
        actor: "Cliente",
        action: "Solicitud de anulación enviada",
        note: invoice.annulment_reason || undefined,
      });
    }

    // Sort oldest-first so the timeline reads top-down chronologically.
    return entries.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [invoice]);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !data || !invoice) {
    return (
      <Card className="mx-auto max-w-lg mt-8">
        <CardContent className="py-12 text-center">
          <Receipt className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-3 font-medium">Error al cargar factura</p>
          <p className="mt-1 text-sm text-muted">
            No se pudo cargar la factura. Verifica el enlace o intenta de nuevo.
          </p>
        </CardContent>
      </Card>
    );
  }

  const rawStage = invoice.stage ?? invoice.invoice_stage ?? "";
  const metaKey = stateMetaData?.states?.[rawStage]
    ? rawStage
    : STAGE_ALIASES[rawStage] ?? rawStage;
  const meta: StateMeta = stateMetaData?.states?.[metaKey] ?? FALLBACK_META;

  const customerName = customer?.company_name ?? "";
  const hasNCF = !!invoice.ncf;

  const detailsContent = (
    <div className="space-y-6">
      {/* Late fee notice — invoice replaced by a recargo invoice */}
      {!!invoice.late_fee_applied && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive-soft p-4">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Recargo por mora aplicado: {formatCurrency(invoice.late_fee_amount)}
            </p>
            {invoice.original_invoice && (
              <p className="mt-1 text-sm text-muted">
                Factura original:{" "}
                <Link
                  href={`/facturas/${invoice.original_invoice}`}
                  className="font-medium text-primary underline"
                >
                  {invoice.original_invoice}
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* NCF info */}
      {hasNCF && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-muted p-4">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">
              NCF: <span className="font-mono">{invoice.ncf}</span>
            </p>
            {invoice.ncf_expiry && (
              <p className="mt-0.5 text-xs text-muted">
                Vencimiento: {formatDate(invoice.ncf_expiry)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Outstanding banner */}
      {invoice.outstanding_amount > 0 &&
        !invoice.is_return &&
        rawStage !== "Anulación Solicitada" &&
        rawStage !== "Anulada" && (
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft p-4">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium text-warning">
                Balance pendiente: {formatCurrency(invoice.outstanding_amount)}
              </p>
              {invoice.due_date && (
                <p className="mt-1 text-sm text-muted">
                  Fecha de vencimiento: {formatDate(invoice.due_date)}
                </p>
              )}
            </div>
          </div>
        )}

      {/* Comprobante en revisión notice */}
      {rawStage === "Comprobante en Revisión" && (
        <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info-soft p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-info" />
          <div>
            <p className="text-sm font-medium text-info">
              Comprobante en revisión por nuestro equipo
            </p>
            {invoice.payment_proof_uploaded_at && (
              <p className="mt-1 text-xs text-muted">
                Enviado: {formatDate(invoice.payment_proof_uploaded_at)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Annulment status notice */}
      {rawStage === "Anulación Solicitada" && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft p-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-warning">
              Anulación en revisión
            </p>
            {invoice.annulment_reason && (
              <p className="mt-1 text-sm text-muted">
                Motivo: {invoice.annulment_reason}
              </p>
            )}
            {invoice.annulment_requested_at && (
              <p className="mt-1 text-xs text-muted">
                Solicitada: {formatDate(invoice.annulment_requested_at)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Invoice info cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información de Factura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted" />
              <div>
                <p className="text-xs text-muted">Fecha de Emisión</p>
                <p className="text-sm font-medium">
                  {formatDate(invoice.posting_date)}
                </p>
              </div>
            </div>
            {invoice.due_date && (
              <div className="flex items-center gap-3">
                <CalendarClock className="h-4 w-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Fecha de Vencimiento</p>
                  <p className="text-sm font-medium">{formatDate(invoice.due_date)}</p>
                </div>
              </div>
            )}
            {invoice.is_return > 0 && invoice.return_against && (
              <div className="text-sm text-muted">
                Nota de crédito contra:{" "}
                <span className="font-medium">{invoice.return_against}</span>
              </div>
            )}
            {invoice.linked_quotation && (
              <div className="flex items-center gap-3">
                <ExternalLink className="h-4 w-4 text-muted" />
                <Link
                  href={`/cotizaciones/${invoice.linked_quotation}`}
                  className="text-sm font-medium text-primary underline"
                >
                  Cotización {invoice.linked_quotation}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Total</span>
              <span className="font-semibold">
                {formatCurrency(invoice.grand_total)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Pendiente</span>
              <span className="font-semibold">
                {formatCurrency(invoice.outstanding_amount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Estado</span>
              <Badge className="text-[10px] px-2 py-0.5">
                {invoice.payment_status.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items table */}
      <Card>
        <CardHeader>
          <CardTitle>Artículos</CardTitle>
          <CardDescription>{invoice.items.length} artículo(s)</CardDescription>
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
                  <th className="pb-3 text-right font-medium text-muted">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{item.item_name}</p>
                      <p className="mt-0.5 text-xs text-muted">{item.item_code}</p>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      {item.qty} {item.uom}
                    </td>
                    <td className="py-3 pr-4 text-right whitespace-nowrap">
                      {formatCurrency(item.rate)}
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
            {invoice.items.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-border p-3 space-y-1"
              >
                <p className="text-sm font-medium">{item.item_name}</p>
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
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {/* Split taxes into shipping vs other by description prefix.
                _override_shipping_cost rebuilds taxes as charge_type=Actual
                (rate=0) for both Envío AND ITBIS, so a rate-based filter
                would hide ITBIS. Description-based filter is robust. */}
            {(() => {
              const shippingRows = invoice.taxes.filter((t) =>
                (t.description || "").toLowerCase().startsWith("env")
              );
              const otherRows = invoice.taxes.filter(
                (t) => !(t.description || "").toLowerCase().startsWith("env")
              );
              const totalShipping = shippingRows.reduce(
                (s, t) => s + t.tax_amount,
                0
              );
              return (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Envío</span>
                    <span>
                      {totalShipping > 0 ? (
                        formatCurrency(totalShipping)
                      ) : (
                        <span className="text-muted">Recoger en local</span>
                      )}
                    </span>
                  </div>
                  {otherRows.map((tax, index) => (
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
                </>
              );
            })()}
            {/* Recargo por mora stamped on the invoice itself — surfaced in
                the totals breakdown when > 0 so the customer can see what the
                late-fee policy added to the balance due. */}
            {invoice.custom_recargo_amount > 0 && (
              <div className="flex justify-between border-t pt-2 text-red-700">
                <span>Recargo por mora</span>
                <span>{formatCurrency(invoice.custom_recargo_amount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(invoice.grand_total)}
              </span>
            </div>
            {invoice.outstanding_amount > 0 && (
              <div className="flex items-center justify-between text-warning">
                <span className="text-sm font-medium">Pendiente</span>
                <span className="text-base font-bold">
                  {formatCurrency(invoice.outstanding_amount)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const documentsContent = (
    <div className="space-y-6">
      {/* Retention card — shows summary when already submitted. The upload
          flow is in a dialog opened from the action rail. */}
      {invoice.retention_letter_file && (
        <RetentionForm invoice={invoice} onRetentionSubmitted={() => mutate()} />
      )}

      {/* Payment proof summary — just the timestamp/rejection reason if any.
          Active upload flow lives in the proof dialog. */}
      {invoice.payment_proof_uploaded_at && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comprobante de pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted">
              Enviado: {formatDate(invoice.payment_proof_uploaded_at)}
            </p>
            {invoice.payment_rejection_reason && (
              <div className="rounded-lg border border-destructive/30 bg-destructive-soft p-3">
                <p className="font-medium text-destructive">Rechazado</p>
                <p className="mt-1 text-xs text-muted">
                  {invoice.payment_rejection_reason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!invoice.payment_proof_uploaded_at && !invoice.retention_letter_file && (
        <p className="text-sm text-muted">Aún no hay documentos asociados.</p>
      )}
    </div>
  );

  const historyContent = <HistoryTimeline entries={historyEntries} />;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_260px]">
      <div className="space-y-6">
        <DocHeader
          title={invoice.name}
          customerName={customerName}
          issuedLabel="Emitida"
          issuedDate={invoice.posting_date}
          dueLabel="Vence"
          dueDate={invoice.due_date ?? invoice.posting_date}
          subtotal={invoice.subtotal}
          taxes={invoice.tax_total}
          total={invoice.grand_total}
        />

        <StateBanner stage={rawStage} meta={meta} />

        <DocTabs
          details={detailsContent}
          documents={documentsContent}
          history={historyContent}
        />

        <div className="flex justify-start">
          <Button variant="outline" asChild>
            <Link href="/facturas">
              <ArrowLeft className="h-4 w-4" />
              Volver al listado
            </Link>
          </Button>
        </div>
      </div>

      <ActionRail actions={actions} />

      {/* Upload-proof dialog — contains the existing PaymentForm. */}
      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Subir comprobante de pago</DialogTitle>
            <DialogDescription>
              Adjunta tu comprobante de transferencia para esta factura.
            </DialogDescription>
          </DialogHeader>
          <PaymentForm
            invoice={invoice}
            onPaymentSubmitted={() => {
              setProofOpen(false);
              mutate();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Upload-retention dialog — contains the existing RetentionForm. */}
      <Dialog open={retentionOpen} onOpenChange={setRetentionOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Subir carta de retención</DialogTitle>
            <DialogDescription>
              Adjunta la carta de retención fiscal y los montos correspondientes.
            </DialogDescription>
          </DialogHeader>
          <RetentionForm
            invoice={invoice}
            onRetentionSubmitted={() => {
              setRetentionOpen(false);
              mutate();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Annulment request dialog — existing component already uses Dialog. */}
      <AnnulmentDialog
        invoiceName={invoice.name}
        open={annulOpen}
        onOpenChange={setAnnulOpen}
        onAnnulmentRequested={() => mutate()}
      />
    </div>
  );
}
