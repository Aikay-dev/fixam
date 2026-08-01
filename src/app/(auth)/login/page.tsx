import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth/session";
import { features } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Fixam account.",
  robots: { index: false, follow: true },
};

/** Auth.js redirects here with ?error=... when an OAuth attempt fails. */
const OAUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email is already registered with a password. Sign in with your password instead.",
  AccessDenied:
    "We couldn't sign you in with that account. Try your email and password.",
  Configuration: "Sign-in is temporarily unavailable. Please try again shortly.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const { next, error } = await props.searchParams;

  const user = await getSessionUser();
  if (user) redirect(typeof next === "string" ? next : "/");

  return (
    <LoginForm
      googleEnabled={features.google}
      next={typeof next === "string" ? next : undefined}
      initialError={
        typeof error === "string"
          ? (OAUTH_ERRORS[error] ?? "We couldn't sign you in. Try again.")
          : undefined
      }
    />
  );
}
