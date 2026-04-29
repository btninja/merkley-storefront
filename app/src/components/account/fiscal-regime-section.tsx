"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { CheckCircle2, AlertTriangle, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { CarneRequestDialog } from "./carne-request-dialog";
import { CarneViewerDialog } from "./carne-viewer-dialog";

type Props = { customer: string; customerName: string };

/**
 * Subtle, single-row fiscal-regime block rendered inside a Customer card.
 *
 * Visual goal: this should READ as a status line attached to the company,
 * not as a sub-card competing with it. No border, no card background — just
 * a thin separator above and compact typography. The CTA is text-link sized
 * for the most common state (Normal → request) and only escalates to a
 * proper button when the action is urgent (renew on expiring/expired carné).
 */
export function FiscalRegimeSection({ customer, customerName }: Props) {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data: status, isLoading } = useSWR(
    ["carne-status", customer],
    () => api.getCarneStatus(customer),
  );

  async function handleCancel(name: string) {
    setCancelling(true);
    try {
      await api.cancelCarneRequest(name);
      mutate(["carne-status", customer]);
      toast({ title: "Solicitud cancelada", variant: "success" });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo cancelar.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  }

  if (isLoading || !status) return null;

  const isExento = status.regime === "Exento";
  const expiringSoon =
    isExento &&
    status.days_until_expiry !== null &&
    status.days_until_expiry <= 30 &&
    status.days_until_expiry >= 0;
  const justExpired = !isExento && status.carne_pending;
  const isPending = !!status.pending_request;

  return (
    <>
      <div className="mt-3 border-t border-border/60 pt-2 text-xs">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium uppercase tracking-wide text-muted-foreground">
            Régimen fiscal
          </span>
          <span className="text-muted-foreground/60">·</span>

          {/* State branches — compact inline layout. */}
          {isExento && !expiringSoon && (
            <>
              <span className="inline-flex items-center gap-1 text-foreground">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Exento
              </span>
              {status.cert_number && (
                <span className="text-muted-foreground">
                  · Carné #{status.cert_number} vence {status.cert_expiry}
                </span>
              )}
              {status.cert_file_url && (
                <button
                  type="button"
                  onClick={() => setViewerOpen(true)}
                  className="inline-flex cursor-pointer items-center gap-0.5 text-primary underline-offset-2 hover:underline"
                >
                  <FileText className="h-3 w-3" /> Ver carné
                </button>
              )}
            </>
          )}

          {isExento && expiringSoon && (
            <>
              <span className="inline-flex items-center gap-1 text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                Exento — vence en {status.days_until_expiry} días
              </span>
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="cursor-pointer text-primary underline-offset-2 hover:underline"
              >
                Renovar carné
              </button>
            </>
          )}

          {justExpired && (
            <>
              <span className="inline-flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Carné venció — régimen revertido a Normal
              </span>
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="cursor-pointer font-medium text-primary underline-offset-2 hover:underline"
              >
                Renovar carné
              </button>
            </>
          )}

          {!isExento && !justExpired && !isPending && (
            <>
              <span className="text-foreground">Normal</span>
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="cursor-pointer text-primary underline-offset-2 hover:underline"
              >
                Solicitar exención fiscal
              </button>
            </>
          )}

          {isPending && status.pending_request && (
            <>
              <span className="inline-flex items-center gap-1 text-amber-700">
                <Clock className="h-3 w-3" />
                Solicitud pendiente desde{" "}
                {new Date(status.pending_request.requested_at).toLocaleDateString("es-DO")}
              </span>
              <button
                type="button"
                onClick={() => handleCancel(status.pending_request!.name)}
                disabled={cancelling}
                className="cursor-pointer text-destructive underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar solicitud
              </button>
            </>
          )}
        </div>

        {/* Rejection reason gets its own line — too long to inline cleanly. */}
        {!isExento && !justExpired && !isPending && status.last_rejection_reason && (
          <p className="mt-1 text-muted-foreground">
            Última solicitud rechazada:{" "}
            <span className="text-foreground">{status.last_rejection_reason}</span>. Puedes
            enviar una nueva.
          </p>
        )}
      </div>

      <CarneRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={customer}
        customerName={customerName}
      />
      <CarneViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        customer={customer}
        customerName={customerName}
      />
    </>
  );
}
