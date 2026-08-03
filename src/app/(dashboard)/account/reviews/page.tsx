import type { Metadata } from "next";
import { Star } from "lucide-react";
import Link from "next/link";

import { RatingStars } from "@/components/artisans/rating-stars";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { ArtisanProfile } from "@/models/artisan-profile";
import { Review } from "@/models/review";

export const metadata: Metadata = {
  title: "My reviews",
  robots: { index: false, follow: false },
};

/** Reviews this customer has written. */
export default async function AccountReviewsPage() {
  const user = await requireUser();
  await connectDB();

  const reviews = await Review.find({ customerUserId: user.id })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  const profiles = await ArtisanProfile.find({
    _id: { $in: reviews.map((r) => r.artisanProfileId) },
  })
    .select("displayName slug")
    .lean()
    .exec();

  const byId = new Map(profiles.map((p) => [String(p._id), p]));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My reviews</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Reviews you&apos;ve left for professionals you hired.
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="text-muted-foreground mx-auto size-8" />
            <p className="mt-3 font-semibold">You haven&apos;t reviewed anyone yet</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm text-balance">
              After you take someone&apos;s number, you can leave them a review
              from your contacts. It&apos;s the most useful thing you can do for
              the next customer.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4">
              <Link href={ROUTES.accountContacts}>See my contacts</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {reviews.map((review) => {
            const profile = byId.get(String(review.artisanProfileId));
            return (
              <Card key={String(review._id)}>
                <CardContent className="grid gap-2 pt-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <RatingStars value={review.rating} size="sm" showCount={false} />
                    {profile ? (
                      <Link
                        href={ROUTES.professional(profile.slug)}
                        className="text-sm font-semibold hover:underline"
                      >
                        {profile.displayName}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Profile removed
                      </span>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {new Date(review.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {review.status === "hidden" ? (
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                        Hidden
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
                    <div className="bg-muted/50 mt-1 rounded-lg p-3">
                      <p className="text-xs font-semibold">
                        Reply from {profile?.displayName ?? "the professional"}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        {review.artisanResponse.body}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
