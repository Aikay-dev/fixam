import type { Metadata } from "next";
import Link from "next/link";

import { RatingStars } from "@/components/artisans/rating-stars";
import { ReviewActions } from "@/components/admin/review-actions";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { PAGE_SIZE, ROUTES } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { displayAuthorName } from "@/lib/serializers/review";
import { ArtisanProfile } from "@/models/artisan-profile";
import { Review } from "@/models/review";
import { User } from "@/models/user";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

const FILTERS = ["all", "published", "hidden"] as const;
type Filter = (typeof FILTERS)[number];

export default async function AdminReviewsPage(
  props: PageProps<"/admin/reviews">,
) {
  await requireAdmin("/admin/reviews");

  const params = await props.searchParams;
  const raw = typeof params.status === "string" ? params.status : "all";
  const filter: Filter = FILTERS.includes(raw as Filter) ? (raw as Filter) : "all";
  const page = Math.max(1, Number(params.page) || 1);

  await connectDB();

  const query = filter === "all" ? {} : { status: filter };

  const [reviews, total, counts] = await Promise.all([
    Review.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE.adminTable)
      .limit(PAGE_SIZE.adminTable)
      .lean()
      .exec(),
    Review.countDocuments(query).exec(),
    Review.aggregate<{ _id: string; n: number }>([
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]).exec(),
  ]);

  const countByStatus = new Map(counts.map((c) => [c._id, c.n]));
  const allCount = counts.reduce((sum, c) => sum + c.n, 0);

  const [profiles, customers] = await Promise.all([
    ArtisanProfile.find({ _id: { $in: reviews.map((r) => r.artisanProfileId) } })
      .select("displayName slug")
      .lean()
      .exec(),
    User.find({ _id: { $in: reviews.map((r) => r.customerUserId) } })
      .select("name email")
      .lean()
      .exec(),
  ]);

  const profileById = new Map(profiles.map((p) => [String(p._id), p]));
  const customerById = new Map(customers.map((c) => [String(c._id), c]));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground text-sm">
          Every review is tied to a lead, so each one came from a verified
          account that actually took the number. Hide anything abusive or not
          about a real job.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = f === "all" ? allCount : (countByStatus.get(f) ?? 0);
          return (
            <Link
              key={f}
              href={`/admin/reviews?status=${f}`}
              className={
                f === filter
                  ? "bg-primary text-primary-foreground rounded-full px-3.5 py-1.5 text-sm font-medium"
                  : "border-input hover:bg-accent rounded-full border px-3.5 py-1.5 text-sm transition-colors"
              }
            >
              {f === "all" ? "All" : f === "published" ? "Published" : "Hidden"} ({n})
            </Link>
          );
        })}
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-medium">Nothing here</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm text-balance">
              {filter === "hidden"
                ? "No reviews have been hidden."
                : "No reviews yet. They appear once a customer reviews someone whose number they took."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {reviews.map((review) => {
            const profile = profileById.get(String(review.artisanProfileId));
            const customer = customerById.get(String(review.customerUserId));

            return (
              <Card key={String(review._id)}>
                <CardContent className="grid gap-3 pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
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
                        {review.status === "hidden" ? (
                          <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-medium">
                            Hidden
                          </span>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        by {displayAuthorName(customer?.name)}
                        {customer?.email ? ` · ${customer.email}` : ""} ·{" "}
                        {new Date(review.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <ReviewActions id={String(review._id)} status={review.status} />
                  </div>

                  {review.title ? (
                    <p className="font-medium">{review.title}</p>
                  ) : null}
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {review.body}
                  </p>

                  {review.hiddenReason ? (
                    <p className="text-destructive text-xs">
                      Hidden: {review.hiddenReason}
                    </p>
                  ) : null}

                  {review.artisanResponse?.body ? (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-semibold">
                        Reply from the professional
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

      {total > PAGE_SIZE.adminTable ? (
        <div className="flex justify-between text-sm">
          {page > 1 ? (
            <Link
              href={`/admin/reviews?status=${filter}&page=${page - 1}`}
              className="hover:underline"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          {page * PAGE_SIZE.adminTable < total ? (
            <Link
              href={`/admin/reviews?status=${filter}&page=${page + 1}`}
              className="hover:underline"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}
