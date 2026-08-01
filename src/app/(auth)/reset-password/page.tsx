import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage(
  props: PageProps<"/reset-password">,
) {
  const { email } = await props.searchParams;

  // Without an address there is nothing to look a code up against.
  if (typeof email !== "string" || !email) redirect("/forgot-password");

  return <ResetPasswordForm email={email} />;
}
