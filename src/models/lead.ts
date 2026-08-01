import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import {
  LEAD_BILLING_STATUSES,
  LEAD_CHANNELS,
  LEAD_OUTCOMES,
  LEAD_SOURCES,
} from "@/lib/constants";

/**
 * ⭐ One document per phone-number reveal. This collection IS the product.
 *
 * In Stage One it proves demand ("artisans received N real leads last week"),
 * which is the evidence that makes Stage Two pricing an easy sell. In Stage
 * Two the exact same rows become the billing ledger — which is why the
 * billing fields exist from day one, inert, rather than arriving via a
 * migration against live data.
 */
const leadSchema = new Schema(
  {
    artisanProfileId: {
      type: Schema.Types.ObjectId,
      ref: "ArtisanProfile",
      required: true,
      index: true,
    },
    /** Denormalised so artisan-facing queries skip a lookup. */
    artisanUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /** What the customer was browsing when they revealed. */
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },

    source: { type: String, enum: LEAD_SOURCES, default: "profile" },
    channel: { type: String, enum: LEAD_CHANNELS, default: "whatsapp" },

    revealedAt: { type: Date, default: Date.now, index: true },

    /**
     * Start of the dedupe window this lead belongs to. Combined with customer
     * and artisan it forms the unique key that stops one customer opening the
     * same profile five times from creating five leads — which would inflate
     * Stage One metrics and double-charge in Stage Two.
     */
    dedupeWindowStart: { type: Date, required: true },

    /** Salted hashes, not raw values — see fingerprint() in src/lib/api.ts. */
    ipHash: { type: String, default: null, index: true },
    userAgentHash: { type: String, default: null },

    // --- Stage Two billing. Written as `free` today, never charged. --------
    chargeable: { type: Boolean, default: false },
    creditCost: { type: Number, default: 0 },
    billingStatus: {
      type: String,
      enum: LEAD_BILLING_STATUSES,
      default: "free",
      index: true,
    },
    billedAt: { type: Date, default: null },

    // --- Outcome -----------------------------------------------------------
    reviewId: { type: Schema.Types.ObjectId, ref: "Review", default: null },
    outcomeReported: { type: String, enum: LEAD_OUTCOMES, default: null },

    /** Set once the +48h review prompt has gone out, so it only fires once. */
    reviewPromptSentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// The dedupe guarantee, enforced by the database rather than by application
// logic that could race under concurrent requests.
leadSchema.index(
  { customerUserId: 1, artisanProfileId: 1, dedupeWindowStart: 1 },
  { unique: true },
);

// Artisan's "who viewed my number" feed.
leadSchema.index({ artisanProfileId: 1, revealedAt: -1 });

// Customer's "artisans I've contacted" list.
leadSchema.index({ customerUserId: 1, revealedAt: -1 });

// Admin analytics + CSV export, and the cron that finds leads due a prompt.
leadSchema.index({ revealedAt: -1 });
leadSchema.index({ reviewPromptSentAt: 1, revealedAt: 1 });

export type LeadDoc = InferSchemaType<typeof leadSchema> & { _id: string };

export const Lead: Model<LeadDoc> =
  (models.Lead as Model<LeadDoc>) ?? model<LeadDoc>("Lead", leadSchema);
