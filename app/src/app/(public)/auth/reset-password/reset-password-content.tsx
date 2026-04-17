"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PasswordStrength,
  isPasswordValid,
} from "@/components/auth/password-strength";

const ERP_BASE =
  process.env.NEXT_PUBLIC_ERP_URL ||
  process.env.FRAPPE_BASE_URL ||
  "https://erp.merkleydetails.com";

export default function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("key") || searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Guard: no token in URL
  if (!token) {
    return (
      <section className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-gradient-to-br from-primary-soft via-white to-surface-muted py-12">
        <Container size="sm" className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <KeyRound className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Enlace inválido</h1>
              <p className="mt-3 text-sm text-muted">
                Este enlace de restablecimiento no es válido o ya fue utilizado.
              </p>
              <div className="mt-6">
                <Link
                  href="/auth/forgot-password"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Solicitar un nuevo enlace
                </Link>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isPasswordValid(newPassword)) {
      setError("La contraseña no cumple todos los requisitos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${ERP_BASE}/api/method/merkley_web.api.auth.reset_password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, new_password: newPassword }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Never show data.exception (raw Python traceback) to the user.
        // Parse _server_messages for the user-facing message; fall back to generic.
        const msg =
          data?._server_messages ||
          data?.message ||
          "No se pudo restablecer la contraseña. El enlace puede haber expirado.";

        let resolved: string;
        if (typeof msg === "string" && msg.startsWith("[")) {
          try {
            const arr = JSON.parse(msg) as string[];
            const inner = JSON.parse(arr[0]) as { message: string };
            resolved = inner.message || msg;
          } catch {
            resolved = msg;
          }
        } else {
          resolved = typeof msg === "string" ? msg : "Error al restablecer la contraseña.";
        }

        // Frappe may wrap messages in HTML (<div>, <ul><li>…); render as plain text.
        setError(
          resolved
            .replace(/<\/?[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim() || "Error al restablecer la contraseña."
        );
        return;
      }

      setDone(true);
    } catch {
      setError("Error de conexión. Verifica tu red e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <section className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-gradient-to-br from-primary-soft via-white to-surface-muted py-12">
        <Container size="sm" className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">¡Contraseña actualizada!</h1>
              <p className="mt-3 text-sm text-muted">
                Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.
              </p>
              <div className="mt-6">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Iniciar sesión
                </Link>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    );
  }

  return (
    <section className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-gradient-to-br from-primary-soft via-white to-surface-muted py-12">
      <Container size="sm" className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
            <CardDescription>
              Elige una contraseña segura para tu cuenta.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    className="pr-10"
                    aria-describedby="new-password-strength"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <PasswordStrength
                  id="new-password-strength"
                  password={newPassword}
                  hideWhenEmpty
                />
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repite tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  aria-invalid={
                    confirmPassword.length > 0 && confirmPassword !== newPassword
                  }
                />
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <p className="text-xs text-destructive">
                    Las contraseñas no coinciden.
                  </p>
                )}
              </div>

              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={
                  loading ||
                  !isPasswordValid(newPassword) ||
                  newPassword !== confirmPassword
                }
              >
                {loading ? "Cambiando..." : "Cambiar contraseña"}
              </Button>
            </form>

            <div className="mt-6 border-t border-border pt-6 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al inicio de sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
