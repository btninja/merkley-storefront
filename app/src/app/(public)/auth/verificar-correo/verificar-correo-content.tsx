"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, RefreshCw, ArrowLeft } from "lucide-react";
import { resendVerificationEmail } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const COOLDOWN_SECONDS = 60;

function VerificarCorreoContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      await resendVerificationEmail(email);
      toast({
        title: "Correo reenviado",
        description: "Hemos enviado un nuevo enlace de verificación a tu correo.",
        variant: "success",
      });
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "No se pudo reenviar el correo.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  }, [email, cooldown, isResending]);

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-8 text-center">
        {/* Mail icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          Revisa tu correo electrónico
        </h1>

        <p className="mt-3 text-muted">
          Hemos enviado un enlace de verificación a
        </p>
        {email && (
          <p className="mt-1 font-semibold text-foreground">{email}</p>
        )}

        <p className="mt-4 text-sm text-muted">
          Haz clic en el enlace del correo para activar tu cuenta.
          Revisa tu bandeja de entrada y la carpeta de spam.
        </p>

        {/* Resend button */}
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
            {isResending
              ? "Reenviando..."
              : cooldown > 0
                ? `Reenviar en ${cooldown}s`
                : "Reenviar correo de verificación"}
          </Button>
        </div>

        {/* Back to login */}
        <div className="mt-6 border-t border-border pt-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a iniciar sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerificarCorreoPage() {
  return (
    <section className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-gradient-to-br from-primary-soft via-white to-surface-muted py-12">
      <Container size="sm" className="flex justify-center">
        <Suspense fallback={
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Cargando...</h1>
            </CardContent>
          </Card>
        }>
          <VerificarCorreoContent />
        </Suspense>
      </Container>
    </section>
  );
}
