"use client";
import { formatCurrency, formatDate } from "@/lib/format";

interface DocHeaderProps {
  title: string;
  customerName: string;
  issuedLabel: string;
  issuedDate: string;
  dueLabel: string;
  dueDate: string;
  subtotal?: number;
  taxes?: number;
  total: number;
}

export function DocHeader(p: DocHeaderProps) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto] border-b pb-4">
      <div>
        <h1 className="text-xl font-semibold">{p.title}</h1>
        <p className="text-sm text-muted-foreground">
          {p.issuedLabel} {formatDate(p.issuedDate)} • {p.dueLabel} {formatDate(p.dueDate)}
        </p>
        <p className="text-sm">{p.customerName}</p>
      </div>
      <div className="text-right">
        {p.subtotal != null && <p className="text-sm">Subtotal: {formatCurrency(p.subtotal)}</p>}
        {p.taxes != null && <p className="text-sm">ITBIS: {formatCurrency(p.taxes)}</p>}
        <p className="font-semibold">Total: {formatCurrency(p.total)}</p>
      </div>
    </div>
  );
}
