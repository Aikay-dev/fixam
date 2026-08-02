import type { Metadata } from "next";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = {
  title: "My reviews",
  robots: { index: false, follow: false },
};

export default function AccountReviewsPage() {
  return (
    <ComingSoon
      title="My reviews"
      description="Reviews you've left for professionals."
      phase="Phase 6 — reviews"
    />
  );
}
