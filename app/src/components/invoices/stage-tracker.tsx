"use client";

import { Check, Clock, CreditCard, Eye, BadgeCheck, Wallet, AlertTriangle, Ban, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvoiceStage } from "@/lib/types";

// ── Stage definitions ──

interface StageStep {
  key: InvoiceStage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const HAPPY_PATH: StageStep[] = [
  { key: "Pendiente de Pago", label: "Pendiente", icon: Clock },
  { key: "Pago Sometido", label: "Sometido", icon: CreditCard },
  { key: "Pago en Revisión", label: "En Revisión", icon: Eye },
  { key: "Pago Aprobado", label: "Aprobado", icon: BadgeCheck },
  { key: "Pagada", label: "Pagada", icon: Wallet },
];

// Stages that branch off the happy path
const BRANCH_STAGES: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  "Vencida": { label: "Vencida", icon: AlertTriangle, color: "text-destructive" },
  "Recargo Aplicado": { label: "Recargo Aplicado", icon: AlertTriangle, color: "text-destructive" },
  "Anulación Solicitada": { label: "Anulación Solicitada", icon: XCircle, color: "text-warning" },
  "Anulada": { label: "Anulada", icon: Ban, color: "text-destructive" },
};

function getHappyPathIndex(stage: InvoiceStage): number {
  return HAPPY_PATH.findIndex((s) => s.key === stage);
}

// ── Component ──

interface StageTrackerProps {
  stage: InvoiceStage | null;
  className?: string;
}

export function StageTracker({ stage, className }: StageTrackerProps) {
  if (!stage) return null;

  const branchInfo = BRANCH_STAGES[stage];
  const happyIndex = getHappyPathIndex(stage);

  // If the current stage is a branch stage (Vencida, Anulada, etc.)
  if (branchInfo) {
    const BranchIcon = branchInfo.icon;
    return (
      <div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-full border-2", "border-destructive/30 bg-destructive-soft")}>
            <BranchIcon className={cn("h-5 w-5", branchInfo.color)} />
          </div>
          <div>
            <p className={cn("text-sm font-semibold", branchInfo.color)}>
              {branchInfo.label}
            </p>
            <p className="text-xs text-muted">
              {stage === "Vencida" && "Esta factura ha vencido sin pago."}
              {stage === "Recargo Aplicado" && "Se ha generado una nueva factura con recargo."}
              {stage === "Anulación Solicitada" && "La solicitud de anulación está en revisión."}
              {stage === "Anulada" && "Esta factura ha sido anulada."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Happy path — show step progress
  const currentIndex = happyIndex >= 0 ? happyIndex : 0;

  return (
    <div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {HAPPY_PATH.map((step, idx) => {
            const StepIcon = step.icon;
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFuture = idx > currentIndex;

            return (
              <div key={step.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                      isCompleted && "border-success bg-success text-white",
                      isCurrent && "border-primary bg-primary text-white",
                      isFuture && "border-border bg-surface-muted text-muted"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium text-center leading-tight",
                      isCompleted && "text-success",
                      isCurrent && "text-primary",
                      isFuture && "text-muted"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {/* Connector line (not after last) */}
                {idx < HAPPY_PATH.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 flex-1 rounded",
                      idx < currentIndex ? "bg-success" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: vertical stepper */}
      <div className="sm:hidden space-y-3">
        {HAPPY_PATH.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                  isCompleted && "border-success bg-success text-white",
                  isCurrent && "border-primary bg-primary text-white",
                  isFuture && "border-border bg-surface-muted text-muted"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <StepIcon className="h-3.5 w-3.5" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isCompleted && "text-success",
                  isCurrent && "text-primary",
                  isFuture && "text-muted"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
