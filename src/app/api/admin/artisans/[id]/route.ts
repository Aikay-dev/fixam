import type { NextRequest } from "next/server";
import { z } from "zod";

import { badRequest, fail, notFound, ok, parseBody, serverError } from "@/lib/api";
import { recordAudit, type AuditAction } from "@/lib/admin/audit";
import { authenticateRequest } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import {
  sendProfileApprovedEmail,
  sendProfileRejectedEmail,
} from "@/lib/email/mailers";
import { ArtisanProfile } from "@/models/artisan-profile";
import { Category } from "@/models/category";
import { Lga, State } from "@/models/location";
import { User } from "@/models/user";

/**
 * Moderation actions on an artisan profile.
 *
 * This is the human gate the whole "vetted" promise rests on: nothing reaches
 * the public directory or Google without an admin approving it here.
 */

const schema = z
  .object({
    action: z.enum([
      "approve",
      "reject",
      "verify",
      "unverify",
      "suspend",
      "unsuspend",
      "feature",
      "unfeature",
    ]),
    /** Required for reject and suspend — it goes straight into the email. */
    reason: z.string().trim().max(600).optional(),
  })
  .refine(
    (v) => !["reject", "suspend"].includes(v.action) || Boolean(v.reason?.trim()),
    { message: "Tell the artisan what to change.", path: ["reason"] },
  );

const AUDIT: Record<string, AuditAction> = {
  approve: "artisan.approve",
  reject: "artisan.reject",
  verify: "artisan.verify",
  unverify: "artisan.unverify",
  suspend: "artisan.suspend",
  unsuspend: "artisan.unsuspend",
  feature: "artisan.feature",
  unfeature: "artisan.feature",
};

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/artisans/[id]">,
) {
  const auth = await authenticateRequest({ role: "admin" });
  if (!auth.ok) return fail(auth.status, "Admins only.", auth.reason);

  const { id } = await ctx.params;
  if (!/^[a-f\d]{24}$/i.test(id)) return notFound();

  const parsed = await parseBody(request, schema);
  if (!parsed.ok) return parsed.response;

  const { action, reason } = parsed.data;

  try {
    await connectDB();

    const profile = await ArtisanProfile.findById(id).exec();
    if (!profile) return notFound("Artisan not found.");

    const before = {
      status: profile.status,
      isVerified: profile.isVerified,
      isFeatured: profile.isFeatured,
    };

    const now = new Date();
    const $set: Record<string, unknown> = {};

    switch (action) {
      case "approve": {
        if (!profile.phone) {
          return badRequest(
            "This profile has no phone number — approving it would put an uncontactable artisan in the directory.",
          );
        }
        $set.status = "approved";
        $set.rejectionReason = null;
        $set.reviewedBy = auth.user.id;
        // publishedAt is set once and never moved: it is the "newest" sort key
        // and re-approving after an edit shouldn't jump them to the top.
        if (!profile.publishedAt) $set.publishedAt = now;
        break;
      }
      case "reject":
        $set.status = "rejected";
        $set.rejectionReason = reason;
        $set.reviewedBy = auth.user.id;
        break;
      case "verify":
        $set.isVerified = true;
        $set.verifiedAt = now;
        $set.verifiedBy = auth.user.id;
        break;
      case "unverify":
        $set.isVerified = false;
        $set.verifiedAt = null;
        $set.verifiedBy = null;
        break;
      case "suspend":
        $set.status = "suspended";
        $set.rejectionReason = reason;
        $set.reviewedBy = auth.user.id;
        break;
      case "unsuspend":
        // Back to the queue, not straight live — a suspension means something
        // was wrong, and it should be re-checked before customers see it.
        $set.status = "pending_review";
        $set.rejectionReason = null;
        break;
      case "feature":
        $set.isFeatured = true;
        break;
      case "unfeature":
        $set.isFeatured = false;
        $set.featuredUntil = null;
        break;
    }

    const updated = await ArtisanProfile.findOneAndUpdate(
      { _id: profile._id },
      { $set },
      { returnDocument: "after" },
    ).exec();

    if (!updated) return serverError();

    // Keep denormalised counts honest — they drive directory facets and the
    // home page, and a stale count is a link to an empty page.
    if (action === "approve" || action === "reject" || action === "suspend") {
      const delta = action === "approve" ? 1 : -1;
      const wasPublic = before.status === "approved";
      const isPublic = updated.status === "approved";

      if (wasPublic !== isPublic) {
        const categoryIds = (updated.trades ?? []).map((t) => t.categoryId);
        await Promise.all([
          Category.updateMany(
            { _id: { $in: categoryIds } },
            { $inc: { artisanCount: isPublic ? 1 : -1 } },
          ),
          updated.location?.stateId
            ? State.updateOne(
                { _id: updated.location.stateId },
                { $inc: { artisanCount: isPublic ? 1 : -1 } },
              )
            : Promise.resolve(),
          updated.location?.lgaId
            ? Lga.updateOne(
                { _id: updated.location.lgaId },
                { $inc: { artisanCount: isPublic ? 1 : -1 } },
              )
            : Promise.resolve(),
        ]);
      }
      void delta;
    }

    await recordAudit({
      adminUserId: auth.user.id,
      action: AUDIT[action]!,
      targetType: "ArtisanProfile",
      targetId: id,
      before,
      after: {
        status: updated.status,
        isVerified: updated.isVerified,
        isFeatured: updated.isFeatured,
      },
      note: reason ?? "",
      request,
    });

    // Tell the artisan. Queued — a slow mail provider must not hold up the
    // admin's queue.
    const owner = await User.findById(updated.userId)
      .select("email name")
      .lean()
      .exec();

    if (owner?.email) {
      const recipient = {
        userId: String(updated.userId),
        email: owner.email,
        name: updated.displayName || owner.name || undefined,
      };

      if (action === "approve") {
        sendProfileApprovedEmail({ ...recipient, slug: updated.slug });
      } else if (action === "reject") {
        sendProfileRejectedEmail({ ...recipient, reason: reason! });
      }
    }

    return ok({
      id,
      status: updated.status,
      isVerified: updated.isVerified,
      isFeatured: updated.isFeatured,
    });
  } catch (error) {
    console.error("[admin/artisans PATCH] failed", error);
    return serverError();
  }
}
