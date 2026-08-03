import type { Metadata } from "next";
import { Star } from "lucide-react";
import { redirect } from "next/navigation";

import { RatingStars } from "@/components/artisans/rating-stars";
import { ReviewReply } from "@/components/pro/review-reply";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { displayAuthorName } from "@/lib/serializers/review";
import { ArtisanProfile } from "@/models/artisan-profile";
import { Review } from "@/models/review";
import { User } from "@/models/user";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

/**
 * Reviews the professional has received.
 *
 * Shows hidden reviews too, marked as such. A professional who cannot see
 * that a review was hidden will assume it is still costing them business,
 * and will keep asking support about it.
 */
export default async function ProReviewsPage() {
  const user = await requireUser();
  await connectDB();

  // Read-only: viewing your reviews should never be the thing that creates a
  // profile. Anyone reaching /pro already has one from the dashboard.
  const profile = await ArtisanProfile.findOne({ userId: user.id })
    .select("_id rating")
    .lean()
    .exec();

  if (!profile) redirect(ROUTES.proProfile);

  const reviews = await Review.find({ artisanProfileId: profile._id })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  const customers = await User.find({
    _id: { $in: reviews.map((r) => r.customerUserId) },
  })
    .select("name")
    .lean()
    .exec();

  const nameById = new Map(customers.map((c) => [String(c._id), c.name]));

  const published = reviews.filter((r) => r.status === "published");
  const unanswered = published.filter((r) => !r.artisanResponse?.body).length;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {published.length === 0
            ? "No reviews yet. They arrive after a customer takes your number and you finish the job."
            : `${published.length} review${published.length === 1 ? "" : "s"}, averaging ${profile.rating?.average?.toFixed(1) ?? "0.0"}.${unanswered > 0 ? ` ${unanswered} without a reply.` : ""}`}
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="text-muted-foreground mx-auto size-8" />
            <p className="mt-3 font-semibold">Nothing here yet</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm text-balance">
              Only customers who actually took your number can review you, so
              these come from real jobs. Finish one and ask the customer to
              leave a note.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {reviews.map((review) => (
            <Card key={String(review._id)}>
              <CardContent className="grid gap-3 pt-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <RatingStars value={review.rating} size="sm" showCount={false} />
                  <span className="text-sm font-semibold">
                    {displayAuthorName(nameById.get(String(review.customerUserId)))}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(review.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {review.status !== "published" ? (
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                      {review.status === "hidden" ? "Hidden by Fixam" : "Awaiting review"}
                    </span>
                  ) : null}
                </div>

                {review.title ? (
                  <p className="font-medium">{review.title}</p>
                ) : null}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {review.body}
                </p>

                {review.artisanResponse?.body ? (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-semibold">Your reply</p>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {review.artisanResponse.body}
                    </p>
                  </div>
                ) : null}

                {review.status === "published" ? (
                  <div>
                    <ReviewReply
                      reviewId={String(review._id)}
                      existing={review.artisanResponse?.body ?? null}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
