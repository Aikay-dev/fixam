/**
 * Barrel for every Mongoose model.
 *
 * Importing this guarantees all schemas are registered before any query runs
 * — without it, a `populate("Category")` from a route that never imported the
 * Category model throws MissingSchemaError. Seed scripts and admin pages
 * import from here rather than cherry-picking.
 */

export { ArtisanProfile, type ArtisanProfileDoc } from "@/models/artisan-profile";
export {
  CreditTransaction,
  Wallet,
  type CreditTransactionDoc,
  type WalletDoc,
} from "@/models/billing";
export { Category, type CategoryDoc } from "@/models/category";
export { Lead, type LeadDoc } from "@/models/lead";
export { Lga, State, type LgaDoc, type StateDoc } from "@/models/location";
export { AuditLog, Report, type AuditLogDoc, type ReportDoc } from "@/models/moderation";
export { Notification, type NotificationDoc } from "@/models/notification";
export { OtpToken, type OtpTokenDoc } from "@/models/otp-token";
export {
  PlatformConfig,
  getPlatformConfig,
  type PlatformConfigDoc,
} from "@/models/platform-config";
export { RateLimit, type RateLimitDoc } from "@/models/rate-limit";
export { Review, type ReviewDoc } from "@/models/review";
export { User, hasRole, type UserDoc } from "@/models/user";
