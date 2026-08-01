import { BadgeCheck, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { RatingStars } from "@/components/artisans/rating-stars";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants";
import type { PublicArtisan } from "@/lib/serializers/artisan";
import { cn } from "@/lib/utils";

/**
 * Directory result card.
 *
 * Deliberately carries no phone number and no "call" affordance — the only
 * route to a number is the profile page, where the reveal gate lives. A
 * shortcut here would be a hole in the model.
 */
export function ArtisanCard({
  artisan,
  tradeName,
  locationName,
  priority = false,
}: {
  artisan: PublicArtisan;
  tradeName?: string;
  locationName?: string;
  priority?: boolean;
}) {
  const initials = artisan.displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Link
      href={ROUTES.artisan(artisan.slug)}
      className="group focus-visible:ring-ring hover:border-primary/40 block rounded-lg border p-4 transition hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex gap-3">
        <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-full">
          {artisan.avatarUrl ? (
            <Image
              src={artisan.avatarUrl}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
              priority={priority}
            />
          ) : (
            <span className="text-muted-foreground flex size-full items-center justify-center text-sm font-semibold">
              {initials}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <h3 className="group-hover:text-primary truncate font-semibold">
              {artisan.displayName}
            </h3>
            {artisan.isVerified ? (
              <BadgeCheck
                className="mt-0.5 size-4 shrink-0 text-emerald-600"
                aria-label="Verified by Fixam"
              />
            ) : null}
          </div>

          {tradeName ? (
            <p className="text-muted-foreground truncate text-sm">{tradeName}</p>
          ) : null}

          <div className="mt-1.5">
            <RatingStars
              value={artisan.rating.average}
              count={artisan.rating.count}
            />
          </div>
        </div>
      </div>

      {artisan.bio ? (
        <p className="text-muted-foreground line-clamp-2-safe mt-3 text-sm">
          {artisan.bio}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {locationName || artisan.location.areaText ? (
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <MapPin className="size-3" />
            {artisan.location.areaText || locationName}
          </span>
        ) : null}

        {artisan.yearsExperience > 0 ? (
          <Badge variant="secondary" className="text-xs">
            {artisan.yearsExperience} yr
            {artisan.yearsExperience === 1 ? "" : "s"} experience
          </Badge>
        ) : null}

        {!artisan.acceptingJobs ? (
          <Badge variant="outline" className="text-xs">
            Fully booked
          </Badge>
        ) : null}

        {artisan.portfolio.length > 0 ? (
          <span className="text-muted-foreground text-xs">
            {artisan.portfolio.length} photo
            {artisan.portfolio.length === 1 ? "" : "s"} of work
          </span>
        ) : null}
      </div>
    </Link>
  );
}

/** Loading placeholder matching the card's shape, to avoid layout shift. */
export function ArtisanCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      <div className="flex gap-3">
        <div className="bg-muted size-14 shrink-0 animate-pulse rounded-full" />
        <div className="flex-1 space-y-2 py-1">
          <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
          <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
          <div className="bg-muted h-3 w-1/3 animate-pulse rounded" />
        </div>
      </div>
      <div className="bg-muted mt-3 h-3 w-full animate-pulse rounded" />
      <div className="bg-muted mt-1.5 h-3 w-4/5 animate-pulse rounded" />
    </div>
  );
}
