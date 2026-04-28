"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  AlertTriangle,
  Loader2,
  X,
  ShieldCheck,
  Landmark,
  ImagePlus,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileDropzone } from "@/components/shared/file-dropzone";
import * as api from "@/lib/api";
import { ResponsibilityLetterDialog } from "./responsibility-letter-dialog";
import { APPROVAL_METHODS, PAYMENT_INFO } from "@/lib/constants";
import type { ApprovalMethod } from "@/lib/constants";
import type { QuotationDocuments } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
// .heic/.heif accepted at picker level so iPhone customers can SELECT
// the file from desktop file dialogs (OS greys out extensions not in
// this list). FileDropzone converts HEIC→JPEG client-side before
// upload, so the server still receives a clean JPEG.
const APPROVAL_DOC_TYPES = ".pdf,.jpg,.jpeg,.png,.heic,.heif";
// Brand books ship vector/source formats. Keep raster + Apple HEIC and
// add the common vector / source-art extensions so designers can drop
// the canonical file straight from the brand kit.
const LOGO_FILE_TYPES = ".pdf,.jpg,.jpeg,.png,.heic,.heif,.svg,.webp,.eps,.ai,.psd,.tiff,.tif";

interface ApprovalUploadProps {
  quotationName: string;
  documents: QuotationDocuments | null;
  hasPersonalizableItems: boolean;
  onSuccess: () => void;
}

