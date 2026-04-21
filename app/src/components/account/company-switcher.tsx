"use client";

/**
 * CompanySwitcher
 *
 * Dropdown + "request access to another company" modal for portal users
 * who have access to multiple Customers. Replaces the static
 * `customer.company_name` label previously shown in the account menu.
 *
 * Visibility rules:
 *   0 customers → render nothing (should not happen for authenticated users;
 *                 auth context handles that higher up).
 *   1 customer  → render a read-only label with a "Solicitar otra empresa"
 *                 button so single-customer users can request a second.
 *   2+ customers → render a full dropdown with each company and a
 *                 "Solicitar otra empresa" footer row. Pending requests
 *                 surface inline with status.
 *
 * Switching calls switchCustomer() (auth-context) which sets the
 * mw_active_customer cookie server-side and refetches the session — so
 * all downstream data (quotations, invoices, price list) re-resolves
 * under the new customer automatically.
 */

import { useEffect, useState } from "react";
import { Building2, ChevronDown, Plus, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as api from "@/lib/api";
import type { CustomerAccessRequest } from "@/lib/types";

export function CompanySwitcher({ onSwitched }: { onSwitched?: () => void }) {
  const { customer, availableCustomers, switchCustomer } = useAuth();
  const { toast } = useToast();

  const [switching, setSwitching] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requests, setRequests] = useState<CustomerAccessRequest[]>([]);

  // Load the user's own pending/recent access requests so we can
  // surface status inside the dropdown ("empresa X · pendiente").
  useEffect(() => {
    let cancelled = false;
    api.listMyAccessRequests()
      .then((r) => { if (!cancelled) setRequests(r.requests); })
      .catch(() => { /* silent — non-critical */ });
    return () => { cancelled = true; };
  }, [customer?.name]);

  const handleSwitch = async (customerName: string) => {
    if (customerName === customer?.name) return;
    setSwitching(true);
    try {
      await switchCustomer(customerName);
      toast({ title: "Cambiado de empresa", description: `Ahora actúas como ${customerName}.` });
      onSwitched?.();
    } catch (e) {
      toast({
        title: "No se pudo cambiar de empresa",
        description: e instanceof Error ? e.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSwitching(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "Pending");
  const hasMultiple = availableCustomers.length > 1;
  const activeName = customer?.company_name || customer?.name || "Mi Cuenta";

  return (
    <>
      {hasMultiple ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-left hover:bg-surface-muted transition-colors"
              disabled={switching}
            >
              <Building2 className="h-4 w-4 text-muted shrink-0" />
              <span className="flex-1 truncate">{activeName}</span>
              {switching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted shrink-0" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted shrink-0" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[min(320px,calc(100vw-2rem))]">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
              Mis empresas
            </p>
            {availableCustomers.map((c) => {
              const isActive = c.name === customer?.name;
              return (
                <DropdownMenuItem
                  key={c.name}
                  onClick={() => handleSwitch(c.name)}
                  className={cn("flex items-center gap-2 py-2", isActive && "bg-surface-muted")}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.customer_name || c.name}</p>
                    {c.tax_id && (
                      <p className="text-xs text-muted truncate">RNC {c.tax_id}</p>
                    )}
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                </DropdownMenuItem>
              );
            })}
            {pendingRequests.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  Pendientes
                </p>
                {pendingRequests.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-foreground">{r.requested_company_name}</p>
                      <p className="text-xs">Pendiente de aprobación</p>
                    </div>
                  </div>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setRequestOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Solicitar otra empresa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // Single-customer view — flat label + a smaller "request" action
        // so users with one company can still ask for access to another.
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
            <Building2 className="h-4 w-4 text-muted shrink-0" />
            <span className="truncate">{activeName}</span>
          </div>
          <button
            onClick={() => setRequestOpen(true)}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" />
            Solicitar otra empresa
          </button>
          {pendingRequests.length > 0 && (
            <p className="px-3 text-xs text-muted">
              {pendingRequests.length} solicitud{pendingRequests.length === 1 ? "" : "es"} pendiente{pendingRequests.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}

      <RequestAccessDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        onSubmitted={(newReq) => setRequests((prev) => [newReq, ...prev])}
      />
    </>
  );
}

function RequestAccessDialog({
  open,
  onOpenChange,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitted: (req: CustomerAccessRequest) => void;
}) {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [rnc, setRnc] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetAndClose = () => {
    setCompanyName("");
    setRnc("");
    setMessage("");
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.requestCustomerAccess({
        company_name: companyName.trim(),
        rnc: rnc.trim() || undefined,
        message: message.trim() || undefined,
      });
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
      // Provide a synthetic record so the switcher's pending list
      // updates immediately without a round-trip.
      onSubmitted({
        name: res.name,
        requested_company_name: companyName.trim(),
        requested_rnc: rnc.trim() || null,
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
          <div className="space-y-1.5">
            <Label htmlFor="ca-company">Nombre de la empresa *</Label>
            <Input
              id="ca-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej: Distribuidora XYZ, SRL"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ca-rnc">RNC (opcional)</Label>
            <Input
              id="ca-rnc"
              value={rnc}
              onChange={(e) => setRnc(e.target.value.replace(/\D/g, ""))}
              placeholder="000000000"
              inputMode="numeric"
            />
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
            <Button type="submit" disabled={submitting || !companyName.trim()}>
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Enviar solicitud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
