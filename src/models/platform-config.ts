import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { RATE_LIMITS, SITE } from "@/lib/constants";

/**
 * Single-document settings collection, editable from /admin/settings.
 *
 * `monetizationEnabled` is the Stage Two switch. It is read by
 * `canRevealContact()` and nowhere else — flipping it is meant to be the
 * entire deployment step for turning on pay-per-lead credits.
 */
const platformConfigSchema = new Schema(
  {
    /** Guards the singleton: only one document can carry key "default". */
    key: { type: String, default: "default", unique: true, index: true },

    // --- Stage Two -------------------------------------------------------
    monetizationEnabled: { type: Boolean, default: false },
    defaultLeadCreditCost: { type: Number, default: 0 },

    // --- Stage One knobs -------------------------------------------------
    revealLimitPerDay: { type: Number, default: RATE_LIMITS.reveal.limit },
    requireEmailVerificationToReveal: { type: Boolean, default: true },
    autoPublishArtisans: { type: Boolean, default: false },

    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "" },

    /** Slugs of states currently promoted on the marketing surface. */
    launchStates: { type: [String], default: ["lagos"] },

    supportEmail: { type: String, default: SITE.supportEmail },
    supportWhatsapp: { type: String, default: "" },
  },
  { timestamps: true },
);

export type PlatformConfigDoc = InferSchemaType<typeof platformConfigSchema>;

export const PlatformConfig: Model<PlatformConfigDoc> =
  (models.PlatformConfig as Model<PlatformConfigDoc>) ??
  model<PlatformConfigDoc>("PlatformConfig", platformConfigSchema);

/** Reads the singleton, creating it with defaults on first call. */
export async function getPlatformConfig(): Promise<PlatformConfigDoc> {
  const existing = await PlatformConfig.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();

  return existing as PlatformConfigDoc;
}
