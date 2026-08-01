"use client";

import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Minimal accessible field wrapper.
 *
 * The shadcn `form` primitive isn't in the radix/nova registry, and pulling in
 * a second registry for one component isn't worth it — react-hook-form already
 * gives us everything except the label/error markup, which is this file.
 */

export type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

export function Field({
  id,
  label,
  error,
  hint,
  required,
  className,
  children,
}: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-destructive ml-0.5" aria-hidden>
            *
          </span>
        ) : null}
      </Label>

      {children}

      {hint && !error ? (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Props to spread onto the input so screen readers announce the error. */
export function fieldA11y(id: string, error?: string, hint?: ReactNode) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error
      ? `${id}-error`
      : hint
        ? `${id}-hint`
        : undefined,
  } as const;
}
