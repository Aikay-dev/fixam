import type { Metadata } from "next";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = {
  title: "Customer leads",
  robots: { index: false, follow: false },
};

export default function ProLeadsPage() {
  return (
    <ComingSoon
      title="Customer leads"
      description="Everyone who has taken your number, and what they were looking for."
      phase="Phase 5 — the reveal gate"
    />
  );
}
