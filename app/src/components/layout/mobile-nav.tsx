"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";
import { useBootstrap } from "@/hooks/use-catalog";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/blog", label: "Blog" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

const ACCOUNT_LINKS = [
  { href: "/cuenta", label: "Mi Cuenta" },
  { href: "/cotizaciones", label: "Cotizaciones" },
  { href: "/cuenta/perfil", label: "Perfil" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, customer, logout } = useAuth();
  const { data: bootstrap } = useBootstrap();
  const seasons = bootstrap?.seasons || [];

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menú</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              <Image src="/logo_merkley.svg" alt="Merkley Details" width={120} height={32} className="h-8 w-auto" />
            </SheetTitle>
            <SheetDescription className="sr-only">Menú de navegación</SheetDescription>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-1 px-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                {link.label}
              </Link>
            ))}

            {seasons.length > 0 && (
              <>
                <Separator className="my-3" />
                <Link
                  href="/temporadas"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted hover:text-primary transition-colors"
                >
                  Temporadas
                </Link>
                {seasons.map((s) => (
                  <Link
                    key={s.name}
                    href={`/temporada/${s.slug}`}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
                  >
                    {s.season_name}
                  </Link>
                ))}
                <Link
                  href="/temporadas"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
                >
                  Ver todas →
                </Link>
              </>
            )}

            {isAuthenticated && (
              <>
                <Separator className="my-3" />
                <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  {customer?.company_name || "Mi Cuenta"}
                </p>
                {ACCOUNT_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
                  >
                    {link.label}
                  </Link>
                ))}
                <Separator className="my-3" />
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive-soft"
                >
                  Cerrar Sesión
                </button>
              </>
            )}

            {!isAuthenticated && (
              <>
                <Separator className="my-3" />
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/registro"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground"
                >
                  Crear Cuenta
                </Link>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
