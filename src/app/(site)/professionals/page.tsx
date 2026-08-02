import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import Link from "next/link";

import { ArtisanCard } from "@/components/artisans/artisan-card";
import { DirectoryFilters } from "@/components/artisans/directory-filters";
import { Button } from "@/components/ui/button";
import { searchArtisans, type SortKey } from "@/lib/artisan/search";
import { ROUTES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/category";
import { Lga, State } from "@/models/location";

export const metadata: Metadata = {
  title: "Find a trusted professional near you",
  description:
    "Browse vetted plumbers, electricians, carpenters, AC technicians and more across Nigeria. Real reviews, real photos of past work, and free contact.",
  alternates: { canonical: "/professionals" },
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DirectoryPage(props: PageProps<"/professionals">) {
  const sp = await props.searchParams;

  const q = first(sp.q);
  const categoryId = first(sp.categoryId);
  const stateId = first(sp.stateId);
  const lgaId = first(sp.lgaId);
  const sort = (first(sp.sort) as SortKey) ?? "recommended";
  const page = Number(first(sp.page) ?? 1) || 1;

  await connectDB();

  const [results, categories, states, lgas] = await Promise.all([
    searchArtisans({
      q,
      categoryId,
      stateId,
      lgaId,
      verifiedOnly: first(sp.verified) === "1",
      acceptingOnly: first(sp.accepting) === "1",
      minRating: Number(first(sp.minRating) ?? 0) || undefined,
      sort,
      page,
    }),
    Category.find({ isActive: true })
      .select("name parentId order")
      .sort({ order: 1, name: 1 })
      .lean()
      .exec(),
    State.find({ isActive: true }).select("name").sort({ name: 1 }).lean().exec(),
    stateId
      ? Lga.find({ stateId, isActive: true })
          .select("name")
          .sort({ name: 1 })
          .lean()
          .exec()
      : Promise.resolve([]),
  ]);

  const groupedCategories = categories
    .filter((c) => !c.parentId)
    .map((group) => ({
      group: group.name,
      items: categories
        .filter((c) => String(c.parentId) === String(group._id))
        .map((c) => ({ id: String(c._id), name: c.name })),
    }))
    .filter((g) => g.items.length > 0);

  const categoryNames = new Map(
    categories.map((c) => [String(c._id), c.name] as const),
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Find a trusted professional
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse, compare and connect directly. Free, always.
        </p>
      </header>

      <DirectoryFilters
        categories={groupedCategories}
        states={states.map((s) => ({ id: String(s._id), name: s.name }))}
        lgas={lgas.map((l) => ({ id: String(l._id), name: l.name }))}
      />

      <div className="mt-6">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {results.total === 0
            ? "No professionals found"
            : `${results.total} professional${results.total === 1 ? "" : "s"} found`}
        </p>
      </div>

      {results.artisans.length > 0 ? (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.artisans.map((professional, index) => (
              <ArtisanCard
                key={professional.id}
                professional={professional}
                tradeName={
                  professional.tradeIds.length
                    ? categoryNames.get(professional.tradeIds[0]!)
                    : undefined
                }
                priority={index < 3}
              />
            ))}
          </div>

          {results.totalPages > 1 ? (
            <nav
              className="mt-8 flex items-center justify-center gap-2"
              aria-label="Pagination"
            >
              {page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={{
                      pathname: ROUTES.directory,
                      query: { ...sp, page: page - 1 },
                    }}
                  >
                    Previous
                  </Link>
                </Button>
              ) : null}

              <span className="text-muted-foreground px-3 text-sm">
                Page {results.page} of {results.totalPages}
              </span>

              {results.hasMore ? (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={{
                      pathname: ROUTES.directory,
                      query: { ...sp, page: page + 1 },
                    }}
                  >
                    Next
                  </Link>
                </Button>
              ) : null}
            </nav>
          ) : null}
        </>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed py-16 text-center">
          <SearchX className="text-muted-foreground mx-auto size-8" />
          <h2 className="mt-3 font-semibold">Nothing here yet</h2>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm text-balance">
            {q || categoryId || stateId
              ? "Try widening your search — fewer filters, or a nearby area."
              : "Fixam is just getting started. Professionals are being added and reviewed now."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {q || categoryId || stateId ? (
              <Button asChild variant="outline">
                <Link href={ROUTES.directory}>Clear filters</Link>
              </Button>
            ) : null}
            <Button asChild>
              <Link href={ROUTES.listYourServices}>
                Are you a professional? List free
              </Link>
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
