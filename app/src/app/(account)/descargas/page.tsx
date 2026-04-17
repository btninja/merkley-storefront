"use client";

import { useState } from "react";
import {
  Download,
  FileDown,
  FileText,
  Receipt,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useDownloadCenter } from "@/hooks/use-portal";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { DownloadDocument } from "@/lib/api";

import { ERP_BASE_URL as ERP_BASE } from "@/lib/env";

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

function MonthGroup({
  monthLabel,
  documents,
}: {
  monthLabel: string;
  documents: DownloadDocument[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDownload = async (doc: DownloadDocument) => {
    setDownloadingId(doc.name);
    try {
      const url = `${ERP_BASE}${doc.pdf_url}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${doc.name}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch {
      toast({
        title: "Error de descarga",
        description: "No se pudo descargar el documento. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer py-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted" />
            )}
            <CardTitle className="text-base">{monthLabel}</CardTitle>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              {documents.length}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-1">
            {documents.map((doc, index) => {
              const isInvoice = doc.doctype === "Sales Invoice";
              return (
                <div key={doc.name}>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-surface-muted transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isInvoice ? (
                        <Receipt className="h-4 w-4 text-muted shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{doc.name}</p>
                          {doc.ncf && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 gap-0.5"
                            >
                              <FileText className="h-2.5 w-2.5" />
                              {doc.ncf}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted">
                          {formatDateShort(doc.date)} &middot;{" "}
                          {formatCurrency(doc.grand_total)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.name}
                    >
                      {downloadingId === doc.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {index < documents.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function DescargasPage() {
  const [year, setYear] = useState<number | undefined>(undefined);
  const { data, isLoading } = useDownloadCenter(year);

  // Group documents by month
  const grouped = data?.documents.reduce<
    Record<string, { label: string; docs: DownloadDocument[] }>
  >((acc, doc) => {
    if (!acc[doc.month]) {
      acc[doc.month] = { label: doc.month_label, docs: [] };
    }
    acc[doc.month].docs.push(doc);
    return acc;
  }, {}) ?? {};

  const monthKeys = Object.keys(grouped).sort().reverse();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Descargas"
        description="Descarga tus facturas y cotizaciones en PDF"
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
      ) : monthKeys.length === 0 ? (
        <Card className="mx-auto max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
              <Download className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mt-4">Sin documentos</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted leading-relaxed">
              No hay documentos disponibles para descargar en este período.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {monthKeys.map((monthKey) => (
            <MonthGroup
              key={monthKey}
              monthLabel={grouped[monthKey].label}
              documents={grouped[monthKey].docs}
            />
          ))}
        </div>
      )}
    </div>
  );
}
