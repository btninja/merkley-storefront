// Canonical post-migration stage values. See
// merkley_web.state_machine.quotation.STATES for the authoritative source.
export const QUOTE_STAGES = [
  "Borrador",
  "Enviada",
  "Confirmada",
  "En Revisión",
  "Aceptada",
  "Rechazada",
  "Expirada",
] as const;

// Pre-migration stage values still returned by a handful of derived-status
// code paths on the backend (see get_synced_quote_stage in quotations.py).
// We widen the type so callers can render them without an `as QuoteStage`
// cast — the canonical list stays strict.
export const LEGACY_QUOTE_STAGES = [
  "En Revision",
  "Aprobada",
  "Aceptada por Cliente",
] as const;

export type QuoteStage =
  | (typeof QUOTE_STAGES)[number]
  | (typeof LEGACY_QUOTE_STAGES)[number];

export const QUOTE_STAGE_COLORS: Record<QuoteStage, { bg: string; text: string }> = {
  Borrador: { bg: "bg-surface-muted", text: "text-muted" },
  Enviada: { bg: "bg-info-soft", text: "text-info" },
  Confirmada: { bg: "bg-warning-soft", text: "text-warning" },
  "En Revisión": { bg: "bg-info-soft", text: "text-info" },
  Aceptada: { bg: "bg-success-soft", text: "text-success" },
  Rechazada: { bg: "bg-destructive-soft", text: "text-destructive" },
  Expirada: { bg: "bg-surface-muted", text: "text-muted" },
  // Legacy aliases — preserved so the list views don't crash if the backend
  // occasionally surfaces a pre-migration stage on older records.
  "En Revision": { bg: "bg-info-soft", text: "text-info" },
  Aprobada: { bg: "bg-info-soft", text: "text-info" },
  "Aceptada por Cliente": { bg: "bg-success-soft", text: "text-success" },
};

export const APPROVAL_METHODS = [
  "Orden de compra firmada y sellada",
  "Voucher de pago del 50%",
  "Carta de responsabilidad firmada y sellada",
] as const;

export type ApprovalMethod = (typeof APPROVAL_METHODS)[number];

export function calculateDeliveryTier(
  desiredDate: string | null | undefined
): { tier: DeliveryTier; surchargePercent: number; isEmergency: boolean } {
  if (!desiredDate) return { tier: "Estandar", surchargePercent: 0, isEmergency: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(desiredDate + "T00:00:00");
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 2) return { tier: "Emergencia", surchargePercent: 30, isEmergency: true };
  if (diffDays <= 6) return { tier: "Express", surchargePercent: 15, isEmergency: false };
  return { tier: "Estandar", surchargePercent: 0, isEmergency: false };
}

export const PAYMENT_INFO = {
  bank: "Banreservas",
  accountType: "Ahorros",
  accountNumber: "9607475061",
  cedula: "402-2760250-1",
  accountHolder: "Perla Genesis Peña Garcia",
} as const;

export const DELIVERY_TIERS = ["Estandar", "Express", "Emergencia"] as const;

export type DeliveryTier = (typeof DELIVERY_TIERS)[number];

export const INDUSTRIES = [
  "Servicios Financieros",
  "Salud",
  "Logistica",
  "Hoteleria",
  "Educacion",
  "Gobierno",
  "Otro",
] as const;

export const REFERRAL_SOURCES = [
  "Instagram",
  "WhatsApp",
  "Referido",
  "Google",
  "Evento",
  "Otro",
] as const;

export const PRODUCT_TIERS = ["Esencial", "Premium", "Lujo"] as const;

export const WEBSITE_CATEGORIES = [
  "San Valentin",
  "Dia de las Madres",
  "Navidad / Fin de Ano",
  "Bienvenida / Onboarding",
  "Reconocimiento / Empleado del Mes",
  "Eventos Corporativos",
  "Regalos Ejecutivos",
  "Canastas / Baskets",
  "Personalizados a Medida",
] as const;

export const CURRENCY = "DOP";
export const CURRENCY_SYMBOL = "RD$";
export const ITBIS_RATE = 18;

// Surcharge for small orders (fewer than this qty per line item)
export const SMALL_ORDER_QTY_THRESHOLD = 12;
export const SMALL_ORDER_SURCHARGE_PERCENT = 10;
