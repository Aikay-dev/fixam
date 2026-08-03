import { Quote } from "lucide-react";

import { RatingStars } from "@/components/artisans/rating-stars";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicReview } from "@/lib/serializers/review";

/**
 * Reviews on a public profile.
 *
 * Deliberately not cards-in-cards: each review is separated by a rule rather
 * than boxed, so a profile with twelve reviews reads as a column of writing
 * rather than twelve competing containers.
 */

function relativeMonth(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

export function ReviewList({ reviews }: { reviews: PublicReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <ul className="divide-y">
      {reviews.map((review) => (
        <li key={review.id} className="py-5 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <RatingStars value={review.rating} size="sm" showCount={false} />
            <span className="text-sm font-semibold">{review.authorName}</span>
            <span className="text-muted-foreground text-xs">
              {relativeMonth(review.createdAt)}
            </span>
            {review.jobCategoryName ? (
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                {review.jobCategoryName}
              </span>
            ) : null}
          </div>

          {review.title ? (
            <p className="mt-2 font-medium">{review.title}</p>
          ) : null}

          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            {review.body}
          </p>

          {review.response ? (
            <div className="bg-muted/50 mt-3 rounded-lg p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold">
                <Quote className="size-3.5 shrink-0" />
                Reply from the professional
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {review.response.body}
              </p>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * The star distribution.
 *
 * Shown because an average alone hides its own shape: 4.2 from twenty reviews
 * with two angry outliers is a different professional from a flat 4.2, and
 * the customer deciding whether to call deserves to see which.
 */
export function RatingBreakdown({
  breakdown,
  total,
}: {
  breakdown: Record<string, number>;
  total: number;
}) {
  if (total === 0) return null;

  return (
    <Card>
      <CardContent className="grid gap-1.5 py-4">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = breakdown[String(star)] ?? 0;
          const pct = total === 0 ? 0 : Math.round((count / total) * 100);
          return (
            <div key={star} className="flex items-center gap-2.5 text-xs">
              <span className="text-muted-foreground w-8 shrink-0 tabular-nums">
                {star} ★
              </span>
              <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                <div
                  className="bg-gold h-full rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-muted-foreground w-6 shrink-0 text-right tabular-nums">
                {count}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
