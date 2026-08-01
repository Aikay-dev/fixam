import type { ArtisanProfileDoc } from "@/models/artisan-profile";

/**
 * ⭐ THE SINGLE CHOKE POINT FOR ARTISAN DATA LEAVING THE SERVER.
 *
 * Every public read path — profile pages, search results, category pages,
 * sitemaps, JSON-LD — must return through `toPublicArtisan()`. It builds a
 * fresh object with an explicit allow-list of fields rather than deleting
 * keys from the document, so a field added to the schema later is excluded
 * by default instead of silently shipping to the browser.
 *
 * What it exists to protect: `phone`, `whatsapp` and `alternatePhone`. Those
 * three fields are the entire Stage Two business model. If they appear in any
 * GET response, RSC payload or search JSON, the directory can be scraped in
 * an afternoon and pay-per-lead credits are worthless before launch.
 *
 * The only code allowed to read them is the reveal endpoint.
 * `scripts/test-scrape.ts` asserts this holds against the running app.
 */

export type PublicMedia = {
  url: string;
  caption: string;
  width: number | null;
  height: number | null;
};

export type PublicArtisan = {
  id: string;
  slug: string;
  displayName: string;
  bio: string;
  yearsExperience: number;
  tradeIds: string[];
  location: {
    stateId: string | null;
    lgaId: string | null;
    areaText: string;
    landmark: string;
  };
  serviceAreaStateIds: string[];
  avatarUrl: string | null;
  portfolio: PublicMedia[];
  credentials: { type: string; title: string; verifiedByAdmin: boolean }[];
  isVerified: boolean;
  rating: {
    average: number;
    count: number;
    breakdown: Record<string, number>;
  };
  reviewCount: number;
  acceptingJobs: boolean;
  respondsWithin: string;
  isFeatured: boolean;
  publishedAt: string | null;
  /** Signals a contact is available WITHOUT disclosing the number itself. */
  hasWhatsApp: boolean;
};

/**
 * Accepts a hydrated document, a `.lean()` result, or a plain object — the
 * three shapes callers actually have. Fields are read defensively rather than
 * trusting a single Mongoose type, because a lean subdocument and a hydrated
 * one differ structurally.
 */
type AnyArtisan = ArtisanProfileDoc | Record<string, unknown>;

type Loose = Record<string, unknown>;

function obj(value: unknown): Loose {
  return value && typeof value === "object" ? (value as Loose) : {};
}

function arr(value: unknown): Loose[] {
  return Array.isArray(value) ? (value as Loose[]) : [];
}

function str(value: unknown): string {
  return value == null ? "" : String(value);
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function idOrNull(value: unknown): string | null {
  return value == null ? null : String(value);
}

export function toPublicArtisan(doc: AnyArtisan): PublicArtisan {
  const d = obj(doc);

  const location = obj(d.location);
  const rating = obj(d.rating);
  const breakdown = obj(rating.breakdown);
  const stats = obj(d.stats);
  const availability = obj(d.availability);
  const avatar = obj(d.avatar);

  // Built by construction, never by deletion. Adding `phone` to this object
  // is the one change that must never happen.
  return {
    id: String(d._id),
    slug: str(d.slug),
    displayName: str(d.displayName),
    bio: str(d.bio),
    yearsExperience: num(d.yearsExperience),

    tradeIds: arr(d.trades).map((t) => String(t.categoryId)),

    location: {
      stateId: idOrNull(location.stateId),
      lgaId: idOrNull(location.lgaId),
      areaText: str(location.areaText),
      landmark: str(location.landmark),
    },

    serviceAreaStateIds: arr(d.serviceAreas).map((a) => String(a.stateId)),

    avatarUrl: avatar.url ? String(avatar.url) : null,

    portfolio: arr(d.portfolio).map((p) => ({
      url: str(p.url),
      caption: str(p.caption),
      width: p.width == null ? null : num(p.width),
      height: p.height == null ? null : num(p.height),
    })),

    credentials: arr(d.credentials).map((c) => ({
      type: str(c.type),
      title: str(c.title),
      verifiedByAdmin: Boolean(c.verifiedByAdmin),
    })),

    isVerified: Boolean(d.isVerified),

    rating: {
      average: num(rating.average),
      count: num(rating.count),
      breakdown: {
        "1": num(breakdown["1"]),
        "2": num(breakdown["2"]),
        "3": num(breakdown["3"]),
        "4": num(breakdown["4"]),
        "5": num(breakdown["5"]),
      },
    },

    reviewCount: num(stats.reviewCount),
    acceptingJobs: availability.acceptingJobs !== false,
    respondsWithin: str(availability.respondsWithin || "same_day"),
    isFeatured: Boolean(d.isFeatured),
    publishedAt: d.publishedAt
      ? new Date(d.publishedAt as string).toISOString()
      : null,

    // Boolean only. Tells the UI which button to show; discloses nothing.
    hasWhatsApp: Boolean(d.whatsapp || d.phone),
  };
}

/**
 * The artisan's own view of their profile. Includes their contact details —
 * they obviously may see their own number — and moderation state.
 *
 * Only ever returned to the authenticated owner or an admin. Never reachable
 * from a public route.
 */
export type OwnerArtisan = PublicArtisan & {
  phone: string | null;
  whatsapp: string | null;
  alternatePhone: string | null;
  status: string;
  rejectionReason: string | null;
  submittedAt: string | null;
  profileViews: number;
  contactReveals: number;
  subscriptionTier: string;
};

export function toOwnerArtisan(doc: AnyArtisan): OwnerArtisan {
  const d = obj(doc);
  const stats = obj(d.stats);

  return {
    ...toPublicArtisan(doc),
    phone: d.phone == null ? null : String(d.phone),
    whatsapp: d.whatsapp == null ? null : String(d.whatsapp),
    alternatePhone:
      d.alternatePhone == null ? null : String(d.alternatePhone),
    status: str(d.status),
    rejectionReason:
      d.rejectionReason == null ? null : String(d.rejectionReason),
    submittedAt: d.submittedAt
      ? new Date(d.submittedAt as string).toISOString()
      : null,
    profileViews: num(stats.profileViews),
    contactReveals: num(stats.contactReveals),
    subscriptionTier: str(d.subscriptionTier || "free"),
  };
}

/**
 * Mongo projection that omits the gated fields at the query layer.
 *
 * Defence in depth: even if a future read path forgets to serialise through
 * `toPublicArtisan`, the numbers were never loaded into memory to begin with.
 */
export const PUBLIC_ARTISAN_PROJECTION = {
  phone: 0,
  whatsapp: 0,
  alternatePhone: 0,
} as const;
