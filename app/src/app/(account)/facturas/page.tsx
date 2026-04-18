"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Receipt,
  FileDown,
  Loader2,
  Calendar,
  Filter,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { useMyInvoices } from "@/hooks/use-invoices";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InvoiceStage } from "@/lib/types";

const STATUS_FILTERS = [
  { value: "", label: "Todas" },
  { value: "Unpaid", label: "Pendientes" },
  { value: "Paid", label: "Pagadas" },
  { value: "Overdue", label: "Vencidas" },
  { value: "Return", label: "Notas de Crédito" },
];

const PAYMENT_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  success: { bg: "bg-success-soft", text: "text-success" },
  warning: { bg: "bg-warning-soft", text: "text-warning" },
  info: { bg: "bg-info-soft", text: "text-info" },
  destructive: { bg: "bg-destructive-soft", text: "text-destructive" },
};

const STAGE_BADGE_MAP: Record<InvoiceStage, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info" }> = {
  // Post-migration stages
  "Pendiente de Pago": { label: "Pendiente", variant: "warning" },
  "Comprobante en Revisión": { label: "En Revisión", variant: "info" },
  "Pago Aprobado": { label: "Aprobado", variant: "success" },
  "Pago Parcial": { label: "Pago Parcial", variant: "warning" },
  "Pagada": { label: "Pagada", variant: "success" },
  "Vencida": { label: "Vencida", variant: "destructive" },
  "Anulación Solicitada": { label: "Anulación", variant: "warning" },
  "Anulada": { label: "Anulada", variant: "destructive" },
  // Legacy aliases preserved so list rows from un-migrated invoices still render
  "Pago Sometido": { label: "Sometido", variant: "info" },
  "Pago en Revisión": { label: "En Revisión", variant: "info" },
  "Recargo Aplicado": { label: "Recargo", variant: "destructive" },
};

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

export default function FacturasPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [limit, setLimit] = useState(20);
  const { data, isLoading, error } = useMyInvoices(
    { status: statusFilter || undefined, page_length: limit }
  );
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const invoices = data?.invoices || [];
  const hasMore = data?.pagination?.has_more;

  const handleDownloadPdf = async (name: string) => {
    setDownloadingId(name);
    try {
      await api.downloadInvoicePdf(name);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo descargar el PDF.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturas"
        description="Historial de facturación"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted" />
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => { setStatusFilter(filter.value); setLimit(20); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === filter.value
                ? "bg-primary text-primary-foreground"
                : "bg-surface-muted text-muted hover:bg-surface-muted/80"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <Card className="mx-auto max-w-lg">
          <CardContent className="py-12 text-center">
            <Receipt className="mx-auto h-10 w-10 text-destructive" />
            <p className="mt-3 text-sm text-destructive">Error al cargar facturas. Intenta de nuevo.</p>
          </CardContent>
        </Card>
      ) : !invoices.length ? (
        <Card className="mx-auto max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
              <Receipt className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mt-4">No hay facturas</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted leading-relaxed">
              {statusFilter
                ? "No se encontraron facturas con el filtro seleccionado."
                : "Aún no tienes facturas. Las facturas aparecerán aquí cuando se generen."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const statusStyle =
              PAYMENT_STATUS_STYLES[invoice.payment_status.color] ||
              PAYMENT_STATUS_STYLES.warning;

            // Prefer the canonical `stage` field; fall back to the deprecated
            // `invoice_stage` for older responses during the rollout window.
            const currentStage = invoice.stage ?? invoice.invoice_stage;
            const stageInfo = currentStage ? STAGE_BADGE_MAP[currentStage] : null;

            return (
              <Link
                key={invoice.name}
                href={`/facturas/${invoice.name}`}
                className="block"
              >
                <Card className="transition-colors hover:bg-surface-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{invoice.name}</p>
                          {stageInfo ? (
                            <Badge variant={stageInfo.variant} className="text-[10px] px-2 py-0.5">
                              {stageInfo.label}
                            </Badge>
                          ) : (
                            <Badge
                              className={`${statusStyle.bg} ${statusStyle.text} text-[10px] px-2 py-0.5`}
                            >
                              {invoice.payment_status.label}
                            </Badge>
                          )}
                          {invoice.ncf && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 gap-0.5">
                              <FileText className="h-2.5 w-2.5" />
                              {invoice.ncf}
                            </Badge>
                          )}
                          {!!invoice.late_fee_applied && (
                            <Badge variant="destructive" className="text-[10px] px-2 py-0.5 gap-0.5">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Recargo
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(invoice.posting_date)}</span>
                          {invoice.due_date && (
                            <>
                              <span className="mx-1">&middot;</span>
                              <span>Vence: {formatDate(invoice.due_date)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold">
                            {formatCurrency(invoice.grand_total)}
                          </p>
                          {invoice.outstanding_amount > 0 && (
                            <p className="text-xs text-warning">
                              Pend: {formatCurrency(invoice.outstanding_amount)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDownloadPdf(invoice.name);
                          }}
                          disabled={downloadingId === invoice.name}
                        >
                          {downloadingId === invoice.name ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setLimit((l) => l + 20)}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Cargar más
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
