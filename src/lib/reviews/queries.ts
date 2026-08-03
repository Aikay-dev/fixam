import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { toPublicReview, type PublicReview } from "@/lib/serializers/review";
import { Review } from "@/models/review";

export type ReviewPage = {
  reviews: PublicReview[];
  total: number;
  hasMore: boolean;
};

/**
 * Published reviews for one profile, newest first.
 *
 * Uses an aggregation rather than .populate() so the customer's name and the
 * job category arrive in one round trip. `$lookup` with a pipeline keeps the
 * joined documents narrow: the users collection holds password hashes and
 * email addresses, and none of that should travel just to render "Chidi O."
 */
export async function getProfileReviews(
  artisanProfileId: string | Types.ObjectId,
  { limit = 10, skip = 0 }: { limit?: number; skip?: number } = {},
): Promise<ReviewPage> {
  await connectDB();

  // Cast explicitly. An aggregation `$match` does NOT go through Mongoose's
  // casting — a string id here matches nothing and fails silently, which is
  // the worst possible failure mode for a review list.
  const match = {
    artisanProfileId: toObjectId(artisanProfileId),
    status: "published" as const,
  };

  const [rows, total] = await Promise.all([
    Review.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          let: { uid: "$customerUserId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
            { $project: { name: 1 } },
          ],
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          let: { cid: "$jobCategoryId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$cid"] } } },
            { $project: { name: 1 } },
          ],
          as: "jobCategory",
        },
      },
      { $unwind: { path: "$jobCategory", preserveNullAndEmptyArrays: true } },
    ]).exec(),
    Review.countDocuments(match).exec(),
  ]);

  return {
    reviews: rows.map(toPublicReview),
    total,
    hasMore: skip + rows.length < total,
  };
}

/**
 * The leads this customer could still review.
 *
 * A review requires a lead, and one lead yields at most one review, so the
 * eligible set is "my leads minus the ones already reviewed". Computed with a
 * lookup rather than two queries so it stays correct as the list grows.
 */
export async function getReviewableLeads(customerUserId: string) {
  await connectDB();
  const { Lead } = await import("@/models/lead");

  return Lead.aggregate([
    { $match: { customerUserId: toId(customerUserId) } },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "leadId",
        as: "review",
      },
    },
    { $match: { review: { $size: 0 } } },
    { $sort: { revealedAt: -1 } },
  ]).exec();
}

function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

const toId = toObjectId;
