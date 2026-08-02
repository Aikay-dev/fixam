"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { GoogleButton } from "@/components/auth/google-button";
import { Field, fieldA11y } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants";
import {
  registerSchema,
  type RegisterInput,
  type RegisterOutput,
} from "@/lib/validation/auth";

export function SignupForm({
  role,
  googleEnabled,
  next,
}: {
  role: "customer" | "artisan";
  googleEnabled: boolean;
  next?: string;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterInput, unknown, RegisterOutput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role, name: "", email: "", password: "", website: "" },
  });

  async function onSubmit(values: RegisterOutput) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Field-level errors come back keyed by field name.
        if (body.details && typeof body.details === "object") {
          for (const [field, message] of Object.entries(
            body.details as Record<string, string>,
          )) {
            setError(field as keyof RegisterInput, { message });
          }
        }
        toast.error(body.error ?? "We couldn't create your account.");
        return;
      }

      const params = new URLSearchParams({ email: values.email });
      if (next) params.set("next", next);
      router.push(`${ROUTES.verifyEmail}?${params.toString()}`);
    } catch {
      toast.error("Network problem. Check your connection and try again.");
    }
  }

  const isArtisan = role === "artisan";

  return (
    <div className="grid gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {isArtisan ? "Join Fixam as an artisan" : "Create your account"}
        </h1>
        <p className="text-muted-foreground text-sm text-balance">
          {isArtisan
            ? "Free to list. Free to get customers. No commission, ever."
            : "You need an account to see an artisan's phone number. It's free."}
        </p>
      </div>

      {googleEnabled ? (
        <>
          <GoogleButton next={next ?? (isArtisan ? ROUTES.proProfile : "/")} />
          <div className="relative text-center">
            <span className="bg-background text-muted-foreground relative z-10 px-3 text-xs uppercase">
              or
            </span>
            <span className="bg-border absolute inset-x-0 top-1/2 h-px" />
          </div>
        </>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <input type="hidden" {...register("role")} value={role} readOnly />

        {/* Honeypot — hidden from people, irresistible to naive bots. */}
        <div className="hidden" aria-hidden>
          <label htmlFor="website">Website</label>
          <input
            id="website"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </div>

        <Field id="name" label="Full name" error={errors.name?.message} required>
          <Input
            {...fieldA11y("name", errors.name?.message)}
            {...register("name")}
            autoComplete="name"
            placeholder="Emeka Okafor"
          />
        </Field>

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

        <Field
          id="password"
          label="Password"
          error={errors.password?.message}
          hint="At least 8 characters."
          required
        >
          <div className="relative">
            <Input
              {...fieldA11y("password", errors.password?.message, true)}
              {...register("password")}
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="text-foreground font-medium underline">
          Sign in
        </Link>
      </p>

      <p className="text-muted-foreground text-center text-xs">
        {isArtisan ? (
          <>
            Looking to hire instead?{" "}
            <Link href={ROUTES.signup} className="underline">
              Sign up as a customer
            </Link>
          </>
        ) : (
          <>
            Are you an artisan?{" "}
            {/* Straight to artisan signup — the reader is demonstrably signed
                out, so routing via /become-an-artisan would only bounce them
                back here. */}
            <Link href="/signup?role=artisan" className="underline">
              List your services free
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
