import type { Metadata } from "next";
import { MessageCircle, Search, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";

import { ArtisanCard } from "@/components/artisans/artisan-card";
import { HomeSearch } from "@/components/site/home-search";
import { Button } from "@/components/ui/button";
import { liveCategoryCounts } from "@/lib/artisan/counts";
import { searchArtisans } from "@/lib/artisan/search";
import { ROUTES, SITE } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/category";

export const metadata: Metadata = {
  title: "Fixam — Nigeria's Trusted Artisan Marketplace",
  description: SITE.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  await connectDB();

  const [allTrades, counts, featured] = await Promise.all([
    Category.find({ isActive: true, parentId: { $ne: null } })
      .select("name slug icon")
      .lean()
      .exec(),
    // Live counts, never the stored artisanCount — see src/lib/artisan/counts.ts.
    liveCategoryCounts(),
    searchArtisans({ sort: "recommended", limit: 6 }),
  ]);

  // Trades with artisans first, then the rest alphabetically, so the grid
  // leads with what a visitor can actually act on today.
  const popular = allTrades
    .map((c) => ({ ...c, count: counts.get(String(c._id)) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 12);

  return (
    <main>
      {/* Hero */}
      <section className="from-primary to-navy-deep bg-gradient-to-br text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="text-gold text-xs font-semibold tracking-[0.2em] uppercase sm:text-sm">
            {SITE.tagline}
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            Find an artisan you can actually trust
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-balance text-white/80">
            Plumbers, electricians, carpenters, AC technicians and more — near
            you, with real reviews and real photos of their work.
          </p>

          <div className="mt-8">
            <HomeSearch />
          </div>

          <p className="mt-4 text-sm text-white/70">
            Free to browse. Free to contact. Always.
          </p>
        </div>
      </section>

      {/* Popular services */}
      {popular.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-xl font-bold tracking-tight">
            What do you need done?
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {popular.map((category) => (
              <Link
                key={String(category._id)}
                href={ROUTES.category(category.slug)}
                className="hover:border-primary/50 hover:bg-accent/40 rounded-lg border px-4 py-3 text-sm font-medium transition"
              >
                {category.name}
                {category.count > 0 ? (
                  <span className="text-muted-foreground block text-xs font-normal">
                    {category.count} artisan
                    {category.count === 1 ? "" : "s"}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          <Button asChild variant="outline" className="mt-6">
            <Link href={ROUTES.directory}>Browse everything</Link>
          </Button>
        </section>
      ) : null}

      {/* How it works */}
      <section className="bg-muted/40 border-y">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-xl font-bold tracking-tight">How Fixam works</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <Search className="size-5" />,
                title: "Browse and compare",
                body: "No forms, no waiting. Look through artisans near you, sort by rating, and see photos of work they've actually finished.",
              },
              {
                icon: <Star className="size-5" />,
                title: "Check the reviews",
                body: "Only customers who actually contacted an artisan can review them — so what you're reading came from real jobs.",
              },
              {
                icon: <MessageCircle className="size-5" />,
                title: "Contact them directly",
                body: "Sign up free, see their number, and reach them on WhatsApp. You agree the price with them — Fixam never touches your money.",
              },
            ].map((step) => (
              <div key={step.title}>
                <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full">
                  {step.icon}
                </div>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured artisans */}
      {featured.artisans.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight">
              Top-rated artisans
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href={ROUTES.directory}>See all</Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.artisans.map((artisan) => (
              <ArtisanCard key={artisan.id} artisan={artisan} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Artisan CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="bg-primary text-primary-foreground grid gap-4 rounded-xl p-8 sm:p-12">
          <ShieldCheck className="text-gold size-8" />
          <h2 className="text-2xl font-bold tracking-tight">
            Are you an artisan?
          </h2>
          <p className="max-w-lg text-balance text-white/80">
            List your services free and let customers near you find you. No
            joining fee, no commission, and no charge when someone contacts
            you.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gold hover:bg-gold/90 text-navy-deep w-fit"
          >
            <Link href={ROUTES.joinAsArtisan}>List your services free</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
