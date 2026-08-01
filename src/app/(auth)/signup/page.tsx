import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { getSessionUser } from "@/lib/auth/session";
import { features } from "@/lib/env";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Sign up free to see artisan phone numbers and connect on WhatsApp.",
  robots: { index: false, follow: true },
};

export default async function SignupPage(props: PageProps<"/signup">) {
  const { role, next } = await props.searchParams;

  const user = await getSessionUser();
  if (user) redirect(typeof next === "string" ? next : "/");

  return (
    <SignupForm
      role={role === "artisan" ? "artisan" : "customer"}
      googleEnabled={features.google}
      next={typeof next === "string" ? next : undefined}
    />
  );
}
