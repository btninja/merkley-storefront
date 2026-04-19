"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DR_CITIES } from "@/lib/dr-cities";

interface CitySearchInputProps {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Searchable city input. Uses DR_CITIES as the suggestion source but
 *  accepts any free-text value. Keyboard-accessible: ArrowDown opens the
 *  list, ArrowUp/Down navigates, Enter picks, Escape closes.
 *
 *  Dropdown is portaled to document.body with fixed positioning so it
 *  escapes any ancestor overflow:hidden (e.g. inside a scrollable
 *  dialog body). Repositions on scroll + resize. */
export function CitySearchInput({
  value,
  onChange,
  id,
  placeholder = "Ej: Santo Domingo",
  required,
  disabled,
  className,
}: CitySearchInputProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions: accent-insensitive substring match.
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return DR_CITIES.slice(0, 8);
    const strip = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const nq = strip(q);
    return DR_CITIES.filter((c) => strip(c).includes(nq)).slice(0, 8);
  }, [value]);

  // Reset highlighted index when list shrinks
  useEffect(() => {
    if (active >= suggestions.length) setActive(0);
  }, [suggestions.length, active]);

  // Compute dropdown coords relative to viewport (fixed positioning).
  const updateCoords = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  // Track input position while open: reposition on scroll (capture phase
  // catches nested scrolls like a dialog body) + on resize.
  useEffect(() => {
    if (!open) return;
    updateCoords();
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [open]);

  // Close on outside click — check BOTH the wrapper and the portal container
  // (target could be inside the portaled <ul>).
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      // Portaled suggestions carry data-city-portal attribute — allow their clicks.
      const portalEl = document.querySelector("[data-city-portal]");
      if (portalEl?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && suggestions[active]) {
      e.preventDefault();
      onChange(suggestions[active]);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const portalOpen = open && suggestions.length > 0 && typeof document !== "undefined";

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          id={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className="pl-7"
        />
      </div>
      {portalOpen &&
        createPortal(
          <ul
            role="listbox"
            data-city-portal
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
            className="z-[100] max-h-60 overflow-y-auto rounded-md border bg-white py-1 shadow-lg dark:bg-slate-900 dark:border-slate-700"
          >
            {suggestions.map((city, idx) => (
              <li
                key={city}
                role="option"
                aria-selected={idx === active}
                onMouseDown={(e) => {
                  // onMouseDown (not onClick) so this fires before input's onBlur
                  e.preventDefault();
                  onChange(city);
                  setOpen(false);
                }}
                onMouseEnter={() => setActive(idx)}
                className={cn(
                  "cursor-pointer px-2 py-1.5 text-sm",
                  idx === active
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-50"
                    : "text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800",
                )}
              >
                {city}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
