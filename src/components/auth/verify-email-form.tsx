"use client";

import { Loader2, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { OtpInput } from "@/components/forms/otp-input";
import { Button } from "@/components/ui/button";
import { OTP_LENGTH, ROUTES } from "@/lib/constants";

const RESEND_COOLDOWN_SECONDS = 45;

export function VerifyEmailForm({
  email,
  next,
}: {
  email: string;
  next?: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  // Cooldown discourages hammering resend, which would burn the OTP rate
  // limit and lock the user out of their own signup.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function verify(value: string) {
    if (value.length !== OTP_LENGTH || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: value }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body.error ?? "That code didn't work.");
        setCode("");
        return;
      }

      toast.success("Email verified.");

      // Professionals go straight to profile setup — the profile is the whole
      // reason they signed up, and an empty one earns them nothing.
      const destination =
        next ?? (body.isArtisan ? ROUTES.proProfile : ROUTES.login);

      router.push(
        destination === ROUTES.login
          ? `${ROUTES.login}?next=${encodeURIComponent("/")}`
          : `${ROUTES.login}?next=${encodeURIComponent(destination)}`,
      );
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "verify_email" }),
      });

      if (response.ok) {
        toast.success("New code sent. Check your inbox.");
      } else {
        const body = await response.json().catch(() => ({}));
        toast.error(body.error ?? "Couldn't send a new code.");
      }
    } catch {
      toast.error("Network problem. Try again.");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2 text-center">
        <div className="bg-accent text-accent-foreground mx-auto flex size-12 items-center justify-center rounded-full">
          <MailCheck className="size-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="text-muted-foreground text-sm text-balance">
          We sent a {OTP_LENGTH}-digit code to{" "}
          <span className="text-foreground font-medium break-all">{email}</span>
        </p>
      </div>

      <div className="grid gap-3">
        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={verify}
          disabled={submitting}
          error={Boolean(error)}
        />

        {error ? (
          <p role="alert" className="text-destructive text-center text-sm">
            {error}
          </p>
        ) : null}
      </div>

      <Button
        onClick={() => verify(code)}
        disabled={code.length !== OTP_LENGTH || submitting}
        className="w-full"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Verifying…
          </>
        ) : (
          "Verify email"
        )}
      </Button>

      <div className="text-muted-foreground text-center text-sm">
        {cooldown > 0 ? (
          <span>Didn&apos;t get it? Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={resend}
            className="text-foreground font-medium underline"
          >
            Send a new code
          </button>
        )}
      </div>

      <p className="text-muted-foreground text-center text-xs text-balance">
        Check your spam folder if it hasn&apos;t arrived within a minute.
      </p>
    </div>
  );
}
