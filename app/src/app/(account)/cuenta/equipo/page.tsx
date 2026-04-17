"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Shield,
  ShieldCheck,
  UserX,
  UserCheck,
  UserPlus,
  ArrowRightLeft,
  Loader2,
  AlertTriangle,
  Mail,
  Clock,
  X,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { TeamMember } from "@/lib/types";

export default function TeamPage() {
  const { customer, refreshSession, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [trustedDomain, setTrustedDomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmTransfer, setConfirmTransfer] = useState<string | null>(null);

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const isAdmin = customer?.is_company_admin === true;

  const fetchTeam = useCallback(async () => {
    try {
      const data = await api.getTeamMembers();
      setMembers(data.members);
      setCompanyName(data.company_name);
      setTrustedDomain(data.trusted_domain);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudo cargar el equipo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authLoading) return;
    if (!customer) return;
    if (!isAdmin) {
      router.push("/cuenta");
      return;
    }
    fetchTeam();
  }, [authLoading, customer, isAdmin, router, fetchTeam]);

  const handleToggleUser = async (
    email: string,
    currentlyEnabled: boolean
  ) => {
    setActionLoading(email);
    try {
      if (currentlyEnabled) {
        await api.deactivateTeamMember(email);
        toast({
          title: "Usuario desactivado",
          description: `${email} ya no puede acceder a la cuenta.`,
          variant: "success",
        });
      } else {
        await api.activateTeamMember(email);
        toast({
          title: "Usuario activado",
          description: `${email} puede acceder nuevamente.`,
          variant: "success",
        });
      }
      await fetchTeam();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "No se pudo actualizar el usuario.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransferAdmin = async (email: string) => {
    if (confirmTransfer !== email) {
      setConfirmTransfer(email);
      return;
    }

    setActionLoading(email);
    setConfirmTransfer(null);
    try {
      await api.transferAdmin(email);
      toast({
        title: "Administrador transferido",
        description: `${email} es ahora el administrador de la empresa.`,
        variant: "success",
      });
      await refreshSession();
      router.push("/cuenta");
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "No se pudo transferir el rol.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = inviteEmail.trim().toLowerCase();
    const name = inviteName.trim();

    if (!email || !name) {
      toast({
        title: "Campos requeridos",
        description: "Ingresa el correo y nombre del nuevo miembro.",
        variant: "destructive",
      });
      return;
    }

    setInviteLoading(true);
    try {
      await api.inviteTeamMember(email, name);
      toast({
        title: "Invitacion enviada",
        description: `Se envio un correo de invitacion a ${email}.`,
        variant: "success",
      });
      setInviteEmail("");
      setInviteName("");
      setShowInvite(false);
      await fetchTeam();
    } catch (err) {
      toast({
        title: "Error al invitar",
        description:
          err instanceof Error
            ? err.message
            : "No se pudo enviar la invitacion.",
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="text-sm text-muted">
            Gestiona los usuarios de{" "}
            <span className="font-medium text-foreground">
              {companyName || customer?.company_name}
            </span>
          </p>
        </div>
        <Button
          onClick={() => setShowInvite(!showInvite)}
          className="gap-2"
          size="sm"
        >
          {showInvite ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Invitar miembro
            </>
          )}
        </Button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleInvite} className="space-y-4">
              <h3 className="text-sm font-semibold">
                Invitar nuevo miembro
              </h3>
              <p className="text-xs text-muted">
                Se enviara un correo de invitacion para que active su cuenta.
                {trustedDomain && (
                  <> El correo debe ser del dominio <strong>@{trustedDomain}</strong>.</>
                )}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-name">Nombre completo</Label>
                  <Input
                    id="invite-name"
                    placeholder="Juan Perez"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    disabled={inviteLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Correo corporativo</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder={
                      trustedDomain
                        ? `nombre@${trustedDomain}`
                        : "nombre@empresa.com"
                    }
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={inviteLoading}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={inviteLoading}
                  className="gap-2"
                  size="sm"
                >
                  {inviteLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Enviar invitacion
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Domain info */}
      {trustedDomain && (
        <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info-soft p-4">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-info" />
          <div>
            <p className="text-sm font-medium text-info">
              Dominio de confianza: @{trustedDomain}
            </p>
            <p className="mt-1 text-sm text-muted">
              Nuevos usuarios con correo @{trustedDomain} se vincularan
              automaticamente a tu empresa al registrarse.
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
          </CardContent>
        </Card>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-3 text-sm text-muted">
              No hay miembros en el equipo.
            </p>
            <p className="mt-1 text-xs text-muted">
              Invita a tu primer miembro usando el boton de arriba.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <Card key={member.email}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Member info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {member.contact_name}
                      </span>
                      {member.is_admin && (
                        <Badge
                          variant="default"
                          className="shrink-0 gap-1 text-xs"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                      {!member.enabled && (
                        <Badge
                          variant="destructive"
                          className="shrink-0 text-xs"
                        >
                          Desactivado
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </span>
                      {member.last_login && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Ultimo acceso: {formatDate(member.last_login)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (not for self / current admin) */}
                  {!member.is_admin && (
                    <div className="flex shrink-0 gap-2">
                      {/* Toggle enable/disable */}
                      <Button
                        variant={member.enabled ? "outline" : "default"}
                        size="sm"
                        disabled={actionLoading === member.email}
                        onClick={() =>
                          handleToggleUser(member.email, member.enabled)
                        }
                      >
                        {actionLoading === member.email ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : member.enabled ? (
                          <>
                            <UserX className="mr-1.5 h-4 w-4" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-1.5 h-4 w-4" />
                            Activar
                          </>
                        )}
                      </Button>

                      {/* Transfer admin */}
                      {member.enabled && (
                        <Button
                          variant={
                            confirmTransfer === member.email
                              ? "destructive"
                              : "ghost"
                          }
                          size="sm"
                          disabled={actionLoading === member.email}
                          onClick={() => handleTransferAdmin(member.email)}
                        >
                          {confirmTransfer === member.email ? (
                            <>
                              <AlertTriangle className="mr-1.5 h-4 w-4" />
                              Confirmar
                            </>
                          ) : (
                            <>
                              <ArrowRightLeft className="mr-1.5 h-4 w-4" />
                              Hacer Admin
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info footer */}
      <Separator />
      <div className="rounded-lg bg-surface-muted p-4">
        <h3 className="text-sm font-medium">Sobre la gestion de equipo</h3>
        <ul className="mt-2 space-y-1 text-xs text-muted">
          <li>
            <strong>Invitar</strong> envio un correo para que el nuevo miembro
            active su cuenta y establezca su contrasena.
          </li>
          <li>
            <strong>Desactivar</strong> un usuario impide que inicie sesion,
            pero no elimina sus datos.
          </li>
          <li>
            <strong>Transferir admin</strong> te quita el rol de administrador
            y lo asigna al usuario seleccionado. Esta accion no se puede
            deshacer por ti mismo.
          </li>
          <li>
            Todos los miembros del equipo comparten acceso a cotizaciones y
            facturas de la empresa.
          </li>
        </ul>
      </div>
    </div>
  );
}
