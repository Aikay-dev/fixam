import type { NextRequest } from "next/server";

import { fail, ok, parseBody, serverError } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { respondToReviewSchema } from "@/lib/validation/review";
import { ArtisanProfile } from "@/models/artisan-profile";
import { Review } from "@/models/review";

/**
 * The right of reply.
 *
 * A bad review with a calm, specific response often reads better than no bad
 * reviews at all, so this exists for the professional's benefit as much as
 * the customer's. It does NOT change the rating — a reply is context, not a
 * negotiation, and letting a response move the score would make replying a
 * form of score repair.
 *
 * One response per review, editable. Editing rather than threading keeps the
 * public page readable and stops a review turning into an argument.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/reviews/[id]/respond">,
) {
  const { id } = await ctx.params;

  const auth = await authenticateRequest({ requireVerified: true });
  if (!auth.ok) {
    return fail(auth.status, "Sign in to reply.", auth.reason);
  }

  const parsed = await parseBody(request, respondToReviewSchema);
  if (!parsed.ok) return parsed.response;

  try {
    await connectDB();

    const review = await Review.findById(id).select("artisanProfileId").lean().exec();
    if (!review) return fail(404, "That review no longer exists.", "not_found");

    // Ownership is checked through the profile, not through a field on the
    // review: the only person who may reply is the one whose profile it is on.
    const profile = await ArtisanProfile.findById(review.artisanProfileId)
      .select("userId")
      .lean()
      .exec();

    if (!profile || String(profile.userId) !== auth.user.id) {
      return fail(403, "That isn't your review to answer.", "not_owner");
    }

    await Review.updateOne(
      { _id: id },
      {
        $set: {
          "artisanResponse.body": parsed.data.body,
          "artisanResponse.respondedAt": new Date(),
        },
      },
    ).exec();

    return ok({ id });
  } catch (error) {
    console.error("[reviews] respond failed", error);
    return serverError("Couldn't save your reply right now.");
  }
}
