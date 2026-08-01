import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { getSessionUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage(
  props: PageProps<"/verify-email">,
) {
  const { email, next } = await props.searchParams;

  // Fall back to the signed-in user's address so an already-authenticated but
  // unverified user landing here without a query param still sees something.
  const user = await getSessionUser();
  const address = typeof email === "string" ? email : (user?.email ?? "");

  if (!address) redirect(ROUTES.signup);
  if (user?.isVerified) redirect(typeof next === "string" ? next : "/");

  return (
    <VerifyEmailForm
      email={address}
      next={typeof next === "string" ? next : undefined}
    />
  );
}
