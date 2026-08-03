import type { ReviewStatus } from "@/lib/constants";

/**
 * Public shape of a review.
 *
 * Like toPublicArtisan(), this builds an allow-listed object rather than
 * deleting fields, so a column added to the Review schema later is excluded
 * by default instead of leaking the first time someone forgets.
 *
 * The reviewer is deliberately reduced to a first name and an initial.
 * A review is public and permanent; the person who left it signed up to hire
 * a plumber, not to attach their full name to a searchable page. "Chidi O."
 * is enough to read as a real person without publishing an identity.
 */
export type PublicReview = {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  jobCategoryName: string | null;
  jobDate: string | null;
  createdAt: string;
  photos: { url: string }[];
  response: { body: string; respondedAt: string } | null;
};

type AnyReview = {
  _id: unknown;
  rating: number;
  title?: string | null;
  body: string;
  jobDate?: Date | null;
  createdAt?: Date;
  photos?: { url: string }[] | null;
  artisanResponse?: { body?: string | null; respondedAt?: Date | null } | null;
  status?: ReviewStatus;
  // Populated or joined.
  customer?: { name?: string | null } | null;
  jobCategory?: { name?: string | null } | null;
};

/** "Chidi Okonkwo" -> "Chidi O." ; a single name is left as-is. */
export function displayAuthorName(fullName: string | null | undefined): string {
  const name = (fullName ?? "").trim();
  if (!name) return "A Fixam customer";

  const parts = name.split(/\s+/);
  if (parts.length === 1) return parts[0]!;

  const surnameInitial = parts[parts.length - 1]![0]!.toUpperCase();
  return `${parts[0]} ${surnameInitial}.`;
}

export function toPublicReview(doc: AnyReview): PublicReview {
  const response =
    doc.artisanResponse?.body && doc.artisanResponse.respondedAt
      ? {
          body: doc.artisanResponse.body,
          respondedAt: doc.artisanResponse.respondedAt.toISOString(),
        }
      : null;

  return {
    id: String(doc._id),
    rating: doc.rating,
    title: doc.title ?? "",
    body: doc.body,
    authorName: displayAuthorName(doc.customer?.name),
    jobCategoryName: doc.jobCategory?.name ?? null,
    jobDate: doc.jobDate ? doc.jobDate.toISOString() : null,
    createdAt: (doc.createdAt ?? new Date()).toISOString(),
    photos: (doc.photos ?? []).map((p) => ({ url: p.url })),
    response,
  };
}

/**
 * Projection for public review reads. `customerUserId` is excluded: the
 * public list needs the reviewer's display name, never an id that could be
 * correlated across every review they have ever left.
 */
export const PUBLIC_REVIEW_PROJECTION = {
  customerUserId: 0,
  leadId: 0,
  hiddenReason: 0,
} as const;
