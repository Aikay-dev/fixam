import { MapPin, Wrench } from "lucide-react";
import Link from "next/link";

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
import type { ServiceScope } from "@/lib/artisan/service-pages";

/**
 * A trade with nobody listed yet.
 *
 * Deliberately NOT a 404. There are ~82 of these — a real, finite set of
 * service categories, linked from the footer and the home page. 404ing them
 * makes the site look broken to visitors for the sake of an SEO concern that
 * doesn't apply at this scale.
 *
 * The page is `noindex` instead (set by the route), so it stays out of search
 * until it has real content, and becomes indexable automatically the moment
 * an artisan is approved for the trade. Meanwhile it does useful work: it is
 * the best possible recruitment pitch to an artisan searching for their own
 * trade.
 *
 * The location variants (~60,000) are a different story and still 404 — that
 * volume of empty pages IS a doorway pattern.
 */
export function ServiceEmpty({
  scope,
  otherTrades,
}: {
  scope: ServiceScope;
  otherTrades: { name: string; slug: string; count: number }[];
}) {
  const trade = scope.category.name;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
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
              <Link href={ROUTES.directory}>Artisans</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{trade}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold tracking-tight">{trade}s on Fixam</h1>

      {scope.category.description ? (
        <p className="text-muted-foreground mt-2">
          {scope.category.description}
        </p>
      ) : null}

      <div className="bg-muted/40 mt-8 rounded-lg border border-dashed p-8 text-center">
        <Wrench className="text-muted-foreground mx-auto size-8" />
        <h2 className="mt-3 text-lg font-semibold">
          No {trade.toLowerCase()}s listed here yet
        </h2>
        <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm text-balance">
          Fixam is new and growing. Nobody has listed under this trade yet —
          which means whoever does will be the first name customers see.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href={ROUTES.joinAsArtisan}>
              List your services free
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.directory}>Browse all artisans</Link>
          </Button>
        </div>

        <p className="text-muted-foreground mt-4 text-xs">
          Free to list. No joining fee, no commission, no charge when a
          customer contacts you.
        </p>
      </div>

      {otherTrades.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">
            Trades with artisans available now
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Looking to hire? These have people listed today.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {otherTrades.map((item) => (
              <Link key={item.slug} href={ROUTES.category(item.slug)}>
                <Badge variant="secondary" className="hover:bg-accent">
                  {item.name}
                  <span className="ml-1.5 opacity-60">{item.count}</span>
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-muted-foreground mt-10 flex items-center gap-1.5 text-sm">
        <MapPin className="size-3.5" />
        Fixam covers all of Nigeria, starting with Lagos, Abuja and Port
        Harcourt.
      </p>
    </main>
  );
}
