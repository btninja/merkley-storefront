"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Receipt,
  User,
  Users,
  Package,
  History,
  Download,
  MessageCircle,
  Menu,
  LogOut,
  Home,
  ShoppingBag,
  Building2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { Sidebar } from "@/components/layout/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Bottom nav: 4 most-used direct links + a Menú button that opens a drawer
// with the full account menu (Catálogo, Historial, Descargas, Soporte,
// Equipo, Perfil) plus public-site shortcuts and Cerrar Sesión. The header
// hamburger is hidden inside (account) since the drawer covers everything.
const MOBILE_NAV_LINKS = [
  { href: "/cuenta", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { href: "/facturas", label: "Facturas", icon: Receipt },
  { href: "/pedidos", label: "Pedidos", icon: Package },
];

// Items shown inside the bottom-nav Menú drawer, in display order.
const MENU_ACCOUNT_LINKS: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean; multiCompanyOnly?: boolean }> = [
  { href: "/catalogo-pdf", label: "Catálogo PDF", icon: BookOpen },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/descargas", label: "Descargas", icon: Download },
  { href: "/soporte", label: "Soporte", icon: MessageCircle },
  { href: "/cuenta/equipo", label: "Equipo", icon: Users, adminOnly: true },
  // Always shown — even single-company users need to discover "Solicitar
  // otra empresa" so they can request access to additional companies.
  { href: "/cuenta/empresas", label: "Mis empresas", icon: Building2 },
  { href: "/cuenta/perfil", label: "Perfil", icon: User },
];

const MENU_PUBLIC_LINKS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/temporadas", label: "Temporadas", icon: ShoppingBag },
];

function AccountLoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b border-border bg-surface" />
      <Container className="flex-1 py-8">
        <div className="flex gap-8">
          <div className="hidden w-60 shrink-0 lg:block">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Container>
    </div>
  );
}

function MobileAccountNav() {
  const pathname = usePathname();
  const { customer, availableCustomers, logout } = useAuth();
  const isAdmin = customer?.is_company_admin === true;
  const hasMultipleCustomers = (availableCustomers?.length ?? 0) > 1;
  const [menuOpen, setMenuOpen] = useState(false);

  const accountMenuLinks = MENU_ACCOUNT_LINKS.filter((link) => {
    if (link.adminOnly && !isAdmin) return false;
    if (link.multiCompanyOnly && !hasMultipleCustomers) return false;
    return true;
  });

  const isMenuPathActive = accountMenuLinks.some((link) =>
    pathname.startsWith(link.href)
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface lg:hidden">
        <div className="flex items-center justify-around">
          {MOBILE_NAV_LINKS.map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
              isMenuPathActive
                ? "text-primary"
                : "text-muted hover:text-foreground"
            )}
            aria-label="Abrir menú"
          >
            <Menu className="h-4 w-4" />
            <span>Menú</span>
          </button>
        </div>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle>
              <Image
                src="/logo_merkley.svg"
                alt="Merkley Details"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
            </SheetTitle>
            <SheetDescription className="sr-only">
              Menú de navegación de la cuenta
            </SheetDescription>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto flex flex-col gap-1 px-6 pt-2 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
              Mi cuenta
            </p>
            {accountMenuLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-soft text-primary"
                      : "text-foreground hover:bg-surface-muted"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <Separator className="my-3" />

            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
              Tienda
            </p>
            {MENU_PUBLIC_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <Separator className="my-3" />

            <button
              type="button"
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive-soft"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Read the same-domain session-marker cookie set by AuthProvider after
// login. Used as an "authentication is in flight, just propagating" hint
// to avoid bouncing users to /login during the brief window between
// login() resolving and React state catching up.
function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith("mw_session=1"));
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, refreshSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    // No React state yet — but if mw_session=1 is set, the user just
    // authenticated and the AuthProvider hasn't finished refreshing.
    // Pull the session instead of bouncing to /login (which would be a
    // jarring "logged in → redirected back to login" flicker).
    if (hasSessionCookie()) {
      void refreshSession();
      return;
    }
    router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
  }, [isLoading, isAuthenticated, refreshSession, router, pathname]);

  if (isLoading) {
    return <AccountLoadingSkeleton />;
  }

  // Show skeleton (not bounce) while we resolve the session via the cookie
  // hint. The effect above handles the actual redirect when there's truly
  // no session.
  if (!isAuthenticated) {
    return <AccountLoadingSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header showMobileMenu={false} />
      <Container className="flex flex-1 gap-8 py-8">
        <Sidebar />
        <main className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
      </Container>
      <MobileAccountNav />
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
