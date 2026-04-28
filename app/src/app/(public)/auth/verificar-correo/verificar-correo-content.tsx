"use client";

import {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
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

const RESEND_COOLDOWN_MS = 60 * 1000;
const CODE_VALIDITY_MS = 30 * 60 * 1000;

function formatMinSec(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function cleanError(msg: string): string {
  return msg.replace(/^CODE_INVALID:\s*/, "");
}

function VerificarCorreoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { applyVerifiedSession } = useAuth();

  const email = searchParams.get("email") || "";
  const status = searchParams.get("status");
  const isPendingApproval = status === "pending_approval";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  // Wall-clock anchors so countdowns survive tab throttling.
  const [resendUnlockAt, setResendUnlockAt] = useState(
    () => Date.now() + RESEND_COOLDOWN_MS,
  );
  const [codeExpiresAt, setCodeExpiresAt] = useState(
    () => Date.now() + CODE_VALIDITY_MS,
  );
  const [now, setNow] = useState(() => Date.now());

  const inputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Single 1Hz tick drives both countdowns.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isPendingApproval) inputRef.current?.focus();
  }, [isPendingApproval]);

  // Auto-submit when 6 digits are entered. 200 ms debounce coalesces
  // burst events from a paste (where onChange can fire twice as the
  // browser commits the value), preventing two parallel verify calls.
  useEffect(() => {
    if (code.length !== 6 || submittingRef.current) return;
    const timer = setTimeout(() => {
      if (code.length === 6 && !submittingRef.current) {
        handleSubmit(code);
      }
    }, 200);
    return () => clearTimeout(timer);
    // handleSubmit is stable enough; intentionally omit to avoid re-firing
    // on every render due to its closure over `code`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const cooldownMs = Math.max(0, resendUnlockAt - now);
  const codeRemainingMs = Math.max(0, codeExpiresAt - now);
  const codeExpired = codeRemainingMs === 0;

  const handleSubmit = useCallback(
    async (override?: string) => {
      const value = (override ?? code).replace(/\D/g, "").slice(0, 6);
      if (value.length !== 6) return;
      if (submittingRef.current) return;
      if (!email) {
        setError("Falta el correo. Vuelve a iniciar sesión o regístrate.");
        return;
      }

      submittingRef.current = true;
      setIsSubmitting(true);
      setError("");
      try {
        const result = await verifyEmail(value, email);

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
        // Full reload (not router.push) so middleware re-evaluates with the
        // freshly-set mw_session cookie. router.push can serve a cached
        // "redirect to login" response from when this route was prefetched
        // while still unauthenticated, which strands the user on /auth/login
        // until they hard-refresh.
        window.location.href = "/cuenta";
      } catch (err: unknown) {
        const raw = err instanceof Error ? err.message : "Error al verificar.";
        setError(cleanError(raw));
        setCode("");
        setTimeout(() => inputRef.current?.focus(), 0);
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [code, email, applyVerifiedSession, router],
  );

  const handleResend = useCallback(async () => {
    if (!email || cooldownMs > 0 || isResending) return;

    setIsResending(true);
    setError("");
    try {
      await resendVerificationEmail(email);
      toast({
        title: "Correo enviado",
        description:
          "Si tu código sigue activo, recibirás el mismo. Revisa tu bandeja y la carpeta de spam.",
        variant: "success",
      });
      setResendUnlockAt(Date.now() + RESEND_COOLDOWN_MS);
      // Optimistic: assume server generated a fresh code.
      // If it actually reused an in-flight code, the displayed countdown
      // will be slightly long; server is authoritative on real expiry.
      setCodeExpiresAt(Date.now() + CODE_VALIDITY_MS);
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
  }, [email, cooldownMs, isResending]);

  const cooldownLabel = useMemo(
    () => Math.ceil(cooldownMs / 1000),
    [cooldownMs],
  );

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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="mt-6"
        >
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
            }}
            disabled={isSubmitting}
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
            disabled={code.length !== 6 || isSubmitting}
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

        {/* Code validity hint */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
          <Clock className="h-4 w-4" />
          <span>
            {codeExpired
              ? "Solicita un código nuevo para continuar."
              : `Tu código vence en ${formatMinSec(codeRemainingMs)}`}
          </span>
        </div>

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
            disabled={cooldownMs > 0 || isResending}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`}
            />
            {isResending
              ? "Enviando..."
              : codeExpired
                ? "Enviar código nuevo"
                : cooldownMs > 0
                  ? `Reenviar en ${cooldownLabel}s`
                  : "Reenviar código"}
          </Button>
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
