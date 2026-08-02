import type { Metadata } from "next";

import { LEAD_DEDUPE_WINDOW_DAYS, SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${SITE.name} handles your personal data.`,
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Privacy policy</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Last updated: 1 August 2026
      </p>

      <div className="text-muted-foreground mt-8 grid gap-6 leading-relaxed">
        <section>
          <h2 className="text-foreground text-lg font-semibold">
            What we collect
          </h2>
          <p className="mt-2">
            <strong className="text-foreground">Everyone:</strong> your name,
            email address and an encrypted password (or, if you sign in with
            Google, your Google account&apos;s name, email and profile photo).
          </p>
          <p className="mt-2">
            <strong className="text-foreground">Professionals:</strong> in addition,
            your phone and WhatsApp number, trades, service areas, photos of
            your work, and any credentials you upload.
          </p>
          <p className="mt-2">
            <strong className="text-foreground">When you unlock a number:</strong>{" "}
            we record which professional, when, and which trade you were browsing.
            We also store a one-way hashed fingerprint of your IP address and
            browser — hashed, so we can spot abuse patterns without keeping a
            log of where you personally browse from.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">
            What we do with it
          </h2>
          <ul className="mt-2 grid list-disc gap-1.5 pl-5">
            <li>Showing professional profiles to people looking to hire</li>
            <li>Letting you sign in and verifying your email address</li>
            <li>
              Telling a professional that someone is interested — they see your
              first name, the trade, and the general area, not your email
              address
            </li>
            <li>Preventing scraping, spam and fake accounts</li>
            <li>Understanding which trades and areas are in demand</li>
          </ul>
          <p className="mt-2">
            We do not sell your data, and we do not share professional phone numbers
            with anyone other than the signed-in customer who unlocked them.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">
            What&apos;s public
          </h2>
          <p className="mt-2">
            An approved professional profile is public and appears in search
            engines: display name, trades, bio, area, photos of work, ratings
            and reviews.{" "}
            <strong className="text-foreground">
              Phone numbers are never public
            </strong>{" "}
            — they are released only to a signed-in, email-verified customer
            who chooses to contact that professional.
          </p>
          <p className="mt-2">
            Reviews are public and show the reviewer&apos;s first name.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">
            Who else is involved
          </h2>
          <p className="mt-2">
            We use a small number of providers to run the service: MongoDB
            Atlas (database), Vercel (hosting), Resend (email delivery),
            Cloudinary (image hosting) and Google (optional sign-in). They
            process data on our instructions only.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">
            How long we keep it
          </h2>
          <p className="mt-2">
            Account and profile data is kept while your account is open.
            Verification codes expire within minutes and are deleted
            automatically. Contact records are kept as a history of enquiries —
            repeat contact with the same professional inside{" "}
            {LEAD_DEDUPE_WINDOW_DAYS} days counts as one record, not many.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">Your rights</h2>
          <p className="mt-2">
            Under the Nigeria Data Protection Act you can ask for a copy of
            your data, ask us to correct it, or ask us to delete your account.
            Email {SITE.supportEmail} and we&apos;ll action it.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">Cookies</h2>
          <p className="mt-2">
            We use one essential cookie to keep you signed in. We do not run
            advertising or third-party tracking cookies, which is why you
            won&apos;t see a consent banner.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">Contact</h2>
          <p className="mt-2">
            Questions about your data: {SITE.supportEmail}
          </p>
        </section>
      </div>
    </main>
  );
}
