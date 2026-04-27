"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  Eye,
  EyeOff,
  AlertTriangle,
  TrendingUp,
  Sparkles as SparkleIcon,
  FileText,
  Shield,
  CheckCircle2,
  Loader2,
  XCircle,
  Building2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { trackBeginRegistration } from "@/lib/analytics";
import { useFormTracking } from "@/hooks/use-form-tracking";
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
import {
  PasswordStrength,
  isPasswordValid,
} from "@/components/auth/password-strength";

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

const STEP_LABELS = ["Empresa", "Contacto", "Adicional"] as const;

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
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formTracking = useFormTracking("registration");

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

  const emailDomainBlocked = useMemo(() => {
    const email = form.email.trim().toLowerCase();
    if (!email.includes("@")) return false;
    const domain = email.split("@")[1];
    return BLOCKED_DOMAINS.has(domain);
  }, [form.email]);

  function updateField(field: string, value: string) {
    formTracking.markDirty();
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Step validation
  const canProceedToStep2 = dgiiChecked && dgiiResult?.valid === true;
  const canProceedToStep3 =
    canProceedToStep2 &&
    form.company_name.trim() !== "" &&
    form.contact_name.trim() !== "" &&
    form.email.trim() !== "" &&
    form.phone.trim() !== "" &&
    isPasswordValid(form.password);

  // DGII RNC validation
  const handleValidateRnc = useCallback(async () => {
    const cleanRnc = form.rnc.replace(/[-\s]/g, "");
    if (!cleanRnc || cleanRnc.length < 9) {
      toast({
        title: "RNC inválido",
        description: "El RNC debe tener 9 dígitos o la Cédula 11 dígitos.",
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
        // Auto-advance to step 2
        setStep(2);
      } else {
        toast({
          title: "RNC no encontrado",
          description: result.message || "No se encontro en la base de datos de la DGII.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error de validacion",
        description: "No se pudo validar el RNC. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setDgiiLoading(false);
    }
  }, [form.rnc]);

  const handleRncBlur = useCallback(() => {
    const cleanRnc = form.rnc.replace(/[-\s]/g, "");
    if (cleanRnc.length >= 9 && !dgiiChecked && !dgiiLoading) {
      handleValidateRnc();
    }
  }, [form.rnc, dgiiChecked, dgiiLoading, handleValidateRnc]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const required = ["rnc", "company_name", "contact_name", "email", "phone", "password"] as const;
    for (const field of required) {
      if (!form[field].trim()) {
        toast({
          title: "Campo requerido",
          description: "Por favor completa todos los campos obligatorios.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!dgiiChecked || !dgiiResult?.valid) {
      toast({
        title: "Verificar RNC",
        description: "Debes verificar el RNC antes de crear la cuenta.",
        variant: "destructive",
      });
      setStep(1);
      return;
    }

    if (!isPasswordValid(form.password)) {
      // Should be prevented by canProceedToStep3, but guard against URL-hopping.
      toast({
        title: "Contraseña no válida",
        description: "Revisa los requisitos de la contraseña en el paso 2.",
        variant: "destructive",
      });
      setStep(2);
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
        ...(form.employee_count_range && { employee_count_range: form.employee_count_range }),
        ...(form.referral_source && { referral_source: form.referral_source }),
        ...(form.position && { position: form.position }),
      });
      formTracking.markSubmitted();

      if (result.approvalPending) {
        clearStoredForm();
        toast({
          title: "Solicitud recibida",
          description: "Tu solicitud sera revisada por un administrador.",
          variant: "success",
        });
        router.push(`/auth/verificar-correo?email=${encodeURIComponent(result.email)}&status=pending_approval`);
        return;
      }

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
        router.push(`/auth/verificar-correo?email=${encodeURIComponent(result.email)}`);
      } else {
        toast({
          title: "Cuenta creada",
          description: "Tu cuenta ha sido creada exitosamente. Bienvenido a Merkley Details.",
          variant: "success",
        });
        router.push("/cuenta");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear la cuenta. Intenta de nuevo.";

      if (message.includes("COMPANY_EXISTS")) {
        toast({
          title: "Empresa ya registrada",
          description: "Ya existe una empresa con este nombre. Si eres parte de esta empresa, contacta al administrador.",
          variant: "destructive",
        });
      } else if (message.includes("correo") && message.includes("verificac")) {
        // Backend verification-related error — redirect to verification page
        clearStoredForm();
        toast({
          title: "Verifica tu correo",
          description: "Te hemos enviado un correo de verificación. Revisa tu bandeja de entrada.",
          variant: "default",
        });
        router.push(`/auth/verificar-correo?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
        return;
      } else {
        toast({ title: "Error de registro", description: message, variant: "destructive" });
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
                { icon: TrendingUp, text: "Precios corporativos exclusivos" },
                { icon: SparkleIcon, text: "Catalogos personalizados con tu logo" },
                { icon: FileText, text: "Cotizacion en menos de 24 horas" },
                { icon: Shield, text: "Proceso seguro y documentado" },
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
                &#9733; 98% de satisfacción del cliente
              </p>
              <p className="mt-1 text-xs text-muted">
                &ldquo;Merkley hizo que nuestro evento corporativo
                fuera un exito. El proceso fue rapido y los productos
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
                <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
                <CardDescription>
                  {step === 1 && "Verifica tu empresa con el RNC"}
                  {step === 2 && "Completa tus datos de contacto"}
                  {step === 3 && "Información adicional (opcional)"}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* ── Step Progress ── */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    {STEP_LABELS.map((label, i) => {
                      const s = i + 1;
                      return (
                        <div key={s} className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                              step > s
                                ? "bg-primary text-white"
                                : step === s
                                  ? "bg-primary text-white ring-2 ring-primary/30 ring-offset-1"
                                  : "bg-surface-muted text-muted"
                            }`}
                          >
                            {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                          </div>
                          <span
                            className={`hidden text-xs font-medium sm:inline ${
                              step >= s ? "text-foreground" : "text-muted"
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="relative h-1.5 w-full rounded-full bg-surface-muted">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${((step - 1) / 2) * 100}%` }}
                    />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* ════════════ STEP 1: RNC ════════════ */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="rnc">
                          RNC o Cédula <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-[11px] text-muted leading-tight">
                          El número de registro de tu empresa en la DGII (9 dígitos). Lo encuentras en cualquier factura fiscal o en dgii.gov.do.
                        </p>
                        <div className="flex gap-2">
                          <Input
                            id="rnc"
                            placeholder="123-45678-9"
                            value={form.rnc}
                            onChange={(e) => {
                              updateField("rnc", e.target.value);
                              if (dgiiChecked) {
                                setDgiiChecked(false);
                                setDgiiResult(null);
                              }
                            }}
                            onBlur={handleRncBlur}
                            required
                            disabled={isSubmitting}
                            autoFocus
                            className={
                              dgiiChecked
                                ? dgiiResult?.valid ? "border-success" : "border-destructive"
                                : ""
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleValidateRnc}
                            disabled={dgiiLoading || isSubmitting || !form.rnc.replace(/[-\s]/g, "")}
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
                                      <p className="font-medium text-success">Empresa verificada en DGII</p>
                                      <p className="mt-0.5 text-muted">{dgiiResult.full_name}</p>
                                      {dgiiResult.trade_name && dgiiResult.trade_name !== dgiiResult.full_name && (
                                        <p className="text-xs text-muted">
                                          Nombre comercial: {dgiiResult.trade_name}
                                        </p>
                                      )}
                                    </>
                                  )
                                ) : (
                                  <p className="font-medium text-destructive">
                                    {dgiiResult.message || "RNC no encontrado en DGII"}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        className="w-full gap-2"
                        size="lg"
                        disabled={!canProceedToStep2}
                        onClick={() => setStep(2)}
                      >
                        Continuar <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* ════════════ STEP 2: CONTACT ════════════ */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="company_name">
                          Nombre de la empresa <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="company_name"
                          placeholder="Mi Empresa SRL"
                          value={form.company_name}
                          onChange={(e) => updateField("company_name", e.target.value)}
                          required
                          disabled={isSubmitting || (dgiiChecked && dgiiResult?.company_exists === true)}
                        />
                        {dgiiChecked && dgiiResult?.valid && (
                          <p className="text-xs text-muted">
                            {dgiiResult.company_exists
                              ? "Te unirás al equipo de esta empresa."
                              : "Auto-completado desde DGII."}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="contact_name">
                            Nombre de contacto <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="contact_name"
                            placeholder="Juan Perez"
                            value={form.contact_name}
                            onChange={(e) => updateField("contact_name", e.target.value)}
                            required
                            disabled={isSubmitting}
                            autoFocus
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="position">Posición / Cargo</Label>
                          <Input
                            id="position"
                            placeholder="Ej: Gerente de RRHH"
                            value={form.position}
                            onChange={(e) => updateField("position", e.target.value)}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Correo electrónico corporativo <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="contacto@empresa.com"
                          value={form.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          autoComplete="email"
                          required
                          disabled={isSubmitting}
                          className={emailDomainBlocked ? "border-destructive" : ""}
                        />
                        {emailDomainBlocked && (
                          <div className="rounded-lg border border-amber-300 bg-amber-100 p-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                              <div className="text-sm">
                                <p className="font-medium text-amber-900">
                                  Tu cuenta requerirá aprobación de un administrador antes de activarse.
                                </p>
                                <p className="mt-1 text-amber-900">
                                  Por favor usa tu correo corporativo si tienes uno para acceso inmediato.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Teléfono / WhatsApp <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="809-555-0100"
                          value={form.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">
                          Contraseña <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Tu contraseña"
                            value={form.password}
                            onChange={(e) => updateField("password", e.target.value)}
                            autoComplete="new-password"
                            required
                            minLength={8}
                            disabled={isSubmitting}
                            className="pr-10"
                            aria-describedby="password-strength"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                            tabIndex={-1}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <PasswordStrength
                          id="password-strength"
                          password={form.password}
                          hideWhenEmpty
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          size="lg"
                          onClick={() => setStep(1)}
                        >
                          <ArrowLeft className="h-4 w-4" /> Atras
                        </Button>
                        <Button
                          type="button"
                          className="flex-1 gap-2"
                          size="lg"
                          disabled={!canProceedToStep3}
                          onClick={() => setStep(3)}
                        >
                          Continuar <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ════════════ STEP 3: ADDITIONAL ════════════ */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted">
                        Esta información es opcional pero nos ayuda a darte un mejor servicio.
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Industria</Label>
                          <Select
                            value={form.industry}
                            onValueChange={(val) => updateField("industry", val)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar industria" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRIES.map((ind) => (
                                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Cantidad de empleados</Label>
                          <Select
                            value={form.employee_count_range}
                            onValueChange={(val) => updateField("employee_count_range", val)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar rango" />
                            </SelectTrigger>
                            <SelectContent>
                              {EMPLOYEE_RANGES.map((range) => (
                                <SelectItem key={range} value={range}>{range} empleados</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>¿Cómo nos encontraste?</Label>
                          <Select
                            value={form.referral_source}
                            onValueChange={(val) => updateField("referral_source", val)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar fuente" />
                            </SelectTrigger>
                            <SelectContent>
                              {REFERRAL_SOURCES.map((src) => (
                                <SelectItem key={src} value={src}>{src}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          size="lg"
                          onClick={() => setStep(2)}
                        >
                          <ArrowLeft className="h-4 w-4" /> Atras
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          size="lg"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Creando cuenta..." : "Crear Cuenta"}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>

                <div className="mt-6 text-center text-sm text-muted">
                  <span>¿Ya tienes una cuenta?</span>{" "}
                  <Link href="/auth/login" className="font-medium text-primary hover:underline">
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
