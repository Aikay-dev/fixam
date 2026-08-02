import Image from "next/image";
import Link from "next/link";

import { ROUTES } from "@/lib/constants";
import type { SiteImage } from "@/data/site-images";

export type Tile = {
  name: string;
  slug: string;
  count: number;
  image: SiteImage;
};

/**
 * Photographic trade tiles.
 *
 * The point of the photography is that this is a marketplace of people doing
 * physical work — a grid of icons or text chips says "database", a grid of
 * hands and workshops says "these are real people you can call".
 *
 * The first tile spans two columns on wider screens so the grid has a focal
 * point rather than reading as an undifferentiated wall of equal squares.
 */
export function TradeTiles({ tiles }: { tiles: Tile[] }) {
  if (tiles.length === 0) return null;

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {tiles.map((tile, index) => {
        const feature = index === 0;

        return (
          <Link
            key={tile.slug}
            href={ROUTES.category(tile.slug)}
            className={[
              "group focus-visible:ring-ring relative isolate overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              feature
                ? "col-span-2 aspect-[4/3] sm:aspect-[16/10] lg:row-span-2 lg:aspect-auto"
                : "aspect-square",
            ].join(" ")}
          >
            <Image
              src={tile.image.url}
              alt={tile.image.alt}
              fill
              // Tiles are never rendered larger than these, so the browser
              // shouldn't fetch a 2000px crop for a 300px square.
              sizes={
                feature
                  ? "(max-width: 1024px) 100vw, 640px"
                  : "(max-width: 640px) 50vw, 320px"
              }
              quality={70}
              loading={index < 2 ? "eager" : "lazy"}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />

            <div className="tile-scrim absolute inset-0" />

            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
              <h3
                className={[
                  "font-bold text-white",
                  feature ? "text-xl sm:text-2xl" : "text-sm sm:text-base",
                ].join(" ")}
              >
                {tile.name}
              </h3>
              {tile.count > 0 ? (
                <p className="text-xs text-white/75">
                  {tile.count} available
                </p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
