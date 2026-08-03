import type { NextRequest } from "next/server";

import {
  created,
  fail,
  parseBody,
  serverError,
  tooManyRequests,
} from "@/lib/api";
import { authenticateRequest } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { sendNewReviewEmail } from "@/lib/email/mailers";
import { checkRateLimit } from "@/lib/rate-limit";
import { recomputeRating } from "@/lib/reviews/aggregate";
import { createReviewSchema } from "@/lib/validation/review";
import { ArtisanProfile } from "@/models/artisan-profile";
import { Lead } from "@/models/lead";
import { Review } from "@/models/review";
import { User } from "@/models/user";

/**
 * Post a review.
 *
 * The gate is the lead, not the rating. To leave a review you must hold a
 * Lead for this professional — which means a verified account actually
 * revealed their number — and each lead yields exactly one review. That is
 * what separates Fixam's reviews from every directory where anyone can rate
 * anyone: a competitor cannot review you without first appearing in your
 * leads list under their own verified account.
 *
 * The unique index on Review.leadId is the real guarantee. The lookup below
 * is a courtesy that produces a good error message; the index is what holds
 * under two concurrent submissions.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest({ requireVerified: true });
  if (!auth.ok) {
    const messages: Record<string, string> = {
      unauthenticated: "Sign in to leave a review.",
      unverified: "Verify your email address before reviewing.",
      suspended: "This account has been suspended.",
    };
    return fail(auth.status, messages[auth.reason] ?? "You can't do that.", auth.reason);
  }

  const parsed = await parseBody(request, createReviewSchema);
  if (!parsed.ok) return parsed.response;

  const limit = await checkRateLimit("review", auth.user.id);
  if (!limit.allowed) {
    return tooManyRequests(
      "You've left a lot of reviews today. Try again tomorrow.",
      limit.resetAt,
    );
  }

  try {
    await connectDB();

    // The lead must be THIS customer's. Without the customerUserId condition
    // anyone holding a lead id could review on someone else's behalf.
    const lead = await Lead.findOne({
      _id: parsed.data.leadId,
      customerUserId: auth.user.id,
    }).exec();

    if (!lead) {
      return fail(
        403,
        "You can only review someone whose number you've taken.",
        "no_lead",
      );
    }

    const existing = await Review.findOne({ leadId: lead._id }).select("_id").lean().exec();
    if (existing) {
      return fail(409, "You've already reviewed this contact.", "already_reviewed");
    }

    const profile = await ArtisanProfile.findById(lead.artisanProfileId)
      .select("displayName userId")
      .lean()
      .exec();

    if (!profile) return fail(404, "That profile no longer exists.", "not_found");

    let review;
    try {
      review = await Review.create({
        leadId: lead._id,
        artisanProfileId: lead.artisanProfileId,
        customerUserId: auth.user.id,
        rating: parsed.data.rating,
        title: parsed.data.title,
        body: parsed.data.body,
        // The category the customer was browsing when they made contact. It
        // is the closest thing we have to "what the job was", and it is not
        // asked for again — every extra field costs completions.
        jobCategoryId: lead.categoryId ?? null,
        jobDate: parsed.data.jobDate ?? null,
        status: "published",
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        return fail(409, "You've already reviewed this contact.", "already_reviewed");
      }
      throw error;
    }

    // Link back so /account/contacts can show "reviewed" without a join.
    await Lead.updateOne({ _id: lead._id }, { $set: { reviewId: review._id } }).exec();

    const rating = await recomputeRating(lead.artisanProfileId);

    const artisanUser = await User.findById(profile.userId)
      .select("email notificationPrefs")
      .lean()
      .exec();

    if (artisanUser?.email && artisanUser.notificationPrefs?.reviewAlerts !== false) {
      sendNewReviewEmail({
        userId: String(profile.userId),
        email: artisanUser.email,
        name: profile.displayName,
        reviewerFirstName: (auth.user.name ?? "A customer").split(" ")[0]!,
        rating: parsed.data.rating,
        body: parsed.data.body,
      });
    }

    return created({ id: String(review._id), rating });
  } catch (error) {
    console.error("[reviews] create failed", error);
    return serverError("Couldn't save your review right now.");
  }
}
