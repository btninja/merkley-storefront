"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Receipt,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { Sidebar } from "@/components/layout/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MOBILE_NAV_LINKS = [
  { href: "/cuenta", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { href: "/catalogo-pdf", label: "Catálogo", icon: BookOpen },
  { href: "/facturas", label: "Facturas", icon: Receipt },
  { href: "/cuenta/equipo", label: "Equipo", icon: Users, adminOnly: true },
  { href: "/cuenta/perfil", label: "Perfil", icon: User },
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
  const { customer } = useAuth();
  const isAdmin = customer?.is_company_admin === true;

  const visibleLinks = MOBILE_NAV_LINKS.filter(
    (link) => !("adminOnly" in link && link.adminOnly) || isAdmin
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface lg:hidden">
      <div className="flex items-center justify-around">
        {visibleLinks.map((link) => {
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
                isActive
                  ? "text-primary"
                  : "text-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <AccountLoadingSkeleton />;
  }

  if (!isAuthenticated) {
    return <AccountLoadingSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
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
