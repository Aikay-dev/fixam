import type { Metadata } from "next";

import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `The terms that apply when you use ${SITE.name}.`,
  alternates: { canonical: "/legal/terms" },
};

/**
 * Plain-language terms.
 *
 * NOT a substitute for a lawyer — flagged prominently for the owner, since
 * publishing template terms as if they were reviewed is its own risk.
 */
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Terms of use</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Last updated: 1 August 2026
      </p>

      <div className="prose-sm text-muted-foreground mt-8 grid gap-6 leading-relaxed">
        <section>
          <h2 className="text-foreground text-lg font-semibold">
            1. What Fixam is
          </h2>
          <p className="mt-2">
            {SITE.name} is a directory that helps people in Nigeria find
            professionals and tradespeople. We introduce the two sides. We are not a
            party to any agreement you reach with a professional, we do not employ
            them, and we do not carry out the work.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">
            2. We do not handle payment
          </h2>
          <p className="mt-2">
            All payment for a job happens directly between you and the professional.
            Fixam never holds, processes or escrows your money and takes no
            commission. Because of that we cannot refund you for work, and any
            dispute about money or workmanship is between you and the professional.
            We strongly recommend agreeing the price in writing before work
            begins.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">
            3. Your account
          </h2>
          <p className="mt-2">
            You need a free account with a verified email address to see an
            professional&apos;s phone number. Keep your login details to yourself —
            you are responsible for activity on your account. Don&apos;t create
            accounts to harvest professionals&apos; contact details; we rate-limit
            and suspend accounts that do.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">
            4. If you list as a professional
          </h2>
          <p className="mt-2">
            Everything on your profile must be true — your name, trades,
            experience, service areas, and photos of work you personally
            carried out. Don&apos;t use other people&apos;s photos. We review
            profiles before they go live and may reject, unpublish or suspend
            any profile, with reasons given.
          </p>
          <p className="mt-2">
            Listing is free. If we ever introduce charges, existing professionals
            will be told well in advance and it will never be a commission on
            your work.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">5. Reviews</h2>
          <p className="mt-2">
            Only a customer who has unlocked a professional&apos;s contact details
            can review them, once per contact. Reviews must describe your own
            genuine experience. We remove reviews that are fake, defamatory,
            or written to damage a competitor — but we do not remove a review
            simply because it is negative and accurate.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">
            6. What we are responsible for
          </h2>
          <p className="mt-2">
            We check that professionals are real and reachable and we show you what
            previous customers said. We do not guarantee the quality, safety,
            timeliness or legality of any work, and we are not liable for loss
            arising from a job arranged through Fixam. Choosing who to hire
            remains your decision.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">
            7. Ending your use
          </h2>
          <p className="mt-2">
            You may delete your account at any time by emailing{" "}
            {SITE.supportEmail}. We may suspend accounts that break these
            terms, and we will tell you why.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">
            8. Governing law
          </h2>
          <p className="mt-2">
            These terms are governed by the laws of the Federal Republic of
            Nigeria.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">9. Contact</h2>
          <p className="mt-2">
            Questions about these terms: {SITE.supportEmail}
          </p>
        </section>
      </div>
    </main>
  );
}
