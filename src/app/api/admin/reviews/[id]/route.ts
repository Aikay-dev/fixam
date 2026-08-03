import type { NextRequest } from "next/server";

import { fail, notFound, ok, parseBody, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/admin/audit";
import { authenticateRequest } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { recomputeRating } from "@/lib/reviews/aggregate";
import { moderateReviewSchema } from "@/lib/validation/review";
import { Review } from "@/models/review";

/**
 * Hide or restore a review.
 *
 * Hiding is not deleting. The document stays, so a professional who disputes
 * a review and loses cannot claim it never existed, and a moderator who hides
 * the wrong one can put it back. `hiddenReason` is recorded because "why is
 * my review gone" is the single most common support question a directory
 * gets, and "a moderator hid it" with no reason is not an answer.
 *
 * Every change recomputes the rating: a hidden review must stop counting
 * immediately, or the average silently disagrees with the visible list.
 */
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/reviews/[id]">,
) {
  const { id } = await ctx.params;

  const auth = await authenticateRequest({ role: "admin" });
  if (!auth.ok) return fail(auth.status, "Admins only.", auth.reason);

  const parsed = await parseBody(request, moderateReviewSchema);
  if (!parsed.ok) return parsed.response;

  try {
    await connectDB();

    const before = await Review.findById(id)
      .select("status hiddenReason artisanProfileId rating")
      .lean()
      .exec();

    if (!before) return notFound("That review no longer exists.");

    await Review.updateOne(
      { _id: id },
      {
        $set: {
          status: parsed.data.status,
          hiddenReason:
            parsed.data.status === "hidden"
              ? (parsed.data.hiddenReason ?? null)
              : null,
        },
      },
    ).exec();

    const rating = await recomputeRating(before.artisanProfileId);

    await recordAudit({
      adminUserId: auth.user.id,
      action: parsed.data.status === "hidden" ? "review.hide" : "review.publish",
      targetType: "Review",
      targetId: id,
      before: { status: before.status, hiddenReason: before.hiddenReason },
      after: { status: parsed.data.status, hiddenReason: parsed.data.hiddenReason ?? null },
      request,
    });

    return ok({ id, status: parsed.data.status, rating });
  } catch (error) {
    console.error("[admin/reviews] moderate failed", error);
    return serverError("Couldn't update that review.");
  }
}
