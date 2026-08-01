import type { Metadata } from "next";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ROUTES, SITE } from "@/lib/constants";
import { clientEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "How Fixam works, what it costs, why you need an account to see a phone number, and how reviews are kept honest.",
  alternates: { canonical: "/faq" },
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is Fixam free?",
    a: "Yes. It is free for customers to browse and contact artisans, and free for artisans to list. There is no joining fee, no monthly charge and no commission on any job.",
  },
  {
    q: "Why do I need an account to see a phone number?",
    a: "Two reasons. It stops artisans' numbers being scraped and sold, and it means the people who contact them are real. Artisans get far fewer wasted calls, so the ones you make are more likely to be answered. Creating an account is free and takes a minute.",
  },
  {
    q: "Does Fixam handle my payment?",
    a: "No. You pay the artisan directly, on whatever terms you agree between you. Fixam never holds your money and never takes a cut. Agree the price before work starts — that single habit prevents most disputes.",
  },
  {
    q: "What does the verified badge mean?",
    a: "It means our team has personally checked that artisan's details. Every artisan is reviewed before going live, but the badge is a further step.",
  },
  {
    q: "Can I trust the reviews?",
    a: "Only a customer who actually unlocked an artisan's number can leave a review, and only once per contact. That means reviews come from people who genuinely got in touch — not from competitors or strangers.",
  },
  {
    q: "I'm an artisan and I do more than one trade. Can I list them all?",
    a: "Yes. You can list up to eight trades on one profile, and you'll appear in searches for each of them. The first trade you pick becomes your main one and appears in your profile link.",
  },
  {
    q: "How long does approval take?",
    a: "Usually a day or two. We check every profile before it goes live. If something needs changing we'll email you exactly what, with a link straight back to your profile.",
  },
  {
    q: "What if an artisan does bad work?",
    a: "Leave an honest review — it's the most useful thing you can do for the next customer. You can also report a profile, and our team will look into it. Fixam checks that artisans are real and reachable, but we don't guarantee the work itself.",
  },
  {
    q: "Which cities does Fixam cover?",
    a: "Artisans can register anywhere in Nigeria. We're focusing on Lagos first, with Abuja and Port Harcourt next, so those areas have the most artisans right now.",
  },
  {
    q: "Will Fixam ever charge artisans?",
    a: "Not while we're growing. If we do introduce charges later, it would be a small fee for artisans to unlock a customer enquiry — never a charge to customers, and never a commission on your work. Artisans would be told well in advance.",
  },
];

export default function FaqPage() {
  // FAQPage structured data — these questions are exactly what people type
  // into Google before they've heard of us.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="text-3xl font-bold tracking-tight">
        Frequently asked questions
      </h1>
      <p className="text-muted-foreground mt-2">
        Everything people usually want to know about {SITE.name}.
      </p>

      <Accordion type="single" collapsible className="mt-8">
        {FAQS.map((faq, i) => (
          <AccordionItem key={faq.q} value={`item-${i}`}>
            <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="bg-muted/50 mt-10 rounded-lg p-5">
        <h2 className="font-semibold">Still stuck?</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Email us at{" "}
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="text-foreground underline"
          >
            {SITE.supportEmail}
          </a>{" "}
          or use the{" "}
          <Link href="/contact" className="text-foreground underline">
            contact page
          </Link>
          .
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={ROUTES.directory}
          className="text-primary text-sm underline"
        >
          Find an artisan
        </Link>
        <Link href="/how-it-works" className="text-primary text-sm underline">
          How Fixam works
        </Link>
      </div>

      {/* Referenced so the canonical URL stays in one place. */}
      <link rel="canonical" href={`${clientEnv.NEXT_PUBLIC_SITE_URL}/faq`} />
    </main>
  );
}
