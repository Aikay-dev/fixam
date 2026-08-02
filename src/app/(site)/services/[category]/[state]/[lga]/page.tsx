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

type Props = PageProps<"/services/[category]/[state]/[lga]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, state, lga } = await params;
  const scope = await resolveScope({ category, state, lga });

  if (!scope) return { title: "Not found" };

  // "Plumbers in Lekki, Lagos" — as close as possible to what someone types.
  // No "| Fixam" suffix here: the root layout's title template appends it,
  // and including it again produces "... | Fixam | Fixam".
  const title = `${scope.category.name}s in ${scope.lga!.name}, ${scope.state!.name}`;

  return {
    title,
    description: `Trusted ${scope.category.name.toLowerCase()}s in ${scope.lga!.name}. See ratings, photos of finished work, and contact them directly — free.`,
    alternates: { canonical: scopePath(scope) },
    openGraph: { title, type: "website" },
  };
}

export default async function CategoryLgaPage({ params }: Props) {
  const { category, state, lga } = await params;

  const scope = await resolveScope({ category, state, lga });
  if (!scope || !scope.state || !scope.lga) notFound();

  const results = await searchArtisans({
    categoryId: scope.category.id,
    lgaId: scope.lga.id,
    sort: "recommended",
    limit: 12,
  });

  // The deepest and most numerous pages — the guard matters most here.
  if (results.total === 0) notFound();

  const locationLabel = scopeLocationLabel(scope);

  const [nearby, related] = await Promise.all([
    nearbyLgasWithArtisans(scope.category.id, scope.state.id, scope.lga.id),
    relatedTradesInArea(scope.category.id, { lgaId: scope.lga.id }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${scope.category.name}s in ${scope.lga.name}`,
    url: `${clientEnv.NEXT_PUBLIC_SITE_URL}${scopePath(scope)}`,
    about: { "@type": "Service", serviceType: scope.category.name },
    spatialCoverage: {
      "@type": "AdministrativeArea",
      name: scope.lga.name,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: scope.state.name,
        containedInPlace: { "@type": "Country", name: "Nigeria" },
      },
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
        nearby={nearby}
        nearbyLabel={`${scope.category.name}s in nearby areas`}
        nearbyHrefPrefix={`/services/${scope.category.slug}/${scope.state.slug}`}
        relatedTrades={related}
      />
    </>
  );
}
