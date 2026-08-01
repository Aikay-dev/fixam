import { connectDB } from "@/lib/db";
import { RATE_LIMITS } from "@/lib/constants";
import { RateLimit } from "@/models/rate-limit";

export type RateLimitAction = keyof typeof RATE_LIMITS;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  /** When the current window rolls over. */
  resetAt: Date;
};

/**
 * Fixed-window counter.
 *
 * A sliding window would be more precise at the boundary, but these limits
 * exist to stop scraping and spam, not to meter a paid API — the extra
 * complexity buys nothing here.
 */
export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string,
): Promise<RateLimitResult> {
  const { limit, windowMs } = RATE_LIMITS[action];

  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const resetAt = new Date(windowStart + windowMs);
  const key = `${action}:${identifier}:${windowStart}`;

  await connectDB();

  // Atomic: upsert the window document and increment in one round trip, so
  // concurrent requests cannot both read a stale count and both be allowed.
  const doc = await RateLimit.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: resetAt } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();

  const count = doc?.count ?? 1;

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    limit,
    resetAt,
  };
}

/**
 * Give back a consumed unit when the guarded action turned out not to happen —
 * e.g. a reveal that was deduplicated against an existing lead. Without this,
 * a customer re-opening the same artisan five times burns five of their
 * fifteen daily reveals for no reason.
 */
export async function refundRateLimit(
  action: RateLimitAction,
  identifier: string,
): Promise<void> {
  const { windowMs } = RATE_LIMITS[action];
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const key = `${action}:${identifier}:${windowStart}`;

  await connectDB();
  await RateLimit.updateOne(
    { key, count: { $gt: 0 } },
    { $inc: { count: -1 } },
  ).exec();
}
