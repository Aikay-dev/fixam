import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { RATING_MAX, RATING_MIN, REVIEW_STATUSES } from "@/lib/constants";

/**
 * A review must be backed by a lead.
 *
 * `leadId` is unique, so one contact event yields at most one review. That
 * single constraint is what makes the trust layer hard to game: to leave a
 * review you must have a verified account that actually revealed this
 * artisan's number, and you get exactly one shot per contact.
 */
const reviewSchema = new Schema(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      unique: true,
      index: true,
    },

    artisanProfileId: {
      type: Schema.Types.ObjectId,
      ref: "ArtisanProfile",
      required: true,
      index: true,
    },
    customerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: RATING_MIN,
      max: RATING_MAX,
    },

    title: { type: String, default: "", maxlength: 120 },
    body: { type: String, required: true, minlength: 10, maxlength: 2000 },

    /** What the job actually was — often broader than the browsed category. */
    jobCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    jobDate: { type: Date, default: null },

    photos: {
      type: [
        new Schema(
          {
            publicId: { type: String, required: true },
            url: { type: String, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    status: {
      type: String,
      enum: REVIEW_STATUSES,
      default: "published",
      index: true,
    },
    hiddenReason: { type: String, default: null },

    /** Right of reply. A bad review with a calm response often reads better. */
    artisanResponse: {
      body: { type: String, default: null, maxlength: 1000 },
      respondedAt: { type: Date, default: null },
    },

    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Public review list on a profile.
reviewSchema.index({ artisanProfileId: 1, status: 1, createdAt: -1 });

// Moderation queue + per-user review history.
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ customerUserId: 1, createdAt: -1 });

export type ReviewDoc = InferSchemaType<typeof reviewSchema> & { _id: string };

export const Review: Model<ReviewDoc> =
  (models.Review as Model<ReviewDoc>) ?? model<ReviewDoc>("Review", reviewSchema);
