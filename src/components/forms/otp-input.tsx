"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

import { OTP_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Six separate boxes rather than one text field.
 *
 * Handles the three things people actually do with codes on a phone:
 * paste the whole thing, type it one digit at a time, and backspace when
 * they fat-finger it. `inputMode="numeric"` brings up the number pad, and
 * `autoComplete="one-time-code"` lets Android/iOS offer the code from the
 * notification without opening the email.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  error,
  id = "otp",
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  id?: string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(OTP_LENGTH, " ").slice(0, OTP_LENGTH).split("");

  function commit(next: string) {
    const clean = next.replace(/\D/g, "").slice(0, OTP_LENGTH);
    onChange(clean);
    if (clean.length === OTP_LENGTH) onComplete?.(clean);
    return clean;
  }

  function handleInput(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;

    const chars = value.padEnd(OTP_LENGTH, " ").split("");
    chars[index] = digit;
    const next = commit(chars.join("").trimEnd());

    if (index < OTP_LENGTH - 1 && next.length > index) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const chars = value.padEnd(OTP_LENGTH, " ").split("");

      if (chars[index] && chars[index] !== " ") {
        // Clear this box and stay put.
        chars[index] = " ";
      } else if (index > 0) {
        // Already empty — step back and clear that one instead.
        chars[index - 1] = " ";
        refs.current[index - 1]?.focus();
      }

      commit(chars.join("").replace(/\s+$/, ""));
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    const next = commit(pasted);
    const focusIndex = Math.min(next.length, OTP_LENGTH - 1);
    refs.current[focusIndex]?.focus();
  }

  return (
    <div className="flex gap-2" role="group" aria-label="Verification code">
      {Array.from({ length: OTP_LENGTH }).map((_, index) => {
        const char = digits[index]?.trim() ?? "";
        return (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            id={index === 0 ? id : `${id}-${index}`}
            value={char}
            onChange={(e) => handleInput(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Digit ${index + 1}`}
            aria-invalid={error || undefined}
            className={cn(
              "border-input bg-background h-14 w-full min-w-0 rounded-md border text-center text-xl font-semibold shadow-xs transition",
              "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive/30",
            )}
          />
        );
      })}
    </div>
  );
}
