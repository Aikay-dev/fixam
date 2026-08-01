import type { Metadata } from "next";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default function AccountSettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="Email preferences and account details."
      phase="Phase 9 — launch prep"
    />
  );
}
