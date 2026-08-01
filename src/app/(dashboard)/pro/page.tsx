import type { Metadata } from "next";
import { CheckCircle2, Circle, Eye, Phone, Star, TrendingUp } from "lucide-react";
import type { Types } from "mongoose";
import Link from "next/link";

import { ArtisanStatusBanner } from "@/components/dashboard/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getOrCreateProfile } from "@/lib/artisan/service";
import { requireUser } from "@/lib/auth/session";
import { ROUTES, type ArtisanStatus } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { profileCompleteness } from "@/lib/validation/artisan";
import { Lead } from "@/models/lead";

export const metadata: Metadata = {
  title: "Artisan dashboard",
  robots: { index: false, follow: false },
};

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          {icon}
          {label}
        </div>
        <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
        {hint ? (
          <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * Kept outside the component body: reading the clock during render trips the
 * React purity rule, and this belongs with the query anyway.
 */
async function getLeadCounts(profileId: Types.ObjectId) {
  await connectDB();

  // Leads in the last 7 days — the number that makes the Stage Two pricing
  // conversation easy later, so it's front and centre from day one.
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [thisWeek, total] = await Promise.all([
    Lead.countDocuments({
      artisanProfileId: profileId,
      revealedAt: { $gte: weekAgo },
    }),
    Lead.countDocuments({ artisanProfileId: profileId }),
  ]);

  return { thisWeek, total };
}

export default async function ProOverviewPage() {
  const user = await requireUser(ROUTES.pro);
  const profile = await getOrCreateProfile(user.id, user.name ?? "");
  const completeness = profileCompleteness(profile);

  const { thisWeek: leadsThisWeek, total: leadsTotal } = await getLeadCounts(
    profile._id,
  );

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {profile.displayName || "Your dashboard"}
        </h1>
        <p className="text-muted-foreground text-sm">
          Everything about how customers find and reach you.
        </p>
      </div>

      <ArtisanStatusBanner
        status={profile.status as ArtisanStatus}
        rejectionReason={profile.rejectionReason}
        canSubmit={completeness.canSubmit}
        missingRequired={completeness.missingRequired}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Phone className="size-4" />}
          label="Leads this week"
          value={leadsThisWeek}
          hint={`${leadsTotal} all time`}
        />
        <StatCard
          icon={<Eye className="size-4" />}
          label="Profile views"
          value={profile.stats?.profileViews ?? 0}
        />
        <StatCard
          icon={<Star className="size-4" />}
          label="Rating"
          value={
            profile.rating?.count
              ? `${profile.rating.average.toFixed(1)}★`
              : "—"
          }
          hint={
            profile.rating?.count
              ? `${profile.rating.count} review${profile.rating.count === 1 ? "" : "s"}`
              : "No reviews yet"
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>Profile strength</span>
            <span className="text-muted-foreground text-sm font-normal tabular-nums">
              {completeness.percent}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Progress value={completeness.percent} />

          <ul className="grid gap-2.5">
            {completeness.items.map((item) => (
              <li key={item.key} className="flex items-start gap-2.5 text-sm">
                {item.done ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="text-muted-foreground/50 mt-0.5 size-4 shrink-0" />
                )}
                <span className="min-w-0 flex-1">
                  <span
                    className={
                      item.done ? "text-muted-foreground line-through" : ""
                    }
                  >
                    {item.label}
                  </span>
                  {item.required ? (
                    <span className="text-muted-foreground ml-1 text-xs">
                      (required)
                    </span>
                  ) : null}
                  {!item.done && item.hint ? (
                    <span className="text-muted-foreground block text-xs">
                      {item.hint}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>

          <Button asChild className="justify-self-start">
            <Link href={ROUTES.proProfile}>
              {completeness.percent === 100 ? "Edit profile" : "Complete profile"}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {profile.status === "approved" ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            <TrendingUp className="size-5 shrink-0 text-emerald-600" />
            <p className="min-w-0 flex-1 text-sm">
              Fixam is free for artisans in this phase — no joining fee, no
              commission, no charge when a customer contacts you.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/artisans/${profile.slug}`}>View public profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
