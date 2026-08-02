import type { Metadata } from "next";
import {
  BadgeCheck,
  Lock,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES, SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How Fixam works",
  description:
    "Browse vetted professionals, check real reviews, and contact them directly on WhatsApp. Free for customers, free for professionals.",
  alternates: { canonical: "/how-it-works" },
};

function Step({
  number,
  icon,
  title,
  children,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
          {icon}
        </div>
        <div className="bg-border mt-2 w-px flex-1" />
      </div>
      <div className="pb-8">
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Step {number}
        </p>
        <h3 className="mt-1 text-lg font-semibold">{title}</h3>
        <div className="text-muted-foreground mt-1.5 text-sm">{children}</div>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          How {SITE.name} works
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-balance">
          Finding someone trustworthy shouldn&apos;t depend on knowing the
          right person. Here&apos;s how we fix that.
        </p>
      </header>

      {/* Customers */}
      <section className="mt-12">
        <h2 className="mb-6 text-xl font-bold tracking-tight">
          If you need something done
        </h2>

        <Step number={1} icon={<Search className="size-5" />} title="Browse — no form, no waiting">
          Open the directory and look. Filter by trade and area, sort by
          rating. You don&apos;t fill in a form and wait for someone to call
          you back; you look through people the way you&apos;d look through
          products in a shop.
        </Step>

        <Step number={2} icon={<Star className="size-5" />} title="Check who you're dealing with">
          Every profile shows photos of finished work, years of experience,
          the areas they cover, and reviews from previous customers. Some
          carry a <strong>verified badge</strong> — that means our team
          checked their details personally.
        </Step>

        <Step number={3} icon={<Lock className="size-5" />} title="Create a free account to see their number">
          This is the only thing we ask for. It takes a minute, it&apos;s
          free, and it&apos;s what keeps professionals from being buried in spam
          calls — so the ones you contact actually pick up.
        </Step>

        <Step number={4} icon={<MessageCircle className="size-5" />} title="Contact them directly">
          You get their phone number and a WhatsApp link. You talk to them
          yourself, agree the price yourself, and pay them yourself.{" "}
          <strong>Fixam never handles your money</strong> and never takes a
          cut of what you pay.
        </Step>

        <div className="flex gap-4">
          <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
            <BadgeCheck className="size-5" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Step 5
            </p>
            <h3 className="mt-1 text-lg font-semibold">
              Leave a review afterwards
            </h3>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Tell the next person what happened. Only customers who actually
              took a professional&apos;s number can review them, so what you read
              here comes from real jobs — not from strangers or competitors.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Button asChild size="lg">
            <Link href={ROUTES.directory}>Find a professional</Link>
          </Button>
        </div>
      </section>

      {/* Professionals */}
      <section className="mt-16 border-t pt-12">
        <h2 className="mb-2 text-xl font-bold tracking-tight">
          If you&apos;re a professional
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          You do the work. We help people find you.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: <Wallet className="size-5" />,
              title: "Completely free",
              body: "No joining fee, no monthly charge, no commission, and nothing when a customer contacts you. That is the whole deal right now.",
            },
            {
              icon: <ShieldCheck className="size-5" />,
              title: "Only serious enquiries",
              body: "Customers must create an account before they can see your number. You hear from people who chose you, not from random callers.",
            },
            {
              icon: <Star className="size-5" />,
              title: "Your reputation follows you",
              body: "Good reviews move you up the list. Work you've done stays on your profile where the next customer can see it.",
            },
            {
              icon: <MessageCircle className="size-5" />,
              title: "They reach you on WhatsApp",
              body: "No app to install, no new inbox to check. Customers message you where you already are.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="pt-6">
                <div className="text-primary">{item.icon}</div>
                <h3 className="mt-2 font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-4 border-primary/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold">You can list more than one trade</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Most professionals do more than one thing. If you do plumbing and
              carpentry, list both — you&apos;ll show up in searches for each
              one. You can add up to eight trades, and the first one you pick
              becomes your main trade.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Button asChild size="lg">
            <Link href={ROUTES.listYourServices}>List your services free</Link>
          </Button>
        </div>
      </section>

      {/* Honest bit */}
      <section className="mt-16 border-t pt-12">
        <h2 className="text-xl font-bold tracking-tight">
          What Fixam does not do
        </h2>
        <ul className="text-muted-foreground mt-4 grid gap-3 text-sm">
          <li>
            <strong className="text-foreground">We don&apos;t hold your money.</strong>{" "}
            You pay the professional directly, on your own terms. We&apos;re not in
            the middle of that.
          </li>
          <li>
            <strong className="text-foreground">We don&apos;t set prices.</strong>{" "}
            Agree what the job costs before work starts — that one habit
            prevents most disputes.
          </li>
          <li>
            <strong className="text-foreground">We don&apos;t guarantee the work.</strong>{" "}
            We check that professionals are real and reachable, and we show you
            what previous customers said. The judgement is still yours.
          </li>
        </ul>
      </section>
    </main>
  );
}
