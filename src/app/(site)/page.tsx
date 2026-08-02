import type { Metadata } from "next";
import { BadgeCheck, MessageCircle, Star, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ArtisanCard } from "@/components/artisans/artisan-card";
import { HomeSearch } from "@/components/site/home-search";
import { TradeTiles } from "@/components/site/trade-tiles";
import { Button } from "@/components/ui/button";
import { liveCategoryCounts } from "@/lib/artisan/counts";
import { searchArtisans } from "@/lib/artisan/search";
import { ROUTES, SITE } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { SITE_IMAGES } from "@/data/site-images";
import { Category } from "@/models/category";

export const metadata: Metadata = {
  // `absolute` opts out of the root layout's "%s | Fixam" template, which
  // would otherwise render "Fixam — ... | Fixam" on the one page whose title
  // already leads with the brand.
  title: {
    absolute: "Fixam — Find Trusted Artisans & Professionals in Nigeria",
  },
  description: SITE.description,
  alternates: { canonical: "/" },
};

/**
 * Trades that get a photograph, ordered by how often people search them.
 *
 * Nine is deliberate. The first tile spans 2×2, so the grid needs
 * 4 + 8 = 12 cells to fill three rows of four cleanly; seven tiles left a
 * ragged hole in the last row.
 */
/**
 * The groups that aren't manual trades. They get their own row because the
 * hero promises lawyers, architects and web designers, and a promise the page
 * never makes good on is worse than not making it.
 */
const PROFESSIONAL_GROUP_SLUGS = [
  "professional-services",
  "legal-financial",
  "digital-technology",
];

const FEATURED_TRADES = [
  { slug: "plumber", image: "trade-plumber" },
  { slug: "electrician", image: "hero" },
  { slug: "carpenter", image: "trade-carpenter" },
  { slug: "ac-installation-repair", image: "trade-ac" },
  { slug: "pop-ceiling", image: "trade-pop" },
  { slug: "painter", image: "trade-painter" },
  { slug: "generator-repair", image: "trade-generator" },
  { slug: "tiler", image: "trade-tiler" },
  { slug: "aluminium-fabricator", image: "trade-aluminium" },
] as const;

