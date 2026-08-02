import { MapPin } from "lucide-react";
import Link from "next/link";

import { ArtisanCard } from "@/components/artisans/artisan-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ROUTES } from "@/lib/constants";
import type { PublicArtisan } from "@/lib/serializers/artisan";
import type { ServiceScope } from "@/lib/artisan/service-pages";

export type LinkGroup = { name: string; slug: string; count: number };

/**
 * The /services/* landing page.
 *
 * Three things make this rank rather than read as a thin doorway page:
 * genuine per-category copy, real professional results, and internal links that
 * only point at places which actually have someone.
 */
export function ServiceLanding({
  scope,
  professionals,
  total,
  locationLabel,
  nearby,
  relatedTrades,
  nearbyLabel,
  nearbyHrefPrefix,
}: {
  scope: ServiceScope;
  professionals: PublicArtisan[];
  total: number;
  locationLabel: string;
  nearby: LinkGroup[];
  relatedTrades: LinkGroup[];
  nearbyLabel: string;
  /** e.g. `/services/plumber` — nearby slugs are appended to this. */
  nearbyHrefPrefix: string;
}) {
  const trade = scope.category.name;
  const inPlace = scope.state ? ` in ${locationLabel}` : " in Nigeria";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={ROUTES.directory}>Professionals</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {scope.state ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={ROUTES.category(scope.category.slug)}>{trade}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          ) : null}
          <BreadcrumbItem>
            <BreadcrumbPage>
              {scope.lga?.name ?? scope.state?.name ?? trade}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {trade}s{inPlace}
        </h1>

        <p className="text-muted-foreground mt-2">
          {total} vetted {trade.toLowerCase()}
          {total === 1 ? "" : "s"}
          {scope.state ? ` covering ${locationLabel}` : " across Nigeria"}.
          Compare ratings and past work, then contact them directly — free.
        </p>

        {scope.category.introCopy ? (
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm">
            {scope.category.introCopy}
          </p>
        ) : null}

        {scope.lga?.popularAreas.length ? (
          <p className="text-muted-foreground mt-3 text-sm">
            <MapPin className="mr-1 inline size-3.5" />
            Covering {scope.lga.popularAreas.slice(0, 6).join(", ")} and
            surrounding areas.
          </p>
        ) : null}
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {professionals.map((professional, index) => (
          <ArtisanCard
            key={professional.id}
            professional={professional}
            tradeName={trade}
            locationName={locationLabel}
            priority={index < 3}
          />
        ))}
      </div>

      {total > professionals.length ? (
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link
              href={{
                pathname: ROUTES.directory,
                query: {
                  categoryId: scope.category.id,
                  ...(scope.state ? { stateId: scope.state.id } : {}),
                  ...(scope.lga ? { lgaId: scope.lga.id } : {}),
                },
              }}
            >
              See all {total} {trade.toLowerCase()}s
            </Link>
          </Button>
        </div>
      ) : null}

      {/* Internal linking — only to places that actually have someone. */}
      {nearby.length > 0 ? (
        <section className="mt-12 border-t pt-8">
          <h2 className="text-lg font-semibold">{nearbyLabel}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {nearby.map((item) => (
              <Link
                key={item.slug}
                href={`${nearbyHrefPrefix}/${item.slug}`}
                className="hover:border-primary/50 hover:bg-accent rounded-full border px-3 py-1.5 text-sm transition"
              >
                {trade}s in {item.name}
                <span className="text-muted-foreground ml-1.5 text-xs">
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {relatedTrades.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            Other trades{scope.state ? ` in ${locationLabel}` : ""}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Many professionals here do more than one thing.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedTrades.map((item) => (
              <Link
                key={item.slug}
                href={
                  scope.state
                    ? `/services/${item.slug}/${scope.state.slug}${scope.lga ? `/${scope.lga.slug}` : ""}`
                    : ROUTES.category(item.slug)
                }
              >
                <Badge variant="secondary" className="hover:bg-accent">
                  {item.name}
                  <span className="ml-1.5 opacity-60">{item.count}</span>
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="bg-muted/40 mt-12 rounded-lg p-6">
        <h2 className="font-semibold">
          Are you {/^[aeiou]/i.test(trade) ? "an" : "a"}{" "}
          {trade.toLowerCase()}
          {scope.state ? ` in ${locationLabel}` : ""}?
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          List your services free and let customers near you find you. No
          joining fee, no commission.
        </p>
        <Button asChild className="mt-4">
          <Link href={ROUTES.listYourServices}>List your services free</Link>
        </Button>
      </section>
    </main>
  );
}
