import "server-only";

import type { HydratedDocument } from "mongoose";

import { connectDB } from "@/lib/db";
import { generateArtisanSlug } from "@/lib/slug";
import { ArtisanProfile, type ArtisanProfileDoc } from "@/models/artisan-profile";
import { Category } from "@/models/category";
import { Lga } from "@/models/location";

/**
 * Shared artisan-profile operations used by the dashboard routes.
 */

/**
 * Returns the caller's profile, creating an empty draft on first visit.
 *
 * Typed as HydratedDocument, not the plain schema type, so callers get `_id`
 * and the document methods.
 */
export async function getOrCreateProfile(
  userId: string,
  displayName: string,
): Promise<HydratedDocument<ArtisanProfileDoc>> {
  await connectDB();

  const existing = await ArtisanProfile.findOne({ userId }).exec();
  if (existing) return existing;

  // The slug is provisional — it is regenerated on first submit, once the
  // trade and area are known and can be baked into the URL for SEO.
  const slug = await generateArtisanSlug({ displayName });

  return ArtisanProfile.create({
    userId,
    slug,
    displayName,
    status: "draft",
  });
}

/**
 * Rebuild the denormalised search keywords.
 *
 * Copies trade names plus their Nigerian synonyms onto the profile so the
 * text index covers "AC guy" and "fridge engineer" without joining Category
 * at query time.
 */
export async function rebuildSearchKeywords(
  profile: HydratedDocument<ArtisanProfileDoc>,
): Promise<string[]> {
  const categoryIds = (profile.trades ?? []).map((t) => t.categoryId);
  if (categoryIds.length === 0) return [];

  const categories = await Category.find({ _id: { $in: categoryIds } })
    .select("name synonyms")
    .lean()
    .exec();

  const keywords = new Set<string>();

  for (const category of categories) {
    keywords.add(category.name);
    for (const synonym of category.synonyms ?? []) keywords.add(synonym);
  }

  if (profile.location?.areaText) keywords.add(profile.location.areaText);

  return [...keywords];
}

/**
 * Regenerate the public slug from the profile's current trade and area.
 *
 * Only ever called before first publish. Once a profile is live its URL is
 * frozen: changing it would break inbound links and throw away accumulated
 * search ranking.
 */
export async function refreshSlugIfUnpublished(
  profile: HydratedDocument<ArtisanProfileDoc>,
): Promise<string> {
  if (profile.publishedAt) return profile.slug;

  const primary =
    profile.trades?.find((t) => t.isPrimary) ?? profile.trades?.[0];

  const [category, lga] = await Promise.all([
    primary
      ? Category.findById(primary.categoryId).select("name").lean().exec()
      : null,
    profile.location?.lgaId
      ? Lga.findById(profile.location.lgaId).select("name").lean().exec()
      : null,
  ]);

  return generateArtisanSlug({
    displayName: profile.displayName,
    tradeName: category?.name ?? null,
    areaName: profile.location?.areaText || lga?.name || null,
  });
}
