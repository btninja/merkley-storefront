"use client";

import Image from "next/image";
import useSWR from "swr";
import {
  ShoppingBag,
  FileText,
  MessageCircle,
  Briefcase,
  Calendar,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Instagram,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Facebook,
  Music,
  Mail,
  ExternalLink,
  Phone,
  Globe,
  MapPin,
  Gift,
  Star,
  Heart,
  Send,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Youtube,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Linkedin,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Twitter,
} from "lucide-react";
import { getLinkPage } from "@/lib/api";
import { trackCtaClick } from "@/lib/analytics";
import type { LinkPageItem } from "@/lib/types";

// ── Icon Mapping ──

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "shopping-bag": ShoppingBag,
  "file-text": FileText,
  "message-circle": MessageCircle,
  briefcase: Briefcase,
  calendar: Calendar,
  instagram: Instagram,
  facebook: Facebook,
  music: Music,
  mail: Mail,
  phone: Phone,
  globe: Globe,
  "map-pin": MapPin,
  gift: Gift,
  star: Star,
  heart: Heart,
  send: Send,
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Twitter,
};

function getIcon(name: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[name] || ExternalLink;
}

// ── Skeleton ──

function LinksSkeleton() {
  return (
    <div className="flex w-full max-w-md flex-col items-center px-6 py-12 animate-pulse">
      {/* Avatar skeleton */}
      <div className="h-20 w-20 rounded-full bg-surface-muted" />
      {/* Headline skeleton */}
      <div className="mt-5 h-6 w-48 rounded-lg bg-surface-muted" />
      {/* Tagline skeleton */}
      <div className="mt-2 h-4 w-64 rounded-lg bg-surface-muted" />
      {/* Button skeletons */}
      <div className="mt-8 flex w-full flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 w-full rounded-full bg-surface-muted" />
        ))}
      </div>
      {/* Social skeletons */}
      <div className="mt-8 flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-10 rounded-full bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}

// ── Link Button ──

function LinkButton({
  link,
  index,
}: {
  link: LinkPageItem;
  index: number;
}) {
  const Icon = getIcon(link.icon);

  const handleClick = () => {
    trackCtaClick("link_page_click", link.label);
  };

  // Social & mailto links open in same tab (native app / mail client)
  // External URLs open in new tab
  const isInAppLink =
    link.link_type === "Social" ||
    link.url.startsWith("mailto:") ||
    link.url.startsWith("tel:") ||
    link.url.startsWith("whatsapp:");
  const target = isInAppLink ? "_self" : "_blank";
  const rel = isInAppLink ? undefined : "noopener noreferrer";

  if (link.link_type === "Social") {
    return (
      <a
        href={link.url}
        target={target}
        rel={rel}
        onClick={handleClick}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/80 text-foreground/70 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:border-primary/30 hover:text-primary hover:shadow-md"
        style={{ animationDelay: `${index * 60}ms` }}
        title={link.label}
      >
        <Icon className="h-5 w-5" />
      </a>
    );
  }

  const isPrimary = link.link_type === "Primario";

  return (
    <a
      href={link.url}
      target={target}
      rel={rel}
      onClick={handleClick}
      className={`
        group flex w-full items-center justify-center gap-2.5 rounded-full
        h-12 px-8 text-base font-medium
        shadow-sm transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        animate-fade-in-up
        ${
          isPrimary
            ? "bg-primary text-primary-foreground hover:bg-primary-hover"
            : "border border-border bg-white/80 text-foreground backdrop-blur-sm hover:border-primary/30 hover:bg-white"
        }
      `}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Icon className={`h-4.5 w-4.5 shrink-0 ${isPrimary ? "text-primary-foreground/80" : "text-primary"}`} />
      {link.label}
    </a>
  );
}

// ── Page ──

export default function LinksPage() {
  const { data, isLoading } = useSWR("link-page", () => getLinkPage(), {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
  });

  if (isLoading) {
    return <LinksSkeleton />;
  }

  const headline = data?.headline || "Merkley Details";
  const tagline = data?.tagline || "Detalles corporativos hechos a tu medida";
  const avatar = data?.avatar || "";
  const links = data?.links || [];

  const primaryLinks = links
    .filter((l) => l.link_type === "Primario")
    .sort((a, b) => a.display_order - b.display_order);
  const secondaryLinks = links
    .filter((l) => l.link_type === "Secundario")
    .sort((a, b) => a.display_order - b.display_order);
  const socialLinks = links
    .filter((l) => l.link_type === "Social")
    .sort((a, b) => a.display_order - b.display_order);

  const allButtonLinks = [...primaryLinks, ...secondaryLinks];

  return (
    <div className="flex w-full max-w-md flex-col items-center px-6 py-12">
      {/* ── Avatar ── */}
      <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white bg-white shadow-lg ring-2 ring-primary/20">
        {avatar ? (
          <Image
            src={avatar}
            alt={headline}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-hover">
            <span className="text-2xl font-bold text-primary-foreground">
              {headline.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* ── Headline & Tagline ── */}
      <h1 className="mt-5 text-xl font-bold tracking-tight text-foreground">
        {headline}
      </h1>
      <p className="mt-1 text-center text-sm text-muted">
        {tagline}
      </p>

      {/* ── Primary & Secondary Links ── */}
      {allButtonLinks.length > 0 && (
        <div className="mt-8 flex w-full flex-col gap-3">
          {allButtonLinks.map((link, i) => (
            <LinkButton key={`${link.link_type}-${link.display_order}`} link={link} index={i} />
          ))}
        </div>
      )}

      {/* ── Social Links ── */}
      {socialLinks.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {socialLinks.map((link, i) => (
            <LinkButton
              key={`social-${link.display_order}`}
              link={link}
              index={allButtonLinks.length + i}
            />
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {links.length === 0 && !isLoading && (
        <div className="mt-10 text-center">
          <p className="text-sm text-muted">
            Pronto encontrarás nuestros enlaces aquí.
          </p>
        </div>
      )}

      {/* ── Footer ── */}
      <p className="mt-auto pt-12 text-xs text-muted/60">
        &copy; 2026 Merkley Details
      </p>
    </div>
  );
}
