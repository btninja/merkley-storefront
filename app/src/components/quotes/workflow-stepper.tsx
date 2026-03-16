"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuoteStage } from "@/lib/constants";

const VISUAL_STEPS = [
  { key: "Borrador", label: "Borrador" },
  { key: "Enviada", label: "Enviada" },
  { key: "En Revision", label: "En Revisión" },
  { key: "Aprobada", label: "Aprobada" },
  { key: "Aceptada", label: "Aceptada" },
] as const;

type VisualStepKey = (typeof VISUAL_STEPS)[number]["key"];

function mapStageToStep(stage: QuoteStage): VisualStepKey {
  switch (stage) {
    case "Borrador":
      return "Borrador";
    case "Enviada":
      return "Enviada";
    case "En Revision":
      return "En Revision";
    case "Aprobada":
      return "Aprobada";
    case "Aceptada por Cliente":
      return "Aceptada";
    default:
      return "Borrador";
  }
}

function stepIndex(key: VisualStepKey): number {
  return VISUAL_STEPS.findIndex((s) => s.key === key);
}

interface WorkflowStepperProps {
  stage: QuoteStage;
}

export function WorkflowStepper({ stage }: WorkflowStepperProps) {
  const isTerminal = stage === "Rechazada" || stage === "Expirada";
  const currentKey = mapStageToStep(stage);
  const currentIdx = stepIndex(currentKey);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center justify-between min-w-[400px]">
        {VISUAL_STEPS.map((step, idx) => {
          const isCompleted = !isTerminal && idx < currentIdx;
          const isCurrent = !isTerminal && idx === currentIdx;
          const isFuture = isTerminal || idx > currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isFuture && "border-2 border-border bg-surface text-muted"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium whitespace-nowrap",
                    isCompleted && "text-primary",
                    isCurrent && "text-foreground",
                    isFuture && "text-muted"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < VISUAL_STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1",
                    idx < currentIdx && !isTerminal ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
