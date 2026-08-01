"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Field, fieldA11y } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants";
import { forgotPasswordSchema } from "@/lib/validation/auth";

type Values = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm({ initialEmail }: { initialEmail?: string }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: initialEmail ?? "" },
  });

  async function onSubmit(values: Values) {
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      // The endpoint answers identically whether or not the account exists, so
      // the UI must too — otherwise the redirect itself leaks who's registered.
      toast.success("If that account exists, we've sent a reset code.");
      router.push(
        `/reset-password?email=${encodeURIComponent(values.email)}`,
      );
    } catch {
      toast.error("Network problem. Check your connection and try again.");
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email and we&apos;ll send you a code to set a new password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <Field
          id="email"
          label="Email address"
          error={errors.email?.message}
          required
        >
          <Input
            {...fieldA11y("email", errors.email?.message)}
            {...register("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Send reset code"
          )}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Remembered it?{" "}
        <Link
          href={ROUTES.login}
          className="text-foreground font-medium underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
