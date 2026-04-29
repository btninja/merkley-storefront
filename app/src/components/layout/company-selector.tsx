"use client";

import { useState } from "react";
import { Building2, ChevronDown, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useActiveCustomerFilter } from "@/lib/active-customer-filter";

const SEARCH_THRESHOLD = 6;

type Props = {
  onRequestCompany?: () => void; // called when user clicks "Solicitar otra empresa" — caller wires to the existing access-request dialog
};

export function CompanySelector({ onRequestCompany }: Props) {
  const { availableCustomers } = useAuth();
  const { setFilter, isAll, customer } = useActiveCustomerFilter();
  const [search, setSearch] = useState("");

  const total = availableCustomers?.length ?? 0;

  // 0-company state
  if (total === 0) {
    return (
      <Button variant="outline" size="sm" onClick={onRequestCompany}>
        <Building2 className="mr-1 h-3.5 w-3.5" />
        Sin empresa vinculada
      </Button>
    );
  }

  // 1-company state — non-interactive badge
  if (total === 1) {
    const only = availableCustomers![0];
    return (
      <div className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm">
        <Building2 className="h-3.5 w-3.5" />
        <span className="truncate max-w-[16rem]">{only.customer_name || only.name}</span>
      </div>
    );
  }

  // Multi-company
  const currentName = isAll
    ? "Todas las empresas"
    : (() => {
        const c = availableCustomers!.find((c) => c.name === customer);
        return c ? c.customer_name || c.name : "—";
      })();

  const filtered = availableCustomers!.filter((c) => {
    if (!search) return true;
    const label = (c.customer_name || c.name).toLowerCase();
    return label.includes(search.toLowerCase());
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Building2 className="mr-1 h-3.5 w-3.5" />
          <span className="truncate max-w-[12rem]">{currentName}</span>
          <ChevronDown className="ml-1 h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {total > SEARCH_THRESHOLD && (
          <div className="px-2 py-1.5">
            <Input
              placeholder="Buscar empresa…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
        )}
        <div className="max-h-80 overflow-y-auto">
          {filtered.map((c) => (
            <DropdownMenuItem
              key={c.name}
              onSelect={() => {
                setFilter(c.name);
                setSearch("");
              }}
            >
              {customer === c.name ? (
                <Check className="mr-2 h-3.5 w-3.5" />
              ) : (
                <span className="mr-2 inline-block w-3.5" />
              )}
              <span className="truncate">{c.customer_name || c.name}</span>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setFilter("all")}>
          <span className="mr-2 inline-block w-3.5" />
          Ver todas las empresas
        </DropdownMenuItem>
        {onRequestCompany && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onRequestCompany}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Solicitar otra empresa
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
