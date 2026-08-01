import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/** Abuse reports on artisan profiles and reviews. */
const reportSchema = new Schema(
  {
    targetType: {
      type: String,
      enum: ["artisan", "review"],
      required: true,
      index: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },

    reporterUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    reason: {
      type: String,
      enum: [
        "fake_profile",
        "wrong_number",
        "scam",
        "abusive",
        "not_the_person",
        "poor_work",
        "spam",
        "other",
      ],
      required: true,
    },
    notes: { type: String, default: "", maxlength: 1000 },

    status: {
      type: String,
      enum: ["open", "reviewing", "actioned", "dismissed"],
      default: "open",
      index: true,
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
    resolutionNote: { type: String, default: "" },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });
// One report per user per target — stops brigading from inflating the queue.
reportSchema.index(
  { reporterUserId: 1, targetType: 1, targetId: 1 },
  { unique: true },
);

/**
 * Append-only record of every admin mutation.
 *
 * Approvals, rejections, suspensions and config changes all move real money
 * for real people, so each one records who did it and what changed.
 */
const auditLogSchema = new Schema(
  {
    adminUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, default: null, index: true },

    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },

    note: { type: String, default: "" },
    ipHash: { type: String, default: null },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });

export type ReportDoc = InferSchemaType<typeof reportSchema> & { _id: string };
export type AuditLogDoc = InferSchemaType<typeof auditLogSchema> & {
  _id: string;
};

export const Report: Model<ReportDoc> =
  (models.Report as Model<ReportDoc>) ?? model<ReportDoc>("Report", reportSchema);

export const AuditLog: Model<AuditLogDoc> =
  (models.AuditLog as Model<AuditLogDoc>) ??
  model<AuditLogDoc>("AuditLog", auditLogSchema);
