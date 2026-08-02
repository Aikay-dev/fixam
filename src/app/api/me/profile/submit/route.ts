import { authenticateRequest } from "@/lib/auth/session";
import { badRequest, fail, ok, serverError } from "@/lib/api";
import {
  getOrCreateProfile,
  rebuildSearchKeywords,
  refreshSlugIfUnpublished,
} from "@/lib/artisan/service";
import { connectDB } from "@/lib/db";
import { sendProfileSubmittedEmail } from "@/lib/email/mailers";
import { toOwnerArtisan } from "@/lib/serializers/artisan";
import { profileCompleteness } from "@/lib/validation/artisan";
import { ArtisanProfile } from "@/models/artisan-profile";
import { getPlatformConfig } from "@/models/platform-config";

/**
 * Submit a profile for admin review.
 *
 * Nothing becomes publicly visible or indexable here — approval is a human
 * step in /admin/professionals. That gate is what keeps fake listings out of the
 * directory and out of Google, which is the whole "vetted" promise.
 */
export async function POST() {
  const auth = await authenticateRequest({ requireVerified: true, role: "artisan" });
  if (!auth.ok) {
    return fail(auth.status, "Artisan account required.", auth.reason);
  }

  try {
    await connectDB();
    const profile = await getOrCreateProfile(auth.user.id, auth.user.name ?? "");

    if (profile.status === "suspended") {
      return fail(403, "This profile is suspended.", "suspended");
    }

    if (profile.status === "pending_review") {
      return ok({
        profile: toOwnerArtisan(profile),
        alreadyPending: true,
      });
    }

    const completeness = profileCompleteness(profile);
    if (!completeness.canSubmit) {
      return badRequest(
        `Still missing: ${completeness.missingRequired.join(", ")}.`,
        { missingRequired: completeness.missingRequired },
      );
    }

    const config = await getPlatformConfig();

    // Freeze the URL at first publish; regenerate before that so the slug
    // can pick up the trade and area for SEO.
    const slug = await refreshSlugIfUnpublished(profile);
    const keywords = await rebuildSearchKeywords(profile);

    // autoPublishArtisans exists for a future policy change; the default is
    // false and approval stays a human decision.
    const nextStatus = config.autoPublishArtisans ? "approved" : "pending_review";

    const updated = await ArtisanProfile.findOneAndUpdate(
      { _id: profile._id },
      {
        $set: {
          status: nextStatus,
          slug,
          searchKeywords: keywords,
          submittedAt: new Date(),
          rejectionReason: null,
          ...(nextStatus === "approved" && !profile.publishedAt
            ? { publishedAt: new Date() }
            : {}),
        },
      },
      { returnDocument: "after" },
    ).exec();

    if (!updated) return serverError();

    sendProfileSubmittedEmail({
      userId: auth.user.id,
      email: auth.user.email ?? "",
      name: updated.displayName,
    });

    return ok({
      profile: toOwnerArtisan(updated),
      status: nextStatus,
    });
  } catch (error) {
    console.error("[me/profile/submit] failed", error);
    return serverError("Couldn't submit your profile.");
  }
}
