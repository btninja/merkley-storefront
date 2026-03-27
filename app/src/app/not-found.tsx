import Link from "next/link";
import { ArrowRight, Home, ShoppingBag, Mail } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-soft via-white to-surface-muted">
      <Container className="py-24 md:py-36">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-7xl font-bold tracking-tight text-primary">404</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Página no encontrada
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted">
            Lo sentimos, la página que buscas no existe o fue movida.
            Te invitamos a explorar nuestro catálogo o volver al inicio.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" rounded="full" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Ir al Inicio
              </Link>
            </Button>
            <Button variant="outline" size="lg" rounded="full" asChild>
              <Link href="/catalogo">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Ver Catálogo
              </Link>
            </Button>
            <Button variant="outline" size="lg" rounded="full" asChild>
              <Link href="/contacto">
                <Mail className="mr-2 h-4 w-4" />
                Contacto
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
