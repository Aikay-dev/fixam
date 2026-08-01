import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  fail,
  fingerprint,
  getClientIp,
  ok,
  parseBody,
  serverError,
  tooManyRequests,
} from "@/lib/api";
import {
  canRevealContact,
  revealDenialMessage,
} from "@/lib/artisan/reveal-policy";
import { authenticateRequest } from "@/lib/auth/session";
import {
  LEAD_DEDUPE_WINDOW_DAYS,
  PUBLIC_ARTISAN_STATUS,
} from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { sendLeadAlertEmail } from "@/lib/email/mailers";
import {
  formatPhoneForDisplay,
  toTelLink,
  toWhatsAppLink,
} from "@/lib/phone";
import { checkRateLimit, refundRateLimit } from "@/lib/rate-limit";
import { ArtisanProfile } from "@/models/artisan-profile";
import { Category } from "@/models/category";
import { Lead } from "@/models/lead";
import { Lga } from "@/models/location";
import { User } from "@/models/user";

/**
 * ⭐ The reveal endpoint. The single controlled moment on Fixam.
 *
 * This is the ONLY route in the application permitted to read
 * ArtisanProfile.phone / .whatsapp. Every other read path goes through
 * PUBLIC_ARTISAN_PROJECTION and toPublicArtisan(), which strip them.
 *
 * POST, never GET: a GET would be prefetchable, cacheable and crawlable,
 * which would both leak numbers and fabricate leads.
 */

const schema = z.object({
  source: z.enum(["profile", "search", "category", "direct"]).default("profile"),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});

