"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Building2,
  Plus,
  ShoppingBag,
  Download,
  ArrowRight,
  Receipt,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useMyQuotations } from "@/hooks/use-quotations";
import { useMyInvoices } from "@/hooks/use-invoices";
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
import { formatCurrency, formatDateShort } from "@/lib/format";
import { QUOTE_STAGE_COLORS } from "@/lib/constants";
import type { QuoteStage } from "@/lib/constants";
import { CompanyBadge } from "@/components/account/company-filter";
import type { QuotationSummary, InvoiceSummary } from "@/lib/types";

const PAYMENT_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  success: { bg: "bg-success-soft", text: "text-success" },
  warning: { bg: "bg-warning-soft", text: "text-warning" },
  info: { bg: "bg-info-soft", text: "text-info" },
  destructive: { bg: "bg-destructive-soft", text: "text-destructive" },
};

/**
 * Group list items by customer, preserving the caller-supplied ordering
 * (which matches availableCustomers — alphabetical). Returns [{ name,
 * customer, count, total }] so we can render the per-company breakdown
 * chips that sit under each summary stat.
 */
function breakdownByCompany<T extends { customer: string | null; customer_name: string | null }>(
  rows: T[],
  totalSelector?: (r: T) => number,
): Array<{ customer: string; customer_name: string; count: number; total: number }> {
  const map = new Map<string, { customer: string; customer_name: string; count: number; total: number }>();
  for (const r of rows) {
    const key = r.customer || "—";
    const entry = map.get(key) || {
      customer: key,
      customer_name: r.customer_name || key,
      count: 0,
      total: 0,
    };
    entry.count += 1;
    if (totalSelector) entry.total += totalSelector(r);
    map.set(key, entry);
  }
  return Array.from(map.values());
}

