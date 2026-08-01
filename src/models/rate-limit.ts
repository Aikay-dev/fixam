import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Fixed-window rate limiting, backed by Mongo instead of Redis.
 *
 * Deliberately not Upstash: Stage One has no revenue, and one more paid
 * dependency for a few counters is not worth it. Counters are incremented
 * atomically and reaped by the TTL index.
 */
const rateLimitSchema = new Schema(
  {
    /** `${action}:${identifier}:${windowStart}` */
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitDoc = InferSchemaType<typeof rateLimitSchema> & {
  _id: string;
};

export const RateLimit: Model<RateLimitDoc> =
  (models.RateLimit as Model<RateLimitDoc>) ??
  model<RateLimitDoc>("RateLimit", rateLimitSchema);
