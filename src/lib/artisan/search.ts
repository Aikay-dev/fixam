import "server-only";

import type { PipelineStage } from "mongoose";
import { Types } from "mongoose";

import { PAGE_SIZE, PUBLIC_ARTISAN_STATUS } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import {
  PUBLIC_ARTISAN_PROJECTION,
  toPublicArtisan,
  type PublicArtisan,
} from "@/lib/serializers/artisan";
import { ArtisanProfile } from "@/models/artisan-profile";

/**
 * Directory search.
 *
 * Every query here is hard-scoped to `status: approved` and every result is
 * projected without the gated phone fields before it is serialised. Both, not
 * either — the projection means the numbers are never even loaded into memory,
 * so a future read path that forgets to serialise still cannot leak them.
 */

export type SortKey = "recommended" | "rating" | "reviews" | "newest";

export type SearchParams = {
  q?: string;
  categoryId?: string;
  stateId?: string;
  lgaId?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  acceptingOnly?: boolean;
  sort?: SortKey;
  page?: number;
  limit?: number;
};

export type SearchResult = {
  artisans: PublicArtisan[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
};

function isObjectId(value?: string): value is string {
  return Boolean(value && Types.ObjectId.isValid(value));
}

/**
 * Mongoose 9 removed the exported `FilterQuery` helper, and a structural type
 * would fight the dot-notation keys ("trades.categoryId") this filter needs.
 */
type Filter = Record<string, unknown>;

function buildFilter(params: SearchParams): Filter {
  // Non-negotiable: only approved profiles are ever visible.
  const filter: Filter = { status: PUBLIC_ARTISAN_STATUS };

  if (isObjectId(params.categoryId)) {
    filter["trades.categoryId"] = new Types.ObjectId(params.categoryId);
  }

  // An artisan matches a location if they're based there OR they list it as a
  // service area — a Lekki plumber who covers Ajah should show up in Ajah.
  if (isObjectId(params.lgaId)) {
    const lgaId = new Types.ObjectId(params.lgaId);
    filter.$or = [
      { "location.lgaId": lgaId },
      { "serviceAreas.lgaIds": lgaId },
    ];
  } else if (isObjectId(params.stateId)) {
    const stateId = new Types.ObjectId(params.stateId);
    filter.$or = [
      { "location.stateId": stateId },
      { "serviceAreas.stateId": stateId },
    ];
  }

  if (params.minRating && params.minRating > 0) {
    filter["rating.average"] = { $gte: params.minRating };
  }

  if (params.verifiedOnly) filter.isVerified = true;
  if (params.acceptingOnly) filter["availability.acceptingJobs"] = true;

  if (params.q?.trim()) {
    filter.$text = { $search: params.q.trim() };
  }

  return filter;
}

/**
 * Sort spec. Not `Record<string, 1 | -1>` because the relevance sort uses
 * `{ $meta: "textScore" }`, which is neither.
 */
type SortSpec = Record<string, 1 | -1 | { $meta: "textScore" }>;

function buildSort(sort: SortKey | undefined, hasQuery: boolean): SortSpec {
  switch (sort) {
    case "rating":
      return { "rating.average": -1, "rating.count": -1 };
    case "reviews":
      return { "rating.count": -1, "rating.average": -1 };
    case "newest":
      return { publishedAt: -1 };
    default:
      // "Recommended": text relevance first when searching, then the trust
      // signals. isFeatured is in here for Stage Two but is always false today.
      return hasQuery
        ? { score: { $meta: "textScore" }, "rating.average": -1 }
        : {
            isFeatured: -1,
            isVerified: -1,
            "rating.average": -1,
            "rating.count": -1,
            publishedAt: -1,
          };
  }
}

export async function searchArtisans(
  params: SearchParams,
): Promise<SearchResult> {
  await connectDB();

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(60, Math.max(1, params.limit ?? PAGE_SIZE.directory));
  const skip = (page - 1) * limit;

  const filter = buildFilter(params);
  const hasQuery = Boolean(params.q?.trim());
  const sort = buildSort(params.sort, hasQuery);

  const projection = hasQuery
    ? { ...PUBLIC_ARTISAN_PROJECTION, score: { $meta: "textScore" } }
    : PUBLIC_ARTISAN_PROJECTION;

  const [docs, total] = await Promise.all([
    ArtisanProfile.find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    ArtisanProfile.countDocuments(filter),
  ]);

  return {
    artisans: docs.map(toPublicArtisan),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasMore: skip + docs.length < total,
  };
}

/** A single approved artisan by slug, with the phone fields never loaded. */
export async function getPublicArtisanBySlug(
  slug: string,
): Promise<PublicArtisan | null> {
  await connectDB();

  const doc = await ArtisanProfile.findOne(
    { slug: slug.toLowerCase(), status: PUBLIC_ARTISAN_STATUS },
    PUBLIC_ARTISAN_PROJECTION,
  )
    .lean()
    .exec();

  return doc ? toPublicArtisan(doc) : null;
}

/**
 * Does this category/location combination have anyone in it?
 *
 * Used to 404 empty SEO landing pages. ~82 trades across 774 LGAs is 63,000
 * possible URLs; publishing the empty ones is a doorway-page penalty, not an
 * SEO strategy.
 */
export async function hasArtisansFor(params: {
  categoryId?: string;
  stateId?: string;
  lgaId?: string;
}): Promise<boolean> {
  await connectDB();
  const exists = await ArtisanProfile.exists(buildFilter(params));
  return Boolean(exists);
}

/** Counts per category, for the directory's facet counts. */
export async function countByCategory(
  scope: { stateId?: string; lgaId?: string } = {},
): Promise<Record<string, number>> {
  await connectDB();

  const pipeline: PipelineStage[] = [
    { $match: buildFilter(scope) },
    { $unwind: "$trades" },
    { $group: { _id: "$trades.categoryId", count: { $sum: 1 } } },
  ];

  const rows = await ArtisanProfile.aggregate(pipeline).exec();

  return Object.fromEntries(
    rows.map((r: { _id: unknown; count: number }) => [String(r._id), r.count]),
  );
}