function CompanyBreakdown({
  rows,
  valueRenderer,
}: {
  rows: Array<{ customer: string; customer_name: string; count: number; total: number }>;
  /** Given a row, render the RHS value (e.g. count or formatted amount). */
  valueRenderer: (r: { customer: string; customer_name: string; count: number; total: number }) => React.ReactNode;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-2 space-y-0.5">
      {rows.map((r) => (
        <div
          key={r.customer}
          className="flex items-baseline justify-between gap-2 text-[11px] text-muted"
        >
          <span className="truncate">{r.customer_name}</span>
          <span className="tabular-nums shrink-0">{valueRenderer(r)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { customer, availableCustomers } = useAuth();
  const { data: quoteData, isLoading: quotesLoading } = useMyQuotations();
  const { data: invoiceData, isLoading: invoicesLoading } = useMyInvoices();

  const quotations: QuotationSummary[] = quoteData?.quotes ?? [];
  const recentQuotations = quotations.slice(0, 5);
  const invoices: InvoiceSummary[] = invoiceData?.invoices ?? [];
  const recentInvoices = invoices.slice(0, 5);
  const pendingInvoices = invoices.filter(
    (inv) => inv.outstanding_amount > 0 && !inv.is_return,
  );

  const isMultiCompany = availableCustomers.length > 1;

  // Per-company breakdowns — only meaningful for multi-company users.
  // Shown under the summary numbers so users can see at a glance how
  // each of their companies is doing without leaving the dashboard.
  const quotesByCompany = useMemo(
    () => (isMultiCompany ? breakdownByCompany(quotations) : []),
    [isMultiCompany, quotations],
  );
  const pendingInvoicesByCompany = useMemo(
    () =>
      isMultiCompany
        ? breakdownByCompany(pendingInvoices, (inv) => inv.outstanding_amount)
        : [],
    [isMultiCompany, pendingInvoices],
  );

  const totalPendingAmount = pendingInvoices.reduce(
    (sum, inv) => sum + inv.outstanding_amount,
    0,
  );

  // Greeting used in the page header. Single-company keeps the old
  // generic welcome; multi-company surfaces the company count so the
  // user sees right away that the dashboard spans them.
  const headerDescription = isMultiCompany
    ? `Gestionas ${availableCustomers.length} empresas — cotizaciones, facturas y pedidos unificados aquí.`
    : "Bienvenido a tu cuenta de Merkley Details";

  return (
    <div className="space-y-8">
      <PageHeader title="Panel de Control" description={headerDescription}>
        {isMultiCompany && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/cuenta/empresas">
              <Briefcase className="h-4 w-4" />
              Mis empresas
            </Link>
          </Button>
        )}
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Cotizaciones */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Cotizaciones</CardDescription>
            <FileText className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            {quotesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{quotations.length}</div>
            )}
            <p className="mt-1 text-xs text-muted">
              {isMultiCompany ? "Unificadas (todas tus empresas)" : "Total de cotizaciones"}
            </p>
            {!quotesLoading && isMultiCompany && quotesByCompany.length > 0 && (
              <CompanyBreakdown
                rows={quotesByCompany}
                valueRenderer={(r) => `${r.count}`}
              />
            )}
          </CardContent>
        </Card>

        {/* Facturas Pendientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Facturas Pendientes</CardDescription>
            <Receipt className="h-4 w-4 text-muted" />
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{pendingInvoices.length}</div>
            )}
            <p className="mt-1 text-xs text-muted">
              {invoicesLoading
                ? ""
                : pendingInvoices.length > 0
                  ? `${formatCurrency(totalPendingAmount)} pendiente`
                  : "Al día"}
            </p>
            {!invoicesLoading && isMultiCompany && pendingInvoicesByCompany.length > 0 && (
              <CompanyBreakdown
                rows={pendingInvoicesByCompany}
                valueRenderer={(r) => formatCurrency(r.total)}
              />
            )}
          </CardContent>
        </Card>

        {/* Empresa(s) */}
        {isMultiCompany ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Mis empresas</CardDescription>
              <Building2 className="h-4 w-4 text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {availableCustomers.length}
              </div>
              <p className="mt-1 text-xs text-muted">Vinculadas a tu cuenta</p>
              <div className="mt-2 space-y-0.5">
                {availableCustomers.slice(0, 3).map((c) => (
                  <p key={c.name} className="text-[11px] text-muted truncate">
                    {c.customer_name || c.name}
                  </p>
                ))}
                {availableCustomers.length > 3 && (
                  <p className="text-[11px] text-muted">
                    +{availableCustomers.length - 3} más
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 -ml-2 h-7 px-2 text-xs"
                asChild
              >
                <Link href="/cuenta/empresas">
                  Gestionar
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Empresa</CardDescription>
              <Building2 className="h-4 w-4 text-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold truncate">
                {customer?.company_name || "Sin empresa"}
              </div>
              <p className="mt-1 text-xs text-muted">
                {customer?.contact_name || ""}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Acciones Rapidas */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Acciones Rápidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="justify-start" asChild>
                <Link href="/cotizaciones/nueva">
                  <Plus className="h-4 w-4" />
                  Nueva Cotización
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start" asChild>
                <Link href="/catalogo">
                  <ShoppingBag className="h-4 w-4" />
                  Ver Catálogo
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start" asChild>
                <Link href="/catalogo-pdf">
                  <Download className="h-4 w-4" />
                  Catálogo PDF
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotations & Invoices side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Quotations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cotizaciones Recientes</CardTitle>
              <CardDescription className="mt-1">
                {isMultiCompany
                  ? "Últimas cotizaciones de todas tus empresas"
                  : "Tus últimas cotizaciones"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cotizaciones">
                Ver Todas
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {quotesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : recentQuotations.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto h-10 w-10 text-muted" />
                <p className="mt-3 text-sm text-muted">
                  No tienes cotizaciones aún
                </p>
                <Button size="sm" className="mt-4" asChild>
                  <Link href="/cotizaciones/nueva">
                    <Plus className="h-4 w-4" />
                    Crear Primera Cotización
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentQuotations.map((quote, index) => {
                  const stageColors = QUOTE_STAGE_COLORS[quote.stage as QuoteStage];
                  return (
                    <div key={quote.name}>
                      <Link
                        href={`/cotizaciones/${quote.name}`}
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-surface-muted"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium truncate">{quote.name}</p>
                            <CompanyBadge
                              customer={quote.customer}
                              customerName={quote.customer_name}
                            />
                          </div>
                          <p className="mt-0.5 text-xs text-muted">
                            {formatDateShort(quote.transaction_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge
                            className={
                              stageColors
                                ? `${stageColors.bg} ${stageColors.text}`
                                : undefined
                            }
                          >
                            {quote.stage}
                          </Badge>
                          <span className="text-sm font-medium whitespace-nowrap">
                            {formatCurrency(quote.grand_total)}
                          </span>
                        </div>
                      </Link>
                      {index < recentQuotations.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Facturas Recientes</CardTitle>
              <CardDescription className="mt-1">
                {isMultiCompany
                  ? "Últimas facturas de todas tus empresas"
                  : "Tus últimas facturas"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/facturas">
                Ver Todas
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="py-8 text-center">
                <Receipt className="mx-auto h-10 w-10 text-muted" />
                <p className="mt-3 text-sm text-muted">
                  No tienes facturas aún
                </p>
                <p className="mt-1 text-xs text-muted">
                  Las facturas aparecerán aquí cuando se generen
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentInvoices.map((invoice, index) => {
                  const statusStyle =
                    PAYMENT_STATUS_STYLES[invoice.payment_status.color] ||
                    PAYMENT_STATUS_STYLES.warning;
                  return (
                    <div key={invoice.name}>
                      <Link
                        href={`/facturas/${invoice.name}`}
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-surface-muted"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium truncate">{invoice.name}</p>
                            <CompanyBadge
                              customer={invoice.customer}
                              customerName={invoice.customer_name}
                            />
                          </div>
                          <p className="mt-0.5 text-xs text-muted">
                            {formatDateShort(invoice.posting_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge
                            className={`${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {invoice.payment_status.label}
                          </Badge>
                          <span className="text-sm font-medium whitespace-nowrap">
                            {formatCurrency(invoice.grand_total)}
                          </span>
                        </div>
                      </Link>
                      {index < recentInvoices.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
