import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Delivery log for every message Fixam sends.
 *
 * Doubles as the data source for /admin/emails. Worth its own collection
 * because "did the artisan actually get told about the lead?" is the first
 * question asked whenever an artisan claims Fixam sent them nothing.
 */
const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /** Template identifier, e.g. "lead-number-viewed". */
    type: { type: String, required: true, index: true },

    channel: {
      type: String,
      enum: ["email", "sms", "in_app"],
      default: "email",
    },

    to: { type: String, required: true },
    subject: { type: String, default: "" },

    /** Template props, kept for debugging and for resend-from-admin. */
    payload: { type: Schema.Types.Mixed, default: {} },

    status: {
      type: String,
      enum: ["queued", "sent", "failed", "skipped"],
      default: "queued",
      index: true,
    },

    /** Provider message id, for cross-referencing with Resend. */
    providerId: { type: String, default: null },
    error: { type: String, default: null },

    sentAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

export type NotificationDoc = InferSchemaType<typeof notificationSchema> & {
  _id: string;
};

export const Notification: Model<NotificationDoc> =
  (models.Notification as Model<NotificationDoc>) ??
  model<NotificationDoc>("Notification", notificationSchema);
