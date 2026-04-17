"use client";

import { useState } from "react";
import { MessageCircle, Send, X, CheckCircle2 } from "lucide-react";
import { useBootstrap } from "@/hooks/use-catalog";
import { Button } from "@/components/ui/button";
import { trackWhatsAppClick, trackEvent } from "@/lib/analytics";
import { useUtmParams } from "@/context/utm-context";

import { ERP_BASE_URL as ERP_BASE } from "@/lib/env";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

type FormState = "idle" | "open" | "sending" | "success";

/**
 * Sticky CTA bar for the catalog page.
 * Mobile: fixed bottom bar with WhatsApp + "Request Info" form.
 * Desktop: inline banner below hero with same functionality.
 */
export function CatalogCtaBar() {
  const { data: bootstrap } = useBootstrap();
  const whatsapp = bootstrap?.contact?.whatsapp;
  const [formState, setFormState] = useState<FormState>("idle");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const utmParams = useUtmParams();

  if (!whatsapp) return null;

  const digits = whatsapp.replace(/\D/g, "");
  const waMessage = encodeURIComponent(
    "Hola, estoy viendo su catálogo y me gustaría solicitar una cotización."
  );
  const waHref = `https://wa.me/${digits}?text=${waMessage}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Ingresa tu número de teléfono");
      return;
    }
    setError("");
    setFormState("sending");

    try {
      const res = await fetch(
        `${ERP_BASE}/api/method/merkley_web.api.quick_lead.submit_quick_lead`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || undefined,
            phone: phone.trim(),
            message: message.trim() || undefined,
            page_url: window.location.href,
            ...utmParams,
          }),
        }
      );

      if (!res.ok) throw new Error("API error");

      setFormState("success");
      trackEvent("quick_lead_submitted", { source: "catalog_cta" });

      // Fire Google Ads conversion for lead capture
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "conversion", {
          send_to: "AW-18012244228",
          value: 0,
          currency: "DOP",
        });
      }

      setTimeout(() => {
        setFormState("idle");
        setName("");
        setPhone("");
        setMessage("");
      }, 4000);
    } catch {
      setError("Error al enviar. Intenta por WhatsApp.");
      setFormState("open");
    }
  }

  // ── Success state ──
  if (formState === "success") {
    return (
      <>
        {/* Mobile sticky bar */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Te contactaremos pronto
          </div>
        </div>
        {/* Desktop inline */}
        <div className="hidden lg:block rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Recibimos tu solicitud. Te contactaremos pronto.
          </div>
        </div>
      </>
    );
  }

  // ── Form open state ──
  if (formState === "open" || formState === "sending") {
    return (
      <>
        {/* Mobile: slide-up form */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white px-4 pb-5 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] lg:hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Solicitar información</h3>
            <button
              onClick={() => setFormState("idle")}
              className="rounded-full p-1 text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <input
              type="text"
              placeholder="Tu nombre"
              aria-label="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <input
              type="tel"
              placeholder="Teléfono / WhatsApp *"
              aria-label="Teléfono o WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <input
              type="text"
              placeholder="¿Qué productos te interesan?"
              aria-label="Productos que te interesan"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={formState === "sending"}
            >
              {formState === "sending" ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Enviar solicitud
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Desktop: inline expandable */}
        <div className="hidden lg:block rounded-xl border border-border bg-surface-muted/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Solicitar información</h3>
            <button
              onClick={() => setFormState("idle")}
              className="rounded-full p-1 text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <input
              type="text"
              placeholder="Tu nombre"
              aria-label="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <input
              type="tel"
              placeholder="Teléfono / WhatsApp *"
              aria-label="Teléfono o WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <input
              type="text"
              placeholder="¿Qué productos te interesan?"
              aria-label="Productos que te interesan"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={formState === "sending"}
            >
              {formState === "sending" ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Enviar solicitud
                </>
              )}
            </Button>
          </form>
        </div>
      </>
    );
  }

  // ── Default idle state ──
  return (
    <>
      {/* Mobile: sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="flex items-center gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick("catalog_cta_mobile")}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#20bd5a]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp
          </a>
          <button
            onClick={() => {
              setFormState("open");
              trackEvent("quick_lead_form_opened", { source: "catalog_cta_mobile" });
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <MessageCircle className="h-4 w-4" />
            Solicitar Info
          </button>
        </div>
      </div>

      {/* Desktop: inline banner in sidebar */}
      <div className="hidden lg:block rounded-xl border border-border bg-gradient-to-br from-primary-soft/50 to-surface-muted p-5">
        <h3 className="text-sm font-semibold mb-1">
          ¿Necesitas una cotización?
        </h3>
        <p className="text-xs text-muted mb-3 leading-relaxed">
          Escríbenos por WhatsApp o déjanos tu número y te contactamos.
        </p>
        <div className="space-y-2">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClick("catalog_cta_desktop")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#20bd5a]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Cotizar por WhatsApp
          </a>
          <button
            onClick={() => {
              setFormState("open");
              trackEvent("quick_lead_form_opened", { source: "catalog_cta_desktop" });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            <MessageCircle className="h-4 w-4" />
            Solicitar información
          </button>
        </div>
      </div>
    </>
  );
}
