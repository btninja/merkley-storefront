"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer: string;
  customerName: string;
};

export function CarneRequestDialog({ open, onOpenChange, customer, customerName }: Props) {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [certNumber, setCertNumber] = useState("");
  const [certExpiry, setCertExpiry] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.uploadCarneFile(file);
      setFileUrl(url);
    } catch (e) {
      toast({
        title: "Error al subir archivo",
        description: e instanceof Error ? e.message : "No se pudo subir el archivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.submitCarneRequest({
        customer,
        cert_number: certNumber.trim(),
        cert_expiry: certExpiry,
        cert_file_url: fileUrl!,
      });
      toast({
        title: "Solicitud enviada",
        description: "Nuestro equipo la revisará en 1-2 días hábiles.",
        variant: "success",
      });
      mutate(["carne-status", customer]);
      setCertNumber("");
      setCertExpiry("");
      setFileUrl(null);
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo enviar la solicitud.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minStr = minDate.toISOString().slice(0, 10);

  const canSubmit = certNumber.trim() && certExpiry && fileUrl && !submitting && !uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar exención fiscal — {customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="cert_number">Número de carné</Label>
              <Input
                id="cert_number"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="cert_expiry">Fecha de vencimiento</Label>
              <Input
                id="cert_expiry"
                type="date"
                value={certExpiry}
                onChange={(e) => setCertExpiry(e.target.value)}
                min={minStr}
              />
            </div>
          </div>

          <div>
            <Label>Carné de exención (PDF, JPG o PNG)</Label>
            {fileUrl ? (
              <div className="rounded-lg border p-3 text-sm">
                Archivo cargado ✓
                <button
                  onClick={() => setFileUrl(null)}
                  className="ml-2 text-xs underline"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <FileDropzone
                accept=".pdf,image/jpeg,image/png"
                maxSizeBytes={10 * 1024 * 1024}
                isUploading={uploading}
                onFiles={handleFiles}
                onOversize={() =>
                  toast({
                    title: "Archivo muy grande",
                    description: "Máx 10 MB.",
                    variant: "destructive",
                  })
                }
              />
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Tras enviar, nuestro equipo revisará el documento y aplicará el régimen
            Exento. Esto puede tardar 1-2 días hábiles.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
