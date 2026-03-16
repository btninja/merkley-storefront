"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  BookOpen,
  Download,
  Loader2,
  FileText,
  Calendar,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useActiveSeasons } from "@/hooks/use-seasons";
import { generateCustomerCatalogPdf } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ERP_BASE =
  process.env.NEXT_PUBLIC_ERP_URL ||
  process.env.FRAPPE_BASE_URL ||
  "https://erp.merkleydetails.com";

interface GeneratedFile {
  file_name: string;
  file_url: string;
  item_count: number;
}

interface SeasonState {
  generating: boolean;
  file?: GeneratedFile;
}

export default function CatalogoPdfPage() {
  const { data: seasonsData, isLoading } = useActiveSeasons();
  const { toast } = useToast();
  const [seasonStates, setSeasonStates] = useState<Map<string, SeasonState>>(
    new Map()
  );

  const seasons = seasonsData?.seasons || [];

  const getState = useCallback(
    (name: string): SeasonState =>
      seasonStates.get(name) || { generating: false },
    [seasonStates]
  );

  const updateState = useCallback(
    (name: string, update: Partial<SeasonState>) => {
      setSeasonStates((prev) => {
        const next = new Map(prev);
        next.set(name, { ...getState(name), ...update });
        return next;
      });
    },
    [getState]
  );

  async function handleGenerate(seasonName: string, seasonLabel: string) {
    updateState(seasonName, { generating: true, file: undefined });
    try {
      const result = await generateCustomerCatalogPdf({ season: seasonName });
      updateState(seasonName, { generating: false, file: result });
      toast({
        title: "Catálogo generado",
        description: `${seasonLabel} — ${result.item_count} productos.`,
      });
    } catch (err) {
      updateState(seasonName, { generating: false });
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "No se pudo generar el catálogo.",
        variant: "destructive",
      });
    }
  }

  function handleDownload(file: GeneratedFile) {
    const url = file.file_url.startsWith("http")
      ? file.file_url
      : `${ERP_BASE}${file.file_url}`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Catálogo PDF"
        description="Selecciona una temporada para generar tu catálogo con precios personalizados"
      />

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : seasons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted">
              <Calendar className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              No hay temporadas vigentes
            </p>
            <p className="mt-1 text-sm text-muted">
              Los catálogos estarán disponibles cuando haya temporadas activas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season) => {
            const state = getState(season.name);
            return (
              <Card
                key={season.name}
                className="overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* Banner image */}
                <div className="relative aspect-[16/9] overflow-hidden bg-surface-muted">
                  {season.banner_image ? (
                    <Image
                      src={season.banner_image}
                      alt={season.season_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <CardContent className="p-5 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">
                      {season.season_name}
                    </h3>
                    {season.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {season.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Package className="h-3 w-3" />
                      {season.product_count} productos
                    </Badge>
                  </div>

                  {/* Generated file info */}
                  {state.file && (
                    <div className="rounded-lg border border-success/30 bg-success-soft p-3">
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {state.file.file_name}
                          </p>
                          <p className="text-xs text-muted">
                            {state.file.item_count} productos incluidos
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action button */}
                  {state.file ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDownload(state.file!)}
                        className="flex-1"
                        variant="default"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PDF
                      </Button>
                      <Button
                        onClick={() =>
                          handleGenerate(season.name, season.season_name)
                        }
                        variant="outline"
                        size="icon"
                        disabled={state.generating}
                        title="Regenerar catálogo"
                      >
                        {state.generating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <BookOpen className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() =>
                        handleGenerate(season.name, season.season_name)
                      }
                      disabled={state.generating || season.product_count === 0}
                      className="w-full"
                    >
                      {state.generating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Generar Catálogo PDF
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
