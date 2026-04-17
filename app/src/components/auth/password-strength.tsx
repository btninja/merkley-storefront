"use client";

import { Check, X, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type PasswordRule = {
  id: string;
  label: string;
  test: (pwd: string) => boolean;
};

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: "length", label: "Al menos 8 caracteres", test: (p) => p.length >= 8 },
  { id: "uppercase", label: "Una letra mayúscula", test: (p) => /[A-Z]/.test(p) },
  { id: "digit", label: "Un número", test: (p) => /\d/.test(p) },
];

export interface PasswordEvaluation {
  rules: { rule: PasswordRule; passed: boolean }[];
  passedCount: number;
  valid: boolean;
}

export function evaluatePassword(pwd: string): PasswordEvaluation {
  const rules = PASSWORD_RULES.map((rule) => ({ rule, passed: rule.test(pwd) }));
  const passedCount = rules.filter((r) => r.passed).length;
  return { rules, passedCount, valid: passedCount === PASSWORD_RULES.length };
}

export function isPasswordValid(pwd: string): boolean {
  return evaluatePassword(pwd).valid;
}

interface PasswordStrengthProps {
  password: string;
  className?: string;
  /** Hide while the field is still empty (useful when user hasn't focused it yet). */
  hideWhenEmpty?: boolean;
  id?: string;
}

export function PasswordStrength({
  password,
  className,
  hideWhenEmpty = false,
  id,
}: PasswordStrengthProps) {
  const { rules, passedCount, valid } = evaluatePassword(password);
  const isEmpty = password.length === 0;

  if (hideWhenEmpty && isEmpty) return null;

  const strengthLabel = isEmpty
    ? "Escribe tu contraseña"
    : valid
      ? "Segura"
      : passedCount === 2
        ? "Casi segura"
        : passedCount === 1
          ? "Débil"
          : "Muy débil";

  const strengthToneText = isEmpty
    ? "text-muted"
    : valid
      ? "text-success"
      : passedCount >= 2
        ? "text-amber-600"
        : "text-destructive";

  const strengthToneBar = isEmpty
    ? "bg-surface-muted"
    : valid
      ? "bg-success"
      : passedCount >= 2
        ? "bg-amber-500"
        : "bg-destructive";

  return (
    <div
      id={id}
      className={cn("space-y-2", className)}
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <div
          className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={PASSWORD_RULES.length}
          aria-valuenow={passedCount}
          aria-label="Seguridad de la contraseña"
        >
          <div
            className={cn("h-full rounded-full transition-all duration-200", strengthToneBar)}
            style={{ width: `${(passedCount / PASSWORD_RULES.length) * 100}%` }}
          />
        </div>
        <span className={cn("text-xs font-medium", strengthToneText)}>
          {strengthLabel}
        </span>
      </div>

      <ul className="space-y-1 text-xs">
        {rules.map(({ rule, passed }) => (
          <li key={rule.id} className="flex items-center gap-1.5">
            {isEmpty ? (
              <Circle className="h-3 w-3 text-muted" aria-hidden="true" />
            ) : passed ? (
              <Check className="h-3 w-3 text-success" aria-hidden="true" />
            ) : (
              <X className="h-3 w-3 text-destructive" aria-hidden="true" />
            )}
            <span
              className={cn(
                isEmpty
                  ? "text-muted"
                  : passed
                    ? "text-foreground/70"
                    : "text-destructive"
              )}
            >
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
