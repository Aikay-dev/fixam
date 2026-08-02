import type { Metadata } from "next";
import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/category";

export const metadata: Metadata = {
  title: "List your services free",
  description:
    "Join Fixam as an artisan or professional. No joining fee, no commission, no charge when a customer contacts you. List every service you offer.",
  alternates: { canonical: "/join" },
};

export default async function JoinPage() {
  await connectDB();

  const trades = await Category.find({ isActive: true, parentId: { $ne: null } })
    .select("name")
    .sort({ name: 1 })
    .limit(24)
    .lean()
    .exec();

  return (
    <main>
      <section className="from-primary to-navy-deep bg-gradient-to-br text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Customers are looking for you right now
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-white/80">
            List your services on Fixam and let people near you find you.
            It&apos;s free — and it stays free while we grow.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gold hover:bg-gold/90 text-navy-deep mt-8"
          >
            <Link href={ROUTES.listYourServices}>Create my free profile</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold tracking-tight">What it costs</h2>

        <Card className="mt-4 border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">₦0</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Everything below is included, and there is no paid tier to
              upgrade to.
            </p>
            <ul className="mt-4 grid gap-2 text-sm">
              {[
                "Your own profile page with photos of your work",
                "Listed in searches for every service you offer",
                "Customers contact you directly on WhatsApp",
                "Ratings and reviews from real customers",
                "Email alert the moment someone takes your number",
                "No joining fee, no monthly fee, no commission",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <h2 className="mt-12 text-xl font-bold tracking-tight">
          Do more than one thing? List them all.
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Most people offer more than one thing. If you do plumbing and tiling,
          or web design and IT support, add both — you&apos;ll appear in
          searches for each. Up to eight services per profile.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {trades.map((t) => (
            <span
              key={String(t._id)}
              className="bg-muted rounded-full px-3 py-1 text-xs"
            >
              {t.name}
            </span>
          ))}
          <span className="text-muted-foreground px-3 py-1 text-xs">
            and many more
          </span>
        </div>

        <h2 className="mt-12 text-xl font-bold tracking-tight">
          How to get started
        </h2>
        <ol className="text-muted-foreground mt-4 grid gap-3 text-sm">
          <li>
            <strong className="text-foreground">1. Create your account.</strong>{" "}
            Name, email, password. Takes a minute.
          </li>
          <li>
            <strong className="text-foreground">2. Fill in your profile.</strong>{" "}
            Your services, the areas you cover, your phone number, and photos
            of work you&apos;ve finished. Each section saves on its own, so a bad
            connection won&apos;t lose your work.
          </li>
          <li>
            <strong className="text-foreground">3. Submit for review.</strong>{" "}
            We check every professional before they go live. That check is why
            customers trust the people they find here.
          </li>
          <li>
            <strong className="text-foreground">4. Start getting customers.</strong>{" "}
            We email you the moment someone takes your number.
          </li>
        </ol>

        <div className="bg-muted/50 mt-8 rounded-lg p-4">
          <p className="text-sm">
            <strong>Your phone number stays private.</strong> It is never shown
            on your public profile. A customer has to create a free account and
            choose you before they can see it — which is exactly why the people
            who call you are serious.
          </p>
        </div>

        <div className="mt-8">
          <Button asChild size="lg">
            <Link href={ROUTES.listYourServices}>Create my free profile</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
