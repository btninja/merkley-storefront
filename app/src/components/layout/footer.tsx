"use client";

import Link from "next/link";
import Image from "next/image";
import { useBootstrap } from "@/hooks/use-catalog";
import { Container } from "./container";

export function Footer() {
  const { data: bootstrap } = useBootstrap();
  const contact = bootstrap?.contact;

  return (
    <footer className="border-t border-border bg-surface">
      <Container>
        <div className="grid gap-8 py-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block">
              <Image src="/logo_merkley.svg" alt="Merkley Details" width={120} height={32} className="h-8 w-auto" />
            </Link>
            <p className="mt-3 text-sm leading-6 text-muted">
              Detalles corporativos y regalos personalizados para empresas en República Dominicana.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold">Navegación</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/catalogo" className="text-sm text-muted hover:text-foreground transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/temporadas" className="text-sm text-muted hover:text-foreground transition-colors">
                  Temporadas
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="text-sm text-muted hover:text-foreground transition-colors">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-sm text-muted hover:text-foreground transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/preguntas-frecuentes" className="text-sm text-muted hover:text-foreground transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold">Mi Cuenta</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/auth/login" className="text-sm text-muted hover:text-foreground transition-colors">
                  Iniciar Sesión
                </Link>
              </li>
              <li>
                <Link href="/auth/registro" className="text-sm text-muted hover:text-foreground transition-colors">
                  Crear Cuenta
                </Link>
              </li>
              <li>
                <Link href="/cotizaciones" className="text-sm text-muted hover:text-foreground transition-colors">
                  Mis Cotizaciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold">Contacto</h4>
            <ul className="mt-3 space-y-2">
              {contact?.address?.map((line) => (
                <li key={line} className="text-sm text-muted">{line}</li>
              ))}
              {contact?.phone && (
                <li>
                  <a href={`tel:+1${contact.phone.replace(/\D/g, "")}`} className="text-sm text-muted hover:text-foreground transition-colors">
                    {formatPhone(contact.phone)}
                  </a>
                </li>
              )}
              {contact?.email && (
                <li>
                  <a href={`mailto:${contact.email}`} className="text-sm text-muted hover:text-foreground transition-colors">
                    {contact.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border py-6 text-sm text-muted sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Merkley Details. Todos los derechos reservados.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/politica-de-privacidad" className="hover:text-foreground transition-colors">
              Política de Privacidad
            </Link>
            <Link href="/terminos-y-condiciones" className="hover:text-foreground transition-colors">
              Términos y Condiciones
            </Link>
            <Link href="/politica-de-devolucion" className="hover:text-foreground transition-colors">
              Política de Devoluciones
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}
