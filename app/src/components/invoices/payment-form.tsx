"use client";

import { useState } from "react";
import {
  Upload,
  Loader2,
  Building2,
  CreditCard,
  Hash,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileDropzone } from "@/components/shared/file-dropzone";
import * as api from "@/lib/api";
import { trackPaymentProofUploaded } from "@/lib/analytics";
import type { Invoice } from "@/lib/types";

interface PaymentFormProps {
  invoice: Invoice;
  onPaymentSubmitted: () => void;
}

export function PaymentForm({ invoice, onPaymentSubmitted }: PaymentFormProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const bankInfo = invoice.bank_info;
  // Prefer the canonical `stage` but fall back to the deprecated
  // `invoice_stage` to remain compatible with mid-rollout responses.
  const stage = invoice.stage ?? invoice.invoice_stage;
  // Upload-proof flow is open in any of the three "awaiting payment" stages
  // (see merkley_web.api.invoices.submit_payment_proof).
  const isPaymentPending =
    stage === "Pendiente de Pago" ||
    stage === "Vencida" ||
    stage === "Pago Parcial";
  const wasRejected = !!invoice.payment_rejection_reason;

  const handleFileUpload = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);

    try {
      const fileUrl = await api.uploadInvoiceFile(file, invoice.name);
      setUploadedFileUrl(fileUrl);
      toast({
        title: "Archivo subido",
        description: "El comprobante de pago fue cargado exitosamente.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error al subir archivo",
        description:
          error instanceof Error ? error.message : "No se pudo subir el archivo.",
        variant: "destructive",
      });
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!uploadedFileUrl) {
      toast({
        title: "Sin comprobante",
        description: "Debes subir un comprobante de pago antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.submitPaymentProof(invoice.name, uploadedFileUrl);
      trackPaymentProofUploaded(invoice.name, invoice.grand_total || 0);
      toast({
        title: "Pago sometido",
        description: "Tu comprobante de pago ha sido enviado para revisión.",
        variant: "success",
      });
      onPaymentSubmitted();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo enviar el comprobante.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Only show payment form when stage is "Pendiente de Pago"
  if (!isPaymentPending) return null;

  return (
    <div className="space-y-4">
      {/* Payment rejection banner */}
      {wasRejected && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-destructive bg-destructive-soft p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Pago rechazado
            </p>
            <p className="mt-1 text-sm text-muted">
              {invoice.payment_rejection_reason}
            </p>
            <p className="mt-2 text-xs text-muted">
              Por favor envía un nuevo comprobante de pago.
            </p>
          </div>
        </div>
      )}

      {/* Bank info card */}
      {bankInfo && (bankInfo.bank_name || bankInfo.account_number) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Información Bancaria
            </CardTitle>
            <CardDescription>
              Realiza la transferencia a la siguiente cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bankInfo.bank_name && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Banco</p>
                    <p className="text-sm font-medium">{bankInfo.bank_name}</p>
                  </div>
                </div>
              )}
              {bankInfo.account_number && (
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Número de Cuenta</p>
                    <p className="text-sm font-medium font-mono">{bankInfo.account_number}</p>
                  </div>
                </div>
              )}
              {bankInfo.account_type && (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Tipo de Cuenta</p>
                    <p className="text-sm font-medium">{bankInfo.account_type}</p>
                  </div>
                </div>
              )}
              {bankInfo.rnc && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted shrink-0" />
                  <div>
                    <p className="text-xs text-muted">RNC</p>
                    <p className="text-sm font-medium font-mono">{bankInfo.rnc}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload payment proof */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            {wasRejected ? "Enviar Nuevo Comprobante" : "Comprobante de Pago"}
          </CardTitle>
          <CardDescription>
            Sube una foto o captura de tu comprobante de transferencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File upload area */}
          {uploadedFileUrl ? (
            <div
              className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-primary-soft/30"
              onClick={() => { setUploadedFileUrl(null); setFileName(null); }}
            >
              <CheckCircle2 className="h-8 w-8 text-success" />
              <div className="text-center">
                <p className="text-sm font-medium text-success">Archivo cargado</p>
                <p className="text-xs text-muted">{fileName}</p>
                <p className="mt-1 text-xs text-primary underline">
                  Click para cambiar
                </p>
              </div>
            </div>
          ) : (
            <FileDropzone
              label="Click para subir comprobante"
              helperText="PDF, JPG, PNG (máx. 10MB)"
              accept=".pdf,image/jpeg,image/png"
              maxSizeBytes={10 * 1024 * 1024}
              isUploading={uploading}
              onOversize={() =>
                toast({
                  title: "Archivo muy grande",
                  description: "El archivo no puede exceder 10MB.",
                  variant: "destructive",
                })
              }
              onFiles={handleFileUpload}
            />
          )}

          <Separator />

          {/* Submit button */}
          <Button
            className="w-full"
            onClick={handleSubmitPayment}
            disabled={!uploadedFileUrl || submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Enviar Comprobante de Pago
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
