import { fail, serverError } from "@/lib/api";
import { authenticateRequest } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/lead";

/**
 * CSV export of the lead log.
 *
 * This is the artefact that sells Stage Two: a spreadsheet showing how many
 * real, interested customers each artisan received for free. Without it, the
 * pay-per-lead pitch is a promise; with it, it's arithmetic.
 */

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  // Quote if the value contains a delimiter, quote or newline.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const auth = await authenticateRequest({ role: "admin" });
  if (!auth.ok) return fail(auth.status, "Admins only.", auth.reason);

  try {
    await connectDB();

    const leads = await Lead.aggregate([
      { $sort: { revealedAt: -1 } },
      { $limit: 10000 },
      {
        $lookup: {
          from: "artisanprofiles",
          localField: "artisanProfileId",
          foreignField: "_id",
          as: "artisan",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $project: {
          revealedAt: 1,
          source: 1,
          channel: 1,
          billingStatus: 1,
          creditCost: 1,
          outcomeReported: 1,
          hasReview: { $cond: [{ $ifNull: ["$reviewId", false] }, "yes", "no"] },
          artisanName: { $arrayElemAt: ["$artisan.displayName", 0] },
          artisanSlug: { $arrayElemAt: ["$artisan.slug", 0] },
          artisanArea: { $arrayElemAt: ["$artisan.location.areaText", 0] },
          categoryName: { $arrayElemAt: ["$category.name", 0] },
        },
      },
    ]).exec();

    const headers = [
      "revealed_at",
      "artisan",
      "artisan_slug",
      "area",
      "trade",
      "source",
      "channel",
      "billing_status",
      "credit_cost",
      "outcome",
      "reviewed",
    ];

    const rows = leads.map((l) =>
      [
        l.revealedAt ? new Date(l.revealedAt).toISOString() : "",
        l.artisanName ?? "",
        l.artisanSlug ?? "",
        l.artisanArea ?? "",
        l.categoryName ?? "",
        l.source ?? "",
        l.channel ?? "",
        l.billingStatus ?? "",
        l.creditCost ?? 0,
        l.outcomeReported ?? "",
        l.hasReview,
      ]
        .map(csvEscape)
        .join(","),
    );

    // BOM so Excel opens UTF-8 correctly — without it, Nigerian names with
    // accents render as mojibake, which makes the export look broken.
    const csv = `﻿${headers.join(",")}\n${rows.join("\n")}\n`;

    const date = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fixam-leads-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[admin/leads/export] failed", error);
    return serverError();
  }
}
