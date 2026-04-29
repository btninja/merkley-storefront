"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { CheckCircle2, AlertTriangle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { CarneRequestDialog } from "./carne-request-dialog";

type Props = { customer: string; customerName: string };

export function FiscalRegimeSection({ customer, customerName }: Props) {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [dialogOpen, setDialogOpen] = useState(false);
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
    <div className="rounded-lg border bg-card p-3 text-sm">
      <p className="font-medium mb-1">Régimen fiscal</p>

      {isExento && !expiringSoon && (
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
          <div className="flex-1">
            <p>Exento</p>
            <p className="text-xs text-muted-foreground">
              Carné #{status.cert_number} · vence {status.cert_expiry}
            </p>
            {status.cert_file_url && (
              <a
                href={status.cert_file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs underline"
              >
                <FileText className="h-3 w-3" /> Ver carné
              </a>
            )}
          </div>
        </div>
      )}

      {isExento && expiringSoon && (
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p>Tu carné vence en {status.days_until_expiry} días</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => setDialogOpen(true)}
            >
              Renovar carné
            </Button>
          </div>
        </div>
      )}

      {justExpired && (
        <div className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/5 p-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
          <div className="flex-1">
            <p>Tu carné venció. El régimen volvió a Normal.</p>
            <Button
              variant="default"
              size="sm"
              className="mt-1"
              onClick={() => setDialogOpen(true)}
            >
              Renovar carné
            </Button>
          </div>
        </div>
      )}

      {!isExento && !justExpired && !isPending && (
        <div className="space-y-1.5">
          <p>Régimen: Normal</p>
          {status.last_rejection_reason && (
            <div className="rounded border border-amber-500/30 bg-amber-50 p-2 text-xs text-amber-900">
              Tu última solicitud fue rechazada:{" "}
              <strong>{status.last_rejection_reason}</strong>. Puedes enviar una nueva.
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            Solicitar exención fiscal
          </Button>
        </div>
      )}

      {isPending && status.pending_request && (
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">
              Solicitud enviada{" "}
              {new Date(status.pending_request.requested_at).toLocaleDateString("es-DO")}.
              Pendiente de aprobación.
            </p>
            <button
              className="mt-1 text-xs text-destructive underline"
              onClick={() => handleCancel(status.pending_request!.name)}
              disabled={cancelling}
            >
              Cancelar solicitud
            </button>
          </div>
        </div>
      )}

      <CarneRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={customer}
        customerName={customerName}
      />
    </div>
  );
}
