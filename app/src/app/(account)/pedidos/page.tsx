"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  ChevronDown,
  ChevronUp,
  FileText,
  Receipt,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { useOrderPipeline } from "@/hooks/use-portal";
import { PageHeader } from "@/components/layout/page-header";
import { CompanyFilterChips, CompanyBadge } from "@/components/account/company-filter";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { OrderPipelineOrder, OrderPipelineStep } from "@/lib/api";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Draft: { bg: "bg-surface-muted", text: "text-muted" },
  "En Proceso": { bg: "bg-info-soft", text: "text-info" },
  "Pendiente": { bg: "bg-warning-soft", text: "text-warning" },
  "Completado": { bg: "bg-success-soft", text: "text-success" },
  "Entregado": { bg: "bg-success-soft", text: "text-success" },
  "Cancelado": { bg: "bg-destructive-soft", text: "text-destructive" },
};

function PipelineSteps({
  steps,
  currentStep,
}: {
  steps: OrderPipelineStep[];
  currentStep: string;
}) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            {index > 0 && (
              <div
                className={`h-0.5 w-4 sm:w-8 shrink-0 ${
                  isCompleted ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1 px-1">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary-soft text-primary ring-2 ring-primary"
                      : "bg-surface-muted text-muted"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium text-center leading-tight whitespace-nowrap ${
                  isCurrent ? "text-primary" : "text-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({
  order,
  steps,
}: {
  order: OrderPipelineOrder;
  steps: OrderPipelineStep[];
}) {
  const [expanded, setExpanded] = useState(false);
  const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.Pendiente;

  return (
    <Card>
      <CardContent className="p-4">
        <div
          className="cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold">{order.name}</p>
                <Badge className={`${statusStyle.bg} ${statusStyle.text} text-[10px] px-2 py-0.5`}>
                  {order.status}
                </Badge>
                <CompanyBadge customer={order.customer} customerName={order.customer_name} />
              </div>
              <p className="text-xs text-muted">
                {formatDateShort(order.date)}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-bold whitespace-nowrap">
                {formatCurrency(order.grand_total)}
              </span>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted" />
              )}
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4">
            {/* Pipeline visualization */}
            <PipelineSteps steps={steps} currentStep={order.current_step} />

            <Separator />

            {/* Items */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted uppercase">
                Artículos
              </p>
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted truncate flex-1 mr-3">
                    {item.item_name}
                  </span>
                  <span className="shrink-0">
                    {item.qty} x {formatCurrency(item.rate)}
                  </span>
                </div>
              ))}
            </div>

            {/* Linked documents */}
            {(order.linked_quote || order.linked_invoice) && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {order.linked_quote && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/cotizaciones/${order.linked_quote}`}>
                        <FileText className="h-3.5 w-3.5" />
                        {order.linked_quote}
                      </Link>
                    </Button>
                  )}
                  {order.linked_invoice && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/facturas/${order.linked_invoice}`}>
                        <Receipt className="h-3.5 w-3.5" />
                        {order.linked_invoice}
                      </Link>
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

export default function PedidosPage() {
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const { data, isLoading, error } = useOrderPipeline(companyFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description="Seguimiento de tus pedidos activos"
      />

      {/* Company filter row — auto-hidden for single-company users. */}
      <CompanyFilterChips value={companyFilter} onChange={setCompanyFilter} />

      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <Card className="mx-auto max-w-lg">
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-destructive" />
            <p className="mt-3 text-sm text-destructive">Error al cargar pedidos. Intenta de nuevo.</p>
          </CardContent>
        </Card>
      ) : !data?.orders.length ? (
        <Card className="mx-auto max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mt-4">No hay pedidos</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted leading-relaxed">
              Aún no tienes pedidos activos. Los pedidos aparecerán aquí cuando se procesen tus cotizaciones.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.orders.map((order) => (
            <OrderCard
              key={order.name}
              order={order}
              steps={data.steps}
            />
          ))}
        </div>
      )}
    </div>
  );
}
