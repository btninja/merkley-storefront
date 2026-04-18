"use client";
import type { StateMeta } from "@/lib/state-metadata";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StateBannerProps {
  stage: string;
  meta: StateMeta;
  cta?: { label: string; onClick: () => void; disabled?: boolean };
}

const COLOR_MAP = {
  gray: "bg-gray-50 border-gray-300 text-gray-900",
  blue: "bg-blue-50 border-blue-300 text-blue-900",
  amber: "bg-amber-50 border-amber-400 text-amber-900",
  green: "bg-green-50 border-green-300 text-green-900",
  red: "bg-red-50 border-red-400 text-red-900",
} as const;

export function StateBanner({ stage, meta, cta }: StateBannerProps) {
  return (
    <div
      className={cn(
        "rounded-md border-l-4 px-4 py-3 flex items-center justify-between gap-4",
        COLOR_MAP[meta.color]
      )}
      role="status"
      data-stage={stage}
    >
      <div className="flex-1">
        <p className="font-semibold">{meta.label}</p>
        <p className="text-sm opacity-90">{meta.hint}</p>
      </div>
      {cta && (
        <Button onClick={cta.onClick} disabled={cta.disabled}>
          {cta.label}
        </Button>
      )}
    </div>
  );
}
