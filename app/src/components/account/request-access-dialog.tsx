"use client";

/**
 * Dialog for requesting access to another company. Used by:
 *   - /cuenta/empresas page (list + manage)
 *   - <CompanySelector /> in the portal topbar
 *
 * Mirrors the DGII validation flow from registration: when the user
 * enters a 9 or 11 digit RNC and tabs out, we auto-validate against
 * the DGII registry. Submission is blocked for clearly-invalid RNCs
 * but allowed when the field is left blank.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as api from "@/lib/api";
import { useUtmParams } from "@/context/utm-context";
import { trackAccessRequestSubmitted } from "@/lib/analytics";
import type { CustomerAccessRequest, DgiiValidationResult } from "@/lib/types";

export function RequestAccessDialog({
  open,
  onOpenChange,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitted?: (req: CustomerAccessRequest) => void;
}) {
  const { toast } = useToast();
  const utmParams = useUtmParams();
  const [companyName, setCompanyName] = useState("");
  const [rnc, setRnc] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // DGII validation state — mirrors the registration flow.
  // When the RNC is a valid 9 or 11 digit input and the user tabs
  // out, we auto-fire validate_rnc against the DGII registry. The
  // dialog won't let them submit a clearly-invalid RNC (but we still
  // allow submitting without an RNC at all, in case the user only
  // knows the company name).
  const [dgiiLoading, setDgiiLoading] = useState(false);
  const [dgiiResult, setDgiiResult] = useState<DgiiValidationResult | null>(null);
  const [dgiiChecked, setDgiiChecked] = useState(false);
  // Prevent racing requests if the user re-blurs the same value.
  const lastValidatedRnc = useRef<string | null>(null);
  // Abort any in-flight DGII verify when a newer one starts so a stale
  // (slow) response can't overwrite a fresher result.
  const dgiiAbortRef = useRef<AbortController | null>(null);

  const cleanedRnc = rnc.replace(/\D/g, "");
  const rncLongEnough = cleanedRnc.length >= 9;
  const rncInvalid = dgiiChecked && dgiiResult !== null && !dgiiResult.valid;
  const rncValid = dgiiChecked && dgiiResult?.valid === true;

  const resetAndClose = useCallback(() => {
    setCompanyName("");
    setRnc("");
    setMessage("");
    setDgiiResult(null);
    setDgiiChecked(false);
    setDgiiLoading(false);
    lastValidatedRnc.current = null;
    onOpenChange(false);
  }, [onOpenChange]);

  // Reset DGII state whenever the user changes the RNC digits.
  useEffect(() => {
    if (cleanedRnc !== lastValidatedRnc.current) {
      setDgiiChecked(false);
      setDgiiResult(null);
    }
  }, [cleanedRnc]);

  const runDgiiValidation = useCallback(async () => {
    if (!rncLongEnough) return;
    if (cleanedRnc === lastValidatedRnc.current && dgiiChecked) return;
    // Cancel any in-flight previous request so a stale (slow) DGII
    // response can't overwrite a fresher result.
    dgiiAbortRef.current?.abort();
    const controller = new AbortController();
    dgiiAbortRef.current = controller;
    setDgiiLoading(true);
    try {
      const result = await api.validateRnc(cleanedRnc, { signal: controller.signal });
      // Drop result if a newer request superseded this one.
      if (dgiiAbortRef.current !== controller) return;
      setDgiiResult(result);
      setDgiiChecked(true);
      lastValidatedRnc.current = cleanedRnc;
      if (result.valid) {
        // Only auto-fill the company name if the user hasn't typed
        // their own — respect their input otherwise.
        const resolvedName =
          result.existing_company_name || result.trade_name || result.full_name;
        if (resolvedName && !companyName.trim()) {
          setCompanyName(resolvedName);
        }
      } else {
        toast({
          title: "RNC no encontrado",
          description: result.message || "No se pudo validar el RNC contra la DGII.",
          variant: "destructive",
        });
      }
    } catch {
      if (controller.signal.aborted) return; // ignore aborted requests
      // Network / CORS failure — let user retry via the "Verificar"
      // button. No toast on silent blur failures to avoid spam.
      setDgiiChecked(false);
      setDgiiResult(null);
    } finally {
      if (dgiiAbortRef.current === controller) setDgiiLoading(false);
    }
  }, [cleanedRnc, rncLongEnough, dgiiChecked, companyName, toast]);

  const handleRncBlur = useCallback(() => {
    if (rncLongEnough && !dgiiChecked && !dgiiLoading) {
      runDgiiValidation();
    }
  }, [rncLongEnough, dgiiChecked, dgiiLoading, runDgiiValidation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    // If they entered an RNC, it must be DGII-valid. A user who just
    // doesn't know the RNC can leave it blank.
    if (cleanedRnc) {
      if (!dgiiChecked) {
        toast({
          title: "Verifica el RNC",
          description: "Haz clic en Verificar para validar el RNC contra la DGII.",
          variant: "destructive",
        });
        return;
      }
      if (dgiiResult && !dgiiResult.valid) {
        toast({
          title: "RNC inválido",
          description: "No podemos enviar la solicitud con un RNC que no existe en la DGII.",
          variant: "destructive",
        });
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await api.requestCustomerAccess({
        company_name: companyName.trim(),
        rnc: cleanedRnc || undefined,
        message: message.trim() || undefined,
        // Attribution forwarded from landing context — B2B access requests
        // are a conversion point and should feed the revenue-by-channel
        // pipeline same as quote submissions.
        ...utmParams,
      });
      trackAccessRequestSubmitted(companyName.trim(), !!res.duplicate);
      if (res.duplicate) {
        toast({
          title: "Ya tienes una solicitud pendiente",
          description: `Seguiremos revisando tu solicitud para ${companyName}.`,
        });
      } else {
        toast({
          title: "Solicitud enviada",
          description: "Recibirás una notificación cuando sea revisada.",
        });
      }
      onSubmitted?.({
        name: res.name,
        requested_company_name: companyName.trim(),
        requested_rnc: cleanedRnc || null,
        message: message.trim() || null,
        status: "Pending",
        decline_reason: null,
        resulting_customer: null,
        creation: new Date().toISOString(),
        modified: new Date().toISOString(),
      });
      resetAndClose();
    } catch (e) {
      toast({
        title: "No se pudo enviar la solicitud",
        description: e instanceof Error ? e.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    !!companyName.trim() &&
    !submitting &&
    !dgiiLoading &&
    (!cleanedRnc || rncValid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar acceso a otra empresa</DialogTitle>
          <DialogDescription>
            Pide acceso para representar a otra empresa en el portal. Un miembro del equipo revisará tu solicitud y te notificará.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* RNC goes first so the DGII auto-fill populates the
              company name below, matching the registration flow. */}
          <div className="space-y-1.5">
            <Label htmlFor="ca-rnc">RNC o Cédula</Label>
            <div className="flex items-stretch gap-2">
              <Input
                id="ca-rnc"
                value={rnc}
                onChange={(e) => setRnc(e.target.value.replace(/\D/g, ""))}
                onBlur={handleRncBlur}
                placeholder="000000000"
                inputMode="numeric"
                maxLength={11}
                autoFocus
                className={cn(
                  rncInvalid && "border-destructive focus-visible:ring-destructive",
                  rncValid && "border-success",
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={!rncLongEnough || dgiiLoading}
                onClick={runDgiiValidation}
              >
                {dgiiLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : rncValid ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                ) : (
                  "Verificar"
                )}
              </Button>
            </div>
            {rncValid && dgiiResult && (
              <div className="flex items-start gap-1.5 rounded-md bg-success-soft px-2.5 py-1.5 text-xs text-success">
                <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {dgiiResult.trade_name || dgiiResult.full_name}
                  </p>
                  {dgiiResult.status && (
                    <p className="opacity-80">Estado DGII: {dgiiResult.status}</p>
                  )}
                  {dgiiResult.company_exists && (
                    <p className="opacity-80">
                      Esta empresa ya está registrada en nuestro sistema — la vincularemos automáticamente al aprobar.
                    </p>
                  )}
                </div>
              </div>
            )}
            {rncInvalid && (
              <div className="flex items-start gap-1.5 rounded-md bg-destructive-soft px-2.5 py-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  {dgiiResult?.message || "Este RNC/Cédula no se encontró en la DGII."}
                </span>
              </div>
            )}
            <p className="text-[11px] text-muted">
              Valida contra el registro de la DGII. Déjalo vacío si no conoces el RNC.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ca-company">Nombre de la empresa *</Label>
            <Input
              id="ca-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej: Distribuidora XYZ, SRL"
              required
            />
            {rncValid && dgiiResult?.full_name && companyName.trim() !== (dgiiResult.trade_name || dgiiResult.full_name) && (
              <p className="text-[11px] text-muted">
                Según la DGII: {dgiiResult.trade_name || dgiiResult.full_name}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ca-message">Mensaje (opcional)</Label>
            <Textarea
              id="ca-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe por qué necesitas acceso."
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Enviar solicitud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
