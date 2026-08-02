import "server-only";

import { Types } from "mongoose";

import { PUBLIC_ARTISAN_STATUS } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { ArtisanProfile } from "@/models/artisan-profile";
import { Category } from "@/models/category";
import { Lga, State } from "@/models/location";

/**
 * Shared data loading for the /services/* landing pages.
 *
 * These are the local-SEO pages — "plumber in Lekki" is what someone actually
 * types into Google, and this is the page that should answer it.
 *
 * ⚠️ The thin-content guard is the important part. ~82 trades across 774 LGAs
 * is over 60,000 possible URLs. Publishing the empty ones is a doorway-page
 * penalty, not an SEO strategy, so a combination with no approved artisans
 * 404s rather than rendering "0 results".
 */

export type ServiceScope = {
  category: { id: string; name: string; slug: string; description: string; introCopy: string; seoTitle: string; seoDescription: string };
  state: { id: string; name: string; slug: string } | null;
  lga: { id: string; name: string; slug: string; popularAreas: string[] } | null;
};

/** Resolve slugs to documents. Returns null if any slug is unknown. */
export async function resolveScope(params: {
  category: string;
  state?: string;
  lga?: string;
}): Promise<ServiceScope | null> {
  await connectDB();

  const category = await Category.findOne({
    slug: params.category.toLowerCase(),
    isActive: true,
    parentId: { $ne: null },
  })
    .select("name slug description introCopy seoTitle seoDescription")
    .lean()
    .exec();

  if (!category) return null;

  let state = null;
  let lga = null;

  if (params.state) {
    state = await State.findOne({
      slug: params.state.toLowerCase(),
      isActive: true,
    })
      .select("name slug")
      .lean()
      .exec();

    if (!state) return null;

    if (params.lga) {
      lga = await Lga.findOne({
        stateId: state._id,
        slug: params.lga.toLowerCase(),
        isActive: true,
      })
        .select("name slug popularAreas")
        .lean()
        .exec();

      if (!lga) return null;
    }
  }

  return {
    category: {
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      introCopy: category.introCopy ?? "",
      seoTitle: category.seoTitle ?? "",
      seoDescription: category.seoDescription ?? "",
    },
    state: state ? { id: String(state._id), name: state.name, slug: state.slug } : null,
    lga: lga
      ? {
          id: String(lga._id),
          name: lga.name,
          slug: lga.slug,
          popularAreas: lga.popularAreas ?? [],
        }
      : null,
  };
}

/** Human-readable place name for headings and metadata. */
export function scopeLocationLabel(scope: ServiceScope): string {
  if (scope.lga && scope.state) return `${scope.lga.name}, ${scope.state.name}`;
  if (scope.state) return scope.state.name;
  return "Nigeria";
}

/** Canonical path for a scope. */
export function scopePath(scope: ServiceScope): string {
  const parts = ["/services", scope.category.slug];
  if (scope.state) parts.push(scope.state.slug);
  if (scope.lga) parts.push(scope.lga.slug);
  return parts.join("/");
}

/**
 * Sibling LGAs within the same state that also have artisans for this trade.
 *
 * Real internal linking, not a footer dump: it only links places that
 * actually have someone, which is both useful to a visitor and what makes
 * these pages discoverable to a crawler.
 */
export async function nearbyLgasWithArtisans(
  categoryId: string,
  stateId: string,
  excludeLgaId?: string,
  limit = 12,
): Promise<{ name: string; slug: string; count: number }[]> {
  await connectDB();

  const rows = await ArtisanProfile.aggregate([
    {
      $match: {
        status: PUBLIC_ARTISAN_STATUS,
        "trades.categoryId": { $eq: toObjectId(categoryId) },
        "location.stateId": { $eq: toObjectId(stateId) },
        ...(excludeLgaId
          ? { "location.lgaId": { $ne: toObjectId(excludeLgaId) } }
          : {}),
      },
    },
    { $group: { _id: "$location.lgaId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "lgas",
        localField: "_id",
        foreignField: "_id",
        as: "lga",
      },
    },
    { $unwind: "$lga" },
    { $project: { name: "$lga.name", slug: "$lga.slug", count: 1 } },
  ]).exec();

  return rows as { name: string; slug: string; count: number }[];
}

/**
 * Trades that currently have at least one approved artisan.
 *
 * Used to point visitors from an empty trade page at ones where somebody is
 * actually available, and by the footer so it stops advertising dead ends.
 */
export async function tradesWithArtisans(
  limit = 12,
): Promise<{ name: string; slug: string; count: number }[]> {
  await connectDB();

  const rows = await ArtisanProfile.aggregate([
    { $match: { status: PUBLIC_ARTISAN_STATUS } },
    { $unwind: "$trades" },
    { $group: { _id: "$trades.categoryId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    { $project: { name: "$category.name", slug: "$category.slug", count: 1 } },
  ]).exec();

  return rows as { name: string; slug: string; count: number }[];
}

/** States that have artisans for this trade, for the national page. */
export async function statesWithArtisans(
  categoryId: string,
  limit = 12,
): Promise<{ name: string; slug: string; count: number }[]> {
  await connectDB();

  const rows = await ArtisanProfile.aggregate([
    {
      $match: {
        status: PUBLIC_ARTISAN_STATUS,
        "trades.categoryId": { $eq: toObjectId(categoryId) },
      },
    },
    { $group: { _id: "$location.stateId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "states",
        localField: "_id",
        foreignField: "_id",
        as: "state",
      },
    },
    { $unwind: "$state" },
    { $project: { name: "$state.name", slug: "$state.slug", count: 1 } },
  ]).exec();

  return rows as { name: string; slug: string; count: number }[];
}

/**
 * Other trades offered by artisans in this area.
 *
 * Multi-trade artisans make this genuinely useful — the plumber in Lekki
 * often also tiles, so "people here also do…" is real information rather
 * than filler links.
 */
export async function relatedTradesInArea(
  categoryId: string,
  scope: { stateId?: string; lgaId?: string },
  limit = 8,
): Promise<{ name: string; slug: string; count: number }[]> {
  await connectDB();

  const match: Record<string, unknown> = { status: PUBLIC_ARTISAN_STATUS };
  if (scope.lgaId) match["location.lgaId"] = { $eq: toObjectId(scope.lgaId) };
  else if (scope.stateId)
    match["location.stateId"] = { $eq: toObjectId(scope.stateId) };

  const rows = await ArtisanProfile.aggregate([
    { $match: match },
    { $unwind: "$trades" },
    { $match: { "trades.categoryId": { $ne: toObjectId(categoryId) } } },
    { $group: { _id: "$trades.categoryId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    { $project: { name: "$category.name", slug: "$category.slug", count: 1 } },
  ]).exec();

  return rows as { name: string; slug: string; count: number }[];
}

/** Aggregation pipelines need real ObjectIds; callers pass plain strings. */
function toObjectId(id: string) {
  return Types.ObjectId.createFromHexString(id);
}
