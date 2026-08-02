import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceEmpty } from "@/components/artisans/service-empty";
import { ServiceLanding } from "@/components/artisans/service-landing";
import { searchArtisans } from "@/lib/artisan/search";
import {
  relatedTradesInArea,
  resolveScope,
  scopePath,
  statesWithArtisans,
  tradesWithArtisans,
} from "@/lib/artisan/service-pages";
import { clientEnv } from "@/lib/env";

type Props = PageProps<"/services/[category]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const scope = await resolveScope({ category });

  if (!scope) return { title: "Service not found" };

  // The root layout appends "| Fixam"; strip it if the seeded copy has it so
  // the tab doesn't read "... | Fixam | Fixam".
  const title = (
    scope.category.seoTitle || `${scope.category.name}s in Nigeria`
  ).replace(/\s*\|\s*Fixam\s*$/i, "");

  const hasArtisans = await searchArtisans({
    categoryId: scope.category.id,
    limit: 1,
  });

  return {
    title,
    description:
      scope.category.seoDescription ||
      `Find trusted ${scope.category.name.toLowerCase()}s near you. Real reviews, photos of past work, free contact.`,
    alternates: { canonical: scopePath(scope) },
    openGraph: { title, type: "website" },
    // An empty trade page is real and useful to visitors, but there is
    // nothing worth indexing until somebody lists. It becomes indexable on
    // its own the moment a professional is approved.
    robots:
      hasArtisans.total === 0
        ? { index: false, follow: true }
        : { index: true, follow: true },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;

  const scope = await resolveScope({ category });
  // Unknown trade slug — genuinely does not exist.
  if (!scope) notFound();

  const results = await searchArtisans({
    categoryId: scope.category.id,
    sort: "recommended",
    limit: 12,
  });

  // No professionals yet: render, don't 404.
  //
  // There are only ~82 of these and they're linked from the footer and home
  // page, so 404ing them makes the site look broken. They carry `noindex`
  // (above) so they stay out of search until they have content. The location
  // variants are ~60,000 pages and DO still 404 — that volume of empty pages
  // is a genuine doorway-page pattern.
  if (results.total === 0) {
    const populated = await tradesWithArtisans(8);
    return <ServiceEmpty scope={scope} otherTrades={populated} />;
  }

  const [states, related] = await Promise.all([
    statesWithArtisans(scope.category.id),
    relatedTradesInArea(scope.category.id, {}),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${scope.category.name}s in Nigeria`,
    description: scope.category.seoDescription || scope.category.description,
    url: `${clientEnv.NEXT_PUBLIC_SITE_URL}${scopePath(scope)}`,
    about: { "@type": "Service", serviceType: scope.category.name },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ServiceLanding
        scope={scope}
        professionals={results.artisans}
        total={results.total}
        locationLabel="Nigeria"
        nearby={states}
        nearbyLabel={`${scope.category.name}s by state`}
        nearbyHrefPrefix={`/services/${scope.category.slug}`}
        relatedTrades={related}
      />
    </>
  );
}