export default async function HomePage() {
  await connectDB();

  const [allTrades, counts, featured, professionalGroups] = await Promise.all([
    Category.find({ isActive: true, parentId: { $ne: null } })
      .select("name slug parentId")
      .lean()
      .exec(),
    liveCategoryCounts(),
    searchArtisans({ sort: "recommended", limit: 6 }),
    Category.find({ slug: { $in: PROFESSIONAL_GROUP_SLUGS }, parentId: null })
      .select("_id")
      .lean()
      .exec(),
  ]);

  const bySlug = new Map(allTrades.map((c) => [c.slug, c]));

  const tiles = FEATURED_TRADES.map((t) => {
    const category = bySlug.get(t.slug);
    if (!category) return null;
    return {
      name: category.name,
      slug: category.slug,
      count: counts.get(String(category._id)) ?? 0,
      image: SITE_IMAGES[t.image],
    };
  }).filter((t): t is NonNullable<typeof t> => Boolean(t));

  const professionalGroupIds = new Set(professionalGroups.map((g) => String(g._id)));
  const isProfessional = (c: { parentId?: unknown }) =>
    professionalGroupIds.has(String(c.parentId));

  // Everything else, so the page still leads somewhere for the other trades.
  // Professional services are excluded here and given their own row below —
  // this list sorts by how many people are listed, and the professional
  // categories start at zero, so they would never surface on merit.
  const otherTrades = allTrades
    .filter((c) => !FEATURED_TRADES.some((f) => f.slug === c.slug))
    .filter((c) => !isProfessional(c))
    .map((c) => ({ ...c, count: counts.get(String(c._id)) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 10);

  const professionalServices = allTrades
    .filter(isProfessional)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative isolate min-h-[560px] overflow-hidden sm:min-h-[640px]">
        <Image
          src={SITE_IMAGES.hero.url}
          alt={SITE_IMAGES.hero.alt}
          fill
          priority
          // Capped at the source's own width. `100vw` alone makes the browser
          // request a 3840px render of a 1408px photo — upscaling that costs
          // bytes on a mobile connection and buys nothing.
          sizes="(max-width: 1536px) 100vw, 1536px"
          quality={75}
          className="object-cover object-[60%_center]"
        />
        <div className="hero-scrim absolute inset-0" />

        <div className="relative mx-auto flex min-h-[560px] max-w-6xl flex-col justify-end px-4 pb-12 sm:min-h-[640px] sm:px-6 sm:pb-16">
          <h1 className="text-display max-w-3xl text-white">
            The professional you need is
            <br />
            already nearby.
          </h1>

          <p className="mt-5 max-w-xl text-lg text-white/85">
            Plumbers, electricians and carpenters. Lawyers, architects and web
            designers. All with real reviews from people who hired them.
          </p>

          <div className="mt-8 max-w-2xl">
            <HomeSearch />
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            <li className="flex items-center gap-1.5">
              <Wallet className="size-4 shrink-0" />
              Always free for customers
            </li>
            <li className="flex items-center gap-1.5">
              <BadgeCheck className="size-4 shrink-0" />
              Every professional checked before listing
            </li>
            <li className="flex items-center gap-1.5">
              <MessageCircle className="size-4 shrink-0" />
              Reach them on WhatsApp
            </li>
          </ul>
        </div>
      </section>

      {/* ── Trades ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              What do you need done?
            </h2>
            <p className="text-muted-foreground mt-1">
              Close to 100 services, from a leaking tap to a company
              registration.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={ROUTES.directory}>Browse everything</Link>
          </Button>
        </div>

        <TradeTiles tiles={tiles} />

        {otherTrades.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {otherTrades.map((trade) => (
              <Link
                key={trade.slug}
                href={ROUTES.category(trade.slug)}
                className="border-input hover:border-primary hover:bg-accent rounded-full border px-3.5 py-1.5 text-sm transition-colors"
              >
                {trade.name}
              </Link>
            ))}
          </div>
        ) : null}

        {professionalServices.length > 0 ? (
          <div className="mt-12 border-t pt-8">
            <h3 className="text-lg font-bold">Not just trades</h3>
            <p className="text-muted-foreground mt-1 max-w-xl text-sm">
              Fixam covers the professionals you hire the same way you hire a
              plumber — you find someone nearby, check who has used them, and
              call.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {professionalServices.map((service) => (
                <Link
                  key={service.slug}
                  href={ROUTES.category(service.slug)}
                  className="border-input hover:border-primary hover:bg-accent rounded-full border px-3.5 py-1.5 text-sm transition-colors"
                >
                  {service.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="border-y bg-[oklch(0.24_0.062_254)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Three steps, no middleman
          </h2>

          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {[
              {
                n: "1",
                title: "Look through them",
                body: "No forms, no waiting for a callback. Browse professionals near you, sort by rating, and see photos of jobs they've finished.",
              },
              {
                n: "2",
                title: "Read what customers said",
                body: "Only someone who actually took a professional's number can review them. What you're reading came from real jobs.",
              },
              {
                n: "3",
                title: "Message them yourself",
                body: "Sign up free, get their number, talk on WhatsApp. You agree the price directly — Fixam never touches your money.",
              },
            ].map((step) => (
              <li key={step.n} className="border-t border-white/20 pt-5">
                <span className="text-gold block text-4xl font-black tabular-nums">
                  {step.n}
                </span>
                <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
                <p className="mt-1.5 leading-relaxed text-white/75">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Featured professionals ─────────────────────────────────────────── */}
      {featured.artisans.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Professionals on Fixam
              </h2>
              <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                Checked by our team before they appear here
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={ROUTES.directory}>See all</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.artisans.map((professional) => (
              <ArtisanCard key={professional.id} professional={professional} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Professional recruitment ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="grid overflow-hidden rounded-xl border md:grid-cols-2">
          <div className="relative min-h-[260px] md:min-h-[340px]">
            <Image
              src={SITE_IMAGES["trade-carpenter"].url}
              alt={SITE_IMAGES["trade-carpenter"].alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={75}
              className="object-cover"
            />
          </div>

          <div className="bg-primary flex flex-col justify-center gap-4 p-8 text-white sm:p-10">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Do you work a trade?
            </h2>
            <p className="text-white/80">
              List your services and let customers near you find you. Free to
              join, free to be contacted, and no commission on anything you
              earn.
            </p>
            <ul className="grid gap-1.5 text-sm text-white/75">
              <li>• List every trade you do, up to eight</li>
              <li>• Your number stays private until a customer picks you</li>
              <li>• We email you the moment someone wants to hire</li>
            </ul>
            <Button
              asChild
              size="lg"
              className="bg-gold hover:bg-gold/90 text-navy-deep mt-2 w-fit font-semibold"
            >
              <Link href={ROUTES.listYourServices}>List your services free</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
