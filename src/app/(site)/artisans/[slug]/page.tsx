import type { Metadata } from "next";
import {
  BadgeCheck,
  Briefcase,
  Clock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtisanPortfolio } from "@/components/artisans/artisan-portfolio";
import { ContactGate } from "@/components/artisans/contact-gate";
import { RatingStars } from "@/components/artisans/rating-stars";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPublicArtisanBySlug } from "@/lib/artisan/search";
import { getSessionUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { clientEnv } from "@/lib/env";
import { Category } from "@/models/category";
import { Lga, State } from "@/models/location";

type Props = PageProps<"/artisans/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artisan = await getPublicArtisanBySlug(slug);

  if (!artisan) return { title: "Artisan not found" };

  const location = artisan.location.areaText;
  const title = location
    ? `${artisan.displayName} — Artisan in ${location}`
    : artisan.displayName;

  const description =
    artisan.bio?.slice(0, 155) ||
    `${artisan.displayName} on Fixam${location ? ` in ${location}` : ""}. ${
      artisan.rating.count
        ? `Rated ${artisan.rating.average.toFixed(1)} from ${artisan.rating.count} reviews.`
        : "See their work and connect directly."
    }`;

  return {
    title,
    description,
    alternates: { canonical: `/artisans/${artisan.slug}` },
    openGraph: {
      title,
      description,
      type: "profile",
      images: artisan.avatarUrl ? [{ url: artisan.avatarUrl }] : undefined,
    },
  };
}

export default async function ArtisanProfilePage({ params }: Props) {
  const { slug } = await params;

  const artisan = await getPublicArtisanBySlug(slug);
  if (!artisan) notFound();

  await connectDB();

  const [trades, state, lga, user] = await Promise.all([
    Category.find({ _id: { $in: artisan.tradeIds } })
      .select("name slug")
      .lean()
      .exec(),
    artisan.location.stateId
      ? State.findById(artisan.location.stateId).select("name").lean().exec()
      : null,
    artisan.location.lgaId
      ? Lga.findById(artisan.location.lgaId).select("name").lean().exec()
      : null,
    getSessionUser(),
  ]);

  const locationLabel = [artisan.location.areaText, lga?.name, state?.name]
    .filter(Boolean)
    .join(", ");

  const responseLabel = {
    within_hour: "Usually replies within an hour",
    same_day: "Usually replies the same day",
    few_days: "Usually replies within a few days",
  }[artisan.respondsWithin] ?? "Usually replies the same day";

  // Structured data. AggregateRating is only emitted when reviews exist —
  // Google penalises rating markup with no underlying reviews.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: artisan.displayName,
    description: artisan.bio || undefined,
    image: artisan.avatarUrl || undefined,
    url: `${clientEnv.NEXT_PUBLIC_SITE_URL}${ROUTES.artisan(artisan.slug)}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: lga?.name || artisan.location.areaText || undefined,
      addressRegion: state?.name || undefined,
      addressCountry: "NG",
    },
    ...(artisan.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: artisan.rating.average.toFixed(1),
            reviewCount: artisan.rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    knowsAbout: trades.map((t) => t.name),
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-6">
          {/* Identity */}
          <header className="flex flex-wrap items-start gap-4">
            <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-full sm:size-24">
              {artisan.avatarUrl ? (
                <Image
                  src={artisan.avatarUrl}
                  alt={artisan.displayName}
                  fill
                  sizes="96px"
                  priority
                  className="object-cover"
                />
              ) : (
                <span className="text-muted-foreground flex size-full items-center justify-center text-2xl font-semibold">
                  {artisan.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {artisan.displayName}
                </h1>
                {artisan.isVerified ? (
                  <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                    <BadgeCheck className="size-3.5" />
                    Verified
                  </Badge>
                ) : null}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <RatingStars
                  value={artisan.rating.average}
                  count={artisan.rating.count}
                  size="md"
                />
                {!artisan.acceptingJobs ? (
                  <Badge variant="outline">Fully booked</Badge>
                ) : null}
              </div>

              <div className="text-muted-foreground mt-2 grid gap-1 text-sm">
                {locationLabel ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" />
                    {locationLabel}
                  </span>
                ) : null}
                {artisan.yearsExperience > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="size-3.5 shrink-0" />
                    {artisan.yearsExperience} year
                    {artisan.yearsExperience === 1 ? "" : "s"} experience
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 shrink-0" />
                  {responseLabel}
                </span>
              </div>
            </div>
          </header>

          {trades.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {trades.map((trade) => (
                <Link key={String(trade._id)} href={ROUTES.category(trade.slug)}>
                  <Badge variant="secondary" className="hover:bg-accent">
                    {trade.name}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : null}

          {/* Contact gate on mobile, before the fold */}
          <div className="lg:hidden">
            <ContactGate
              slug={artisan.slug}
              displayName={artisan.displayName}
              hasWhatsApp={artisan.hasWhatsApp}
              isSignedIn={Boolean(user)}
              isVerified={Boolean(user?.isVerified)}
            />
          </div>

          {artisan.bio ? (
            <section>
              <h2 className="mb-2 text-lg font-semibold">About</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {artisan.bio}
              </p>
            </section>
          ) : null}

          {artisan.portfolio.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">
                Work {artisan.displayName.split(" ")[0]} has done
              </h2>
              <ArtisanPortfolio
                images={artisan.portfolio}
                artisanName={artisan.displayName}
              />
            </section>
          ) : null}

          {artisan.credentials.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Credentials</h2>
              <ul className="grid gap-2">
                {artisan.credentials.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <ShieldCheck
                      className={
                        c.verifiedByAdmin
                          ? "size-4 shrink-0 text-emerald-600"
                          : "text-muted-foreground size-4 shrink-0"
                      }
                    />
                    {c.title}
                    {c.verifiedByAdmin ? (
                      <Badge variant="secondary" className="text-xs">
                        Checked by Fixam
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <Separator />

          <section id="reviews">
            <h2 className="mb-3 text-lg font-semibold">
              Reviews{artisan.rating.count ? ` (${artisan.rating.count})` : ""}
            </h2>
            {artisan.rating.count === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    No reviews yet. On Fixam only customers who actually took
                    this artisan&apos;s number can leave one — so reviews here
                    come from real jobs.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <p className="text-muted-foreground text-sm">
                Review list arrives in the next build phase.
              </p>
            )}
          </section>
        </div>

        {/* Contact gate, sticky on desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <ContactGate
              slug={artisan.slug}
              displayName={artisan.displayName}
              hasWhatsApp={artisan.hasWhatsApp}
              isSignedIn={Boolean(user)}
              isVerified={Boolean(user?.isVerified)}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
