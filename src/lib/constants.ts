/**
 * Shared domain vocabulary. Everything downstream (models, guards, UI)
 * imports its enums from here so a status string is never typed twice.
 */

export const SITE = {
  name: "Fixam",
  tagline: "Get am done. Fix am fast.",
  description:
    "Find trusted plumbers, electricians, carpenters and more near you in Nigeria. Browse real reviews, then connect directly on WhatsApp — free.",
  locale: "en_NG",
  country: "NG",
  currency: "NGN",

  /**
   * The registrable domain. Kept here, and referenced everywhere, so a change
   * is one edit rather than a hunt through email templates and error copy.
   * The brand is "Fixam"; only the domain carries the hyphen.
   */
  domain: "fix-am.ng",
  supportEmail: "support@fix-am.ng",
} as const;

// --- Roles ----------------------------------------------------------------

export const ROLES = ["customer", "artisan", "admin"] as const;
export type Role = (typeof ROLES)[number];

// --- User -----------------------------------------------------------------

export const USER_STATUSES = ["active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const AUTH_PROVIDERS = ["credentials", "google"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

// --- Artisan profile ------------------------------------------------------

export const ARTISAN_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "suspended",
] as const;
export type ArtisanStatus = (typeof ARTISAN_STATUSES)[number];

/** The only status that may appear in public listings, search or the sitemap. */
export const PUBLIC_ARTISAN_STATUS: ArtisanStatus = "approved";

export const SUBSCRIPTION_TIERS = ["free", "verified_pro"] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

// --- Leads ----------------------------------------------------------------

export const LEAD_SOURCES = ["profile", "search", "category", "direct"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_CHANNELS = ["phone", "whatsapp"] as const;
export type LeadChannel = (typeof LEAD_CHANNELS)[number];

/**
 * Stage Two billing states. Every Stage One lead is written as `free`.
 * The other values exist so switching monetisation on is a policy change,
 * not a schema migration.
 */
export const LEAD_BILLING_STATUSES = [
  "free",
  "pending",
  "charged",
  "waived",
] as const;
export type LeadBillingStatus = (typeof LEAD_BILLING_STATUSES)[number];

export const LEAD_OUTCOMES = ["hired", "not_hired", "no_response"] as const;
export type LeadOutcome = (typeof LEAD_OUTCOMES)[number];

/**
 * Re-viewing the same artisan inside this window reuses the existing lead:
 * no new record, no repeat notification, and — in Stage Two — no second charge.
 */
export const LEAD_DEDUPE_WINDOW_DAYS = 30;

/** Hours to wait after a reveal before asking the customer to review. */
export const REVIEW_PROMPT_DELAY_HOURS = 48;

// --- Reviews --------------------------------------------------------------

export const REVIEW_STATUSES = [
  "published",
  "pending_moderation",
  "hidden",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const RATING_MIN = 1;
export const RATING_MAX = 5;

// --- Rate limits ----------------------------------------------------------

export const RATE_LIMITS = {
  /** Contact reveals per user per rolling day. Anti-scrape ceiling. */
  reveal: { limit: 15, windowMs: 24 * 60 * 60 * 1000 },
  /** Signups per IP per hour. */
  signup: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** OTP requests per user per hour. */
  otp: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** Failed logins per email per 15 minutes. */
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  /** Reviews per user per day. */
  review: { limit: 10, windowMs: 24 * 60 * 60 * 1000 },
} as const;

// --- OTP ------------------------------------------------------------------

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 15;
export const OTP_MAX_ATTEMPTS = 5;

export const OTP_PURPOSES = ["verify_email", "reset_password"] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

// --- Media limits ---------------------------------------------------------

export const MEDIA = {
  maxPortfolioImages: 12,
  maxImageBytes: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

// --- Pagination -----------------------------------------------------------

export const PAGE_SIZE = {
  directory: 24,
  reviews: 10,
  adminTable: 50,
} as const;

// --- Route groups ---------------------------------------------------------

export const ROUTES = {
  home: "/",
  directory: "/artisans",
  artisan: (slug: string) => `/artisans/${slug}`,
  category: (slug: string) => `/services/${slug}`,
  categoryInState: (category: string, state: string) =>
    `/services/${category}/${state}`,
  categoryInLga: (category: string, state: string, lga: string) =>
    `/services/${category}/${state}/${lga}`,
  login: "/login",
  signup: "/signup",
  /**
   * Every "list your services free" CTA points here, never straight at
   * /signup. This route works out whether the visitor needs to sign up, add
   * the artisan role to an existing account, or just go to their profile —
   * linking to /signup was a dead end for anyone already signed in.
   */
  joinAsArtisan: "/become-an-artisan",
  verifyEmail: "/verify-email",
  account: "/account",
  accountContacts: "/account/contacts",
  pro: "/pro",
  proProfile: "/pro/profile",
  proLeads: "/pro/leads",
  admin: "/admin",
} as const;

/** Path prefixes that require an authenticated session. */
export const PROTECTED_PREFIXES = ["/account", "/pro", "/admin"] as const;

/** Path prefixes that require the `admin` role. */
export const ADMIN_PREFIXES = ["/admin"] as const;
