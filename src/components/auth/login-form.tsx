"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
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
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export function LoginForm({
  googleEnabled,
  next,
  initialError,
}: {
  googleEnabled: boolean;
  next?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    initialError ?? null,
  );

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      // The provider throws ACCOUNT_SUSPENDED for a disabled account; every
      // other failure is deliberately indistinguishable so this form can't be
      // used to work out which emails are registered.
      if (result.error.includes("ACCOUNT_SUSPENDED")) {
        setFormError(
          "This account has been suspended. Contact support@fixam.ng if you think that's a mistake.",
        );
      } else {
        setFormError("That email and password don't match.");
      }
      return;
    }

    toast.success("Welcome back.");
    router.push(next ?? "/");
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your Fixam account.
        </p>
      </div>

      {googleEnabled ? (
        <>
          <GoogleButton next={next ?? "/"} label="Sign in with Google" />
          <div className="relative text-center">
            <span className="bg-background text-muted-foreground relative z-10 px-3 text-xs uppercase">
              or
            </span>
            <span className="bg-border absolute inset-x-0 top-1/2 h-px" />
          </div>
        </>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {formError}
        </div>
      ) : null}

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

        <Field
          id="password"
          label="Password"
          error={errors.password?.message}
          required
        >
          <div className="relative">
            <Input
              {...fieldA11y("password", errors.password?.message)}
              {...register("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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

        <div className="flex justify-end">
          <Link
            href={{
              pathname: "/forgot-password",
              query: getValues("email") ? { email: getValues("email") } : {},
            }}
            className="text-muted-foreground hover:text-foreground text-xs underline"
          >
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        New to Fixam?{" "}
        <Link
          href={ROUTES.signup}
          className="text-foreground font-medium underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
