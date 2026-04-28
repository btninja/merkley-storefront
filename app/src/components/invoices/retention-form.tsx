"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileDropzone } from "@/components/shared/file-dropzone";
import * as api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Invoice } from "@/lib/types";

// Parse a locale-formatted decimal string. Handles "1.234,56" (es-DO),
// "1,234.56" (en-US), bare integers, and bare decimals. Returns NaN
// when the input is empty or unparseable so callers can guard with
// !isNaN(...) like parseFloat. Plain parseFloat truncates locale-grouped
// strings like "1,234" -> 1, which silently understates retention amounts.
function parseLocaleNumber(s: string): number {
  if (!s) return NaN;
  const cleaned = s.replace(/\s/g, "");
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      return Number(cleaned.replace(/\./g, "").replace(",", "."));
    } else {
      return Number(cleaned.replace(/,/g, ""));
    }
  } else if (lastComma > -1) {
    return Number(cleaned.replace(",", "."));
  } else {
    return Number(cleaned);
  }
}

interface RetentionFormProps {
  invoice: Invoice;
  onRetentionSubmitted: () => void;
}

export function RetentionForm({ invoice, onRetentionSubmitted }: RetentionFormProps) {
  const { toast } = useToast();
  const RETENTION_KEY = `md_retention_${invoice.name}`;
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [retentionAmount, setRetentionAmount] = useState<string>("");
  const [retentionPercentage, setRetentionPercentage] = useState<string>("");

  // Restore retention amounts from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(RETENTION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.amount) setRetentionAmount(parsed.amount);
        if (parsed.percentage) setRetentionPercentage(parsed.percentage);
      }
    } catch { /* ignore */ }
  }, [RETENTION_KEY]);

  // Persist retention amounts to sessionStorage
  useEffect(() => {
    if (retentionAmount || retentionPercentage) {
      sessionStorage.setItem(RETENTION_KEY, JSON.stringify({
        amount: retentionAmount,
        percentage: retentionPercentage,
      }));
    }
  }, [retentionAmount, retentionPercentage, RETENTION_KEY]);

  const hasNCF = !!invoice.ncf;
  const canSubmit = invoice.can_submit_retention;
  const alreadySubmitted = !!invoice.retention_letter_file;
  const isReviewed = !!invoice.retention_reviewed_at;

  // Show if: invoice has NCF AND (can submit OR already submitted)
  if (!hasNCF || (!canSubmit && !alreadySubmitted)) return null;

  // Already submitted and reviewed — just show info
  if (alreadySubmitted && isReviewed) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <CardTitle className="text-base">Retención Fiscal Procesada</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {invoice.retention_amount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Monto de retención</span>
              <span className="font-semibold">{formatCurrency(invoice.retention_amount)}</span>
            </div>
          )}
          {invoice.retention_percentage > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Porcentaje</span>
              <span className="font-semibold">{invoice.retention_percentage}%</span>
            </div>
          )}
          {invoice.retention_reviewed_at && (
            <p className="text-xs text-muted">
              Revisada el {formatDate(invoice.retention_reviewed_at)}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Already submitted but pending review
  if (alreadySubmitted && !isReviewed) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info-soft p-4">
        <Receipt className="mt-0.5 h-5 w-5 shrink-0 text-info" />
        <div>
          <p className="text-sm font-medium text-info">
            Carta de retención enviada
          </p>
          <p className="mt-1 text-sm text-muted">
            Tu carta de retención está siendo procesada por nuestro equipo fiscal.
          </p>
          {invoice.retention_amount > 0 && (
            <p className="mt-1 text-sm text-muted">
              Monto: {formatCurrency(invoice.retention_amount)}
            </p>
          )}
          {invoice.retention_letter_uploaded_at && (
            <p className="mt-1 text-xs text-muted">
              Enviada: {formatDate(invoice.retention_letter_uploaded_at)}
            </p>
          )}
        </div>
      </div>
    );
  }

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
        description: "La carta de retención fue cargada exitosamente.",
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

  const handleSubmitRetention = async () => {
    if (!uploadedFileUrl) {
      toast({
        title: "Sin archivo",
        description: "Debes subir la carta de retención antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const parsedAmount = retentionAmount ? parseLocaleNumber(retentionAmount) : undefined;
      const parsedPct = retentionPercentage ? parseLocaleNumber(retentionPercentage) : undefined;
      await api.submitRetentionLetter(
        invoice.name,
        uploadedFileUrl,
        parsedAmount !== undefined && !isNaN(parsedAmount) ? parsedAmount : undefined,
        parsedPct !== undefined && !isNaN(parsedPct) ? parsedPct : undefined
      );
      sessionStorage.removeItem(RETENTION_KEY);
      toast({
        title: "Carta de retención enviada",
        description: "Tu carta de retención ha sido recibida y será procesada.",
        variant: "success",
      });
      onRetentionSubmitted();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo enviar la carta.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-calculate percentage when amount changes
  const handleAmountChange = (value: string) => {
    setRetentionAmount(value);
    const amount = parseLocaleNumber(value);
    if (!isNaN(amount) && invoice.grand_total > 0) {
      const pct = (amount / invoice.grand_total) * 100;
      setRetentionPercentage(pct.toFixed(2));
    }
  };

  // Auto-calculate amount when percentage changes
  const handlePercentageChange = (value: string) => {
    setRetentionPercentage(value);
    const pct = parseLocaleNumber(value);
    if (!isNaN(pct) && invoice.grand_total > 0) {
      const amount = (pct / 100) * invoice.grand_total;
      setRetentionAmount(amount.toFixed(2));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4" />
          Carta de Retención
        </CardTitle>
        <CardDescription>
          Si tu empresa aplica retención fiscal, sube la carta de retención y especifica el monto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Retention amount inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="retention-amount">Monto de Retención (RD$)</Label>
            <Input
              id="retention-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={retentionAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retention-pct">Porcentaje (%)</Label>
            <Input
              id="retention-pct"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0.00"
              value={retentionPercentage}
              onChange={(e) => handlePercentageChange(e.target.value)}
            />
          </div>
        </div>

        {/* File upload area */}
        {uploadedFileUrl ? (
          <div className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-primary-soft/30"
            onClick={() => { setUploadedFileUrl(null); setFileName(null); }}
          >
            <CheckCircle2 className="h-8 w-8 text-success" />
            <div className="text-center">
              <p className="text-sm font-medium text-success">Archivo cargado</p>
              <p className="text-xs text-muted">{fileName}</p>
              <p className="mt-1 text-xs text-primary underline">Click para cambiar</p>
            </div>
          </div>
        ) : (
          <FileDropzone
            label="Click para subir carta de retención"
            helperText="PDF, JPG, PNG (máx. 10MB)"
            accept=".pdf,image/jpeg,image/png,.heic,.heif"
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
          onClick={handleSubmitRetention}
          disabled={!uploadedFileUrl || submitting}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Receipt className="h-4 w-4" />
          )}
          Enviar Carta de Retención
        </Button>
      </CardContent>
    </Card>
  );
}
