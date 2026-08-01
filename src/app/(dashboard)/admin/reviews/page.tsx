import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/review";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

export default async function AdminReviewsPage() {
  await requireAdmin("/admin/reviews");

  await connectDB();
  const count = await Review.countDocuments();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground text-sm">
          Moderate what customers said about artisans.
        </p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <p className="font-medium">
            {count === 0 ? "No reviews yet" : `${count} reviews`}
          </p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm text-balance">
            Review posting lands in the next build phase. Only customers who
            actually unlocked an artisan&apos;s number will be able to leave
            one — one review per contact, enforced by a unique index.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
