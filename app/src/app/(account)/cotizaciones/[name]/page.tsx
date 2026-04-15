"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  FileDown,
  FileText,
  Info,
  Landmark,
  Loader2,
  MapPin,
  Package,
  Pencil,
  ScrollText,
  Send,
  ShieldCheck,
  StickyNote,
  Truck,
  XCircle,
} from "lucide-react";
import { useQuotationDetail } from "@/hooks/use-quotations";
import { PageHeader } from "@/components/layout/page-header";
import { WorkflowStepper } from "@/components/quotes/workflow-stepper";
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
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { QUOTE_STAGE_COLORS, PAYMENT_INFO, calculateDeliveryTier } from "@/lib/constants";
import { TERMS_SECTIONS, TERMS_FOOTER } from "@/lib/terms";
import type { QuoteStage } from "@/lib/constants";

const ERP_BASE =
  process.env.NEXT_PUBLIC_ERP_URL ||
  process.env.FRAPPE_BASE_URL ||
  "https://erp.merkleydetails.com";

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

export default function QuotationDetailPage() {
  const params = useParams();
  const name = params.name as string;
  const { data, isLoading, error, mutate } = useQuotationDetail(name);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !data) {
    return (
      <Card className="mx-auto max-w-lg mt-8">
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-3 font-medium">Error al cargar cotizacion</p>
          <p className="mt-1 text-sm text-muted">No se pudo cargar la cotizacion. Verifica el enlace o intenta de nuevo.</p>
        </CardContent>
      </Card>
    );
  }

  const quote = data.quote;
  const stageColors = QUOTE_STAGE_COLORS[quote.stage as QuoteStage];
  const isDraft = quote.stage === "Borrador";
  const isTerminal = quote.stage === "Rechazada" || quote.stage === "Expirada";
  // Only allow PDF download once the CRM has approved the quote.
  // Shipping and pricing can change during internal review, so we
  // don't let the client download an unvetted PDF.
  const isApproved = quote.stage === "Aprobada" || quote.stage === "Aceptada por Cliente";
  const canDownloadPdf = isApproved;

  // Compute delivery tier from desired_delivery_date for display
  const deliveryInfo = quote.desired_delivery_date
    ? calculateDeliveryTier(quote.desired_delivery_date)
    : null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.submitQuotation(quote.name);
      toast({
        title: "Cotización enviada",
        description: "Tu cotización ha sido enviada para revisión.",
        variant: "success",
      });
      mutate();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la cotización.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await api.downloadQuotationPdf(quote.name);
      toast({
        title: "PDF descargado",
        description: "El archivo PDF se ha descargado correctamente.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo descargar el PDF.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title={quote.name}>
        <Badge
          className={
            stageColors
              ? `${stageColors.bg} ${stageColors.text} text-sm px-3 py-1`
              : "text-sm px-3 py-1"
          }
        >
          {quote.stage}
        </Badge>
      </PageHeader>

      {/* Workflow Stepper */}
      {!isTerminal && (
        <Card>
          <CardContent className="py-4">
            <WorkflowStepper stage={quote.stage as QuoteStage} />
          </CardContent>
        </Card>
      )}

      {/* Terminal stage banners */}
      {quote.stage === "Rechazada" && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive-soft p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Cotización rechazada
            </p>
            {quote.rejection_reason ? (
              <div className="mt-2 rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2">
                <p className="text-xs font-medium text-destructive mb-1">Motivo:</p>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                  {quote.rejection_reason}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Contacta a nuestro equipo si tienes alguna pregunta.
              </p>
            )}
          </div>
        </div>
      )}

      {quote.stage === "Aceptada por Cliente" && (
        <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success-soft p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-medium text-success">
              Cotización aceptada — documentos verificados
            </p>
            <p className="mt-1 text-sm text-muted">
              Tu cotización ha sido aceptada y los documentos han sido revisados exitosamente.
            </p>
          </div>
        </div>
      )}

      {/* Approval section — shown when stage is "En Revision" and can_approve */}
      {quote.can_approve && (
        <ApprovalUpload
          quotationName={quote.name}
          documents={quote.documents}
          hasPersonalizableItems={quote.has_personalizable_items}
          onSuccess={() => mutate()}
        />
      )}

      {/* Approved state card — shown when stage is "Aprobada" */}
      {quote.stage === "Aprobada" && quote.documents && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success" />
              <CardTitle className="text-lg">Aprobación enviada</CardTitle>
            </div>
            <CardDescription>
              Tus documentos de aprobación han sido recibidos y están siendo revisados por nuestro equipo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quote.documents.approval_method && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">Método:</span>
                <Badge variant="outline">{quote.documents.approval_method}</Badge>
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

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {isDraft && (
          <>
            {/* TODO: Implement edit — load quote items into cart and redirect to /cotizaciones/nueva */}
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar
            </Button>
          </>
        )}
        {!isDraft && canDownloadPdf && (
          <Button variant="outline" onClick={handleDownloadPdf} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Descargar PDF
          </Button>
        )}
        {!isDraft && !canDownloadPdf && !isTerminal && (
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-warning">PDF no disponible</p>
              <p className="mt-0.5 text-xs text-muted">
                La cotización está en revisión. Podrás descargar el PDF una vez que
                sea aprobada por nuestro equipo — el envío y otros costos pueden ajustarse.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quote info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted" />
              <div>
                <p className="text-xs text-muted">Fecha de Cotización</p>
                <p className="text-sm font-medium">{formatDate(quote.transaction_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-4 w-4 text-muted" />
              <div>
                <p className="text-xs text-muted">Válida Hasta</p>
                <p className="text-sm font-medium">{formatDate(quote.valid_till)}</p>
              </div>
            </div>
            {quote.desired_delivery_date && (
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-muted" />
                <div>
                  <p className="text-xs text-muted">Fecha de Entrega Deseada</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{formatDate(quote.desired_delivery_date)}</p>
                    {deliveryInfo && (
                      <Badge
                        className={`text-[10px] ${DELIVERY_TIER_STYLES[deliveryInfo.tier] || ""}`}
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
              <p className="text-sm text-muted whitespace-pre-wrap">{quote.general_notes}</p>
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
                <p className="text-sm font-medium">{quote.shipping.delivery_method}</p>
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
              {/* Costo de Envío — always rendered when delivery method is set,
                   with different labels for pickup vs shipping vs missing cost. */}
              <div>
                <p className="text-xs text-muted">Costo de Envío</p>
                <div className="flex items-center gap-2">
                  {quote.shipping.delivery_method === "Recoger en local" ? (
                    <p className="text-sm font-medium text-muted">Recoger en local</p>
                  ) : quote.shipping.cost > 0 ? (
                    <>
                      <p className="text-sm font-bold">{formatCurrency(quote.shipping.cost)}</p>
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
                  El costo de envío puede variar ya que algunos productos no tienen dimensiones registradas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment info card — shown when stage >= En Revision */}
      {(quote.stage === "En Revision" ||
        quote.stage === "Aprobada" ||
        quote.stage === "Aceptada por Cliente") && (
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
                  <p className="font-medium font-mono">{PAYMENT_INFO.accountNumber}</p>
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
                  <th className="pb-3 pr-4 text-center font-medium text-muted">Cant.</th>
                  <th className="pb-3 pr-4 text-right font-medium text-muted">Precio</th>
                  <th className="pb-3 pr-4 text-center font-medium text-muted">Entrega</th>
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
                        className={`text-[10px] ${DELIVERY_TIER_STYLES[item.delivery_tier] || ""}`}
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
                    className={`shrink-0 text-[10px] ${DELIVERY_TIER_STYLES[item.delivery_tier] || ""}`}
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
            {/* Envio row — always visible when the quote has a delivery
                 method, showing either the cost or "Recoger en local".
                 Previously shipping was only visible inside the taxes loop
                 as "Envío — Zona (0%)" which looked broken. */}
            {quote.shipping && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  Envío
                  {quote.shipping.zone && quote.shipping.delivery_method === "Envio estandar" && (
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
            {/* Tax rows — skip shipping rows (description starts with "Env")
                 so the Envio above isn't duplicated. The (rate%) suffix is
                 also skipped for rate=0 rows (charge_type=Actual) since
                 showing "(0%)" was misleading. */}
            {quote.taxes
              .filter((tax) => !(tax.description || "").toLowerCase().startsWith("env"))
              .map((tax, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
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
                  <span className="text-base font-semibold">Términos y Condiciones</span>
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
                          <p key={i} className="whitespace-pre-wrap">{p}</p>
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
}
