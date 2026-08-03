import { z } from "zod";

import { RATING_MAX, RATING_MIN } from "@/lib/constants";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const createReviewSchema = z.object({
  leadId: objectId,
  rating: z.number().int().min(RATING_MIN).max(RATING_MAX),
  title: z.string().trim().max(120).optional().default(""),
  // The 10-character floor matches the schema. "Good" tells the next customer
  // nothing, and a directory of one-word reviews is the thing that makes
  // review sections worthless.
  body: z
    .string()
    .trim()
    .min(10, "Tell us a bit more — at least a sentence.")
    .max(2000),
  jobDate: z.coerce.date().optional().nullable(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const respondToReviewSchema = z.object({
  body: z.string().trim().min(2).max(1000),
});

export const moderateReviewSchema = z.object({
  status: z.enum(["published", "hidden"]),
  hiddenReason: z.string().trim().max(300).optional().nullable(),
});
