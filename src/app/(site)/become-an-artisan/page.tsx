import type { Metadata } from "next";
import { Check } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BecomeArtisanButton } from "@/components/auth/become-artisan-button";
import { Card, CardContent } from "@/components/ui/card";
import { userHasRole } from "@/lib/auth/roles";
import { getSessionUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "List your services",
  robots: { index: false, follow: true },
};

/**
 * Single entry point for every "list your services free" call to action.
 *
 * Previously they all pointed straight at /signup?role=artisan, which is a
 * dead end for anyone already signed in: the signup page sees a session and
 * bounces them back to where they came from, so the button appears to do
 * nothing.
 *
 * Worse, there was no path at all for an existing customer to become an
 * artisan — they would have had to create a second account with a second
 * email address, which is absurd for someone who signed up to hire a plumber
 * and happens to be an electrician.
 *
 * This routes each of the four states to the right place.
 */
export default async function BecomeAnArtisanPage() {
  const user = await getSessionUser();

  // 1. Signed out — normal artisan signup, landing in the profile editor.
  if (!user) {
    redirect(
      `${ROUTES.signup}?role=artisan&next=${encodeURIComponent(ROUTES.proProfile)}`,
    );
  }

  // 2. Already an artisan — straight to their profile. Checks the database
  //    when the token says otherwise, so a just-granted role isn't ignored
  //    and the user re-offered an upgrade they already took.
  if (await userHasRole(user, "artisan")) {
    redirect(ROUTES.proProfile);
  }

  // 3. Signed in but unverified — verify first; the reveal gate and lead
  //    alerts both depend on a working address.
  if (!user.isVerified) {
    redirect(
      `${ROUTES.verifyEmail}?email=${encodeURIComponent(user.email ?? "")}&next=${encodeURIComponent("/become-an-artisan")}`,
    );
  }

  // 4. Signed-in customer — offer the upgrade.
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">
        List your services on Fixam
      </h1>
      <p className="text-muted-foreground mt-2">
        You&apos;re signed in as{" "}
        <span className="text-foreground font-medium">{user.email}</span>. Add
        artisan access to this account — you don&apos;t need a second one.
      </p>

      <Card className="mt-8">
        <CardContent className="grid gap-4 pt-6">
          <p className="font-semibold">What happens next</p>

          <ul className="grid gap-2.5 text-sm">
            {[
              "You'll go straight to your profile editor",
              "Add your trades — list every one you do, up to eight",
              "Add your area, phone number and photos of finished work",
              "Submit for review; we check every artisan before they go live",
            ].map((step) => (
              <li key={step} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                {step}
              </li>
            ))}
          </ul>

          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-sm">
              <strong>It stays free.</strong> No joining fee, no commission,
              and no charge when a customer contacts you. Your phone number
              stays private until a customer signs up and chooses you.
            </p>
          </div>

          <BecomeArtisanButton />

          <p className="text-muted-foreground text-xs">
            You keep your customer account exactly as it is — you can still
            hire other artisans yourself.
          </p>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-6 text-sm">
        Just browsing?{" "}
        <Link href={ROUTES.directory} className="text-foreground underline">
          Find an artisan instead
        </Link>
      </p>
    </main>
  );
}
