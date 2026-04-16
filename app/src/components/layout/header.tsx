"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, LogOut, FileText, LayoutDashboard, ChevronDown, Calendar, ArrowRight, ShoppingBag, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { useBootstrap } from "@/hooks/use-catalog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Container } from "./container";
import { MobileNav } from "./mobile-nav";
import { HeaderSearch, MobileSearchToggle } from "./header-search";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/blog", label: "Blog" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

const MONTH_NAMES: Record<number, string> = {
  1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
  5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
  9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
};

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, customer, logout, isLoading } = useAuth();
  const { itemCount, lastAddedAt } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [bouncing, setBouncing] = useState(false);

  // Badge bounce when an item is added
  useEffect(() => {
    if (lastAddedAt > 0) {
      setBouncing(true);
      const timer = setTimeout(() => setBouncing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [lastAddedAt]);
  const { data: bootstrap } = useBootstrap();
  const seasons = bootstrap?.seasons || [];

  // Mobile search state
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Hover dropdown state
  const [seasonOpen, setSeasonOpen] = useState(false);
  const seasonTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSeasons = useCallback(() => {
    if (seasonTimeout.current) clearTimeout(seasonTimeout.current);
    setSeasonOpen(true);
  }, []);

  const closeSeasons = useCallback(() => {
    seasonTimeout.current = setTimeout(() => setSeasonOpen(false), 150);
  }, []);

  const initials = customer?.contact_name
    ? customer.contact_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "MD";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo_merkley.svg" alt="Merkley Details" width={120} height={50} priority />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-muted",
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Seasons hover dropdown */}
            {seasons.length > 0 && (
              <div
                className="relative"
                onMouseEnter={openSeasons}
                onMouseLeave={closeSeasons}
              >
                <Link
                  href="/temporadas"
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-muted",
                    pathname.startsWith("/temporada")
                      ? "text-primary"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  Temporadas
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    seasonOpen && "rotate-180"
                  )} />
                </Link>

                {/* Hover dropdown panel — fixed white background, no blur/gradient inheritance */}
                {seasonOpen && (
                <div className="absolute left-1/2 top-full z-[60] w-64 -translate-x-1/2 pt-1">
                  <div className="rounded-xl border border-gray-200 shadow-2xl bg-white ring-1 ring-black/5">
                    <div className="px-3 pb-1 pt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                        Temporadas Activas
                      </p>
                    </div>
                    <div className="p-1.5">
                      {seasons.map((s) => (
                        <Link
                          key={s.name}
                          href={`/temporada/${s.slug}`}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50"
                          onClick={() => setSeasonOpen(false)}
                        >
                          <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-foreground truncate">
                              {s.season_name}
                            </span>
                            {s.month && (
                              <span className="flex items-center gap-1 text-[11px] text-muted">
                                <Calendar className="h-2.5 w-2.5" />
                                {s.end_day} de {MONTH_NAMES[s.month] || `Mes ${s.month}`}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-border p-1.5">
                      <Link
                        href="/temporadas"
                        className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-blue-50"
                        onClick={() => setSeasonOpen(false)}
                      >
                        Ver todas las temporadas
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}
          </nav>

          {/* Desktop search */}
          <div className="hidden md:block flex-1 max-w-xs mx-4">
            <HeaderSearch />
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Mobile search toggle */}
            <div className="md:hidden">
              <MobileSearchToggle onOpen={() => setMobileSearchOpen(true)} />
            </div>
            {/* Cart icon — always visible, opens drawer */}
            <Button variant="ghost" size="icon" className="relative" onClick={() => setCartOpen(true)}>
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className={cn(
                  "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white",
                  bouncing && "animate-bounce-once"
                )}>
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Button>
            <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />

            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <p className="text-sm font-medium">{customer?.contact_name}</p>
                        <p className="text-xs text-muted">{customer?.company_name}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/cuenta" className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          Mi Cuenta
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/cotizaciones" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Cotizaciones
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/cuenta/perfil" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Perfil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => logout()}
                        className="flex items-center gap-2 text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <div className="hidden items-center gap-2 sm:flex">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/auth/login">Iniciar Sesión</Link>
                      </Button>
                      <Button size="sm" rounded="full" asChild>
                        <Link href="/auth/registro">Crear Cuenta</Link>
                      </Button>
                    </div>
                    <Button size="sm" rounded="full" className="sm:hidden" asChild>
                      <Link href="/auth/registro">Crear Cuenta</Link>
                    </Button>
                  </>
                )}
              </>
            )}

            {/* Mobile menu */}
            <MobileNav />
          </div>
        </div>
      </Container>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="absolute inset-x-0 top-0 z-50 flex h-16 items-center gap-2 border-b border-border bg-surface px-3 md:hidden">
          <div className="flex-1">
            <HeaderSearch autoFocus />
          </div>
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </header>
  );
}
