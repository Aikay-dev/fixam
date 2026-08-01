import type { Metadata } from "next";
import { ClipboardCheck, Phone, Star, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { ArtisanProfile } from "@/models/artisan-profile";
import { Lead } from "@/models/lead";
import { Review } from "@/models/review";
import { User } from "@/models/user";

export const metadata: Metadata = {
  title: "Admin overview",
  robots: { index: false, follow: false },
};

/**
 * Outside the component body — reading the clock during render trips the
 * React purity rule, and this belongs with the queries anyway.
 */
async function getStats() {
  await connectDB();

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const weekAgo = new Date(now - 7 * day);
  const prevWeekAgo = new Date(now - 14 * day);

  const [
    pendingArtisans,
    approvedArtisans,
    totalUsers,
    newUsersThisWeek,
    leadsThisWeek,
    leadsPrevWeek,
    leadsTotal,
    reviewCount,
    topCategories,
  ] = await Promise.all([
    ArtisanProfile.countDocuments({ status: "pending_review" }),
    ArtisanProfile.countDocuments({ status: "approved" }),
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    Lead.countDocuments({ revealedAt: { $gte: weekAgo } }),
    Lead.countDocuments({
      revealedAt: { $gte: prevWeekAgo, $lt: weekAgo },
    }),
    Lead.countDocuments(),
    Review.countDocuments({ status: "published" }),
    Lead.aggregate([
      { $match: { revealedAt: { $gte: weekAgo }, categoryId: { $ne: null } } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      { $project: { name: "$category.name", count: 1 } },
    ]).exec(),
  ]);

  return {
    pendingArtisans,
    approvedArtisans,
    totalUsers,
    newUsersThisWeek,
    leadsThisWeek,
    leadsPrevWeek,
    leadsTotal,
    reviewCount,
    topCategories: topCategories as { name: string; count: number }[],
  };
}

function Stat({
  icon,
  label,
  value,
  hint,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}) {
  const body = (
    <CardContent className="pt-6">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
    </CardContent>
  );

  return href ? (
    <Card className="hover:border-primary/40 transition">
      <Link href={href}>{body}</Link>
    </Card>
  ) : (
    <Card>{body}</Card>
  );
}

export default async function AdminOverviewPage() {
  await requireAdmin("/admin");
  const stats = await getStats();

  const trend =
    stats.leadsPrevWeek === 0
      ? null
      : Math.round(
          ((stats.leadsThisWeek - stats.leadsPrevWeek) / stats.leadsPrevWeek) *
            100,
        );

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm">
          How Fixam is doing this week.
        </p>
      </div>

      {stats.pendingArtisans > 0 ? (
        <Card className="border-blue-500/40 bg-blue-500/5">
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            <ClipboardCheck className="size-5 shrink-0 text-blue-600" />
            <p className="min-w-0 flex-1 text-sm">
              <strong>
                {stats.pendingArtisans} artisan
                {stats.pendingArtisans === 1 ? "" : "s"}
              </strong>{" "}
              waiting for review. They stay invisible to customers until
              approved.
            </p>
            <Button asChild size="sm">
              <Link href="/admin/artisans?status=pending_review">
                Review now
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Phone className="size-4" />}
          label="Leads this week"
          value={stats.leadsThisWeek}
          hint={
            trend === null
              ? `${stats.leadsTotal} all time`
              : `${trend >= 0 ? "+" : ""}${trend}% vs last week · ${stats.leadsTotal} all time`
          }
          href="/admin/leads"
        />
        <Stat
          icon={<ClipboardCheck className="size-4" />}
          label="Live artisans"
          value={stats.approvedArtisans}
          hint={`${stats.pendingArtisans} awaiting review`}
          href="/admin/artisans?status=approved"
        />
        <Stat
          icon={<Users className="size-4" />}
          label="Total users"
          value={stats.totalUsers}
          hint={`+${stats.newUsersThisWeek} this week`}
          href="/admin/users"
        />
        <Stat
          icon={<Star className="size-4" />}
          label="Published reviews"
          value={stats.reviewCount}
          href="/admin/reviews"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4" />
            Most-wanted trades this week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topCategories.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No leads yet this week.
            </p>
          ) : (
            <ul className="grid gap-2">
              {stats.topCategories.map((c) => (
                <li key={c.name} className="flex items-center justify-between">
                  <span className="text-sm">{c.name}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {c.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted-foreground mt-4 border-t pt-3 text-xs">
            This is the demand evidence that makes the Stage Two pricing
            conversation straightforward. Export it from the leads page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
