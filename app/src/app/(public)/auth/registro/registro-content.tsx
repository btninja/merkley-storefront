"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  Eye,
  EyeOff,
  AlertTriangle,
  MessageCircle,
  TrendingUp,
  Sparkles as SparkleIcon,
  FileText,
  Shield,
  CheckCircle2,
  Loader2,
  XCircle,
  Building2,
} from "lucide-react";
import { trackBeginRegistration, trackWhatsAppClick } from "@/lib/analytics";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";
import { INDUSTRIES, REFERRAL_SOURCES } from "@/lib/constants";
import { Container } from "@/components/layout/container";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateRnc } from "@/lib/api";
import type { DgiiValidationResult } from "@/lib/types";

const EMPLOYEE_RANGES = [
  "1-50",
  "51-200",
  "201-500",
  "500+",
] as const;

const BLOCKED_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.es",
  "outlook.com",
  "outlook.es",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.es",
  "yahoo.com.mx",
  "ymail.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "zoho.com",
  "gmx.com",
  "gmx.net",
  "tutanota.com",
  "tuta.io",
]);

const WHATSAPP_NUMBER = "18093735131";

export default function RegistroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const STORAGE_KEY = "md_registro_form";

  const defaultForm = {
    rnc: "",
    company_name: "",
    contact_name: "",
    position: "",
    email: "",
    phone: "",
    password: "",
    industry: "",
    employee_count_range: "",
    referral_source: "",
  };

  const [form, setForm] = useState(defaultForm);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DGII validation state
  const [dgiiResult, setDgiiResult] = useState<DgiiValidationResult | null>(
    null
  );
  const [dgiiLoading, setDgiiLoading] = useState(false);
  const [dgiiChecked, setDgiiChecked] = useState(false);

  // Restore form from sessionStorage on mount, then overlay URL params
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as typeof defaultForm;
        setForm((prev) => ({ ...prev, ...parsed, password: "" }));
      }
    } catch {
      /* ignore */
    }
    // Prefill from URL params (e.g., from invoice email link)
    const email = searchParams.get("email");
    const company = searchParams.get("company");
    const rnc = searchParams.get("rnc");
    if (email || company || rnc) {
      setForm((prev) => ({
        ...prev,
        ...(email ? { email } : {}),
        ...(company ? { company_name: company } : {}),
        ...(rnc ? { rnc } : {}),
      }));
    }
  }, [searchParams]);

  // Persist form to sessionStorage (excluding password)
  useEffect(() => {
    const { password: _, ...safe } = form;
    void _;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  }, [form]);

  function clearStoredForm() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  useEffect(() => {
    trackBeginRegistration();
  }, []);

  // Check if the email domain is blocked
  const emailDomainBlocked = useMemo(() => {
    const email = form.email.trim().toLowerCase();
    if (!email.includes("@")) return false;
    const domain = email.split("@")[1];
    return BLOCKED_DOMAINS.has(domain);
  }, [form.email]);

  // Step progress calculation
  const currentStep = useMemo(() => {
    if (!(dgiiChecked && dgiiResult?.valid)) return 1;
    // Step 2: all required contact fields filled
    const contactFilled =
      form.company_name.trim() &&
      form.contact_name.trim() &&
      form.email.trim() &&
      !emailDomainBlocked &&
      form.phone.trim() &&
      form.password.trim() &&
      form.password.length >= 8;
    if (!contactFilled) return 2;
    return 3;
  }, [dgiiChecked, dgiiResult, form, emailDomainBlocked]);

  const whatsappApprovalUrl = useMemo(() => {
    const message = encodeURIComponent(
      `Hola, me gustaría registrarme en Merkley Details pero tengo un correo personal (${form.email}). ¿Podrían aprobar mi cuenta?`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  }, [form.email]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // DGII RNC validation
  const handleValidateRnc = useCallback(async () => {
    const cleanRnc = form.rnc.replace(/[-\s]/g, "");
    if (!cleanRnc || cleanRnc.length < 9) {
      toast({
        title: "RNC inválido",
        description:
          "El RNC debe tener 9 dígitos o la Cédula 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setDgiiLoading(true);
    setDgiiChecked(false);
    try {
      const result = await validateRnc(cleanRnc);
      setDgiiResult(result);
      setDgiiChecked(true);

      if (result.valid && result.full_name) {
        // Auto-fill company name from DGII
        const companyName = result.company_exists
          ? result.existing_company_name || result.trade_name || result.full_name
          : result.trade_name || result.full_name;
        setForm((prev) => ({
          ...prev,
          company_name: companyName || prev.company_name,
        }));

        if (result.company_exists) {
          toast({
            title: "Empresa ya registrada",
            description: result.trusted_domain
              ? `Usa un correo @${result.trusted_domain} para acceder automáticamente.`
              : `La empresa "${companyName}" ya tiene una cuenta. Regístrate para unirte.`,
            variant: "default",
          });
        } else {
          toast({
            title: "RNC verificado",
            description: `Empresa: ${companyName}`,
            variant: "success",
          });
        }
      } else {
        toast({
          title: "RNC no encontrado",
          description:
            result.message ||
            "No se encontró en la base de datos de la DGII.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error de validación",
        description: "No se pudo validar el RNC. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setDgiiLoading(false);
    }
  }, [form.rnc]);

  // Auto-validate RNC on blur
  const handleRncBlur = useCallback(() => {
    const cleanRnc = form.rnc.replace(/[-\s]/g, "");
    if (cleanRnc.length >= 9 && !dgiiChecked && !dgiiLoading) {
      handleValidateRnc();
    }
  }, [form.rnc, dgiiChecked, dgiiLoading, handleValidateRnc]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (emailDomainBlocked) return;

    // Validate required fields
    const required = [
      "rnc",
      "company_name",
      "contact_name",
      "email",
      "phone",
      "password",
    ] as const;
    for (const field of required) {
      if (!form[field].trim()) {
        toast({
          title: "Campo requerido",
          description:
            "Por favor completa todos los campos obligatorios.",
          variant: "destructive",
        });
        return;
      }
    }

    // Must have validated RNC
    if (!dgiiChecked || !dgiiResult?.valid) {
      toast({
        title: "Verificar RNC",
        description:
          "Debes verificar el RNC antes de crear la cuenta.",
        variant: "destructive",
      });
      return;
    }

    if (form.password.length < 8) {
      toast({
        title: "Contraseña muy corta",
        description:
          "La contraseña debe tener al menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register({
        company_name: form.company_name,
        contact_name: form.contact_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        rnc: form.rnc.replace(/[-\s]/g, ""),
        ...(form.industry && { industry: form.industry }),
        ...(form.employee_count_range && {
          employee_count_range: form.employee_count_range,
        }),
        ...(form.referral_source && {
          referral_source: form.referral_source,
        }),
        ...(form.position && { position: form.position }),
      });

      clearStoredForm();
      const joinedExisting = result.joinedExisting;
      if (result.verificationRequired) {
        toast({
          title: joinedExisting ? "Te has unido al equipo" : "Cuenta creada",
          description: joinedExisting
            ? "Te hemos enviado un correo de verificación. Una vez verificado, tendrás acceso a los datos de tu empresa."
            : "Te hemos enviado un correo de verificación.",
          variant: "success",
        });
        router.push(
          `/auth/verificar-correo?email=${encodeURIComponent(result.email)}`
        );
      } else {
        toast({
          title: "Cuenta creada",
          description:
            "Tu cuenta ha sido creada exitosamente. Bienvenido a Merkley Details.",
          variant: "success",
        });
        router.push("/cuenta");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al crear la cuenta. Intenta de nuevo.";

      if (message.includes("USER_EXISTS_UNVERIFIED")) {
        // User exists but hasn't verified email — send to verification page
        toast({
          title: "Cuenta pendiente de verificación",
          description: "Ya tienes una cuenta. Revisa tu correo para verificarla.",
          variant: "default",
        });
        router.push(
          `/auth/verificar-correo?email=${encodeURIComponent(form.email.trim().toLowerCase())}`
        );
        return;
      } else if (message.includes("USER_EXISTS")) {
        // User already has an active account — redirect to login with email prefilled
        clearStoredForm();
        toast({
          title: "Ya tienes una cuenta",
          description: "Hemos encontrado una cuenta con este correo. Inicia sesión.",
          variant: "default",
        });
        router.push(
          `/auth/login?email=${encodeURIComponent(form.email.trim().toLowerCase())}&from=registro`
        );
        return;
      } else if (message.includes("DOMAIN_MISMATCH")) {
        // Extract the domain from the error message
        const domainMatch = message.match(/@([^\s]+)/);
        toast({
          title: "Dominio de correo no coincide",
          description: domainMatch
            ? `Tu empresa requiere un correo @${domainMatch[1]} para registrarse. Contacta al administrador de tu empresa si necesitas usar otro correo.`
            : "El dominio de tu correo no coincide con el registrado para esta empresa.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error de registro",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-200px)] items-center bg-gradient-to-br from-primary-soft via-white to-surface-muted py-12">
      <Container className="flex justify-center">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-5">
          {/* ── Value Prop Sidebar ── */}
          <div className="hidden lg:col-span-2 lg:flex lg:flex-col lg:justify-center lg:pr-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Precios exclusivos para empresas
            </h2>
            <p className="mt-3 text-sm text-muted">
              Más de 500 empresas en República Dominicana ya usan
              Merkley Details para sus regalos y detalles corporativos.
            </p>
            <div className="mt-8 space-y-4">
              {[
                {
                  icon: TrendingUp,
                  text: "Precios corporativos exclusivos",
                },
                {
                  icon: SparkleIcon,
                  text: "Catálogos personalizados con tu logo",
                },
                {
                  icon: FileText,
                  text: "Cotización en menos de 24 horas",
                },
                {
                  icon: Shield,
                  text: "Proceso seguro y documentado",
                },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-lg border border-primary/20 bg-white/60 p-4">
              <p className="text-xs font-medium text-primary">
                ★ 98% de satisfacción del cliente
              </p>
              <p className="mt-1 text-xs text-muted">
                &ldquo;Merkley hizo que nuestro evento corporativo
                fuera un éxito. El proceso fue rápido y los productos
                llegaron perfectos.&rdquo;
              </p>
            </div>
          </div>

          {/* ── Registration Form ── */}
          <div className="lg:col-span-3">
            <Card className="w-full">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  Crear Cuenta
                </CardTitle>
                <CardDescription>
                  Registra tu empresa para acceder a precios exclusivos
                  y solicitar cotizaciones
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* ── Step Progress Bar ── */}
                <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 rounded-t-lg bg-white/95 px-6 pb-4 pt-2 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                            currentStep > step
                              ? "bg-primary text-white"
                              : currentStep === step
                                ? "bg-primary text-white ring-2 ring-primary/30 ring-offset-1"
                                : "bg-surface-muted text-muted"
                          }`}
                        >
                          {currentStep > step ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            step
                          )}
                        </div>
                        <span
                          className={`hidden text-xs font-medium sm:inline ${
                            currentStep >= step ? "text-foreground" : "text-muted"
                          }`}
                        >
                          {step === 1 ? "Empresa" : step === 2 ? "Contacto" : "Adicional"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Progress track */}
                  <div className="relative h-1.5 w-full rounded-full bg-surface-muted">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-center text-xs text-muted">
                    Paso {currentStep} de 3
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* ── Step 1: RNC Validation ── */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                      Paso 1 — Verificar empresa
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="rnc">
                        RNC o Cédula{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="rnc"
                          placeholder="123-45678-9"
                          value={form.rnc}
                          onChange={(e) => {
                            updateField("rnc", e.target.value);
                            // Reset validation when RNC changes
                            if (dgiiChecked) {
                              setDgiiChecked(false);
                              setDgiiResult(null);
                            }
                          }}
                          onBlur={handleRncBlur}
                          required
                          disabled={isSubmitting}
                          className={
                            dgiiChecked
                              ? dgiiResult?.valid
                                ? "border-success"
                                : "border-destructive"
                              : ""
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleValidateRnc}
                          disabled={
                            dgiiLoading ||
                            isSubmitting ||
                            !form.rnc.replace(/[-\s]/g, "")
                          }
                          className="shrink-0 text-muted hover:text-foreground"
                        >
                          {dgiiLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Building2 className="h-4 w-4" />
                          )}
                          Verificar
                        </Button>
                      </div>

                      {/* DGII Result */}
                      {dgiiChecked && dgiiResult && (
                        <div
                          className={`rounded-lg border p-3 ${
                            dgiiResult.valid
                              ? dgiiResult.company_exists
                                ? "border-info/30 bg-info/5"
                                : "border-success/30 bg-success/5"
                              : "border-destructive/30 bg-destructive/5"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {dgiiResult.valid ? (
                              dgiiResult.company_exists ? (
                                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                              ) : (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                              )
                            ) : (
                              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                            )}
                            <div className="text-sm">
                              {dgiiResult.valid ? (
                                dgiiResult.company_exists ? (
                                  <>
                                    <p className="font-medium text-info">
                                      Tu empresa ya tiene cuenta en Merkley Details
                                    </p>
                                    <p className="mt-0.5 text-muted">
                                      {dgiiResult.existing_company_name || dgiiResult.full_name}
                                    </p>
                                    {dgiiResult.trusted_domain && (
                                      <p className="mt-1 text-xs text-muted">
                                        Usa un correo <strong>@{dgiiResult.trusted_domain}</strong> para
                                        unirte automáticamente al equipo de tu empresa.
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <p className="font-medium text-success">
                                      Empresa verificada en DGII
                                    </p>
                                    <p className="mt-0.5 text-muted">
                                      {dgiiResult.full_name}
                                    </p>
                                    {dgiiResult.trade_name &&
                                      dgiiResult.trade_name !==
                                        dgiiResult.full_name && (
                                        <p className="text-xs text-muted">
                                          Nombre comercial:{" "}
                                          {dgiiResult.trade_name}
                                        </p>
                                      )}
                                  </>
                                )
                              ) : (
                                <p className="font-medium text-destructive">
                                  {dgiiResult.message ||
                                    "RNC no encontrado en DGII"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Step 2: Company & Contact Info ── */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                      Paso 2 — Datos de contacto
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="company_name">
                          Nombre de la empresa{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="company_name"
                          placeholder="Mi Empresa SRL"
                          value={form.company_name}
                          onChange={(e) =>
                            updateField(
                              "company_name",
                              e.target.value
                            )
                          }
                          required
                          disabled={isSubmitting || (dgiiChecked && dgiiResult?.company_exists === true)}
                        />
                        {dgiiChecked && dgiiResult?.valid && (
                          <p className="text-xs text-muted">
                            {dgiiResult.company_exists
                              ? "Te unirás al equipo de esta empresa."
                              : "Auto-completado desde DGII. Puedes modificarlo si prefieres otro nombre."}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_name">
                          Nombre de contacto{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="contact_name"
                          placeholder="Juan Pérez"
                          value={form.contact_name}
                          onChange={(e) =>
                            updateField(
                              "contact_name",
                              e.target.value
                            )
                          }
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Posición / Cargo</Label>
                        <Input
                          id="position"
                          placeholder="Ej: Gerente de RRHH"
                          value={form.position}
                          onChange={(e) =>
                            updateField("position", e.target.value)
                          }
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Correo electrónico corporativo{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="contacto@empresa.com"
                          value={form.email}
                          onChange={(e) =>
                            updateField("email", e.target.value)
                          }
                          autoComplete="email"
                          required
                          disabled={isSubmitting}
                          className={
                            emailDomainBlocked
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {emailDomainBlocked && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                              <div className="text-sm">
                                <p className="font-medium text-amber-800">
                                  Los correos personales no están
                                  permitidos.
                                </p>
                                <p className="mt-1 text-amber-700">
                                  Por favor usa tu correo corporativo.
                                  Si no tienes uno, puedes solicitar
                                  aprobación manual:
                                </p>
                                <a
                                  href={whatsappApprovalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() =>
                                    trackWhatsAppClick(
                                      "registro_approval"
                                    )
                                  }
                                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  Solicitar aprobación por WhatsApp
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Teléfono / WhatsApp{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="809-555-0100"
                          value={form.phone}
                          onChange={(e) =>
                            updateField("phone", e.target.value)
                          }
                          required
                          disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted">
                          Te contactaremos por este número
                        </p>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="password">
                          Contraseña{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={
                              showPassword ? "text" : "password"
                            }
                            placeholder="Mínimo 8 caracteres"
                            value={form.password}
                            onChange={(e) =>
                              updateField(
                                "password",
                                e.target.value
                              )
                            }
                            autoComplete="new-password"
                            required
                            minLength={8}
                            disabled={isSubmitting}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword(!showPassword)
                            }
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
                        <p className="text-xs text-muted">
                          Mínimo 8 caracteres
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── Step 3: Additional Info (Optional) ── */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                      Paso 3 — Información adicional (opcional)
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Industria</Label>
                        <Select
                          value={form.industry}
                          onValueChange={(val) =>
                            updateField("industry", val)
                          }
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar industria" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDUSTRIES.map((ind) => (
                              <SelectItem key={ind} value={ind}>
                                {ind}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cantidad de empleados</Label>
                        <Select
                          value={form.employee_count_range}
                          onValueChange={(val) =>
                            updateField(
                              "employee_count_range",
                              val
                            )
                          }
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rango" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMPLOYEE_RANGES.map((range) => (
                              <SelectItem
                                key={range}
                                value={range}
                              >
                                {range} empleados
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>¿Cómo nos encontraste?</Label>
                        <Select
                          value={form.referral_source}
                          onValueChange={(val) =>
                            updateField("referral_source", val)
                          }
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar fuente" />
                          </SelectTrigger>
                          <SelectContent>
                            {REFERRAL_SOURCES.map((src) => (
                              <SelectItem key={src} value={src}>
                                {src}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={
                      isSubmitting || emailDomainBlocked
                    }
                  >
                    {isSubmitting
                      ? "Creando cuenta..."
                      : "Crear Cuenta"}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm text-muted">
                  <span>¿Ya tienes una cuenta?</span>{" "}
                  <Link
                    href="/auth/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}
