"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  History,
  TrendingUp,
  ShoppingBag,
  FileText,
  Receipt,
  RefreshCw,
  Loader2,
  BarChart3,
} from "lucide-react";
import { usePurchaseHistory } from "@/hooks/use-portal";
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
import { formatCurrency, formatDateShort } from "@/lib/format";

function ListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

export default function HistorialPage() {
  const [year, setYear] = useState<number | undefined>(undefined);
  const { data, isLoading } = usePurchaseHistory(year ? { year } : undefined);
  const { toast } = useToast();
  const router = useRouter();
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const handleReorder = async (doctype: string, docname: string) => {
    setReorderingId(docname);
    try {
      const result = await api.reorderFromDocument(doctype, docname);
      toast({
        title: "Cotización creada",
        description: `Se ha creado la cotización ${result.quotation_name} con los mismos artículos.`,
        variant: "success",
      });
      router.push(`/cotizaciones/${result.quotation_name}`);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo crear la reorden.",
        variant: "destructive",
      });
    } finally {
      setReorderingId(null);
    }
  };

  const maxSpending = data?.monthly_spending
    ? Math.max(...data.monthly_spending.map((m) => m.total), 1)
    : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de Compras"
        description="Resumen de tu actividad"
      >
        {data?.available_years && data.available_years.length > 0 && (
          <select
            value={year || data.year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            {data.available_years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
      </PageHeader>

      {isLoading ? (
        <ListSkeleton />
      ) : !data ? (
        <Card className="mx-auto max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
              <History className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mt-4">Sin historial</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted leading-relaxed">
              Aún no tienes historial de compras.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Monthly Spending */}
          {data.monthly_spending.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted" />
                  <CardTitle className="text-base">Gasto Mensual</CardTitle>
                </div>
                <CardDescription>
                  {data.year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1.5 h-32">
                  {data.monthly_spending.map((month) => (
                    <div
                      key={month.month}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div className="w-full flex flex-col items-center justify-end h-24">
                        {month.total > 0 && (
                          <span className="text-[9px] text-muted mb-1 whitespace-nowrap">
                            {formatCurrency(month.total)}
                          </span>
                        )}
                        <div
                          className="w-full max-w-[32px] rounded-t bg-primary transition-all"
                          style={{
                            height: `${Math.max((month.total / maxSpending) * 100, month.total > 0 ? 4 : 0)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted">
                        {month.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Products */}
          {data.top_products.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted" />
                  <CardTitle className="text-base">
                    Productos Más Comprados
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.top_products.map((product, index) => (
                    <div
                      key={product.item_code}
                      className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface-muted"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-bold text-muted w-5">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {product.item_name}
                          </p>
                          <p className="text-xs text-muted">
                            {product.total_qty} unidades
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold shrink-0">
                        {formatCurrency(product.total_amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents List */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              Documentos
            </h2>
            {data.documents.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">
                No hay documentos para este período.
              </p>
            ) : (
              data.documents.map((doc) => {
                const isInvoice = doc.doctype === "Sales Invoice";
                return (
                  <Card key={`${doc.doctype}-${doc.name}`} className="transition-colors hover:bg-surface-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={
                            isInvoice
                              ? `/facturas/${doc.name}`
                              : `/cotizaciones/${doc.name}`
                          }
                          className="flex-1 min-w-0 space-y-1"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            {isInvoice ? (
                              <Receipt className="h-4 w-4 text-muted shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-muted shrink-0" />
                            )}
                            <p className="text-sm font-semibold">{doc.name}</p>
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                              {isInvoice ? "Factura" : "Cotización"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted">
                            {formatDateShort(doc.date)} &middot;{" "}
                            {doc.item_count} artículo(s)
                          </p>
                        </Link>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold whitespace-nowrap">
                            {formatCurrency(doc.grand_total)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReorder(doc.doctype, doc.name)}
                            disabled={reorderingId === doc.name}
                            title="Reordenar"
                          >
                            {reorderingId === doc.name ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline ml-1">Reordenar</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
