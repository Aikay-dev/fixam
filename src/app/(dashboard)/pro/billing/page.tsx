import type { Metadata } from "next";
import { PartyPopper } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getOrCreateProfile } from "@/lib/artisan/service";
import { requireUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/lead";

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

/**
 * Stage One billing page: there is nothing to bill.
 *
 * It exists anyway so Stage Two has a home, and so the artisan can see the
 * running total of what they've received for free — which is exactly the
 * argument that makes pay-per-lead credits an easy sell later.
 */
export default async function ProBillingPage() {
  const user = await requireUser("/pro/billing");
  const profile = await getOrCreateProfile(user.id, user.name ?? "");

  await connectDB();
  const totalLeads = await Lead.countDocuments({
    artisanProfileId: profile._id,
  });

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-sm">
          What Fixam costs you.
        </p>
      </div>

      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="grid gap-3 pt-6">
          <div className="flex items-center gap-2">
            <PartyPopper className="size-5 text-emerald-600" />
            <p className="text-lg font-semibold">₦0 — Fixam is free</p>
          </div>
          <p className="text-muted-foreground text-sm">
            No joining fee, no monthly charge, no commission, and nothing when
            a customer contacts you. That applies to every artisan on the
            platform right now.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">
            Customers who&apos;ve taken your number so far
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{totalLeads}</p>
          <p className="text-muted-foreground mt-2 text-xs">
            Every one of these was free to you.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