/** Start of the current dedupe bucket for this customer/artisan pair. */
function currentWindowStart(): Date {
  const windowMs = LEAD_DEDUPE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return new Date(Math.floor(Date.now() / windowMs) * windowMs);
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/artisans/[slug]/reveal">,
) {
  const { slug } = await ctx.params;

  // 1. Must be signed in AND email-verified. Verification is what makes a
  //    lead worth anything to the artisan — anyone can type an address.
  const auth = await authenticateRequest({ requireVerified: true });
  if (!auth.ok) {
    const messages: Record<string, string> = {
      unauthenticated: "Create a free account to see this number.",
      unverified: "Verify your email address to see this number.",
      suspended: "This account has been suspended.",
    };
    return fail(
      auth.status,
      messages[auth.reason] ?? "You can't do that.",
      auth.reason,
    );
  }

  const parsed = await parseBody(request, schema);
  if (!parsed.ok) return parsed.response;

  // 2. Rate limit before touching the database — this is the anti-scrape
  //    ceiling, and it must apply even to requests that later dedupe.
  const limit = await checkRateLimit("reveal", auth.user.id);
  if (!limit.allowed) {
    return tooManyRequests(
      "You've looked up a lot of numbers today. Try again tomorrow.",
      limit.resetAt,
    );
  }

  try {
    await connectDB();

    // 3. Only approved artisans are contactable.
    const artisan = await ArtisanProfile.findOne({
      slug: slug.toLowerCase(),
      status: PUBLIC_ARTISAN_STATUS,
    }).exec();

    if (!artisan) {
      await refundRateLimit("reveal", auth.user.id);
      return fail(404, "That artisan isn't available.", "not_found");
    }

    if (!artisan.phone) {
      await refundRateLimit("reveal", auth.user.id);
      return fail(
        409,
        "This artisan hasn't added a phone number yet.",
        "no_phone",
      );
    }

    // An artisan revealing their own number would create a self-lead.
    if (String(artisan.userId) === auth.user.id) {
      await refundRateLimit("reveal", auth.user.id);
      return fail(400, "That's your own profile.", "self_reveal");
    }

    const dedupeWindowStart = currentWindowStart();

    // 4. Dedupe. Re-opening the same profile inside the window returns the
    //    same number without creating a second lead or re-notifying anyone.
    const existing = await Lead.findOne({
      customerUserId: auth.user.id,
      artisanProfileId: artisan._id,
      dedupeWindowStart,
    }).exec();

    const isDuplicate = Boolean(existing);

    // 5. ⭐ The Stage Two seam.
    const decision = await canRevealContact({
      customerUserId: auth.user.id,
      artisanUserId: String(artisan.userId),
      artisanProfileId: String(artisan._id),
      isDuplicate,
    });

    if (!decision.allowed) {
      await refundRateLimit("reveal", auth.user.id);
      return fail(402, revealDenialMessage(decision.reason), decision.reason);
    }

    const phone = artisan.phone;
    const whatsapp = artisan.whatsapp || artisan.phone;

    const payload = {
      phone,
      displayPhone: formatPhoneForDisplay(phone),
      telLink: toTelLink(phone),
      whatsappLink: whatsapp
        ? toWhatsAppLink(
            whatsapp,
            `Hi ${artisan.displayName.split(" ")[0]}, I found you on Fixam and I'd like to hire you.`,
          )
        : null,
      alreadyRevealed: isDuplicate,
    };

    if (isDuplicate) {
      // Give back the rate-limit unit: the customer consumed no new lead, and
      // re-checking a number they already have shouldn't burn their quota.
      await refundRateLimit("reveal", auth.user.id);
      return ok(payload);
    }

    // 6. Write the lead. The unique index on
    //    (customer, artisan, window) is the real guarantee here — two
    //    concurrent requests cannot both create one.
    const primaryTrade =
      artisan.trades?.find((t) => t.isPrimary) ?? artisan.trades?.[0];

    try {
      await Lead.create({
        artisanProfileId: artisan._id,
        artisanUserId: artisan.userId,
        customerUserId: auth.user.id,
        categoryId: parsed.data.categoryId ?? primaryTrade?.categoryId ?? null,
        source: parsed.data.source,
        channel: payload.whatsappLink ? "whatsapp" : "phone",
        revealedAt: new Date(),
        dedupeWindowStart,
        ipHash: fingerprint(getClientIp(request)),
        userAgentHash: fingerprint(request.headers.get("user-agent") ?? ""),
        // Stage One: always free. These fields exist so Stage Two doesn't
        // need a migration.
        chargeable: decision.chargeable,
        creditCost: decision.cost,
        billingStatus: decision.chargeable ? "pending" : "free",
      });
    } catch (error) {
      // A concurrent request won the race — that's the dedupe working.
      if ((error as { code?: number }).code === 11000) {
        await refundRateLimit("reveal", auth.user.id);
        return ok({ ...payload, alreadyRevealed: true });
      }
      throw error;
    }

    // 7. Bump the artisan's counter.
    await ArtisanProfile.updateOne(
      { _id: artisan._id },
      { $inc: { "stats.contactReveals": 1 } },
    );

    // 8. Tell the artisan — queued, so a slow mail provider never delays the
    //    customer getting the number they asked for.
    const [artisanUser, category, lga] = await Promise.all([
      User.findById(artisan.userId).select("email name notificationPrefs").lean().exec(),
      primaryTrade
        ? Category.findById(primaryTrade.categoryId).select("name").lean().exec()
        : null,
      artisan.location?.lgaId
        ? Lga.findById(artisan.location.lgaId).select("name").lean().exec()
        : null,
    ]);

    if (artisanUser?.email && artisanUser.notificationPrefs?.leadAlerts !== false) {
      sendLeadAlertEmail({
        userId: String(artisan.userId),
        email: artisanUser.email,
        name: artisan.displayName,
        // First name only. The artisan gets enough to recognise a real
        // enquiry without us handing over the customer's full identity
        // before they've even spoken.
        customerFirstName: (auth.user.name ?? "Someone").split(" ")[0]!,
        categoryName: category?.name ?? "your services",
        areaName: lga?.name ?? artisan.location?.areaText ?? "",
      });
    }

    return ok(payload);
  } catch (error) {
    console.error("[reveal] failed", error);
    await refundRateLimit("reveal", auth.user.id);
    return serverError("Couldn't show the number right now.");
  }
}
