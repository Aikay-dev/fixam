import type { Metadata } from "next";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

export default function ProReviewsPage() {
  return (
    <ComingSoon
      title="Reviews"
      description="What customers said about your work, and your replies."
      phase="Phase 6 — reviews"
    />
  );
}
