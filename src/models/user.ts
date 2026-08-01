import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import {
  AUTH_PROVIDERS,
  ROLES,
  USER_STATUSES,
  type Role,
} from "@/lib/constants";

/**
 * A single account type for everyone.
 *
 * Roles are an array rather than a scalar so an artisan can also hire other
 * artisans without needing a second account — which they will, since an
 * electrician still needs a plumber at home.
 */
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /** Null for accounts created purely through Google. */
    passwordHash: { type: String, default: null, select: false },

    name: { type: String, trim: true, default: "" },
    image: { type: String, default: null },

    /** Timestamp of successful email verification; null means unverified. */
    emailVerified: { type: Date, default: null },

    roles: {
      type: [String],
      enum: ROLES,
      default: ["customer"],
      index: true,
    },

    /** Customer's own contact number. Unrelated to the gated artisan phone. */
    phone: { type: String, default: null, trim: true },

    status: { type: String, enum: USER_STATUSES, default: "active", index: true },

    authProviders: { type: [String], enum: AUTH_PROVIDERS, default: [] },

    lastLoginAt: { type: Date, default: null },

    /** Set by an admin when suspending; surfaced in the suspension email. */
    suspendedReason: { type: String, default: null },

    notificationPrefs: {
      leadAlerts: { type: Boolean, default: true },
      reviewAlerts: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

userSchema.index({ createdAt: -1 });

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: string };

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) ?? model<UserDoc>("User", userSchema);

export function hasRole(
  user: { roles?: string[] | null } | null | undefined,
  role: Role,
): boolean {
  return Boolean(user?.roles?.includes(role));
}
