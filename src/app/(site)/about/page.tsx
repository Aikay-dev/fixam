import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROUTES, SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Fixam",
  description:
    "Why we built Nigeria's artisan marketplace, and how it stays honest.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">About {SITE.name}</h1>

      <div className="text-muted-foreground mt-6 grid gap-5 text-base leading-relaxed">
        <p>
          Almost everyone in Nigeria has a story about an artisan. The plumber
          who said he was on his way and turned up three days later. The
          painter whose finish looked nothing like what was agreed. The money
          paid upfront to someone who then stopped picking up.
        </p>

        <p>
          The frustrating part is that good artisans are everywhere. The
          problem was never a shortage of skill — it&apos;s that there was no
          way to tell, before someone is already inside your house, whether
          they were any good.
        </p>

        <p className="text-foreground font-medium">
          That&apos;s the only problem Fixam exists to solve: making trust
          visible before you commit.
        </p>

        <p>
          So we built a directory you can actually look through. Photos of work
          people have genuinely finished. Reviews that can only be written by
          customers who really got in touch. A team that checks every artisan
          before they appear. And a phone number you can only reach after
          creating a free account — which is what keeps good artisans from
          drowning in junk calls, so the ones you ring pick up.
        </p>

        <p>
          For artisans, the deal is simple. Skilled people lose income during
          quiet periods purely because nobody nearby knows they exist. Fixam is
          free for them — no joining fee, no commission, nothing when a
          customer makes contact.
        </p>

        <h2 className="text-foreground mt-4 text-xl font-bold tracking-tight">
          What we deliberately don&apos;t do
        </h2>

        <p>
          We don&apos;t touch your money. You pay the artisan directly, on
          terms you agree between yourselves. Plenty of platforms sit in the
          middle of that payment and take a percentage; we think that adds cost
          without adding trust, and Nigerians are rightly wary of handing money
          to a middleman.
        </p>

        <p>
          We also don&apos;t pretend to guarantee anyone&apos;s work. We check
          that artisans are real, reachable and reviewed. The judgement about
          who to hire stays with you — we just make sure you&apos;re making it
          with real information instead of guesswork.
        </p>

        <p className="text-foreground font-medium italic">
          {SITE.tagline}
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={ROUTES.directory}>Find an artisan</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={ROUTES.joinAsArtisan}>List your services free</Link>
        </Button>
      </div>
    </main>
  );
}
