"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, RefreshCw, MessageCircle, Clock } from "lucide-react";
import { verifyEmail } from "@/lib/api";
import type { SessionResponse } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";
import { trackWhatsAppClick } from "@/lib/analytics";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";

const WHATSAPP_NUMBER = "18093735131";

type VerifyState = "loading" | "success" | "error" | "pending_approval";

function VerificarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { applyVerifiedSession } = useAuth();

  // Accept `code` (new) or `token` (legacy links still in inboxes — server
  // treats either as a code value).
  const code = searchParams.get("code") || searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [state, setState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    if (!code || !email) {
      setState("error");
      setErrorMessage("Enlace de verificación incompleto. Falta el código o el correo.");
      return;
    }

    async function doVerify() {
      try {
        const result = await verifyEmail(code, email);

        if ("approval_pending" in result && result.approval_pending) {
          setState("pending_approval");
          return;
        }

        applyVerifiedSession(result as SessionResponse);
        setState("success");
        toast({
          title: "Correo verificado",
          description: "Tu cuenta ha sido activada exitosamente.",
          variant: "success",
        });
        // Invited users (no self-set password) go to profile to set password
        const isInvited = searchParams.get("invited") === "1";
        setTimeout(() => {
          router.push(isInvited ? "/cuenta/perfil?setup=1" : "/cuenta");
        }, 2000);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error al verificar el correo.";
        setState("error");
        setErrorMessage(message.replace(/^CODE_INVALID:\s*/, ""));
      }
    }

    doVerify();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- searchParams accessed via ref guard; re-running is prevented by hasVerified
  }, [code, email, applyVerifiedSession, router]);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, necesito ayuda con la verificación de mi correo (${email}) en Merkley Details.`
  )}`;

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-8 text-center">
        {/* Loading */}
        {state === "loading" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Verificando tu correo...
            </h1>
            <p className="mt-3 text-muted">
              Por favor espera un momento.
            </p>
          </>
        )}

        {/* Success */}
        {state === "success" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              ¡Correo verificado!
            </h1>
            <p className="mt-3 text-muted">
              Tu cuenta ha sido activada exitosamente. Redirigiendo a tu cuenta...
            </p>
          </>
        )}

        {/* Pending Approval */}
        {state === "pending_approval" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Correo verificado
            </h1>
            <p className="mt-3 text-muted">
              Tu correo ha sido verificado. Tu cuenta esta pendiente de aprobacion
              por un administrador. Te notificaremos por correo cuando sea aprobada.
            </p>
            <div className="mt-6 border-t border-border pt-6">
              <Link
                href="/"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Volver al inicio
              </Link>
            </div>
          </>
        )}

        {/* Error */}
        {state === "error" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Error de verificación
            </h1>
            <p className="mt-3 text-muted">{errorMessage}</p>

            <div className="mt-6 flex flex-col gap-3">
              {email && (
                <Link
                  href={`/auth/verificar-correo?email=${encodeURIComponent(email)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-muted"
                >
                  <RefreshCw className="h-4 w-4" />
                  Ingresar código manualmente o solicitar uno nuevo
                </Link>
              )}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClick("verificar_soporte")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" />
                Contactar soporte por WhatsApp
              </a>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <Link
                href="/auth/login"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Volver a iniciar sesión
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerificarPage() {
  return (
    <section className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-gradient-to-br from-primary-soft via-white to-surface-muted py-12">
      <Container size="sm" className="flex justify-center">
        <Suspense fallback={
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Cargando...</h1>
            </CardContent>
          </Card>
        }>
          <VerificarContent />
        </Suspense>
      </Container>
    </section>
  );
}
