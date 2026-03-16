"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  CalendarClock,
  FileDown,
  Loader2,
  ArrowLeft,
  ExternalLink,
  FileText,
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useInvoiceDetail } from "@/hooks/use-invoices";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { StageTracker } from "@/components/invoices/stage-tracker";
import { PaymentForm } from "@/components/invoices/payment-form";
import { AnnulmentDialog } from "@/components/invoices/annulment-dialog";
import { RetentionForm } from "@/components/invoices/retention-form";

const PAYMENT_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  success: { bg: "bg-success-soft", text: "text-success" },
  warning: { bg: "bg-warning-soft", text: "text-warning" },
  info: { bg: "bg-info-soft", text: "text-info" },
  destructive: { bg: "bg-destructive-soft", text: "text-destructive" },
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
  const { data, isLoading, mutate } = useInvoiceDetail(name);
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [annulmentOpen, setAnnulmentOpen] = useState(false);

  if (isLoading || !data) {
    return <DetailSkeleton />;
  }

  const invoice = data.invoice;
  const statusStyle =
    PAYMENT_STATUS_STYLES[invoice.payment_status.color] ||
    PAYMENT_STATUS_STYLES.warning;

  const stage = invoice.invoice_stage;
  const hasNCF = !!invoice.ncf;

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await api.downloadInvoicePdf(invoice.name);
      toast({
        title: "PDF descargado",
        description: "El archivo PDF se ha descargado correctamente.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo descargar el PDF.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title={invoice.name}>
        <Badge
          className={`${statusStyle.bg} ${statusStyle.text} text-sm px-3 py-1`}
        >
          {invoice.payment_status.label}
        </Badge>
      </PageHeader>

      {/* Stage Tracker */}
      {stage && <StageTracker stage={stage} />}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/facturas">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
        <Button variant="outline" onClick={handleDownloadPdf} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          Descargar PDF
        </Button>
        {invoice.linked_quotation && (
          <Button variant="outline" asChild>
            <Link href={`/cotizaciones/${invoice.linked_quotation}`}>
              <ExternalLink className="h-4 w-4" />
              Cotización {invoice.linked_quotation}
            </Link>
          </Button>
        )}
        {invoice.can_request_annulment && (
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setAnnulmentOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Solicitar Anulación
          </Button>
        )}
      </div>

      {/* Late fee notice */}
      {!!invoice.late_fee_applied && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive-soft p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
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

      {/* Annulment status notice */}
      {stage === "Anulación Solicitada" && (
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

      {/* Payment proof submitted notice */}
      {(stage === "Pago Sometido" || stage === "Pago en Revisión") && (
        <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info-soft p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-info" />
          <div>
            <p className="text-sm font-medium text-info">
              {stage === "Pago Sometido"
                ? "Comprobante de pago enviado"
                : "Pago en revisión por nuestro equipo"}
            </p>
            {invoice.payment_proof_uploaded_at && (
              <p className="mt-1 text-xs text-muted">
                Enviado: {formatDate(invoice.payment_proof_uploaded_at)}
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
      {invoice.outstanding_amount > 0 && !invoice.is_return && stage !== "Anulación Solicitada" && stage !== "Anulada" && (
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

      {/* Payment form — only shows when stage is Pendiente de Pago */}
      <PaymentForm
        invoice={invoice}
        onPaymentSubmitted={() => mutate()}
      />

      {/* Retention letter form — shows after NCF is assigned */}
      <RetentionForm
        invoice={invoice}
        onRetentionSubmitted={() => mutate()}
      />

      {/* Invoice info */}
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
                <p className="text-sm font-medium">{formatDate(invoice.posting_date)}</p>
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
                Nota de crédito contra: <span className="font-medium">{invoice.return_against}</span>
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
              <span className="font-semibold">{formatCurrency(invoice.grand_total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Pendiente</span>
              <span className="font-semibold">
                {formatCurrency(invoice.outstanding_amount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Estado</span>
              <Badge
                className={`${statusStyle.bg} ${statusStyle.text} text-[10px] px-2 py-0.5`}
              >
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
                  <th className="pb-3 pr-4 text-center font-medium text-muted">Cant.</th>
                  <th className="pb-3 pr-4 text-right font-medium text-muted">Precio</th>
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
            {invoice.taxes.map((tax, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {tax.description} ({tax.rate}%)
                </span>
                <span>{formatCurrency(tax.tax_amount)}</span>
              </div>
            ))}
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

      {/* Annulment Dialog */}
      <AnnulmentDialog
        invoiceName={invoice.name}
        open={annulmentOpen}
        onOpenChange={setAnnulmentOpen}
        onAnnulmentRequested={() => mutate()}
      />
    </div>
  );
}