export function ApprovalUpload({
  quotationName,
  documents,
  hasPersonalizableItems,
  onSuccess,
}: ApprovalUploadProps) {
  const { toast } = useToast();
  const STORAGE_KEY = `mw:quote-approval-draft:${quotationName}`;
  const [approvalMethod, setApprovalMethod] = useState<ApprovalMethod | null>(null);
  const [approvalDoc, setApprovalDoc] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cartaDialogOpen, setCartaDialogOpen] = useState(false);
  const logoSectionRef = useRef<HTMLDivElement | null>(null);

  // Restore approvalMethod from sessionStorage on mount. Files can't
  // round-trip through storage; only the radio choice persists so users
  // who navigate away mid-flow keep their selection.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.approvalMethod) setApprovalMethod(parsed.approvalMethod);
      }
    } catch { /* ignore */ }
  }, [STORAGE_KEY]);

  // Persist approvalMethod to sessionStorage so it survives reloads.
  useEffect(() => {
    if (approvalMethod) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ approvalMethod }));
    }
  }, [approvalMethod, STORAGE_KEY]);

  const rejectionNotes = documents?.rejection_notes;
  const isCartaMethod = approvalMethod === "Carta de responsabilidad firmada y sellada";
  const isVoucherMethod = approvalMethod === "Voucher de pago del 50%";

  // Submit button is unblocked when method + approval doc are filled.
  // Logo is validated separately on click so the missing-logo error is
  // visible (toast + scroll to dropzone) instead of silently disabling
  // the action.
  const canSubmit = approvalMethod && approvalDoc;

  function handleOversize() {
    toast({
      title: "Archivo muy grande",
      description: "El archivo no puede exceder 10 MB.",
      variant: "destructive",
    });
  }

  function handleReject(_file: File, reason: "type" | "size") {
    if (reason === "type") {
      toast({
        title: "Tipo de archivo no permitido",
        description: "El formato no está aceptado. Revisa los tipos permitidos en cada campo.",
        variant: "destructive",
      });
    }
  }

  async function handleSubmit() {
    if (!approvalMethod || !approvalDoc) return;
    if (hasPersonalizableItems && !logoFile) {
      toast({
        title: "Logo requerido",
        description: "Falta subir el logo de tu empresa para personalizar los productos.",
        variant: "destructive",
      });
      logoSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setUploading(true);
    try {
      // Upload files first (uses custom endpoint that verifies ownership)
      const uploads: Promise<string>[] = [
        api.uploadQuotationFile(approvalDoc, quotationName),
      ];
      if (hasPersonalizableItems && logoFile) {
        uploads.push(api.uploadQuotationFile(logoFile, quotationName));
      }

      const [docUrl, logoUrl] = await Promise.all(uploads);

      await api.approveQuotation(
        quotationName,
        approvalMethod,
        docUrl,
        logoUrl || undefined,
      );

      sessionStorage.removeItem(STORAGE_KEY);
      toast({
        title: "Cotización aprobada",
        description:
          "Tu aprobación ha sido enviada. Nuestro equipo revisará los documentos.",
        variant: "success",
      });
      onSuccess();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudo completar la aprobación.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Aprobar Cotización</CardTitle>
        </div>
        <CardDescription>
          Para aprobar esta cotización, selecciona un método de aprobación y sube el
          documento correspondiente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Rejection notes warning */}
        {rejectionNotes && (
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium text-warning">
                Documentos devueltos
              </p>
              <p className="mt-1 text-sm text-muted">{rejectionNotes}</p>
            </div>
          </div>
        )}

        {/* Step 1: Approval method selection */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">1. Método de aprobación</p>
          <div className="grid gap-2">
            {APPROVAL_METHODS.map((method) => (
              <label
                key={method}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  approvalMethod === method
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30 hover:bg-surface-muted"
                }`}
              >
                <input
                  type="radio"
                  name="approval-method"
                  value={method}
                  checked={approvalMethod === method}
                  onChange={() => {
                    setApprovalMethod(method);
                    setApprovalDoc(null);
                  }}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">{method}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Carta de responsabilidad */}
        {isCartaMethod && (
          <>
            <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info-soft p-4">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-info" />
              <div className="flex-1">
                <p className="text-sm font-medium text-info">
                  Carta de Responsabilidad
                </p>
                <p className="mt-1 text-sm text-muted">
                  Completa los datos de tu empresa, descarga la carta, imprímela,
                  fírmala, séllala y súbela abajo.
                </p>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => setCartaDialogOpen(true)}
                >
                  Completar y descargar carta
                </Button>
              </div>
            </div>
            <ResponsibilityLetterDialog
              open={cartaDialogOpen}
              onOpenChange={setCartaDialogOpen}
              quotationName={quotationName}
            />
          </>
        )}

        {/* Payment info (shown for voucher method or always as reference) */}
        {(isVoucherMethod || approvalMethod) && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-muted" />
                <p className="text-sm font-semibold">Información de Pago</p>
                {isVoucherMethod && (
                  <Badge className="bg-warning-soft text-warning text-[10px]">
                    Requerido para este método
                  </Badge>
                )}
              </div>
              <div className="rounded-lg border border-border bg-surface-muted p-4">
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted">Banco</p>
                    <p className="font-medium">{PAYMENT_INFO.bank}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Tipo de Cuenta</p>
                    <p className="font-medium">{PAYMENT_INFO.accountType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Número de Cuenta</p>
                    <p className="font-medium font-mono">{PAYMENT_INFO.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Cédula</p>
                    <p className="font-medium font-mono">{PAYMENT_INFO.cedula}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted">Titular</p>
                    <p className="font-medium">{PAYMENT_INFO.accountHolder}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Upload approval document */}
        {approvalMethod && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-semibold">2. Subir documento de aprobación</p>
              {approvalDoc ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-3">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{approvalDoc.name}</p>
                    <p className="text-xs text-muted">
                      {(approvalDoc.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApprovalDoc(null)}
                    className="shrink-0 rounded-md p-1 text-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <FileDropzone
                  label={approvalMethod}
                  helperText="PDF, JPG o PNG (máx 10 MB)"
                  accept={APPROVAL_DOC_TYPES}
                  maxSizeBytes={MAX_FILE_SIZE}
                  onOversize={handleOversize}
                  onReject={handleReject}
                  onFiles={([f]) => { if (f) setApprovalDoc(f); }}
                />
              )}
            </div>
          </>
        )}

        {/* Step 3: Logo upload (conditional) */}
        {approvalMethod && hasPersonalizableItems && (
          <>
            <Separator />
            <div className="space-y-3" ref={logoSectionRef}>
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-muted" />
                <p className="text-sm font-semibold">3. Logo de tu empresa</p>
              </div>
              <p className="text-xs text-muted">
                Tu cotización incluye artículos personalizables. Sube el logo de tu empresa
                en alta resolución para que podamos aplicarlo a los productos.
              </p>
              {logoFile ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-3">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{logoFile.name}</p>
                    <p className="text-xs text-muted">
                      {(logoFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogoFile(null)}
                    className="shrink-0 rounded-md p-1 text-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <FileDropzone
                  label="Logo de empresa"
                  helperText="PNG, JPG, SVG, PDF, EPS, AI, PSD, TIFF, WEBP (máx 10 MB). Preferiblemente vector o PNG con fondo transparente."
                  accept={LOGO_FILE_TYPES}
                  maxSizeBytes={MAX_FILE_SIZE}
                  onOversize={handleOversize}
                  onReject={handleReject}
                  onFiles={([f]) => { if (f) setLogoFile(f); }}
                />
              )}
            </div>
          </>
        )}

        {/* Submit */}
        {approvalMethod && (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando aprobación...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Aprobar Cotización
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

{/* Keep old name as alias for backward compat */}
export { ApprovalUpload as AcceptanceUpload };
