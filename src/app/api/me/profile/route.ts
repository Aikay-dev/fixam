import type { NextRequest } from "next/server";

import { authenticateRequest } from "@/lib/auth/session";
import { fail, ok, parseBody, serverError } from "@/lib/api";
import {
  getOrCreateProfile,
  rebuildSearchKeywords,
} from "@/lib/artisan/service";
import { connectDB } from "@/lib/db";
import { toOwnerArtisan } from "@/lib/serializers/artisan";
import {
  profileCompleteness,
  profileUpdateSchema,
} from "@/lib/validation/artisan";
import { ArtisanProfile } from "@/models/artisan-profile";

/** The artisan's own profile — includes contact details and moderation state. */
export async function GET() {
  const auth = await authenticateRequest({ role: "artisan" });
  if (!auth.ok) {
    return fail(auth.status, "Artisan account required.", auth.reason);
  }

  try {
    const profile = await getOrCreateProfile(
      auth.user.id,
      auth.user.name ?? "",
    );

    return ok({
      profile: toOwnerArtisan(profile),
      completeness: profileCompleteness(profile),
    });
  } catch (error) {
    console.error("[me/profile GET] failed", error);
    return serverError();
  }
}

/**
 * Partial update. Each editor step PATCHes only its own section, so an
 * artisan on a flaky connection never loses a completed step to a failure
 * three steps later.
 */
export async function PATCH(request: NextRequest) {
  const auth = await authenticateRequest({ requireVerified: true, role: "artisan" });
  if (!auth.ok) {
    return fail(auth.status, "Artisan account required.", auth.reason);
  }

  const parsed = await parseBody(request, profileUpdateSchema);
  if (!parsed.ok) return parsed.response;

  const input = parsed.data;

  try {
    await connectDB();
    const profile = await getOrCreateProfile(auth.user.id, auth.user.name ?? "");

    // A suspended profile is read-only until an admin lifts it.
    if (profile.status === "suspended") {
      return fail(
        403,
        "This profile is suspended. Contact support@fixam.ng.",
        "suspended",
      );
    }

    const $set: Record<string, unknown> = {};

    if (input.basics) {
      if (input.basics.displayName !== undefined)
        $set.displayName = input.basics.displayName;
      if (input.basics.bio !== undefined) $set.bio = input.basics.bio;
      if (input.basics.yearsExperience !== undefined)
        $set.yearsExperience = input.basics.yearsExperience;
    }

    if (input.trades) {
      // Exactly one primary trade — it drives the slug and the default
      // category on any lead created from a direct profile visit.
      const trades = input.trades.map((t, i) => ({
        categoryId: t.categoryId,
        isPrimary: input.trades!.some((x) => x.isPrimary) ? t.isPrimary : i === 0,
      }));
      const primaryCount = trades.filter((t) => t.isPrimary).length;
      if (primaryCount > 1) {
        let seen = false;
        for (const t of trades) {
          if (t.isPrimary && seen) t.isPrimary = false;
          else if (t.isPrimary) seen = true;
        }
      }
      $set.trades = trades;
    }

    if (input.contact) {
      if (input.contact.phone !== undefined) {
        $set.phone = input.contact.phone;
        // Default WhatsApp to the main number — for most artisans they are
        // the same, and an empty WhatsApp would hide the primary CTA.
        if (input.contact.whatsapp === undefined && !profile.whatsapp) {
          $set.whatsapp = input.contact.phone;
        }
      }
      if (input.contact.whatsapp !== undefined)
        $set.whatsapp = input.contact.whatsapp;
      if (input.contact.alternatePhone !== undefined)
        $set.alternatePhone = input.contact.alternatePhone;
    }

    if (input.location) {
      const l = input.location;
      if (l.stateId !== undefined) $set["location.stateId"] = l.stateId;
      if (l.lgaId !== undefined) $set["location.lgaId"] = l.lgaId;
      if (l.areaText !== undefined) $set["location.areaText"] = l.areaText;
      if (l.landmark !== undefined) $set["location.landmark"] = l.landmark;
      if (l.serviceAreas !== undefined) $set.serviceAreas = l.serviceAreas;
    }

    if (input.media) {
      if (input.media.avatar !== undefined) $set.avatar = input.media.avatar;
      if (input.media.portfolio !== undefined) {
        $set.portfolio = input.media.portfolio.map((p, i) => ({
          ...p,
          order: i,
        }));
      }
    }

    if (input.credentials) {
      // verifiedByAdmin is never client-settable — an artisan could otherwise
      // award themselves a verified credential badge.
      $set.credentials = input.credentials.map((c) => ({
        ...c,
        verifiedByAdmin: false,
      }));
    }

    if (input.availability) {
      if (input.availability.acceptingJobs !== undefined)
        $set["availability.acceptingJobs"] = input.availability.acceptingJobs;
      if (input.availability.respondsWithin !== undefined)
        $set["availability.respondsWithin"] = input.availability.respondsWithin;
    }

    if (Object.keys($set).length === 0) {
      return ok({
        profile: toOwnerArtisan(profile),
        completeness: profileCompleteness(profile),
      });
    }

    const updated = await ArtisanProfile.findOneAndUpdate(
      { _id: profile._id },
      { $set },
      { returnDocument: "after", runValidators: true },
    ).exec();

    if (!updated) return serverError();

    // Keywords depend on trades and area, so refresh whenever either moved.
    if (input.trades || input.location) {
      const keywords = await rebuildSearchKeywords(updated);
      await ArtisanProfile.updateOne(
        { _id: updated._id },
        { $set: { searchKeywords: keywords } },
      );
      updated.searchKeywords = keywords;
    }

    return ok({
      profile: toOwnerArtisan(updated),
      completeness: profileCompleteness(updated),
    });
  } catch (error) {
    console.error("[me/profile PATCH] failed", error);
    return serverError("Couldn't save your changes.");
  }
}
