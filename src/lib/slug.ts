import { customAlphabet } from "nanoid";
import slugify from "slugify";

import { ArtisanProfile } from "@/models/artisan-profile";

/** Lowercase alphanumerics only — no ambiguous characters in a URL. */
const suffix = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 4);

export function toSlug(input: string): string {
  return slugify(input, { lower: true, strict: true, trim: true });
}

/**
 * Build an artisan's public URL slug: name + primary trade + area + a short
 * random suffix, e.g. `emeka-okafor-plumber-lekki-a4f2`.
 *
 * The trade and area are in there for SEO — the URL itself carries the two
 * keywords people search. The random suffix guarantees uniqueness without a
 * retry loop and without leaking how many artisans have signed up, which an
 * incrementing counter would.
 */
export async function generateArtisanSlug(parts: {
  displayName: string;
  tradeName?: string | null;
  areaName?: string | null;
}): Promise<string> {
  const segments = [parts.displayName, parts.tradeName, parts.areaName]
    .filter((s): s is string => Boolean(s && s.trim()))
    .map(toSlug)
    .filter(Boolean);

  const base = segments.join("-").slice(0, 80).replace(/-+$/, "");

  // Loop defensively even though a collision needs the same base plus the
  // same 4-character suffix.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `${base || "artisan"}-${suffix()}`;
    const taken = await ArtisanProfile.exists({ slug: candidate });
    if (!taken) return candidate;
  }

  return `${base || "artisan"}-${Date.now().toString(36)}`;
}
