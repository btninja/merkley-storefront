"use client";

import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";

interface AnnulmentDialogProps {
  invoiceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnnulmentRequested: () => void;
}

export function AnnulmentDialog({
  invoiceName,
  open,
  onOpenChange,
  onAnnulmentRequested,
}: AnnulmentDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Razón requerida",
        description: "Debes indicar el motivo de la solicitud de anulación.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.requestAnnulment(invoiceName, reason.trim());
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de anulación ha sido enviada para revisión.",
        variant: "success",
      });
      setReason("");
      onOpenChange(false);
      onAnnulmentRequested();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la solicitud de anulación.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Solicitar Anulación
          </DialogTitle>
          <DialogDescription>
            Solicita la anulación de la factura <strong>{invoiceName}</strong>.
            Esta solicitud será revisada por nuestro equipo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="annulment-reason">Motivo de la anulación</Label>
            <Textarea
              id="annulment-reason"
              placeholder="Describe por qué deseas anular esta factura..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="rounded-lg border border-warning/30 bg-warning-soft p-3">
            <p className="text-xs text-warning leading-relaxed">
              La anulación solo es posible dentro del mes de emisión de la factura.
              Una vez aprobada, la factura será cancelada y no se podrá revertir.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Solicitar Anulación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
