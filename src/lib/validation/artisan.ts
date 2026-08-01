import { z } from "zod";

import { MEDIA } from "@/lib/constants";
import { normalisePhone } from "@/lib/phone";

/** Accepts any common Nigerian format and stores E.164. */
const phoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const result = normalisePhone(value);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.reason });
      return z.NEVER;
    }
    return result.e164;
  });

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid selection.");

const mediaSchema = z.object({
  publicId: z.string().min(1),
  url: z.string().url(),
  caption: z.string().max(140).default(""),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
  order: z.number().int().min(0).default(0),
});

/**
 * The editor saves one step at a time, so every section is independently
 * valid. Completeness for publishing is checked separately by
 * `profileCompleteness()` — a half-filled draft must still be savable.
 */

export const basicsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Enter the name customers should see.")
    .max(80, "That name is too long."),
  bio: z
    .string()
    .trim()
    .max(1200, "Keep it under 1200 characters.")
    .default(""),
  yearsExperience: z.coerce
    .number()
    .int()
    .min(0, "Can't be negative.")
    .max(70, "That seems too high.")
    .default(0),
});

export const tradesSchema = z.object({
  trades: z
    .array(
      z.object({
        categoryId: objectIdSchema,
        isPrimary: z.boolean().default(false),
      }),
    )
    .min(1, "Pick at least one trade.")
    .max(8, "Pick up to 8 trades — focus helps you rank."),
});

export const contactSchema = z.object({
  phone: phoneSchema,
  // Most artisans use the same number for calls and WhatsApp.
  whatsapp: phoneSchema.optional().nullable(),
  alternatePhone: phoneSchema.optional().nullable(),
});

export const locationSchema = z.object({
  stateId: objectIdSchema,
  lgaId: objectIdSchema,
  areaText: z.string().trim().max(120).default(""),
  landmark: z.string().trim().max(160).default(""),
  serviceAreas: z
    .array(
      z.object({
        stateId: objectIdSchema,
        lgaIds: z.array(objectIdSchema).default([]),
      }),
    )
    .max(5, "Up to 5 states.")
    .default([]),
});

export const mediaUpdateSchema = z.object({
  avatar: mediaSchema.nullable().optional(),
  portfolio: z
    .array(mediaSchema)
    .max(
      MEDIA.maxPortfolioImages,
      `Up to ${MEDIA.maxPortfolioImages} photos.`,
    )
    .default([]),
});

export const credentialsSchema = z.object({
  credentials: z
    .array(
      z.object({
        type: z
          .enum(["certificate", "id", "guild", "training", "other"])
          .default("other"),
        title: z.string().trim().min(2, "Give it a name.").max(120),
        fileUrl: z.string().url().nullable().default(null),
      }),
    )
    .max(10, "Up to 10 credentials.")
    .default([]),
});

export const availabilitySchema = z.object({
  acceptingJobs: z.boolean().default(true),
  respondsWithin: z
    .enum(["within_hour", "same_day", "few_days"])
    .default("same_day"),
});

/** PATCH /api/me/profile — every section optional, so steps save alone. */
export const profileUpdateSchema = z.object({
  basics: basicsSchema.partial().optional(),
  trades: tradesSchema.shape.trades.optional(),
  contact: contactSchema.partial().optional(),
  location: locationSchema.partial().optional(),
  media: mediaUpdateSchema.partial().optional(),
  credentials: credentialsSchema.shape.credentials.optional(),
  availability: availabilitySchema.partial().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// --- Completeness ---------------------------------------------------------

export type CompletenessItem = {
  key: string;
  label: string;
  done: boolean;
  required: boolean;
  /** Why it matters, shown in the dashboard nudge. */
  hint?: string;
};

export type Completeness = {
  items: CompletenessItem[];
  percent: number;
  canSubmit: boolean;
  missingRequired: string[];
};

/**
 * Drives the dashboard meter and gates submission for review.
 *
 * The required set is deliberately small — name, one trade, a phone number
 * and a location. Everything else raises the percentage and nudges, because
 * a profile with no photos rarely wins work but shouldn't be blocked.
 */
export function profileCompleteness(profile: {
  displayName?: string | null;
  bio?: string | null;
  trades?: unknown[] | null;
  phone?: string | null;
  location?: { stateId?: unknown; lgaId?: unknown; areaText?: string | null } | null;
  avatar?: unknown;
  portfolio?: unknown[] | null;
  yearsExperience?: number | null;
}): Completeness {
  const items: CompletenessItem[] = [
    {
      key: "displayName",
      label: "Your name",
      required: true,
      done: Boolean(profile.displayName && profile.displayName.trim().length >= 2),
    },
    {
      key: "trades",
      label: "At least one trade",
      required: true,
      done: Array.isArray(profile.trades) && profile.trades.length > 0,
    },
    {
      key: "phone",
      label: "Phone number",
      required: true,
      done: Boolean(profile.phone),
      hint: "Customers reach you on this. It stays hidden until someone signs up to see it.",
    },
    {
      key: "location",
      label: "Where you're based",
      required: true,
      done: Boolean(profile.location?.stateId && profile.location?.lgaId),
    },
    {
      key: "avatar",
      label: "A photo of you",
      required: false,
      done: Boolean(profile.avatar),
      hint: "Profiles with a face get contacted far more often than ones without.",
    },
    {
      key: "portfolio",
      label: "Photos of your work",
      required: false,
      done: Array.isArray(profile.portfolio) && profile.portfolio.length >= 3,
      hint: "Aim for 4–6. This is the single biggest thing customers judge you on.",
    },
    {
      key: "bio",
      label: "A short description",
      required: false,
      done: Boolean(profile.bio && profile.bio.trim().length >= 40),
      hint: "Two or three lines about what you do and how long you've done it.",
    },
    {
      key: "experience",
      label: "Years of experience",
      required: false,
      done: Boolean(profile.yearsExperience && profile.yearsExperience > 0),
    },
  ];

  const done = items.filter((i) => i.done).length;
  const missingRequired = items
    .filter((i) => i.required && !i.done)
    .map((i) => i.label);

  return {
    items,
    percent: Math.round((done / items.length) * 100),
    canSubmit: missingRequired.length === 0,
    missingRequired,
  };
}
