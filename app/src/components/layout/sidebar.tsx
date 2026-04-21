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
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

type SidebarLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  adminOnly?: boolean;
  /** Only render when the user has access to 2+ Customers (multi-company). */
  multiCompanyOnly?: boolean;
};

const SIDEBAR_LINKS: SidebarLink[] = [
  { href: "/cuenta", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { href: "/catalogo-pdf", label: "Catálogo PDF", icon: BookOpen },
  { href: "/facturas", label: "Facturas", icon: Receipt },
  { href: "/pedidos", label: "Pedidos", icon: Package },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/descargas", label: "Descargas", icon: Download },
  { href: "/soporte", label: "Soporte", icon: MessageCircle },
  { href: "/cuenta/equipo", label: "Equipo", icon: Users, adminOnly: true },
  { href: "/cuenta/empresas", label: "Mis empresas", icon: Building2, multiCompanyOnly: true },
  { href: "/cuenta/perfil", label: "Perfil", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { customer, availableCustomers } = useAuth();
  const isAdmin = customer?.is_company_admin === true;
  const hasMultipleCustomers = (availableCustomers?.length ?? 0) > 1;

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <nav className="sticky top-20 space-y-1">
        {SIDEBAR_LINKS.filter((link) => {
          if (link.adminOnly && !isAdmin) return false;
          if (link.multiCompanyOnly && !hasMultipleCustomers) return false;
          return true;
        }).map((link) => {
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
    </aside>
  );
}
