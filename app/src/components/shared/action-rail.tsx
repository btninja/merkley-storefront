"use client";
import { Button } from "@/components/ui/button";

export interface Action {
  key: string;
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
  disabled?: boolean;
  primary?: boolean;
}

export function ActionRail({ actions }: { actions: Action[] }) {
  if (actions.length === 0) {
    return (
      <aside className="sticky bottom-0 md:top-20 md:bottom-auto p-3 text-xs text-muted-foreground">
        No hay acciones disponibles en este estado.
      </aside>
    );
  }
  return (
    <aside className="sticky bottom-0 md:top-20 md:bottom-auto flex flex-col gap-2 p-3 bg-background/95 md:bg-transparent border-t md:border-0">
      {actions.map((a) => (
        <Button
          key={a.key}
          onClick={a.onClick}
          variant={a.variant ?? (a.primary ? "default" : "outline")}
          disabled={a.disabled}
        >
          {a.label}
        </Button>
      ))}
    </aside>
  );
}
