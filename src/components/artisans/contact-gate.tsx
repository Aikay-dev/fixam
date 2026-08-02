"use client";

import {
  Loader2,
  Lock,
  MessageCircle,
  Phone,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";

/**
 * ⭐ The contact gate — the one controlled moment on Fixam.
 *
 * The phone number is NOT in this component's props and is NOT in the page
 * payload. It only ever arrives as the response body of an authenticated POST
 * to /api/artisans/[slug]/reveal, which is also what writes the Lead record.
 *
 * Everything else about a professional is deliberately wide open. This is the
 * only thing behind a wall, and the wall is the business model.
 */

type Revealed = {
  phone: string;
  displayPhone: string;
  whatsappLink: string | null;
  telLink: string;
  alreadyRevealed: boolean;
};

export function ContactGate({
  slug,
  displayName,
  hasWhatsApp,
  isSignedIn,
  isVerified,
}: {
  slug: string;
  displayName: string;
  hasWhatsApp: boolean;
  isSignedIn: boolean;
  isVerified: boolean;
}) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [error, setError] = useState<string | null>(null);

  const firstName = displayName.split(" ")[0];

  async function reveal() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/artisans/${slug}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "profile" }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body.error ?? "Couldn't show the number. Try again.");
        return;
      }

      setRevealed(body);

      if (!body.alreadyRevealed) {
        toast.success(`${firstName} has been told you're interested.`);
      }
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // --- Revealed --------------------------------------------------------
  if (revealed) {
    return (
      <Card className="border-emerald-500/40">
        <CardContent className="grid gap-3 pt-6">
          <p className="text-muted-foreground text-sm">
            {firstName}&apos;s number
          </p>

          <p className="text-2xl font-bold tracking-tight tabular-nums">
            {revealed.displayPhone}
          </p>

          <div className="grid gap-2">
            {revealed.whatsappLink ? (
              <Button asChild className="w-full bg-[#25D366] hover:bg-[#20BD5A]">
                <a
                  href={revealed.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" />
                  Message on WhatsApp
                </a>
              </Button>
            ) : null}

            <Button asChild variant="outline" className="w-full">
              <a href={revealed.telLink}>
                <Phone className="size-4" />
                Call {firstName}
              </a>
            </Button>
          </div>

          <p className="text-muted-foreground text-xs">
            {revealed.alreadyRevealed
              ? "You already had this number — we haven't notified them again."
              : `${firstName} has been notified that you're interested.`}
          </p>

          <div className="text-muted-foreground border-t pt-3 text-xs">
            Agree the price before work starts, and pay only when
            you&apos;re happy. Fixam never handles your money.
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Signed out ------------------------------------------------------
  if (!isSignedIn) {
    return (
      <Card>
        <CardContent className="grid gap-4 pt-6">
          <div className="flex items-center gap-2">
            <Lock className="text-muted-foreground size-4" />
            <p className="font-semibold">Contact {firstName}</p>
          </div>

          <p className="text-muted-foreground text-sm">
            Create a free account to see {firstName}&apos;s phone number and
            message them on WhatsApp.
          </p>

          <Button asChild className="w-full" size="lg">
            <Link
              href={`${ROUTES.signup}?next=${encodeURIComponent(pathname)}`}
            >
              Sign up free to see number
            </Link>
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            Already have an account?{" "}
            <Link
              href={`${ROUTES.login}?next=${encodeURIComponent(pathname)}`}
              className="text-foreground underline"
            >
              Sign in
            </Link>
          </p>

          <ul className="text-muted-foreground grid gap-1.5 border-t pt-3 text-xs">
            <li className="flex items-start gap-1.5">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
              Always free for customers — no fees, ever
            </li>
            <li className="flex items-start gap-1.5">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
              Signing up is what keeps professionals safe from spam callers
            </li>
          </ul>
        </CardContent>
      </Card>
    );
  }

  // --- Signed in but unverified ---------------------------------------
  if (!isVerified) {
    return (
      <Card className="border-amber-500/40">
        <CardContent className="grid gap-3 pt-6">
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-amber-600" />
            <p className="font-semibold">Verify your email first</p>
          </div>
          <p className="text-muted-foreground text-sm">
            {`Confirm your email address and you'll be able to see ${firstName}'s number right away.`}
          </p>
          <Button asChild className="w-full">
            <Link
              href={`${ROUTES.verifyEmail}?next=${encodeURIComponent(pathname)}`}
            >
              Verify my email
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // --- Ready to reveal -------------------------------------------------
  return (
    <Card>
      <CardContent className="grid gap-3 pt-6">
        <p className="font-semibold">Contact {firstName}</p>

        {error ? (
          <p
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
          >
            {error}
          </p>
        ) : null}

        <Button
          onClick={reveal}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Getting number…
            </>
          ) : (
            <>
              {hasWhatsApp ? (
                <MessageCircle className="size-4" />
              ) : (
                <Phone className="size-4" />
              )}
              Show phone number
            </>
          )}
        </Button>

        {/* Built as one string rather than interpolated mid-sentence — JSX
            whitespace around an expression is easy to lose to a reformat, and
            it renders as "Emekawill" when it goes. */}
        <p className="text-muted-foreground text-center text-xs">
          {`Free. ${firstName} will be told you're interested.`}
        </p>
      </CardContent>
    </Card>
  );
}
