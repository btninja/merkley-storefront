"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn, Eye, EyeOff, Info } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fromRegistro, setFromRegistro] = useState(false);

  // Restore email from query param (redirect from registro) or sessionStorage
  useEffect(() => {
    const paramEmail = searchParams.get("email");
    const fromReg = searchParams.get("from") === "registro";
    if (paramEmail) {
      setEmail(paramEmail);
      if (fromReg) setFromRegistro(true);
    } else {
      const saved = sessionStorage.getItem("md_login_email");
      if (saved) setEmail(saved);
    }
  }, [searchParams]);

  // Persist email to sessionStorage
  useEffect(() => {
    if (email) {
      sessionStorage.setItem("md_login_email", email);
    }
  }, [email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      sessionStorage.removeItem("md_login_email");
      toast({
        title: "Bienvenido",
        description: "Has iniciado sesión exitosamente.",
        variant: "success",
      });
      router.push("/cuenta");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesión. Verifica tus credenciales.";

      // Check if the error is about unverified email
      if (message.includes("EMAIL_NOT_VERIFIED")) {
        toast({
          title: "Correo no verificado",
          description: "Necesitas verificar tu correo antes de iniciar sesión.",
          variant: "destructive",
        });
        router.push(`/auth/verificar-correo?email=${encodeURIComponent(email)}`);
        return;
      }

      if (message.includes("APPROVAL_PENDING")) {
        toast({
          title: "Cuenta pendiente de aprobacion",
          description: "Tu cuenta esta siendo revisada. Te notificaremos cuando sea aprobada.",
          variant: "default",
        });
        return;
      }

      toast({
        title: "Error de autenticación",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-gradient-to-br from-primary-soft via-white to-surface-muted py-12">
      <Container size="sm" className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>

          <CardContent>
            {fromRegistro && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Ya tienes una cuenta con este correo. Ingresa tu contraseña para continuar.
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={isSubmitting}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="text-right">
                <Link href="/auth/forgot-password" className="text-sm text-muted hover:text-foreground">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Ingresando..." : "Iniciar Sesión"}
              </Button>
            </form>

            {/* Link to register */}
            <div className="mt-6 text-center text-sm text-muted">
              <span>¿No tienes una cuenta?</span>{" "}
              <Link
                href="/auth/registro"
                className="font-medium text-primary hover:underline"
              >
                Crear cuenta
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
