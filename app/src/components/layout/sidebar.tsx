"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  User,
  BookOpen,
  Receipt,
  Users,
  Package,
  History,
  Download,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { CompanySwitcher } from "@/components/account/company-switcher";

const SIDEBAR_LINKS = [
  { href: "/cuenta", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { href: "/catalogo-pdf", label: "Catálogo PDF", icon: BookOpen },
  { href: "/facturas", label: "Facturas", icon: Receipt },
  { href: "/pedidos", label: "Pedidos", icon: Package },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/descargas", label: "Descargas", icon: Download },
  { href: "/soporte", label: "Soporte", icon: MessageCircle },
  { href: "/cuenta/equipo", label: "Equipo", icon: Users, adminOnly: true },
  { href: "/cuenta/perfil", label: "Perfil", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { customer } = useAuth();
  const isAdmin = customer?.is_company_admin === true;

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-20 space-y-3">
        {/* Company switcher — shows the current active company with a
            dropdown of all companies the user has access to, plus a
            "Solicitar otra empresa" action. Single-customer users see
            a flat label + smaller request action. */}
        <div className="rounded-lg border border-border bg-surface p-2">
          <CompanySwitcher />
        </div>
        <nav className="space-y-1">
        {SIDEBAR_LINKS.filter((link) => !("adminOnly" in link && link.adminOnly) || isAdmin).map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:bg-surface-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
        </nav>
      </div>
    </aside>
  );
}
