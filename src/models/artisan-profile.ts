import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import {
  ARTISAN_STATUSES,
  MEDIA,
  SUBSCRIPTION_TIERS,
} from "@/lib/constants";

/**
 * The artisan's storefront, and the most important document in the system.
 *
 * ⚠️ `phone`, `whatsapp` and `alternatePhone` are GATED. They must never leave
 * the server except through the reveal endpoint. Every read path goes through
 * `toPublicArtisan()` in src/lib/serializers/artisan.ts, which strips them.
 * Leaking them turns the whole directory into a free scrape and kills the
 * Stage Two business model before it launches.
 */

const mediaSchema = new Schema(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    caption: { type: String, default: "", maxlength: 140 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const artisanProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    /** e.g. emeka-okafor-plumber-lekki-a4f2 — stable once published. */
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },

    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    bio: { type: String, default: "", maxlength: 1200 },
    yearsExperience: { type: Number, default: 0, min: 0, max: 70 },

    trades: {
      type: [
        new Schema(
          {
            categoryId: {
              type: Schema.Types.ObjectId,
              ref: "Category",
              required: true,
            },
            isPrimary: { type: Boolean, default: false },
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    // --- 🔒 GATED CONTACT DETAILS -----------------------------------------
    // Stored E.164. Never serialised to a public payload.
    phone: { type: String, default: null },
    whatsapp: { type: String, default: null },
    alternatePhone: { type: String, default: null },

    // --- Location ----------------------------------------------------------
    location: {
      stateId: { type: Schema.Types.ObjectId, ref: "State", default: null, index: true },
      lgaId: { type: Schema.Types.ObjectId, ref: "Lga", default: null, index: true },
      /** "Lekki Phase 1" */
      areaText: { type: String, default: "", maxlength: 120 },
      /** "Behind Shoprite, Jakande bus stop" — how directions actually work. */
      landmark: { type: String, default: "", maxlength: 160 },
      geo: {
        type: { type: String, enum: ["Point"], default: undefined },
        coordinates: { type: [Number], default: undefined }, // [lng, lat]
      },
    },

    /** Where they'll travel to, which is often wider than where they live. */
    serviceAreas: {
      type: [
        new Schema(
          {
            stateId: { type: Schema.Types.ObjectId, ref: "State", required: true },
            lgaIds: { type: [Schema.Types.ObjectId], ref: "Lga", default: [] },
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    // --- Media -------------------------------------------------------------
    avatar: { type: mediaSchema, default: null },
    portfolio: {
      type: [mediaSchema],
      default: [],
      validate: {
        validator: (v: unknown[]) => v.length <= MEDIA.maxPortfolioImages,
        message: `Up to ${MEDIA.maxPortfolioImages} portfolio photos.`,
      },
    },

    credentials: {
      type: [
        new Schema(
          {
            type: {
              type: String,
              enum: ["certificate", "id", "guild", "training", "other"],
              default: "other",
            },
            title: { type: String, required: true },
            fileUrl: { type: String, default: null },
            verifiedByAdmin: { type: Boolean, default: false },
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    // --- Moderation --------------------------------------------------------
    status: {
      type: String,
      enum: ARTISAN_STATUSES,
      default: "draft",
      index: true,
    },
    rejectionReason: { type: String, default: null },
    submittedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    // --- Trust -------------------------------------------------------------
    isVerified: { type: Boolean, default: false, index: true },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    /** Denormalised from Review so the directory can sort without a join. */
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      breakdown: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
    },

    stats: {
      profileViews: { type: Number, default: 0 },
      contactReveals: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },

    availability: {
      acceptingJobs: { type: Boolean, default: true, index: true },
      respondsWithin: {
        type: String,
        enum: ["within_hour", "same_day", "few_days"],
        default: "same_day",
      },
    },

    // --- Stage Two seams (inert in Stage One) ------------------------------
    subscriptionTier: {
      type: String,
      enum: SUBSCRIPTION_TIERS,
      default: "free",
    },
    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date, default: null },

    /** Denormalised trade names + synonyms, so text search hits one field. */
    searchKeywords: { type: [String], default: [] },
  },
  { timestamps: true },
);

// --- Indexes --------------------------------------------------------------

// Geospatial "near me". Sparse because most profiles won't have coordinates.
artisanProfileSchema.index({ "location.geo": "2dsphere" }, { sparse: true });

// The directory's main access path: approved artisans, filtered by trade and
// LGA, ordered by rating.
artisanProfileSchema.index({
  status: 1,
  "trades.categoryId": 1,
  "location.lgaId": 1,
  "rating.average": -1,
});

// Category landing pages without an LGA filter.
artisanProfileSchema.index({
  status: 1,
  "trades.categoryId": 1,
  "rating.average": -1,
});

// Admin approval queue.
artisanProfileSchema.index({ status: 1, submittedAt: 1 });

// Free-text search.
artisanProfileSchema.index({
  displayName: "text",
  bio: "text",
  searchKeywords: "text",
});

export type ArtisanProfileDoc = InferSchemaType<typeof artisanProfileSchema> & {
  _id: string;
};

export const ArtisanProfile: Model<ArtisanProfileDoc> =
  (models.ArtisanProfile as Model<ArtisanProfileDoc>) ??
  model<ArtisanProfileDoc>("ArtisanProfile", artisanProfileSchema);
