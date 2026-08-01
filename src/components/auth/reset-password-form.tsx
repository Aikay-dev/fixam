"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Field, fieldA11y } from "@/components/forms/field";
import { OtpInput } from "@/components/forms/otp-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OTP_LENGTH, ROUTES } from "@/lib/constants";
import { resetPasswordSchema } from "@/lib/validation/auth";

export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    code?: string;
    password?: string;
    form?: string;
  }>({});

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsed = resetPasswordSchema.safeParse({ email, code, password });

    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "code" || key === "password") next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrors({ form: body.error ?? "We couldn't reset your password." });
        setCode("");
        return;
      }

      toast.success("Password updated. Sign in with your new password.");
      router.push(ROUTES.login);
    } catch {
      setErrors({ form: "Network problem. Check your connection." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter the code we sent to{" "}
          <span className="text-foreground font-medium break-all">{email}</span>
        </p>
      </div>

      {errors.form ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {errors.form}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-5" noValidate>
        <div className="grid gap-2">
          <span className="text-sm font-medium">Reset code</span>
          <OtpInput
            value={code}
            onChange={setCode}
            disabled={submitting}
            error={Boolean(errors.code)}
          />
          {errors.code ? (
            <p role="alert" className="text-destructive text-xs">
              {errors.code}
            </p>
          ) : null}
        </div>

        <Field
          id="password"
          label="New password"
          error={errors.password}
          hint="At least 8 characters."
          required
        >
          <div className="relative">
            <Input
              {...fieldA11y("password", errors.password, true)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </Field>

        <Button
          type="submit"
          className="w-full"
          disabled={submitting || code.length !== OTP_LENGTH}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Updating…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        <Link href="/forgot-password" className="underline">
          Request a new code
        </Link>
        <span className="mx-2">·</span>
        <Link href={ROUTES.login} className="underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
