"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { ERP_BASE_URL as ERP_BASE } from "@/lib/env";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: string;
  customerName: string;
};

/**
 * Carné viewer dialog.
 *
 * Why fetch+blob instead of iframe pointing at the cross-domain URL:
 * Frappe's response sets `X-Frame-Options: SAMEORIGIN`, which blocks an
 * iframe on merkleydetails.com from embedding a resource served by
 * erp.merkleydetails.com — even when the storefront's CSP allows the
 * frame-src. Mirroring the pattern used by `downloadQuotationPdf` in
 * api.ts: fetch with credentials → blob → URL.createObjectURL — the blob
 * URL is same-origin to the page, so the iframe loads it without
 * any X-Frame-Options check.
 */
export function CarneViewerDialog({ open, onOpenChange, customer, customerName }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let active = true;
    let createdUrl: string | null = null;
    setLoading(true);
    setError(null);

    const apiUrl = `${ERP_BASE}/api/method/merkley_web.api.storefront_session.get_carne_file?customer=${encodeURIComponent(customer)}`;

    fetch(apiUrl, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`No se pudo cargar el carné (HTTP ${response.status})`);
        }
        const blob = await response.blob();
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Error al cargar el carné");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [open, customer]);

  // Reset state when the dialog closes so a re-open re-fetches.
  useEffect(() => {
    if (!open) {
      setBlobUrl(null);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Carné de exención — {customerName}</DialogTitle>
          {blobUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={blobUrl} download={`carne-${customerName}.pdf`}>
                <Download className="mr-1 h-3.5 w-3.5" />
                Descargar
              </a>
            </Button>
          )}
        </DialogHeader>
        <div className="h-[70vh] w-full overflow-hidden rounded-lg border bg-muted">
          {loading && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando carné…
            </div>
          )}
          {error && !loading && (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-destructive">
              {error}
            </div>
          )}
          {blobUrl && !loading && !error && (
            <iframe
              src={blobUrl}
              className="h-full w-full"
              title={`Carné de ${customerName}`}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
