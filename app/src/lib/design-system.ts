/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MERKLEY STOREFRONT — DESIGN SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SINGLE SOURCE OF TRUTH for all visual design decisions.
 *
 * This file is read by:
 *  - Storefront components (import from here)
 *  - AutoResearch optimizer (reads this file as constraints)
 *  - Developers (reference for what's allowed)
 *
 * TO CHANGE THE BRAND: edit the values here + update globals.css CSS vars.
 * Everything else propagates automatically.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ── Colors ────────────────────────────────────────────────────────────────
// These map to CSS variables in globals.css. Use as Tailwind classes.

export const colors = {
  /** Brand pink — primary actions, accents, highlights */
  primary: "primary",             // bg-primary, text-primary, border-primary
  primaryForeground: "primary-foreground", // text on primary bg
  primarySoft: "primary-soft",    // bg-primary-soft (light pink bg)
  primaryHover: "primary-hover",  // hover state for primary buttons

  /** Surfaces */
  background: "background",       // page bg (#fafafa)
  surface: "surface",             // card bg (white)
  surfaceMuted: "surface-muted",  // subtle bg (#f4f4f5) — also allows /50, /30 opacity
  surfaceHover: "surface-hover",  // hover bg

  /** Text */
  foreground: "foreground",       // body text (#635a5c)
  muted: "muted",                 // secondary text (#8a8385)

  /** Borders */
  border: "border",               // default border (#e4e4e7)

  /** Semantic */
  success: "success",
  successSoft: "success-soft",
  warning: "warning",
  warningSoft: "warning-soft",
  destructive: "destructive",
  destructiveSoft: "destructive-soft",
  info: "info",
  infoSoft: "info-soft",
} as const;

// ── Allowed Badge Accent Colors ───────────────────────────────────────────
// Only these soft colors may be used for badges/tags/labels.

export const badgeAccents = [
  "bg-pink-50",
  "bg-blue-50",
  "bg-green-50",
  "bg-amber-50",
  "bg-purple-50",
  "bg-white/90 backdrop-blur-sm",  // for badges over images
] as const;

// ── Use Case Card Gradients ───────────────────────────────────────────────
// Soft gradient backgrounds for use-case/category feature cards.
export const useCaseGradients = [
  "from-pink-500/20 to-rose-500/10",      // events / celebrations
  "from-amber-500/20 to-orange-500/10",    // seasonal / holiday
  "from-blue-500/20 to-cyan-500/10",       // promotional / awards
  "from-purple-500/20 to-violet-500/10",   // special occasions
] as const;

// ── Status Indicators ─────────────────────────────────────────────────────
export const statusIndicators = {
  /** Green pulse dot for "active" badges */
  activePulse: "bg-green-400 animate-pulse",
} as const;

// ── Star Ratings ──────────────────────────────────────────────────────────
export const starClasses = "fill-amber-400 text-amber-400" as const;

// ── Button Variants ───────────────────────────────────────────────────────
// These are the ONLY button styles allowed. Defined in button.tsx via CVA.
// Never add className color overrides to <Button>.

export const buttonVariants = {
  /** Pink bg, white text. THE primary action on screen. */
  primary: { variant: undefined, desc: "Brand pink, for main CTA" },

  /** White bg, subtle border. Secondary/alternative action. */
  outline: { variant: "outline" as const, desc: "Outlined, for secondary CTA" },

  /** Muted bg. Tertiary action. */
  secondary: { variant: "secondary" as const, desc: "Muted bg, for filters/toggles" },

  /** No bg, no border. Low-priority links. */
  ghost: { variant: "ghost" as const, desc: "Transparent, for nav/minor actions" },

  /** Red bg. Destructive/delete actions only. */
  destructive: { variant: "destructive" as const, desc: "Red, for delete/cancel" },

  /** Underlined text link. */
  link: { variant: "link" as const, desc: "Text link style" },
} as const;

// ── Allowed Button className Modifiers ────────────────────────────────────
// These are the ONLY className overrides allowed on <Button> components.
// They handle special contexts (e.g., buttons over gradient/image backgrounds).
export const buttonModifiers = {
  /** Translucent white bg for buttons over gradient/image backgrounds */
  backdrop: "bg-white/80 backdrop-blur-sm",
} as const;

// ── Button Size & Shape ───────────────────────────────────────────────────
// Valid size and rounded props for <Button>.
export const buttonSizes = ["default", "sm", "lg", "icon"] as const;
export const buttonRounded = ["default", "full"] as const;
// CTA buttons always use: size="lg" rounded="full"

// ── CTA Patterns ──────────────────────────────────────────────────────────
// Standard CTA pairings. Use these exact combinations.
// BOTH buttons in a pair are MANDATORY — never remove one.

// CTA sections MUST have both buttons. The optimizer MAY swap which is primary vs secondary.
// Primary = default variant (pink bg). Secondary = outline variant.
export const ctaPatterns = {
  /** Hero section: MUST contain both "Ver Catálogo" and "Crear Cuenta Gratis" */
  hero: {
    buttons: [
      { label: "Ver Catálogo", href: "/catalogo" },
      { label: "Crear Cuenta Gratis", href: "/auth/registro" },
    ],
    note: "Optimizer may choose which is primary (default) and which is secondary (outline). Both MUST be visible <Button> elements.",
  },

  /** Bottom CTA: MUST contain both buttons */
  bottom: {
    buttons: [
      { label: "Crear Cuenta Gratis", href: "/auth/registro" },
      { label: "Ver Catálogo", href: "/catalogo" },
    ],
    note: "Same rule — optimizer may swap order. Both must be <Button> with size='lg' rounded='full'.",
  },

  /** Mid-page catalog link */
  catalog: {
    buttons: [
      { label: "Ver catálogo completo", href: "/catalogo" },
    ],
    note: "Single button, always outline variant.",
  },
} as const;

// ── Section Backgrounds ───────────────────────────────────────────────────
// Alternate these for visual rhythm.

// Sections can use ONE background + optionally "bordered" for a top border.
// Combinations like "border-t border-border bg-white" or "border-t border-border bg-surface-muted/30" are valid.
// "bg-white" is also valid as the default (or simply no bg class).
export const sectionBackgrounds = {
  white: "bg-white",                          // explicit white (or no bg class = default white)
  muted: "bg-surface-muted/30",              // light gray
  gradient: "bg-gradient-to-r from-primary-soft to-surface-muted", // pink gradient (CTA only)
  bordered: "border-t border-border",         // can combine with any of the above
  borderedY: "border-y border-border",        // top + bottom borders (stats bar)
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────

export const sectionPadding = {
  default: "py-20",
  compact: "py-16",
  slim: "py-8",
} as const;

// ── Typography ────────────────────────────────────────────────────────────

export const headingClasses = {
  /** Page/section titles */
  h1: "text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl",
  h2: "text-3xl font-bold tracking-tight",
  h3: "text-lg font-semibold",

  /** Subtitles under headings */
  subtitle: "mt-3 text-muted",

  /** Section label (small caps above heading) */
  label: "text-sm font-semibold uppercase tracking-widest text-muted",
} as const;

// ── Card Patterns ─────────────────────────────────────────────────────────

export const cardClasses = {
  /** Standard interactive card */
  interactive: "h-full overflow-hidden transition-shadow hover:shadow-lg",

  /** Static info card */
  info: "border-border/60",

  /** Featured card with brand border */
  featured: "border-primary/30 transition-shadow hover:shadow-lg",
} as const;

// ── Trust Micro-Copy ──────────────────────────────────────────────────────
// Default reassurance lines used near CTAs. The optimizer MAY modify the TEXT
// of these lines to test different messaging, but MUST keep 2-3 short trust
// phrases in the same visual pattern (small text, centered, with middot separators).
export const trustLines = {
  hero: ["Sin compromiso", "Desde 12 unidades", "Cotización al instante"],
  register: ["Registro gratuito", "Sin tarjeta de crédito", "Cancela cuando quieras"],
} as const;

// ── Image Aspect Ratios ───────────────────────────────────────────────────

export const aspectRatios = {
  category: "aspect-[4/3]",
  useCase: "h-48",
  season: "h-44",
  blog: "h-44",
  logo: "h-16 w-36",
} as const;

// ── Gradient Overlays ─────────────────────────────────────────────────────

export const gradientOverlays = {
  /** Bottom-up dark overlay for text on images */
  bottomDark: "bg-gradient-to-t from-black/60 via-black/20 to-transparent",
  /** Lighter version */
  bottomLight: "bg-gradient-to-t from-black/40 to-transparent",
} as const;
