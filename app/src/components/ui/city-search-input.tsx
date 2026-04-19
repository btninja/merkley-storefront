"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
 *  list, ArrowUp/Down navigates, Enter picks, Escape closes. */
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
  const wrapRef = useRef<HTMLDivElement>(null);

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

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
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

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
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
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border bg-popover py-1 shadow-md"
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
                idx === active ? "bg-accent text-accent-foreground" : "hover:bg-muted",
              )}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
