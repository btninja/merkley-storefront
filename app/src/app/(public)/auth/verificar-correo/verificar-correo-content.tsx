"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  RefreshCw,
  ArrowLeft,
  Clock,
  Inbox,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { resendVerificationEmail, verifyEmail } from "@/lib/api";
import type { SessionResponse } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_VALIDITY_SECONDS = 30 * 60;

function formatMinSec(totalSec: number): string {
  const m = Math.max(0, Math.floor(totalSec / 60));
  const s = Math.max(0, totalSec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function cleanErrorMessage(msg: string): string {
  return msg
    .replace(/^CODE_INVALID:\s*/, "")
    .replace(/^CODE_EXPIRED:\s*/, "")
    .replace(/^CODE_INCORRECT:\s*/, "")
    .replace(/^CODE_LOCKED:\s*/, "");
}

function isExpiredOrLocked(msg: string): boolean {
  return msg.startsWith("CODE_EXPIRED:") || msg.startsWith("CODE_LOCKED:");
}

function VerificarCorreoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { applyVerifiedSession } = useAuth();

  const email = searchParams.get("email") || "";
  const status = searchParams.get("status");
  const isPendingApproval = status === "pending_approval";

  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [codeRemainingSec, setCodeRemainingSec] = useState(CODE_VALIDITY_SECONDS);
  const [isResending, setIsResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [needsNewCode, setNeedsNewCode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Code validity countdown
  useEffect(() => {
    if (codeRemainingSec <= 0) {
      setNeedsNewCode(true);
      return;
    }
    const t = setInterval(
      () => setCodeRemainingSec((s) => Math.max(s - 1, 0)),
      1000,
    );
    return () => clearInterval(t);
  }, [codeRemainingSec]);

  // Autofocus input on mount (skip on pending-approval branch)
  useEffect(() => {
    if (!isPendingApproval) inputRef.current?.focus();
  }, [isPendingApproval]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (code.length !== 6 || isSubmitting) return;
      if (!email) {
        setError("Falta el correo. Vuelve a iniciar sesión o regístrate.");
        return;
      }

      setIsSubmitting(true);
      setError("");
      try {
        const result = await verifyEmail(code, email);

        if ("approval_pending" in result && result.approval_pending) {
          toast({
            title: "Correo verificado",
            description:
              "Tu cuenta está pendiente de aprobación por un administrador.",
            variant: "success",
          });
          router.push(
            `/auth/verificar-correo?status=pending_approval&email=${encodeURIComponent(email)}`,
          );
          return;
        }

        applyVerifiedSession(result as SessionResponse);
        toast({
          title: "¡Correo verificado!",
          description: "Tu cuenta ha sido activada.",
          variant: "success",
        });
        router.push("/cuenta");
      } catch (err: unknown) {
        const raw = err instanceof Error ? err.message : "Error al verificar.";
        setError(cleanErrorMessage(raw));
        if (isExpiredOrLocked(raw)) {
          setNeedsNewCode(true);
          setCodeRemainingSec(0);
        }
        setCode("");
        setIsSubmitting(false);
        setTimeout(() => inputRef.current?.focus(), 0);
        return;
      }
      setIsSubmitting(false);
    },
    [code, email, isSubmitting, applyVerifiedSession, router],
  );

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0 || isResending) return;

    setIsResending(true);
    setError("");
    try {
      await resendVerificationEmail(email);
      toast({
        title: "Correo enviado",
        description:
          "Si tu código anterior sigue activo, recibirás el mismo. Revisa tu bandeja.",
        variant: "success",
      });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setCodeRemainingSec(CODE_VALIDITY_SECONDS);
      setNeedsNewCode(false);
      setCode("");
      setTimeout(() => inputRef.current?.focus(), 0);
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

  if (isPendingApproval) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Solicitud recibida
          </h1>
          <p className="mt-3 text-muted">
            Tu solicitud de cuenta esta siendo revisada por nuestro equipo.
            Recibiras un correo de verificacion cuando tu cuenta sea aprobada.
          </p>
          {email && (
            <p className="mt-4 text-sm text-muted">
              Te notificaremos a{" "}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
          )}
          <div className="mt-8 border-t border-border pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          Ingresa tu código
        </h1>

        <p className="mt-3 text-muted">Te enviamos un código de 6 dígitos a</p>
        {email && (
          <p className="mt-1 font-semibold text-foreground">{email}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-6">
          <Input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(digits);
              setError("");
              if (digits.length === 6 && !isSubmitting) {
                setTimeout(() => handleSubmit(), 0);
              }
            }}
            disabled={isSubmitting || needsNewCode}
            placeholder="000000"
            aria-label="Código de verificación"
            className="text-center text-2xl tracking-[0.5em] font-mono"
          />

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 p-3 text-left text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={code.length !== 6 || isSubmitting || needsNewCode}
            className="mt-4 w-full gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Verificar
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Code validity timer */}
        {!needsNewCode && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
            <Clock className="h-4 w-4" />
            <span>Tu código vence en {formatMinSec(codeRemainingSec)}</span>
          </div>
        )}

        {/* Spam folder callout */}
        <div className="mt-6 flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-left">
          <Inbox className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">¿No lo ves? Revisa tu carpeta de spam.</p>
            <p className="mt-1 text-amber-800">
              El correo suele llegar en 1–2 minutos. Busca un mensaje de Merkley Details.
            </p>
          </div>
        </div>

        {/* Resend */}
        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`}
            />
            {isResending
              ? "Enviando..."
              : needsNewCode
                ? "Enviar código nuevo"
                : cooldown > 0
                  ? `Reenviar en ${cooldown}s`
                  : "Reenviar código"}
          </Button>
          {!needsNewCode && (
            <p className="mt-2 text-xs text-muted">
              Si reenvías, recibirás el mismo código mientras siga vigente.
            </p>
          )}
        </div>

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
        <Suspense
          fallback={
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Cargando...
                </h1>
              </CardContent>
            </Card>
          }
        >
          <VerificarCorreoContent />
        </Suspense>
      </Container>
    </section>
  );
}
