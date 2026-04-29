"use client";

/**
 * Shared components for the unified multi-company portal:
 *
 *   <CompanyFilterChips>  — a "Todas | Empresa A | Empresa B" chip row
 *                           shown above list pages. Single-company users
 *                           don't see it at all (nothing to filter).
 *
 *   <CompanyBadge>         — small colored pill next to each row showing
 *                            which company it belongs to. Hidden for
 *                            single-company users.
 *
 * Both read from useAuth().availableCustomers so they auto-hide when
 * the user only has one company linked.
 */

import { useAuth } from "@/context/auth-context";
import { useActiveCustomerFilter } from "@/lib/active-customer-filter";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import type { AvailableCustomer } from "@/lib/types";

/**
 * Deterministic color assignment per Customer name — stable hash so
 * a given company gets the same color wherever it's shown. Muted
 * palette so the badge doesn't dominate the row.
 */
const BADGE_PALETTE = [
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-sky-100 text-sky-800 border-sky-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
];

function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return BADGE_PALETTE[Math.abs(h) % BADGE_PALETTE.length];
}

export function CompanyFilterChips({ className }: { className?: string }) {
  const { availableCustomers } = useAuth();
  const { customer, isAll, setFilter } = useActiveCustomerFilter();

  if (!availableCustomers || availableCustomers.length <= 1) {
    // Single-company users don't need a filter — they'd always have
    // exactly one chip active. Hide to reduce visual noise.
    return null;
  }

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      <span className="text-xs font-medium text-muted pr-1">Empresa:</span>
      <button
        type="button"
        onClick={() => setFilter("all")}
        className={cn(
          "px-2.5 py-1 rounded-full border text-xs font-medium transition-colors",
          isAll
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-surface border-border text-muted hover:text-foreground hover:border-foreground/20"
        )}
      >
        Todas
      </button>
      {availableCustomers.map((c) => (
        <button
          key={c.name}
          type="button"
          onClick={() => setFilter(c.name)}
          className={cn(
            "px-2.5 py-1 rounded-full border text-xs font-medium transition-colors",
            customer === c.name
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface border-border text-muted hover:text-foreground hover:border-foreground/20"
          )}
        >
          {c.customer_name || c.name}
        </button>
      ))}
    </div>
  );
}

export function CompanyBadge({
  customer,
  customerName,
  className,
}: {
  /** Customer primary key, used for the color hash. */
  customer: string | null | undefined;
  /** Display label (falls back to `customer` if missing). */
  customerName?: string | null;
  className?: string;
}) {
  const { availableCustomers } = useAuth();

  if (!customer) return null;
  if (!availableCustomers || availableCustomers.length <= 1) {
    // Only one company → no need to mark each row.
    return null;
  }

  const label = customerName || customer;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium",
        hashColor(customer),
        className
      )}
      title={`Empresa: ${label}`}
    >
      <Building2 className="h-3 w-3 opacity-70" />
      <span className="truncate max-w-[140px]">{label}</span>
    </span>
  );
}

export function useMultipleCustomers(): { multiple: boolean; customers: AvailableCustomer[] } {
  const { availableCustomers } = useAuth();
  return {
    multiple: (availableCustomers?.length ?? 0) > 1,
    customers: availableCustomers || [],
  };
}
