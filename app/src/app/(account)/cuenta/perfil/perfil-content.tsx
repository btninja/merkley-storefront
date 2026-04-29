"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  User,
  Building2,
  FileDigit,
  Phone,
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";

interface ProfileFieldProps {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  placeholder?: string;
}

function ProfileField({
  icon: Icon,
  label,
  value,
  placeholder = "No especificado",
}: ProfileFieldProps) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
        <Icon className="h-4 w-4 text-muted" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-0.5 text-sm">
          {value || <span className="italic text-muted">{placeholder}</span>}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { email, customer } = useAuth();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const isSetup = searchParams.get("setup") === "1";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  // Auto-expand the password section when coming from invitation
  const [passwordExpanded, setPasswordExpanded] = useState(isSetup);

  useEffect(() => {
    if (isSetup) {
      setPasswordExpanded(true);
    }
  }, [isSetup]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      toast({
        title: "Contrasena invalida",
        description: "La contrasena debe tener al menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Las contrasenas no coinciden",
        description: "Verifica que ambas contrasenas sean iguales.",
        variant: "destructive",
      });
      return;
    }

    setIsChanging(true);
    try {
      await api.changePassword(newPassword);
      toast({
        title: "Contrasena actualizada",
        description: "Tu contrasena ha sido cambiada exitosamente.",
        variant: "success",
      });
      setNewPassword("");
      setConfirmPassword("");
      setPasswordExpanded(false);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "No se pudo cambiar la contrasena.",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mi Perfil"
        description="Informacion de tu cuenta"
      />

      {/* Setup banner for invited users */}
      {isSetup && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Configura tu contrasena
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Tu cuenta fue creada por una invitacion. Establece una contrasena
              para poder iniciar sesion en el futuro.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Datos Personales</CardTitle>
          <CardDescription>
            Informacion asociada a tu cuenta. Para modificar estos datos,
            contacta a nuestro equipo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            <ProfileField
              icon={Mail}
              label="Correo Electronico"
              value={email}
            />
            <ProfileField
              icon={User}
              label="Nombre de Contacto"
              value={customer?.contact_name}
            />
            <ProfileField
              icon={Building2}
              label="Empresa"
              value={customer?.company_name}
            />
            <ProfileField
              icon={FileDigit}
              label="RNC"
              value={customer?.rnc}
            />
            <ProfileField
              icon={Phone}
              label="WhatsApp"
              value={customer?.whatsapp}
            />
            <ProfileField
              icon={Briefcase}
              label="Industria"
              value={customer?.industry}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>Cambia tu contrasena de acceso</CardDescription>
        </CardHeader>
        <CardContent>
          {passwordExpanded ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contrasena</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    disabled={isChanging}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted hover:text-foreground"
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
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Confirmar contrasena
                </Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repite la contrasena"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={isChanging}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isChanging} className="gap-2">
                  {isChanging ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  {isChanging ? "Guardando..." : "Guardar contrasena"}
                </Button>
                {!isSetup && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setPasswordExpanded(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Contrasena</p>
                <p className="text-xs text-muted">
                  Cambia tu contrasena de acceso
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPasswordExpanded(true)}
                className="gap-2"
              >
                <Lock className="h-4 w-4" />
                Cambiar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
