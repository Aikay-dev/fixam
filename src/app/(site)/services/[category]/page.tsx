import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceLanding } from "@/components/artisans/service-landing";
import { searchArtisans } from "@/lib/artisan/search";
import {
  relatedTradesInArea,
  resolveScope,
  scopePath,
  statesWithArtisans,
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

  return {
    title,
    description:
      scope.category.seoDescription ||
      `Find trusted ${scope.category.name.toLowerCase()}s near you. Real reviews, photos of past work, free contact.`,
    alternates: { canonical: scopePath(scope) },
    openGraph: { title, type: "website" },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;

  const scope = await resolveScope({ category });
  if (!scope) notFound();

  const results = await searchArtisans({
    categoryId: scope.category.id,
    sort: "recommended",
    limit: 12,
  });

  // Thin-content guard: a trade with nobody in it must not be an indexable
  // page. Better a 404 than 60,000 empty URLs telling Google we're a
  // doorway site.
  if (results.total === 0) notFound();

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
        artisans={results.artisans}
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
