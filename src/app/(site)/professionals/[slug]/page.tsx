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
import { RatingBreakdown, ReviewList } from "@/components/reviews/review-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getPublicArtisanBySlug } from "@/lib/artisan/search";
import { getSessionUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { clientEnv } from "@/lib/env";
import { getProfileReviews } from "@/lib/reviews/queries";
import { Category } from "@/models/category";
import { Lga, State } from "@/models/location";

type Props = PageProps<"/professionals/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const professional = await getPublicArtisanBySlug(slug);

  if (!professional) return { title: "Professional not found" };

  const location = professional.location.areaText;
  const title = location
    ? `${professional.displayName} — Professional in ${location}`
    : professional.displayName;

  const description =
    professional.bio?.slice(0, 155) ||
    `${professional.displayName} on Fixam${location ? ` in ${location}` : ""}. ${
      professional.rating.count
        ? `Rated ${professional.rating.average.toFixed(1)} from ${professional.rating.count} reviews.`
        : "See their work and connect directly."
    }`;

  return {
    title,
    description,
    alternates: { canonical: `/professionals/${professional.slug}` },
    openGraph: {
      title,
      description,
      type: "profile",
      images: professional.avatarUrl ? [{ url: professional.avatarUrl }] : undefined,
    },
  };
}

export default async function ArtisanProfilePage({ params }: Props) {
  const { slug } = await params;

  const professional = await getPublicArtisanBySlug(slug);
  if (!professional) notFound();

  await connectDB();

  const [trades, state, lga, user, reviewPage] = await Promise.all([
    Category.find({ _id: { $in: professional.tradeIds } })
      .select("name slug")
      .lean()
      .exec(),
    professional.location.stateId
      ? State.findById(professional.location.stateId).select("name").lean().exec()
      : null,
    professional.location.lgaId
      ? Lga.findById(professional.location.lgaId).select("name").lean().exec()
      : null,
    getSessionUser(),
    getProfileReviews(professional.id, { limit: 10 }),
  ]);

  const locationLabel = [professional.location.areaText, lga?.name, state?.name]
    .filter(Boolean)
    .join(", ");

  const responseLabel = {
    within_hour: "Usually replies within an hour",
    same_day: "Usually replies the same day",
    few_days: "Usually replies within a few days",
  }[professional.respondsWithin] ?? "Usually replies the same day";

  // Structured data. AggregateRating is only emitted when reviews exist —
  // Google penalises rating markup with no underlying reviews. Now that the
  // rating is recomputed from actual Review documents, `rating.count > 0`
  // genuinely means there are reviews on the page to back it.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: professional.displayName,
    description: professional.bio || undefined,
    image: professional.avatarUrl || undefined,
    url: `${clientEnv.NEXT_PUBLIC_SITE_URL}${ROUTES.professional(professional.slug)}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: lga?.name || professional.location.areaText || undefined,
      addressRegion: state?.name || undefined,
      addressCountry: "NG",
    },
    ...(professional.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: professional.rating.average.toFixed(1),
            reviewCount: professional.rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    // Individual reviews, capped at five. Google only surfaces a handful and
    // the full list would bloat every profile's HTML for no gain.
    ...(reviewPage.reviews.length > 0
      ? {
          review: reviewPage.reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            author: { "@type": "Person", name: r.authorName },
            datePublished: r.createdAt.slice(0, 10),
            reviewBody: r.body,
          })),
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
              {professional.avatarUrl ? (
                <Image
                  src={professional.avatarUrl}
                  alt={professional.displayName}
                  fill
                  sizes="96px"
                  priority
                  className="object-cover"
                />
              ) : (
                <span className="text-muted-foreground flex size-full items-center justify-center text-2xl font-semibold">
                  {professional.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {professional.displayName}
                </h1>
                {professional.isVerified ? (
                  <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                    <BadgeCheck className="size-3.5" />
                    Verified
                  </Badge>
                ) : null}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <RatingStars
                  value={professional.rating.average}
                  count={professional.rating.count}
                  size="md"
                />
                {!professional.acceptingJobs ? (
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
                {professional.yearsExperience > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="size-3.5 shrink-0" />
                    {professional.yearsExperience} year
                    {professional.yearsExperience === 1 ? "" : "s"} experience
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
              slug={professional.slug}
              displayName={professional.displayName}
              hasWhatsApp={professional.hasWhatsApp}
              isSignedIn={Boolean(user)}
              isVerified={Boolean(user?.isVerified)}
            />
          </div>

          {professional.bio ? (
            <section>
              <h2 className="mb-2 text-lg font-semibold">About</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {professional.bio}
              </p>
            </section>
          ) : null}

          {professional.portfolio.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">
                Work {professional.displayName.split(" ")[0]} has done
              </h2>
              <ArtisanPortfolio
                images={professional.portfolio}
                artisanName={professional.displayName}
              />
            </section>
          ) : null}

          {professional.credentials.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Credentials</h2>
              <ul className="grid gap-2">
                {professional.credentials.map((c, i) => (
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
              Reviews{professional.rating.count ? ` (${professional.rating.count})` : ""}
            </h2>
            {reviewPage.total === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    No reviews yet. On Fixam only customers who actually took
                    this professional&apos;s number can leave one — so reviews here
                    come from real jobs.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5">
                <RatingBreakdown
                  breakdown={professional.rating.breakdown}
                  total={professional.rating.count}
                />
                <ReviewList reviews={reviewPage.reviews} />
                {reviewPage.hasMore ? (
                  <p className="text-muted-foreground text-sm">
                    Showing the {reviewPage.reviews.length} most recent of{" "}
                    {reviewPage.total}.
                  </p>
                ) : null}
              </div>
            )}
          </section>
        </div>

        {/* Contact gate, sticky on desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <ContactGate
              slug={professional.slug}
              displayName={professional.displayName}
              hasWhatsApp={professional.hasWhatsApp}
              isSignedIn={Boolean(user)}
              isVerified={Boolean(user?.isVerified)}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
