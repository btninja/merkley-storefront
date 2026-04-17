import { AlertTriangle } from "lucide-react";

/**
 * Rendered at the top of every legal-policy page (terms, privacy,
 * returns). Makes it unambiguous that the content below is a starting
 * template and must be reviewed by counsel before a new tenant goes
 * live.
 *
 * Set `NEXT_PUBLIC_LEGAL_REVIEWED=1` in `.env.production` once your
 * lawyers have signed off to hide this banner.
 */
export function LegalTemplateBanner() {
  if (process.env.NEXT_PUBLIC_LEGAL_REVIEWED === "1") {
    return null;
  }
  return (
    <div
      role="alert"
      className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold">Plantilla — requiere revisión legal.</p>
          <p className="text-amber-800">
            Este documento es una plantilla de punto de partida. Debe ser
            revisado y personalizado por asesoría jurídica antes de publicarse
            en producción. Una vez revisado, fije{" "}
            <code className="rounded bg-amber-100 px-1 text-[11px]">
              NEXT_PUBLIC_LEGAL_REVIEWED=1
            </code>{" "}
            en el entorno para ocultar este aviso.
          </p>
        </div>
      </div>
    </div>
  );
}
