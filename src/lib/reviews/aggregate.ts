import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { ArtisanProfile } from "@/models/artisan-profile";
import { Review } from "@/models/review";

/**
 * Recompute a profile's rating from its published reviews.
 *
 * `ArtisanProfile.rating` is denormalised so the directory can sort and
 * filter without joining every review on every query. Denormalised numbers
 * drift, so there is exactly ONE function allowed to write them — this one —
 * and every path that changes a review's visibility calls it: creating,
 * hiding, publishing, deleting.
 *
 * It recomputes from scratch rather than incrementing. Incrementing is faster
 * and wrong: a moderator hiding a 1-star review would need the old value to
 * back it out, and any missed call leaves a number nobody can explain. A full
 * recount of one profile's reviews is a single indexed aggregation.
 *
 * Only `published` reviews count. A review awaiting moderation must not move
 * the average, or hiding it later becomes visible as a score change.
 */
export async function recomputeRating(
  artisanProfileId: string | Types.ObjectId,
): Promise<{ average: number; count: number }> {
  await connectDB();

  const rows = await Review.aggregate<{ _id: number; n: number }>([
    { $match: { artisanProfileId: toObjectId(artisanProfileId), status: "published" } },
    { $group: { _id: "$rating", n: { $sum: 1 } } },
  ]).exec();

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  let total = 0;
  let sum = 0;

  for (const row of rows) {
    const star = row._id as 1 | 2 | 3 | 4 | 5;
    if (star < 1 || star > 5) continue;
    breakdown[star] = row.n;
    total += row.n;
    sum += star * row.n;
  }

  // One decimal place, matching how it is displayed. Storing 4.866666… and
  // rounding at render time means the stored value never equals what anyone
  // sees, which makes every rating bug harder to reason about.
  const average = total === 0 ? 0 : Math.round((sum / total) * 10) / 10;

  await ArtisanProfile.updateOne(
    { _id: artisanProfileId },
    {
      $set: {
        "rating.average": average,
        "rating.count": total,
        "rating.breakdown": breakdown,
        "stats.reviewCount": total,
      },
    },
  ).exec();

  return { average, count: total };
}

function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

/**
 * Rebuild every profile's rating. Used by the reconcile script and after any
 * bulk import, where calling recomputeRating() per profile would be N queries.
 */
export async function recomputeAllRatings({
  dryRun = false,
}: { dryRun?: boolean } = {}): Promise<{ checked: number; corrected: string[] }> {
  await connectDB();

  const rows = await Review.aggregate<{
    _id: Types.ObjectId;
    ratings: number[];
  }>([
    { $match: { status: "published" } },
    { $group: { _id: "$artisanProfileId", ratings: { $push: "$rating" } } },
  ]).exec();

  const byProfile = new Map(rows.map((r) => [String(r._id), r.ratings]));

  // Every profile is visited, not just those with reviews — a profile whose
  // last review was hidden must fall back to zero, and it has no row here.
  const profiles = await ArtisanProfile.find({})
    .select("_id rating")
    .lean()
    .exec();

  const corrected: string[] = [];

  for (const profile of profiles) {
    const ratings = byProfile.get(String(profile._id)) ?? [];
    const count = ratings.length;
    const average =
      count === 0
        ? 0
        : Math.round((ratings.reduce((a, b) => a + b, 0) / count) * 10) / 10;

    const stored = profile.rating ?? { average: 0, count: 0 };
    if (stored.average === average && stored.count === count) continue;

    corrected.push(String(profile._id));
    if (dryRun) continue;

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<string, number>;
    for (const r of ratings) breakdown[String(r)] = (breakdown[String(r)] ?? 0) + 1;

    await ArtisanProfile.updateOne(
      { _id: profile._id },
      {
        $set: {
          "rating.average": average,
          "rating.count": count,
          "rating.breakdown": breakdown,
          "stats.reviewCount": count,
        },
      },
    ).exec();
  }

  return { checked: profiles.length, corrected };
}
