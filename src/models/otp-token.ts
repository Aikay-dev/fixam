import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { OTP_PURPOSES } from "@/lib/constants";

/**
 * Short-lived one-time codes for email verification and password reset.
 *
 * The code itself is never stored — only a hash — so a database leak does not
 * hand over live verification codes. Expired documents are reaped by MongoDB
 * via the TTL index rather than a cleanup job.
 */
const otpTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /** Denormalised so a reset can be looked up before the user is loaded. */
    email: { type: String, required: true, lowercase: true, trim: true },

    codeHash: { type: String, required: true },

    purpose: { type: String, enum: OTP_PURPOSES, required: true },

    expiresAt: { type: Date, required: true },

    attempts: { type: Number, default: 0 },

    consumedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// MongoDB deletes the document once expiresAt passes. `expireAfterSeconds: 0`
// means "expire exactly at the stored date".
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Lookup path for verification: newest live token for this user + purpose.
otpTokenSchema.index({ userId: 1, purpose: 1, consumedAt: 1, createdAt: -1 });

export type OtpTokenDoc = InferSchemaType<typeof otpTokenSchema> & {
  _id: string;
};

export const OtpToken: Model<OtpTokenDoc> =
  (models.OtpToken as Model<OtpTokenDoc>) ??
  model<OtpTokenDoc>("OtpToken", otpTokenSchema);
