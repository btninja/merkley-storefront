"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText, ArrowRight } from "lucide-react";
import { useMyQuotations } from "@/hooks/use-quotations";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { QUOTE_STAGE_COLORS } from "@/lib/constants";
import type { QuoteStage } from "@/lib/constants";
import type { QuotationSummary } from "@/lib/types";

const FILTER_TABS = [
  { value: "todas", label: "Todas", stage: undefined },
  { value: "borrador", label: "Borrador", stage: "Borrador" },
  { value: "enviada", label: "Enviada", stage: "Enviada" },
  { value: "en-revision", label: "En Revisión", stage: "En Revision" },
  { value: "aprobada", label: "Aprobada", stage: "Aprobada" },
  { value: "aceptada", label: "Aceptada", stage: "Aceptada por Cliente" },
] as const;

function QuotationListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
      <FileText className="h-12 w-12 text-muted" />
      <h3 className="mt-4 text-base font-semibold">
        No hay cotizaciones
      </h3>
      <p className="mt-1 text-sm text-muted">
        Comienza creando tu primera cotización
      </p>
      <Button className="mt-6" asChild>
        <Link href="/cotizaciones/nueva">
          <Plus className="h-4 w-4" />
          Nueva Cotización
        </Link>
      </Button>
    </div>
  );
}

function QuotationRow({ quote }: { quote: QuotationSummary }) {
  const stageColors = QUOTE_STAGE_COLORS[quote.stage as QuoteStage];

  return (
    <Link
      href={`/cotizaciones/${quote.name}`}
      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-surface-muted"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{quote.name}</p>
          <Badge
            className={
              stageColors
                ? `${stageColors.bg} ${stageColors.text}`
                : undefined
            }
          >
            {quote.stage}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted">
          {formatDateShort(quote.transaction_date)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold whitespace-nowrap">
          {formatCurrency(quote.grand_total)}
        </span>
        <ArrowRight className="h-4 w-4 text-muted" />
      </div>
    </Link>
  );
}

function QuotationFilteredList({ stage }: { stage?: string }) {
  const { data, isLoading } = useMyQuotations(stage);
  const quotations = data?.quotes ?? [];

  if (isLoading) return <QuotationListSkeleton />;
  if (quotations.length === 0) return <EmptyState />;

  return (
    <div className="space-y-2">
      {quotations.map((quote) => (
        <QuotationRow key={quote.name} quote={quote} />
      ))}
    </div>
  );
}

export default function QuotationsPage() {
  const [activeTab, setActiveTab] = useState("todas");

  return (
    <div className="space-y-6">
      <PageHeader title="Mis Cotizaciones" description="Gestiona todas tus cotizaciones">
        <Button asChild>
          <Link href="/cotizaciones/nueva">
            <Plus className="h-4 w-4" />
            Nueva Cotización
          </Link>
        </Button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="w-full sm:w-auto">
            {FILTER_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {FILTER_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <QuotationFilteredList stage={tab.stage} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
