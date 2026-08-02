import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceLanding } from "@/components/artisans/service-landing";
import { searchArtisans } from "@/lib/artisan/search";
import {
  nearbyLgasWithArtisans,
  relatedTradesInArea,
  resolveScope,
  scopeLocationLabel,
  scopePath,
} from "@/lib/artisan/service-pages";
import { clientEnv } from "@/lib/env";

type Props = PageProps<"/services/[category]/[state]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, state } = await params;
  const scope = await resolveScope({ category, state });

  if (!scope) return { title: "Not found" };

  // The root layout's title template appends "| Fixam" — don't repeat it.
  const title = `${scope.category.name}s in ${scope.state!.name}`;

  return {
    title,
    description: `Find trusted ${scope.category.name.toLowerCase()}s in ${scope.state!.name}. Compare ratings, see photos of past work, and contact them free.`,
    alternates: { canonical: scopePath(scope) },
    openGraph: { title, type: "website" },
  };
}

export default async function CategoryStatePage({ params }: Props) {
  const { category, state } = await params;

  const scope = await resolveScope({ category, state });
  if (!scope || !scope.state) notFound();

  const results = await searchArtisans({
    categoryId: scope.category.id,
    stateId: scope.state.id,
    sort: "recommended",
    limit: 12,
  });

  if (results.total === 0) notFound();

  const locationLabel = scopeLocationLabel(scope);

  const [lgas, related] = await Promise.all([
    nearbyLgasWithArtisans(scope.category.id, scope.state.id),
    relatedTradesInArea(scope.category.id, { stateId: scope.state.id }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${scope.category.name}s in ${scope.state.name}`,
    url: `${clientEnv.NEXT_PUBLIC_SITE_URL}${scopePath(scope)}`,
    about: { "@type": "Service", serviceType: scope.category.name },
    spatialCoverage: {
      "@type": "AdministrativeArea",
      name: scope.state.name,
      containedInPlace: { "@type": "Country", name: "Nigeria" },
    },
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
        locationLabel={locationLabel}
        nearby={lgas}
        nearbyLabel={`${scope.category.name}s by area in ${scope.state.name}`}
        nearbyHrefPrefix={`/services/${scope.category.slug}/${scope.state.slug}`}
        relatedTrades={related}
      />
    </>
  );
}
